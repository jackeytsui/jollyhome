import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { MonthlyReportSummary } from '@/lib/dashboard';

interface MonthlyReportCardProps {
  report: MonthlyReportSummary;
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function MonthlyReportCard(props: MonthlyReportCardProps) {
  const { report } = props;

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{report.monthLabel} report</Text>
      <Text style={styles.subtitle}>A compact household summary grounded in this month’s actual activity.</Text>

      <View style={styles.metricRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Spend</Text>
          <Text style={styles.metricValue}>{formatCurrency(report.spendTotalCents)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Top category</Text>
          <Text style={styles.metricValue}>{report.topCategory}</Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Chores</Text>
          <Text style={styles.metricValue}>{report.choresCompleted}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Minutes</Text>
          <Text style={styles.metricValue}>{report.choreMinutes}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Meals</Text>
          <Text style={styles.metricValue}>{report.mealsPlanned}</Text>
        </View>
      </View>

      {report.highlights.map((highlight) => (
        <Text key={highlight} style={styles.highlight}>
          {highlight}
        </Text>
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
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.dominant.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 10,
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.textSecondary.light,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  highlight: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
});
