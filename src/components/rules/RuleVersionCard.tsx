import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { HouseRuleVersion } from '@/types/rules';

interface RuleVersionCardProps {
  version: HouseRuleVersion;
  acknowledgedCount: number;
  pendingCount: number;
}

export function RuleVersionCard({
  version,
  acknowledgedCount,
  pendingCount,
}: RuleVersionCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{version.versionLabel}</Text>
          <Text style={styles.title}>{version.title}</Text>
        </View>
        {version.isCurrent ? (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeLabel}>Current</Text>
          </View>
        ) : null}
      </View>
      {version.changeSummary ? <Text style={styles.summary}>{version.changeSummary}</Text> : null}
      <Text style={styles.body}>{version.body}</Text>
      <Text style={styles.meta}>
        {acknowledgedCount} acknowledged · {pendingCount} pending
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent.light,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  currentBadge: {
    backgroundColor: '#FFEDD5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  currentBadgeLabel: {
    color: colors.accent.light,
    fontWeight: '700',
    fontSize: 12,
  },
  summary: {
    color: colors.textSecondary.light,
    fontSize: 13,
    lineHeight: 18,
  },
  body: {
    color: colors.textPrimary.light,
    fontSize: 14,
    lineHeight: 22,
  },
  meta: {
    color: colors.textSecondary.light,
    fontSize: 13,
  },
});
