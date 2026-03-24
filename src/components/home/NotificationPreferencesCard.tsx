import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { NOTIFICATION_CATEGORY_ORDER } from '@/hooks/useNotifications';
import type { NotificationCategory, NotificationDeliveryMode, NotificationPreferences } from '@/types/notifications';

const MODE_OPTIONS: NotificationDeliveryMode[] = ['realtime', 'digest', 'off'];

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  expenses: 'Expenses',
  chores: 'Chores',
  calendar: 'Calendar',
  meals: 'Meals',
  supplies: 'Supplies',
  maintenance: 'Maintenance',
  rules: 'Rules',
};

interface NotificationPreferencesCardProps {
  preferences: NotificationPreferences | null;
  saving: boolean;
  onModeChange: (category: NotificationCategory, mode: NotificationDeliveryMode) => void;
  onDigestHourCycle: () => void;
}

export function NotificationPreferencesCard(props: NotificationPreferencesCardProps) {
  const { preferences, saving, onModeChange, onDigestHourCycle } = props;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Notification rhythm</Text>
          <Text style={styles.subtitle}>Choose what should interrupt you now versus land in the household digest.</Text>
        </View>
        <Pressable onPress={onDigestHourCycle} style={styles.hourChip}>
          <Text style={styles.hourChipText}>
            Digest {preferences ? `${preferences.digestHour}:00` : '18:00'}
          </Text>
        </Pressable>
      </View>

      {NOTIFICATION_CATEGORY_ORDER.map((category) => (
        <View key={category} style={styles.preferenceRow}>
          <View style={styles.preferenceText}>
            <Text style={styles.categoryLabel}>{CATEGORY_LABELS[category]}</Text>
            <Text style={styles.categoryHint}>
              {category === 'supplies'
                ? 'Low-stock and restock prompts'
                : category === 'calendar'
                  ? 'Upcoming events and booking context'
                  : category === 'meals'
                    ? 'Meal planning and week board changes'
                    : category === 'maintenance'
                      ? 'Repair lifecycle updates'
                      : category === 'rules'
                        ? 'Rule changes and acknowledgements'
                        : `Household ${category} updates`}
            </Text>
          </View>

          <View style={styles.modeRow}>
            {MODE_OPTIONS.map((mode) => {
              const selected = preferences?.categoryModes[category] === mode;
              return (
                <Pressable
                  key={mode}
                  disabled={saving}
                  onPress={() => onModeChange(category, mode)}
                  style={[styles.modeChip, selected ? styles.modeChipSelected : null]}
                >
                  <Text style={[styles.modeChipText, selected ? styles.modeChipTextSelected : null]}>
                    {mode}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  hourChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.dominant.light,
    borderColor: colors.border.light,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hourChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary.light,
  },
  preferenceRow: {
    gap: 8,
  },
  preferenceText: {
    gap: 2,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary.light,
  },
  categoryHint: {
    fontSize: 13,
    color: colors.textSecondary.light,
    lineHeight: 18,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.dominant.light,
  },
  modeChipSelected: {
    backgroundColor: colors.accent.light,
    borderColor: colors.accent.light,
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: colors.textSecondary.light,
  },
  modeChipTextSelected: {
    color: '#FFFFFF',
  },
});
