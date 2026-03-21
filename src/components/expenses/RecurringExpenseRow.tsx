import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { colors } from '@/constants/theme';
import type { RecurringExpenseTemplate } from '@/types/expenses';

interface RecurringExpenseRowProps {
  template: RecurringExpenseTemplate;
  onSkip: () => void;
  onPause: () => void;
  onResume: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatScheduleLabel(template: RecurringExpenseTemplate): string {
  switch (template.frequency) {
    case 'daily':
      return 'Every day';
    case 'weekly': {
      const dayName = template.day_of_week !== null ? DAY_NAMES[template.day_of_week] : 'week';
      return `Every ${dayName}`;
    }
    case 'biweekly': {
      const dayName = template.day_of_week !== null ? DAY_NAMES[template.day_of_week] : 'week';
      return `Every 2 weeks on ${dayName}`;
    }
    case 'monthly': {
      const day = template.day_of_month ?? 1;
      const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
      return `Monthly on the ${day}${suffix}`;
    }
    case 'custom':
      return `Every ${template.custom_interval_days ?? 1} days`;
    default:
      return 'Recurring';
  }
}

function formatAmount(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RecurringExpenseRow({
  template,
  onSkip,
  onPause,
  onResume,
  onEdit,
  onDelete,
}: RecurringExpenseRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const closeSwipeable = () => swipeableRef.current?.close();

  const renderLeftActions = (_progress: Animated.AnimatedInterpolation<number>) => (
    <View style={styles.leftActions}>
      <Pressable
        style={[styles.actionButton, styles.skipAction]}
        onPress={() => { closeSwipeable(); onSkip(); }}
        accessibilityLabel="Skip next occurrence"
      >
        <Text style={styles.actionText}>Skip</Text>
      </Pressable>
      <Pressable
        style={[styles.actionButton, styles.pauseAction]}
        onPress={() => { closeSwipeable(); template.is_paused ? onResume() : onPause(); }}
        accessibilityLabel={template.is_paused ? 'Resume recurring expense' : 'Pause recurring expense'}
      >
        <Text style={styles.actionText}>{template.is_paused ? 'Resume' : 'Pause'}</Text>
      </Pressable>
    </View>
  );

  const renderRightActions = (_progress: Animated.AnimatedInterpolation<number>) => (
    <View style={styles.rightActions}>
      <Pressable
        style={[styles.actionButton, styles.editAction]}
        onPress={() => { closeSwipeable(); onEdit(); }}
        accessibilityLabel="Edit recurring expense"
      >
        <Text style={styles.actionText}>Edit</Text>
      </Pressable>
      <Pressable
        style={[styles.actionButton, styles.deleteAction]}
        onPress={() => { closeSwipeable(); onDelete(); }}
        accessibilityLabel="Delete recurring expense"
      >
        <Text style={styles.actionText}>Delete</Text>
      </Pressable>
    </View>
  );

  const scheduleLabel = formatScheduleLabel(template);

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
    >
      <View style={[styles.row, template.is_paused && styles.rowPaused]}>
        <View style={styles.info}>
          <Text style={styles.description} numberOfLines={1}>
            {template.description}
          </Text>
          <Text style={styles.schedule}>{scheduleLabel}</Text>
          <Text style={styles.dueDate}>
            Next: {formatDueDate(template.next_due_date)}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{formatAmount(template.amount_cents)}</Text>
          {template.is_paused && (
            <View style={styles.pausedBadge}>
              <Text style={styles.pausedBadgeText}>Paused</Text>
            </View>
          )}
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 16,
    gap: 12,
  },
  rowPaused: {
    opacity: 0.5,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary.light,
    lineHeight: 22,
  },
  schedule: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  dueDate: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  amountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.light,
    lineHeight: 20,
  },
  pausedBadge: {
    backgroundColor: colors.sandbox.light,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pausedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 14,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    gap: 4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 14,
    minHeight: 44,
    minWidth: 60,
  },
  skipAction: {
    backgroundColor: colors.accent.light,
  },
  pauseAction: {
    backgroundColor: colors.textSecondary.light,
  },
  editAction: {
    backgroundColor: colors.accent.light,
  },
  deleteAction: {
    backgroundColor: colors.destructive.light,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 18,
  },
});
