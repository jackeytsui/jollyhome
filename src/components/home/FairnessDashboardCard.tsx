import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { FairnessOverview } from '@/lib/dashboard';

interface FairnessDashboardCardProps {
  fairness: FairnessOverview;
}

export function FairnessDashboardCard(props: FairnessDashboardCardProps) {
  const { fairness } = props;

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{fairness.headline}</Text>
      <Text style={styles.subtitle}>{fairness.supporting}</Text>

      {fairness.members.slice(0, 3).map((member) => (
        <View key={member.memberId} style={styles.row}>
          <View style={styles.memberBlock}>
            <Text style={styles.memberName}>{member.memberName}</Text>
            <Text style={styles.memberSummary}>{member.summary}</Text>
          </View>
          <View
            style={[
              styles.badge,
              member.status === 'carrying'
                ? styles.badgeAttention
                : member.status === 'supported'
                  ? styles.badgeMuted
                  : styles.badgeNeutral,
            ]}
          >
            <Text style={styles.badgeText}>{member.status}</Text>
            <Text style={styles.scoreText}>{member.combinedIndex}</Text>
          </View>
        </View>
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
    gap: 12,
    alignItems: 'center',
  },
  memberBlock: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  memberSummary: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
  badge: {
    minWidth: 88,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  badgeAttention: {
    backgroundColor: '#FFF1F2',
  },
  badgeMuted: {
    backgroundColor: '#F5F5F4',
  },
  badgeNeutral: {
    backgroundColor: colors.dominant.light,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
    color: colors.textSecondary.light,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
});
