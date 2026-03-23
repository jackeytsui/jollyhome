import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';

interface GamificationSummary {
  memberId: string;
  memberName: string;
  points: number;
  streakDays: number;
}

interface GamificationCardProps {
  enabled: boolean;
  loading?: boolean;
  leaderboard: GamificationSummary[];
  onToggle: (enabled: boolean) => void;
}

export function GamificationCard({
  enabled,
  loading = false,
  leaderboard,
  onToggle,
}: GamificationCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Gamification</Text>
        <Text style={styles.subtitle}>
          {enabled
            ? 'Light-touch encouragement only: points, streaks, and a simple leaderboard when the household wants it.'
            : 'Optional encouragement for households that want a little extra momentum.'}
        </Text>
      </View>

      <Button
        label={enabled ? 'Hide gamification' : 'Enable gamification'}
        variant={enabled ? 'secondary' : 'primary'}
        loading={loading}
        onPress={() => onToggle(!enabled)}
      />

      {enabled ? (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          {leaderboard.map((entry, index) => (
            <View key={entry.memberId} style={styles.row}>
              <Text style={styles.memberText}>
                {index + 1}. {entry.memberName}
              </Text>
              <Text style={styles.metricText}>
                {entry.points} points • {entry.streakDays}-day streak
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.hiddenText}>
          Gamification is fully hidden right now. Core chores, fairness, and condition tracking stay unchanged.
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: colors.textPrimary.light,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  content: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 10,
  },
  memberText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  metricText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
  hiddenText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
});
