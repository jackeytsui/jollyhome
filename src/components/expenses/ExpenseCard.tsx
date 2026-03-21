import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import type { Expense, ExpenseSplit } from '@/types/expenses';

type ExpenseWithSplits = Expense & { expense_splits: ExpenseSplit[] };

interface ExpenseCardProps {
  expense: ExpenseWithSplits;
  onPress: () => void;
}

function getCategoryIcon(category: string | null): string {
  switch (category) {
    case 'Groceries': return '🛒';
    case 'Dining': return '🍽️';
    case 'Utilities': return '⚡';
    case 'Rent': return '🏠';
    case 'Transport': return '🚗';
    case 'Entertainment': return '🎬';
    case 'Healthcare': return '❤️';
    case 'Household': return '📦';
    default: return '💰';
  }
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ExpenseCard({ expense, onPress }: ExpenseCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withTiming(0.98, { duration: 100 });
  }

  function handlePressOut() {
    scale.value = withTiming(1, { duration: 100 });
  }

  const categoryIcon = getCategoryIcon(expense.category);
  const amountFormatted = formatCurrency(expense.amount_cents);
  const dateFormatted = formatDate(expense.expense_date);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{categoryIcon}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description} numberOfLines={1}>
            {expense.description}
          </Text>
          <Text style={styles.date}>{dateFormatted}</Text>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.amount}>{amountFormatted}</Text>
          <View style={styles.payerAvatar}>
            <Text style={styles.payerInitials}>
              {getInitials(expense.paid_by?.slice(0, 4))}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary.light,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.dominant.light,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  date: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.light,
    lineHeight: 20,
  },
  payerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payerInitials: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary.light,
  },
});
