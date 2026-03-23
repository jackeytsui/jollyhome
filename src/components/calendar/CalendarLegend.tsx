import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { CALENDAR_SOURCE_ICON_MAP } from '@/hooks/useCalendar';
import type { HouseholdCalendarItem } from '@/types/calendar';

export interface LegendMember {
  id: string;
  name: string;
  color: string;
}

export const LEGEND_SOURCE_ORDER: HouseholdCalendarItem['sourceType'][] = [
  'event',
  'chore',
  'attendance',
  'meal',
  'maintenance',
  'guest',
  'quiet-hours',
  'booking',
];

interface CalendarLegendProps {
  members: LegendMember[];
}

function formatLabel(sourceType: HouseholdCalendarItem['sourceType']): string {
  if (sourceType === 'quiet-hours') {
    return 'quiet hours';
  }

  return sourceType;
}

export function CalendarLegend({ members }: CalendarLegendProps) {
  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.heading}>Members</Text>
          <View style={styles.row}>
            {members.map((member) => (
              <View key={member.id} style={styles.memberChip}>
                <View style={[styles.swatch, { backgroundColor: member.color }]} />
                <Text style={styles.memberLabel}>{member.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Timeline legend</Text>
          <View style={styles.row}>
            {LEGEND_SOURCE_ORDER.map((sourceType) => (
              <View key={sourceType} style={styles.legendChip}>
                <Text style={styles.iconText}>{CALENDAR_SOURCE_ICON_MAP[sourceType]}</Text>
                <Text style={styles.legendLabel}>{formatLabel(sourceType)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    gap: 10,
  },
  heading: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.dominant.light,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  memberLabel: {
    fontSize: 13,
    color: colors.textPrimary.light,
    lineHeight: 18,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.dominant.light,
  },
  iconText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent.light,
    textTransform: 'uppercase',
  },
  legendLabel: {
    fontSize: 13,
    color: colors.textPrimary.light,
    lineHeight: 18,
    textTransform: 'capitalize',
  },
});
