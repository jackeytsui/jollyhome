import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

interface MemberFairnessRowProps {
  memberName: string;
  completedTaskCount: number;
  completedMinutes: number;
  averageMinutes: number;
  taskDelta: number;
  minuteDelta: number;
}

function formatDelta(value: number, unit: string) {
  if (value === 0) {
    return `On pace for ${unit}`;
  }

  const direction = value > 0 ? 'over' : 'under';
  return `${Math.abs(value)} ${unit} ${direction}`;
}

export function MemberFairnessRow({
  memberName,
  completedTaskCount,
  completedMinutes,
  averageMinutes,
  taskDelta,
  minuteDelta,
}: MemberFairnessRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.name}>{memberName}</Text>
        <Text style={styles.summary}>
          {completedTaskCount} tasks • {completedMinutes} min
        </Text>
      </View>

      <View style={styles.metrics}>
        <Text style={styles.metricText}>Avg duration {averageMinutes} min</Text>
        <Text style={styles.metricText}>{formatDelta(taskDelta, 'tasks')}</Text>
        <Text style={styles.metricText}>{formatDelta(minuteDelta, 'min')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
});
