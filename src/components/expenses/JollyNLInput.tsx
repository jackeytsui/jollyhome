import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useMembers } from '@/hooks/useMembers';
import { useHouseholdStore } from '@/stores/household';
import { JollyParsingIndicator } from './JollyParsingIndicator';
import { colors } from '@/constants/theme';
import type { CreateExpenseInput } from '@/types/expenses';

interface JollyNLInputProps {
  onParsed: (prefilled: Partial<CreateExpenseInput>, confidenceFlags: string[]) => void;
  disabled?: boolean;
}

interface ParseResponse {
  description?: string;
  amount_cents?: number | null;
  split_type?: 'equal' | 'percentage' | 'exact';
  members?: string[] | null;
  category?: string | null;
  confidence_flags?: string[];
  error?: string;
  credits_remaining?: number;
}

export function JollyNLInput({ onParsed, disabled = false }: JollyNLInputProps) {
  const { activeHouseholdId } = useHouseholdStore();
  const { members } = useMembers(activeHouseholdId);

  const [text, setText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const toastAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  function showToast(message: string) {
    setToast(message);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }

  async function handleSubmit() {
    const sentence = text.trim();
    if (!sentence || isParsing || disabled) return;

    setIsParsing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const { data, error } = await supabase.functions.invoke('parse-nl-expense', {
        body: {
          sentence,
          household_members: members.map((m) => ({
            id: m.user_id,
            name: m.profile.display_name ?? m.user_id,
          })),
          default_currency: 'USD',
        },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      if (error) {
        throw new Error(error.message || 'Parse failed');
      }

      const response = data as ParseResponse;

      if (response.error) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        if (response.error === 'Insufficient AI credits') {
          showToast('No AI credits remaining. Upgrade to continue using Jolly.');
        } else {
          showToast('I couldn\'t parse that. Try: "Pizza $20 split with Jake"');
        }
        return;
      }

      // Success — build prefilled expense input
      const prefilled: Partial<CreateExpenseInput> = {
        description: response.description ?? sentence,
        amount_cents: response.amount_cents ?? undefined,
        split_type: response.split_type ?? 'equal',
        category: response.category ?? null,
      };

      // Map member IDs from the response (already resolved by the Edge Function)
      if (response.members && response.members.length > 0 && activeHouseholdId) {
        prefilled.splits = response.members.map((userId) => ({
          user_id: userId,
          amount_cents: 0, // Will be recalculated in QuickAddCard
        }));
      }

      const confidenceFlags = response.confidence_flags ?? [];
      const isAmbiguous = confidenceFlags.length >= 2;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (isAmbiguous) {
        showToast('I filled what I could \u2014 check the highlighted fields.');
      } else {
        const desc = response.description ?? sentence;
        const amountStr = response.amount_cents
          ? `$${(response.amount_cents / 100).toFixed(2)}`
          : '';
        const memberCount = response.members?.length;
        const membersStr = memberCount
          ? ` split with ${memberCount} member${memberCount > 1 ? 's' : ''}`
          : '';
        showToast(`Got it! ${desc}${amountStr ? `, ${amountStr}` : ''}${membersStr}.`);
      }

      onParsed(prefilled, confidenceFlags);
      setText('');
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('I couldn\'t parse that. Try: "Pizza $20 split with Jake"');
    } finally {
      setIsParsing(false);
    }
  }

  const toastTranslateY = toastAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  return (
    <View style={styles.wrapper}>
      {/* Toast banner */}
      {toast ? (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
        >
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      ) : null}

      {/* Input row */}
      <Pressable
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          disabled && styles.inputContainerDisabled,
        ]}
        onPress={() => inputRef.current?.focus()}
      >
        {/* Jolly icon */}
        <View style={styles.iconWrapper}>
          <Sparkles size={18} color={isFocused ? colors.accent.light : colors.textSecondary.light} />
        </View>

        {/* Text input or parsing indicator */}
        {isParsing ? (
          <View style={styles.parsingContainer}>
            <JollyParsingIndicator visible />
          </View>
        ) : (
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={'Tell Jolly... (e.g., "Pizza with Jake, $42")'}
            placeholderTextColor={colors.textSecondary.light}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            editable={!disabled && !isParsing}
            multiline={false}
            blurOnSubmit
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  toast: {
    backgroundColor: colors.accent.light + 'F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary.light,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 12,
    gap: 8,
  },
  inputContainerFocused: {
    borderColor: colors.accent.light,
    borderWidth: 2,
  },
  inputContainerDisabled: {
    opacity: 0.5,
  },
  iconWrapper: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parsingContainer: {
    flex: 1,
    justifyContent: 'center',
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 24,
    paddingVertical: 14,
  },
});
