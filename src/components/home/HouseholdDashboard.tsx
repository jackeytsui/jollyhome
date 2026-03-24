import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { HouseholdDashboardSummary } from '@/lib/dashboard';

interface HouseholdDashboardProps {
  summary: HouseholdDashboardSummary;
  onMetricPress: (route: HouseholdDashboardSummary['metrics'][number]['route']) => void;
}

export function HouseholdDashboard(props: HouseholdDashboardProps) {
  const { summary, onMetricPress } = props;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{summary.headline}</Text>
        <Text style={styles.subtitle}>{summary.subheadline}</Text>
      </View>

      <View style={styles.grid}>
        {summary.metrics.map((metric) => (
          <Pressable
            key={metric.id}
            onPress={() => onMetricPress(metric.route)}
            style={[
              styles.metricCard,
              metric.tone === 'attention'
                ? styles.metricAttention
                : metric.tone === 'positive'
                  ? styles.metricPositive
                  : null,
            ]}
          >
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricSupporting}>{metric.supporting}</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.dominant.light,
    padding: 12,
    gap: 4,
  },
  metricAttention: {
    backgroundColor: '#FFF1F2',
  },
  metricPositive: {
    backgroundColor: '#F0FDF4',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary.light,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 28,
  },
  metricSupporting: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
});
