import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { UnifiedTimelineSummary } from '@/lib/onboarding';

interface UnifiedTimelineCardProps {
  summary: UnifiedTimelineSummary;
  onOpenCalendar: () => void;
}

export function UnifiedTimelineCard(props: UnifiedTimelineCardProps) {
  const { summary, onOpenCalendar } = props;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Unified timeline</Text>
          <Text style={styles.subtitle}>{summary.headline}</Text>
        </View>
        <Pressable onPress={onOpenCalendar} style={styles.action}>
          <Text style={styles.actionText}>Open</Text>
        </Pressable>
      </View>
      <Text style={styles.supporting}>{summary.supporting}</Text>

      {summary.entries.map((entry) => (
        <View key={entry.id} style={styles.row}>
          <View style={styles.dot} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{entry.title}</Text>
            <Text style={styles.rowSupporting}>{entry.supporting}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary.light,
  },
  supporting: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
  action: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.dominant.light,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.light,
    marginTop: 6,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  rowSupporting: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary.light,
  },
});
