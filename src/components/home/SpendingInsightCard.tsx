import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import type { SpendingInsight } from '@/lib/dashboard';

interface SpendingInsightCardProps {
  insights: SpendingInsight[];
  onInsightPress: (route: SpendingInsight['route']) => void;
}

export function SpendingInsightCard(props: SpendingInsightCardProps) {
  const { insights, onInsightPress } = props;

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Spending insights</Text>
      <Text style={styles.subtitle}>Suggestions stay tied to actual category and trend data so the reasoning is inspectable.</Text>

      {insights.map((insight) => (
        <Pressable
          key={insight.id}
          onPress={() => onInsightPress(insight.route)}
          style={[
            styles.insightRow,
            insight.tone === 'attention'
              ? styles.insightAttention
              : insight.tone === 'positive'
                ? styles.insightPositive
                : null,
          ]}
        >
          <View style={styles.insightText}>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightSummary}>{insight.summary}</Text>
            {insight.evidence.map((line) => (
              <Text key={`${insight.id}-${line}`} style={styles.evidenceLine}>
                {line}
              </Text>
            ))}
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
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.dominant.light,
    padding: 12,
  },
  insightAttention: {
    backgroundColor: '#FFF1F2',
  },
  insightPositive: {
    backgroundColor: '#F0FDF4',
  },
  insightText: {
    flex: 1,
    gap: 4,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  insightSummary: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary.light,
  },
  evidenceLine: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary.light,
  },
  chevron: {
    fontSize: 22,
    lineHeight: 26,
    color: colors.textSecondary.light,
  },
});
