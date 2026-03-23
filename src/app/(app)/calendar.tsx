import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar, type ICalendarEventBase, type Mode } from 'react-native-big-calendar';
import {
  CalendarDays,
  Clock3,
  Home,
  KeyRound,
  MoonStar,
  Sparkles,
  Ticket,
  UserRoundPlus,
  Utensils,
  Wrench,
} from 'lucide-react-native';
import { CalendarAgendaList } from '@/components/calendar/CalendarAgendaList';
import { AttendanceToggleStrip } from '@/components/calendar/AttendanceToggleStrip';
import { CalendarLegend } from '@/components/calendar/CalendarLegend';
import { CalendarViewSwitcher, type CalendarViewMode } from '@/components/calendar/CalendarViewSwitcher';
import { EventEditorSheet } from '@/components/calendar/EventEditorSheet';
import { RSVPChips } from '@/components/calendar/RSVPChips';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { CALENDAR_SOURCE_ICON_MAP, useCalendar } from '@/hooks/useCalendar';
import { useHouseholdStore } from '@/stores/household';
import { useMembers } from '@/hooks/useMembers';
import type { EventRsvpStatus, HouseholdCalendarItem } from '@/types/calendar';

const MEMBER_COLOR_PALETTE = [
  '#F97316',
  '#0F766E',
  '#2563EB',
  '#BE123C',
  '#CA8A04',
  '#7C3AED',
] as const;

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

type CalendarRangeMode = Extract<Mode, 'day' | 'week' | 'month'>;

