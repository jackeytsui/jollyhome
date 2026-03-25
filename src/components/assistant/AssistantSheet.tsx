import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import type { AssistantAction, AssistantMessage } from '@/types/assistant';
import { AssistantMessageCard } from './AssistantMessageCard';

interface AssistantSheetProps {
  visible: boolean;
  loading?: boolean;
  error?: string | null;
  messages: AssistantMessage[];
  onClose: () => void;
  onSend: (message: string) => Promise<void> | void;
  onActionPress: (action: AssistantAction) => Promise<void> | void;
}

export function AssistantSheet(props: AssistantSheetProps) {
  const { visible, loading = false, error, messages, onClose, onSend, onActionPress } = props;
  const [draft, setDraft] = useState('');

  if (!visible) {
    return null;
  }

  async function handleSend() {
    const message = draft.trim();
    if (!message) {
      return;
    }
    setDraft('');
    await onSend(message);
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>Household assistant</Text>
                <Text style={styles.subtitle}>Ask about spending, chores, calendar, pantry, meals, or maintenance.</Text>
              </View>
              <Button label="Close" variant="secondary" onPress={onClose} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
              {messages.map((message) => (
                <AssistantMessageCard
                  key={message.id}
                  message={message}
                  onActionPress={onActionPress}
                />
              ))}
              {loading ? <Text style={styles.loading}>Thinking through the current household state…</Text> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </ScrollView>

            <View style={styles.composer}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="What should we prioritize this week?"
                placeholderTextColor={colors.textSecondary.light}
                multiline
                style={styles.input}
              />
              <Button label="Ask" onPress={handleSend} loading={loading} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 22, 18, 0.42)',
  },
  sheet: {
    backgroundColor: colors.dominant.light,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  content: {
    paddingVertical: 6,
    gap: 10,
  },
  loading: {
    color: colors.accent.light,
    fontWeight: '600',
  },
  error: {
    color: colors.destructive.light,
    lineHeight: 18,
  },
  composer: {
    gap: 10,
  },
  input: {
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.secondary.light,
    color: colors.textPrimary.light,
    padding: 12,
    textAlignVertical: 'top',
  },
});
