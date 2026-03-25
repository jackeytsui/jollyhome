import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CalendarDays,
  Home,
  KeyRound,
  MoonStar,
  Sparkles,
  UserRoundPlus,
  Utensils,
  Wrench,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { CALENDAR_SOURCE_ICON_MAP } from '@/hooks/useCalendar';
import { groupAgendaItemsByDay } from '@/lib/calendarProjection';
import type { HouseholdCalendarItem } from '@/types/calendar';

const ICON_COMPONENTS = {
  calendar: CalendarDays,
  sparkles: Sparkles,
  home: Home,
  utensils: Utensils,
  wrench: Wrench,
  users: UserRoundPlus,
  moon: MoonStar,
  key: KeyRound,
} as const;

interface CalendarAgendaListProps {
  items: HouseholdCalendarItem[];
  memberColorLookup: Map<string, number>;
  onSelectItem?: (item: HouseholdCalendarItem) => void;
}

const MEMBER_COLOR_PALETTE = [
  '#F97316',
  '#0F766E',
  '#2563EB',
  '#BE123C',
  '#CA8A04',
  '#7C3AED',
] as const;

function formatAgendaDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function formatAgendaTime(item: HouseholdCalendarItem): string {
  if (item.allDay) {
    return 'All day';
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${formatter.format(new Date(item.startsAt))} - ${formatter.format(new Date(item.endsAt))}`;
}

function getMemberColor(item: HouseholdCalendarItem, memberColorLookup: Map<string, number>): string {
  const firstOwnerId = item.memberOwnerIds[0];
  const index = firstOwnerId ? (memberColorLookup.get(firstOwnerId) ?? 0) : 0;
  return MEMBER_COLOR_PALETTE[index % MEMBER_COLOR_PALETTE.length];
}

export function CalendarAgendaList({
  items,
  memberColorLookup,
  onSelectItem,
}: CalendarAgendaListProps) {
  const groups = useMemo(() => groupAgendaItemsByDay(items, 'UTC'), [items]);

  if (groups.length === 0) {
    return (
      <Card>
        <Text style={styles.emptyTitle}>Agenda</Text>
        <Text style={styles.emptyText}>Projected events, chores, attendance, meals, and bookings will appear here.</Text>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Agenda</Text>
      {groups.map((group) => (
        <View key={group.date} style={styles.group}>
          <Text style={styles.groupTitle}>{formatAgendaDate(group.date)}</Text>
          <View style={styles.groupItems}>
            {group.items.map((item) => {
              const iconKey = CALENDAR_SOURCE_ICON_MAP[item.sourceType] as keyof typeof ICON_COMPONENTS;
              const Icon = ICON_COMPONENTS[iconKey];
              const itemColor = getMemberColor(item, memberColorLookup);

              return (
                <Pressable
                  key={item.id}
                  onPress={() => onSelectItem?.(item)}
                  style={[styles.row, { borderLeftColor: itemColor }]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: itemColor }]}>
                    <Icon color="#FFFFFF" size={16} strokeWidth={2.2} />
                  </View>
                  <View style={styles.copy}>
                    <View style={styles.rowHeader}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemType}>{item.sourceType === 'quiet-hours' ? 'quiet hours' : item.sourceType}</Text>
                    </View>
                    <Text style={styles.itemTime}>{formatAgendaTime(item)}</Text>
                    {item.details ? (
                      <Text numberOfLines={2} style={styles.itemDetails}>
                        {item.details}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary.light,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupItems: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderLeftWidth: 5,
    backgroundColor: colors.dominant.light,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  itemType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.light,
    textTransform: 'capitalize',
  },
  itemTime: {
    fontSize: 13,
    color: colors.textSecondary.light,
    lineHeight: 18,
  },
  itemDetails: {
    fontSize: 13,
    color: colors.textPrimary.light,
    lineHeight: 18,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 22,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
});
