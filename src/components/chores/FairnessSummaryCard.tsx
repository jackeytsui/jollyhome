import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { MemberFairnessRow } from '@/components/chores/MemberFairnessRow';

interface MemberFairnessSummary {
  memberId: string;
  memberName: string;
  completedTaskCount: number;
  completedMinutes: number;
  averageMinutes: number;
  taskDelta: number;
  minuteDelta: number;
}

interface FairnessSummaryCardProps {
  members: MemberFairnessSummary[];
  title?: string;
  subtitle?: string;
}

export function FairnessSummaryCard({
  members,
  title = 'Fairness snapshot',
  subtitle = 'Counts and effort stay visible without crowding every chore card.',
}: FairnessSummaryCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {members.length === 0 ? (
        <Text style={styles.emptyText}>No completions yet. Fairness stats will appear after the first chore history lands.</Text>
      ) : (
        members.map((member) => (
          <MemberFairnessRow
            key={member.memberId}
            memberName={member.memberName}
            completedTaskCount={member.completedTaskCount}
            completedMinutes={member.completedMinutes}
            averageMinutes={member.averageMinutes}
            taskDelta={member.taskDelta}
            minuteDelta={member.minuteDelta}
          />
        ))
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
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
});
