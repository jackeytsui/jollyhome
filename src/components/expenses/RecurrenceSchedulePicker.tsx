import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { colors } from '@/constants/theme';

type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

interface RecurrenceSchedulePickerProps {
  frequency: Frequency;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  customIntervalDays: number | null;
  onChange: (
    frequency: Frequency,
    dayOfMonth: number | null,
    dayOfWeek: number | null,
    customIntervalDays: number | null
  ) => void;
  onClose: () => void;
  visible: boolean;
}

const FREQUENCIES: { key: Frequency; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'biweekly', label: 'Biweekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'custom', label: 'Custom interval' },
];

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function RecurrenceSchedulePicker({
  frequency,
  dayOfMonth,
  dayOfWeek,
  customIntervalDays,
  onChange,
  onClose,
  visible,
}: RecurrenceSchedulePickerProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%'], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleFrequencySelect = useCallback((freq: Frequency) => {
    onChange(freq, dayOfMonth, dayOfWeek, customIntervalDays);
  }, [onChange, dayOfMonth, dayOfWeek, customIntervalDays]);

  const handleDayOfWeekSelect = useCallback((day: number) => {
    onChange(frequency, dayOfMonth, day, customIntervalDays);
  }, [onChange, frequency, dayOfMonth, customIntervalDays]);

  const handleDayOfMonthChange = useCallback((text: string) => {
    const parsed = parseInt(text, 10);
    const clamped = isNaN(parsed) ? null : Math.min(31, Math.max(1, parsed));
    onChange(frequency, clamped, dayOfWeek, customIntervalDays);
  }, [onChange, frequency, dayOfWeek, customIntervalDays]);

  const handleCustomDaysChange = useCallback((text: string) => {
    const parsed = parseInt(text, 10);
    const value = isNaN(parsed) ? null : Math.max(1, parsed);
    onChange(frequency, dayOfMonth, dayOfWeek, value);
  }, [onChange, frequency, dayOfMonth, dayOfWeek]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.bottomSheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Recurrence Schedule</Text>

        {/* Frequency selector */}
        <Text style={styles.sectionLabel}>Frequency</Text>
        {FREQUENCIES.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.frequencyRow, frequency === key && styles.frequencyRowSelected]}
            onPress={() => handleFrequencySelect(key)}
            accessibilityLabel={`Select ${label} frequency`}
            accessibilityState={{ selected: frequency === key }}
          >
            <Text style={[styles.frequencyLabel, frequency === key && styles.frequencyLabelSelected]}>
              {label}
            </Text>
            {frequency === key && <Text style={styles.checkmark}>✓</Text>}
          </Pressable>
        ))}

        {/* Day-of-week selector for Weekly / Biweekly */}
        {(frequency === 'weekly' || frequency === 'biweekly') && (
          <View style={styles.subsection}>
            <Text style={styles.sectionLabel}>Day of week</Text>
            <View style={styles.dayCircles}>
              {DAY_INITIALS.map((initial, index) => (
                <Pressable
                  key={index}
                  style={[styles.dayCircle, dayOfWeek === index && styles.dayCircleSelected]}
                  onPress={() => handleDayOfWeekSelect(index)}
                  accessibilityLabel={`Select ${DAY_NAMES[index]}`}
                  accessibilityState={{ selected: dayOfWeek === index }}
                >
                  <Text style={[styles.dayInitial, dayOfWeek === index && styles.dayInitialSelected]}>
                    {initial}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Day-of-month picker for Monthly */}
        {frequency === 'monthly' && (
          <View style={styles.subsection}>
            <Text style={styles.sectionLabel}>Day of month (1–31)</Text>
            <TextInput
              style={styles.textInput}
              value={dayOfMonth !== null ? String(dayOfMonth) : ''}
              onChangeText={handleDayOfMonthChange}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={colors.textSecondary.light}
              maxLength={2}
              accessibilityLabel="Day of month"
            />
          </View>
        )}

        {/* Custom interval days for Custom */}
        {frequency === 'custom' && (
          <View style={styles.subsection}>
            <Text style={styles.sectionLabel}>Every N days</Text>
            <TextInput
              style={styles.textInput}
              value={customIntervalDays !== null ? String(customIntervalDays) : ''}
              onChangeText={handleCustomDaysChange}
              keyboardType="number-pad"
              placeholder="7"
              placeholderTextColor={colors.textSecondary.light}
              maxLength={4}
              accessibilityLabel="Interval days"
            />
          </View>
        )}

        {/* Done button */}
        <Pressable style={styles.doneButton} onPress={onClose} accessibilityLabel="Confirm schedule">
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetBg: {
    backgroundColor: colors.dominant.light,
  },
  handle: {
    backgroundColor: colors.border.light,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 26,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary.light,
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: 4,
    backgroundColor: colors.secondary.light,
    minHeight: 44,
  },
  frequencyRowSelected: {
    borderColor: colors.accent.light,
    backgroundColor: colors.dominant.light,
  },
  frequencyLabel: {
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 22,
  },
  frequencyLabelSelected: {
    color: colors.accent.light,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: colors.accent.light,
    fontWeight: '700',
  },
  subsection: {
    marginTop: 4,
  },
  dayCircles: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.secondary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.accent.light,
    borderColor: colors.accent.light,
  },
  dayInitial: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 18,
  },
  dayInitialSelected: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: colors.secondary.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary.light,
    lineHeight: 22,
    minHeight: 44,
  },
  doneButton: {
    backgroundColor: colors.accent.light,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    minHeight: 44,
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
  },
});
