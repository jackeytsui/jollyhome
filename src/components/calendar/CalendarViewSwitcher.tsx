import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'agenda';

interface CalendarViewOption {
  label: string;
  value: CalendarViewMode;
}

export const CALENDAR_VIEW_OPTIONS: CalendarViewOption[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Agenda', value: 'agenda' },
];

interface CalendarViewSwitcherProps {
  value: CalendarViewMode;
  onChange: (value: CalendarViewMode) => void;
}

export function CalendarViewSwitcher({ value, onChange }: CalendarViewSwitcherProps) {
  return (
    <View style={styles.container}>
      {CALENDAR_VIEW_OPTIONS.map((option) => (
        <View key={option.value} style={styles.option}>
          <Button
            label={option.label}
            size="sm"
            variant={value === option.value ? 'primary' : 'secondary'}
            onPress={() => onChange(option.value)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    minWidth: 88,
  },
});
