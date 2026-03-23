import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import type { EventRsvpStatus } from '@/types/calendar';

export interface RSVPOption {
  label: string;
  value: EventRsvpStatus;
}

export const RSVP_OPTIONS: RSVPOption[] = [
  { label: 'Going', value: 'going' },
  { label: 'Maybe', value: 'maybe' },
  { label: 'Not going', value: 'not_going' },
];

interface RSVPChipsProps {
  value: EventRsvpStatus | null;
  onChange: (value: EventRsvpStatus) => void;
  disabled?: boolean;
}

export function RSVPChips({ value, onChange, disabled = false }: RSVPChipsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>RSVP</Text>
      <View style={styles.row}>
        {RSVP_OPTIONS.map((option) => (
          <View key={option.value} style={styles.chip}>
            <Button
              label={option.label}
              variant={value === option.value ? 'primary' : 'secondary'}
              size="sm"
              disabled={disabled}
              onPress={() => onChange(option.value)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minWidth: 96,
  },
});
