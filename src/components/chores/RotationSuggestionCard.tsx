import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';

interface RotationSuggestionCardProps {
  title: string;
  assigneeName: string;
  estimatedEffortMinutes: number;
  rationale: string[];
  onPress?: () => void;
}

export function RotationSuggestionCard({
  title,
  assigneeName,
  estimatedEffortMinutes,
  rationale,
  onPress,
}: RotationSuggestionCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>AI suggestion</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>
            {assigneeName} • {estimatedEffortMinutes} min
          </Text>
        </View>
        <View style={styles.action}>
          <Button label="Review" size="sm" variant="secondary" onPress={onPress} />
        </View>
      </View>

      <View style={styles.reasons}>
        {rationale.slice(0, 2).map((reason) => (
          <Text key={reason} style={styles.reason}>
            • {reason}
          </Text>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.accent.light,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
  action: {
    minWidth: 88,
  },
  reasons: {
    gap: 6,
  },
  reason: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary.light,
  },
});