interface CalendarRenderEvent extends ICalendarEventBase {
  calendarItem: HouseholdCalendarItem;
  sourceType: HouseholdCalendarItem['sourceType'];
  color: string;
  visualWeight: HouseholdCalendarItem['visualWeight'];
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatRangeLabel(mode: CalendarRangeMode, date: Date): string {
  if (mode === 'day') {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  if (mode === 'month') {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  const day = date.getDay();
  const weekStart = addDays(date, -day);
  const weekEnd = addDays(weekStart, 6);
  const startLabel = formatDateLabel(weekStart);
  const endLabel = new Intl.DateTimeFormat('en-US', {
    month: weekStart.getMonth() === weekEnd.getMonth() ? undefined : 'short',
    day: 'numeric',
  }).format(weekEnd);

  return `${startLabel} - ${endLabel}`;
}

function shiftDateByMode(date: Date, mode: CalendarViewMode, direction: 'prev' | 'next'): Date {
  const delta = direction === 'next' ? 1 : -1;

  switch (mode) {
    case 'day':
      return addDays(date, delta);
    case 'month':
      return addMonths(date, delta);
    case 'agenda':
    case 'week':
    default:
      return addDays(date, delta * 7);
  }
}

function getMemberColor(memberId: string | null | undefined, indexLookup: Map<string, number>): string {
  if (!memberId) {
    return colors.accent.light;
  }

  const index = indexLookup.get(memberId) ?? 0;
  return MEMBER_COLOR_PALETTE[index % MEMBER_COLOR_PALETTE.length];
}

function getItemColor(item: HouseholdCalendarItem, indexLookup: Map<string, number>): string {
  return getMemberColor(item.memberOwnerIds[0], indexLookup);
}

function getWeightOpacity(weight: HouseholdCalendarItem['visualWeight']): number {
  switch (weight) {
    case 'strong':
      return 1;
    case 'medium':
      return 0.9;
    case 'light':
    case 'secondary':
    default:
      return 0.72;
  }
}

function formatTimeRange(item: HouseholdCalendarItem): string {
  if (item.allDay) {
    return 'All day';
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${formatter.format(new Date(item.startsAt))} - ${formatter.format(new Date(item.endsAt))}`;
}

function getSourceLabel(sourceType: HouseholdCalendarItem['sourceType']): string {
  if (sourceType === 'quiet-hours') {
    return 'Quiet hours';
  }

  return sourceType[0].toUpperCase() + sourceType.slice(1);
}

function renderCalendarEvent(event: CalendarRenderEvent, onPress: (item: HouseholdCalendarItem) => void) {
  const Icon = ICON_COMPONENTS[CALENDAR_SOURCE_ICON_MAP[event.sourceType]];
  const textColor = event.visualWeight === 'strong' ? '#FFFFFF' : colors.textPrimary.light;

  return (
    <Pressable
      onPress={() => onPress(event.calendarItem)}
      style={[
        styles.eventChip,
        {
          backgroundColor: event.color,
          opacity: getWeightOpacity(event.visualWeight),
        },
      ]}
    >
      <View style={styles.eventChipHeader}>
        <Icon color={textColor} size={12} strokeWidth={2.2} />
        <Text numberOfLines={1} style={[styles.eventChipTitle, { color: textColor }]}>
          {event.title}
        </Text>
      </View>
      <Text numberOfLines={1} style={[styles.eventChipMeta, { color: textColor }]}>
        {event.calendarItem.allDay ? getSourceLabel(event.sourceType) : formatTimeRange(event.calendarItem)}
      </Text>
    </Pressable>
  );
}

export default function CalendarScreen() {
  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const { members, loadMembers } = useMembers(activeHouseholdId);
  const { items, rsvps, loading, error, loadCalendar, upsertRsvp } = useCalendar();

  const [selectedView, setSelectedView] = useState<CalendarViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<HouseholdCalendarItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [savingRsvp, setSavingRsvp] = useState(false);

  useEffect(() => {
    void loadCalendar();
    void loadMembers();
  }, [loadCalendar, loadMembers]);

  const memberIndexLookup = useMemo(
    () => new Map(members.map((member, index) => [member.user_id, index])),
    [members]
  );

  const legendMembers = useMemo(
    () =>
      members
        .filter((member) => member.status === 'active')
        .map((member, index) => ({
          id: member.user_id,
          name: member.profile.display_name ?? 'Housemate',
          color: MEMBER_COLOR_PALETTE[index % MEMBER_COLOR_PALETTE.length],
        })),
    [members]
  );

  const calendarEvents = useMemo<CalendarRenderEvent[]>(
    () =>
      items.map((item) => ({
        title: item.title,
        start: new Date(item.startsAt),
        end: new Date(item.endsAt),
        calendarItem: item,
        sourceType: item.sourceType,
        color: getItemColor(item, memberIndexLookup),
        visualWeight: item.sourceType === 'event' ? 'strong' : item.visualWeight,
      })),
    [items, memberIndexLookup]
  );

  const selectedRsvp = useMemo(() => {
    if (!selectedItem || selectedItem.sourceType !== 'event') {
      return null;
    }

    return rsvps.find((rsvp) => rsvp.eventId === selectedItem.sourceId)?.status ?? null;
  }, [rsvps, selectedItem]);

  const headerLabel = formatRangeLabel(
    selectedView === 'agenda' ? 'week' : selectedView,
    currentDate
  );

  async function handleRsvpChange(status: EventRsvpStatus) {
    if (!selectedItem || selectedItem.sourceType !== 'event') {
      return;
    }

    setSavingRsvp(true);

    try {
      await upsertRsvp(selectedItem.sourceId, status);
    } catch (rsvpError) {
      const message = rsvpError instanceof Error ? rsvpError.message : 'Failed to update RSVP';
      Alert.alert('RSVP failed', message);
    } finally {
      setSavingRsvp(false);
    }
  }

  function openComposer() {
    setSelectedItem(null);
    setIsEditorOpen(true);
  }

  function renderTimeline() {
    if (selectedView === 'agenda') {
      return (
        <CalendarAgendaList
          items={items}
          memberColorLookup={memberIndexLookup}
          onSelectItem={setSelectedItem}
        />
      );
    }

    return (
      <Calendar<CalendarRenderEvent>
        events={calendarEvents}
        height={620}
        date={currentDate}
        mode={selectedView}
        weekStartsOn={0}
        swipeEnabled
        ampm
        showTime
        minHour={6}
        maxHour={23}
        eventCellTextColor="#FFFFFF"
        eventMinHeightForMonthView={28}
        onPressEvent={(event) => setSelectedItem(event.calendarItem)}
        eventCellStyle={(event) => ({
          backgroundColor: event.color,
          borderRadius: 12,
          borderWidth: event.visualWeight === 'strong' ? 0 : 1,
          borderColor: 'rgba(255,255,255,0.48)',
          opacity: getWeightOpacity(event.visualWeight),
          paddingHorizontal: 2,
          paddingVertical: 2,
        })}
        renderEvent={(event) => renderCalendarEvent(event, setSelectedItem)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Shared timeline</Text>
            <Text style={styles.title}>Household calendar</Text>
            <Text style={styles.subtitle}>
              Day, week, month, and agenda views all render the same projected household timeline.
            </Text>
          </View>
          <Button label="Add event" onPress={openComposer} />
        </View>

        <AttendanceToggleStrip />

        <Card style={styles.timelineCard}>
          <View style={styles.toolbar}>
            <CalendarViewSwitcher value={selectedView} onChange={setSelectedView} />
            <View style={styles.rangeRow}>
              <Button
                label="Prev"
                variant="secondary"
                size="sm"
                onPress={() => setCurrentDate((current) => shiftDateByMode(current, selectedView, 'prev'))}
              />
              <View style={styles.rangeLabelWrap}>
                <Text style={styles.rangeLabel}>{headerLabel}</Text>
              </View>
              <Button
                label="Today"
                variant="ghost"
                size="sm"
                onPress={() => setCurrentDate(new Date())}
              />
              <Button
                label="Next"
                variant="secondary"
                size="sm"
                onPress={() => setCurrentDate((current) => shiftDateByMode(current, selectedView, 'next'))}
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.stateBlock}>
              <ActivityIndicator color={colors.accent.light} />
              <Text style={styles.stateText}>Loading the shared timeline...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateBlock}>
              <Text style={styles.errorTitle}>Calendar load failed</Text>
              <Text style={styles.stateText}>{error}</Text>
              <Button
                label="Retry"
                size="sm"
                onPress={() => {
                  void loadCalendar();
                }}
              />
            </View>
          ) : (
            renderTimeline()
          )}
        </Card>

        <CalendarLegend members={legendMembers} />

        {selectedItem ? (
          <Card style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={styles.detailTitleRow}>
                <Ticket color={getItemColor(selectedItem, memberIndexLookup)} size={18} />
                <Text style={styles.detailTitle}>{selectedItem.title}</Text>
              </View>
              <Text style={styles.detailBadge}>{getSourceLabel(selectedItem.sourceType)}</Text>
            </View>

            <View style={styles.detailMeta}>
              <View style={styles.metaRow}>
                <Clock3 color={colors.textSecondary.light} size={15} />
                <Text style={styles.metaText}>{formatTimeRange(selectedItem)}</Text>
              </View>
              {selectedItem.details ? (
                <Text style={styles.detailDescription}>{selectedItem.details}</Text>
              ) : null}
            </View>

            {selectedItem.sourceType === 'event' ? (
              <RSVPChips
                value={selectedRsvp}
                disabled={savingRsvp}
                onChange={(status) => {
                  void handleRsvpChange(status);
                }}
              />
            ) : null}
          </Card>
        ) : null}

        {!activeHouseholdId ? (
          <Card>
            <Text style={styles.emptyTitle}>No active household selected</Text>
            <Text style={styles.stateText}>
              Pick or create a household first so the calendar can render the shared timeline.
            </Text>
          </Card>
        ) : null}
      </ScrollView>

      <EventEditorSheet
        visible={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaved={() => {
          setIsEditorOpen(false);
        }}
        memberOptions={legendMembers.map((member) => ({
          id: member.id,
          label: member.name,
          color: member.color,
        }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dominant.light,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.accent.light,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
  },
  timelineCard: {
    gap: 16,
  },
  toolbar: {
    gap: 12,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  rangeLabelWrap: {
    flex: 1,
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary.light,
    lineHeight: 22,
  },
  stateBlock: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary.light,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.destructive.light,
  },
  eventChip: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 44,
    gap: 4,
  },
  eventChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventChipTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    flex: 1,
  },
  eventChipMeta: {
    fontSize: 11,
    lineHeight: 14,
  },
  detailCard: {
    gap: 14,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  detailTitleRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flex: 1,
  },
  detailTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 24,
  },
  detailBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent.light,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailMeta: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary.light,
    lineHeight: 20,
  },
  detailDescription: {
    fontSize: 14,
    color: colors.textPrimary.light,
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary.light,
    lineHeight: 22,
  },
});
