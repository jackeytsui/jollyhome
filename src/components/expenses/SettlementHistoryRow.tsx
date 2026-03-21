import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import type { Settlement } from '@/types/expenses';

interface SettlementHistoryRowProps {
  settlement: Settlement;
  memberName: string;
}

function formatCurrency(cents: number): string {
  return (Math.abs(cents) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SettlementHistoryRow({ settlement, memberName }: SettlementHistoryRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.date}>{formatDate(settlement.created_at)}</Text>
        {settlement.payment_method ? (
          <Text style={styles.method}>{settlement.payment_method}</Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatCurrency(settlement.amount_cents)}</Text>
        <Text style={styles.memberLabel}>{memberName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    minHeight: 44,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
    fontWeight: '400',
  },
  method: {
    fontSize: 12,
    color: colors.textSecondary.light,
    lineHeight: 16,
    fontWeight: '400',
    textTransform: 'capitalize',
  },
  amount: {
    fontSize: 14,
    color: colors.success.light,
    lineHeight: 20,
    fontWeight: '600',
  },
  memberLabel: {
    fontSize: 12,
    color: colors.textSecondary.light,
    lineHeight: 16,
  },
});
