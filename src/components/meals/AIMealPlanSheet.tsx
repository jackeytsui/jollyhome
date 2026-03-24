import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { buildSuggestionRationale } from '@/lib/mealPlanning';
import { colors } from '@/constants/theme';
import type { MealSuggestion } from '@/types/meals';
import { MealSuggestionCard } from './MealSuggestionCard';

interface AIMealPlanSheetProps {
  visible: boolean;
  suggestions: MealSuggestion[];
  loading?: boolean;
  onClose: () => void;
  onAccept: (suggestion: MealSuggestion) => Promise<void> | void;
  onSwap: (suggestion: MealSuggestion) => Promise<void> | void;
  onRegenerate: (suggestion: MealSuggestion) => Promise<void> | void;
}

export function AIMealPlanSheet({
  visible,
  suggestions,
  loading = false,
  onClose,
  onAccept,
  onSwap,
  onRegenerate,
}: AIMealPlanSheetProps) {
  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>AI meal plan</Text>
            <Text style={styles.caption}>
              Review suggestions, then accept, swap, or regenerate individual slots without discarding the whole week.
            </Text>
            {loading ? <Text style={styles.loading}>Generating suggestions…</Text> : null}
            {suggestions.map((suggestion) => (
              <MealSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                rationale={buildSuggestionRationale({
                  attendanceMemberIds: suggestion.attendanceMemberIds,
                  prepTimeBucket: suggestion.tags.includes('quick') ? 'quick' : 'standard',
                  ingredientOverlap: suggestion.tags.includes('pantry') ? 0.5 : 0,
                  pantryMatchCount: suggestion.tags.includes('pantry') ? 2 : 0,
                })}
                onAccept={() => onAccept(suggestion)}
                onSwap={() => onSwap(suggestion)}
                onRegenerate={() => onRegenerate(suggestion)}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,22,18,0.38)' },
  sheet: {
    backgroundColor: colors.dominant.light,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  content: { padding: 20, gap: 14 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary.light },
  caption: { color: colors.textSecondary.light, lineHeight: 22 },
  loading: { color: colors.accent.light, fontWeight: '600' },
});
