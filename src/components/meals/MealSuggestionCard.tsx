import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { MealSuggestion } from '@/types/meals';

interface MealSuggestionCardProps {
  suggestion: MealSuggestion;
  rationale: string[];
  onAccept: () => void;
  onSwap: () => void;
  onRegenerate: () => void;
}

export function MealSuggestionCard({
  suggestion,
  rationale,
  onAccept,
  onSwap,
  onRegenerate,
}: MealSuggestionCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{suggestion.title}</Text>
          <Text style={styles.meta}>
            {suggestion.plannedForDate} • {suggestion.slot} • {suggestion.servings} servings
          </Text>
        </View>
        <Text style={styles.rank}>#{suggestion.rank}</Text>
      </View>
      {rationale.map((line) => (
        <Text key={line} style={styles.reason}>
          • {line}
        </Text>
      ))}
      <View style={styles.actions}>
        <Pressable onPress={onAccept} style={[styles.action, styles.accept]}>
          <Text style={styles.acceptLabel}>Accept</Text>
        </Pressable>
        <Pressable onPress={onSwap} style={styles.action}>
          <Text style={styles.actionLabel}>Swap</Text>
        </Pressable>
        <Pressable onPress={onRegenerate} style={styles.action}>
          <Text style={styles.actionLabel}>Regenerate</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary.light },
  meta: { color: colors.textSecondary.light, fontSize: 13 },
  rank: { color: colors.accent.light, fontWeight: '700' },
  reason: { color: colors.textSecondary.light, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.dominant.light,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  accept: { backgroundColor: colors.accent.light, borderColor: colors.accent.light },
  actionLabel: { color: colors.textPrimary.light, fontWeight: '600' },
  acceptLabel: { color: '#FFFFFF', fontWeight: '700' },
});
