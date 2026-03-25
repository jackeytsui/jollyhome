import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { ContextSuggestion } from '@/lib/onboarding';

interface ContextSuggestionCardProps {
  suggestions: ContextSuggestion[];
  onPressSuggestion: (route: ContextSuggestion['route']) => void;
}

export function ContextSuggestionCard(props: ContextSuggestionCardProps) {
  const { suggestions, onPressSuggestion } = props;

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Next best moves</Text>
      <Text style={styles.subtitle}>Suggestions read current household context before surfacing actions.</Text>

      {suggestions.map((suggestion) => (
        <Pressable
          key={suggestion.id}
          onPress={() => onPressSuggestion(suggestion.route)}
          style={styles.row}
        >
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{suggestion.title}</Text>
            <Text style={styles.rowSummary}>{suggestion.summary}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.dominant.light,
    padding: 12,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  rowSummary: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary.light,
  },
  chevron: {
    fontSize: 22,
    lineHeight: 24,
    color: colors.textSecondary.light,
  },
});
