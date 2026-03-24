import { useCallback, useEffect, useState } from 'react';
import { projectCalendarItems } from '@/lib/calendarProjection';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import type { CalendarActivityType, CalendarEvent, EventRsvp, HouseholdCalendarItem } from '@/types/calendar';

const REALTIME_CHANNEL_NAME = (householdId: string) => `household:${householdId}:chores-calendar`;

export const CALENDAR_SOURCE_ICON_MAP: Record<
  HouseholdCalendarItem['sourceType'],
  string
> = {
  event: 'calendar',
  chore: 'sparkles',
  attendance: 'home',
  meal: 'utensils',
  maintenance: 'wrench',
  guest: 'users',
  'quiet-hours': 'moon',
  booking: 'key',
};

interface CalendarEventInput {
  activity_type?: CalendarActivityType;
  title: string;
  description?: string | null;
  location?: string | null;
  starts_at: string;
  ends_at: string;
  timezone?: string;
  all_day?: boolean;
  recurrence_rule?: string | null;
  recurrence_timezone?: string;
  recurrence_anchor: string;
  icon_key?: string | null;
  visual_weight?: 'light' | 'medium' | 'secondary' | 'strong';
  owner_member_user_ids?: string[];
}

interface CalendarEventUpdateInput {
  activity_type?: CalendarActivityType;
  title?: string;
  description?: string | null;
  location?: string | null;
  starts_at?: string;
  ends_at?: string;
  timezone?: string;
  all_day?: boolean;
  recurrence_rule?: string | null;
  recurrence_timezone?: string;
  recurrence_anchor?: string;
  icon_key?: string | null;
  visual_weight?: 'light' | 'medium' | 'secondary' | 'strong';
  owner_member_user_ids?: string[];
}

interface ProjectedChoreRow {
  id: string;
  household_id: string;
  template_id: string;
  scheduled_for: string | null;
  due_window_end: string | null;
  template: {
    title: string;
    description: string | null;
    icon_key: string | null;
  } | Array<{
    title: string;
    description: string | null;
    icon_key: string | null;
  }> | null;
  assignments: Array<{
    member_user_id: string;
  }> | null;
}

interface AttendanceRow {
  id: string;
  household_id: string;
  member_user_id: string;
  attendance_date: string;
  status: 'home_tonight' | 'away_tonight';
  note: string | null;
}

interface MealPlanEntryRow {
  id: string;
  household_id: string;
  recipe_id: string | null;
  suggestion_run_id: string | null;
  suggestion_id: string | null;
  calendar_item_id: string | null;
  title: string;
  slot_key: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  slot_date: string;
  starts_at: string | null;
  ends_at: string | null;
  status: 'planned' | 'cooked' | 'skipped';
  servings_planned: number | string;
  serving_source: 'manual' | 'attendance' | 'recipe_default';
  attendance_member_ids: string[] | null;
  attendance_snapshot_date: string | null;
  notes: string | null;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapCalendarEvent(row: {
  id: string;
  household_id: string;
  created_by: string;
  activity_type: CalendarActivityType;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string;
  all_day: boolean;
  recurrence_rule: string | null;
  recurrence_timezone: string;
  recurrence_anchor: string;
  icon_key: string | null;
  visual_weight: 'light' | 'medium' | 'secondary' | 'strong';
  owner_member_user_ids: string[] | null;
  created_at: string;
  updated_at: string;
}): CalendarEvent {
  return {
    id: row.id,
    householdId: row.household_id,
    createdBy: row.created_by,
    activityType: row.activity_type,
    title: row.title,
    description: row.description,
    location: row.location,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timezone: row.timezone,
    allDay: row.all_day,
    recurrenceRule: row.recurrence_rule,
    recurrenceTimezone: row.recurrence_timezone,
    recurrenceAnchor: row.recurrence_anchor,
    iconKey: row.icon_key,
    visualWeight: row.visual_weight,
    memberOwnerIds: row.owner_member_user_ids ?? [],
    memberColorKey: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
  const [items, setItems] = useState<HouseholdCalendarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const user = useAuthStore((state) => state.user);

  const loadCalendar = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId) {
      setEvents([]);
      setRsvps([]);
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [eventsResult, rsvpsResult, choreResult, attendanceResult, mealPlanResult] = await Promise.all([
        supabase
          .from('calendar_events')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('starts_at', { ascending: true }),
        supabase
          .from('event_rsvps')
          .select('*')
          .eq('household_id', activeHouseholdId),
        supabase
          .from('chore_instances')
          .select('id, household_id, template_id, scheduled_for, due_window_end, template:chore_templates(title, description, icon_key), assignments:chore_assignments(member_user_id)')
          .eq('household_id', activeHouseholdId)
          .in('status', ['open', 'claimed']),
        supabase
          .from('member_attendance')
          .select('*')
          .eq('household_id', activeHouseholdId),
        supabase
          .from('meal_plan_entries')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .neq('status', 'skipped'),
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (rsvpsResult.error) throw rsvpsResult.error;
      if (choreResult.error) throw choreResult.error;
      if (attendanceResult.error) throw attendanceResult.error;
      if (mealPlanResult.error) throw mealPlanResult.error;

      const mappedEvents = ((eventsResult.data ?? []) as Array<Parameters<typeof mapCalendarEvent>[0]>).map(mapCalendarEvent);
      const choreRows = (choreResult.data ?? []) as unknown as ProjectedChoreRow[];
      const attendanceRows = (attendanceResult.data ?? []) as AttendanceRow[];

      setEvents(mappedEvents);
      setRsvps(((rsvpsResult.data ?? []) as Array<{
        id: string;
        event_id: string;
        household_id: string;
        member_user_id: string;
        status: 'going' | 'maybe' | 'not_going';
        responded_at: string | null;
        note: string | null;
      }>).map((row) => ({
        id: row.id,
        eventId: row.event_id,
        householdId: row.household_id,
        memberId: row.member_user_id,
        status: row.status,
        respondedAt: row.responded_at,
        note: row.note,
      })));
      setItems(
        projectCalendarItems({
          events: mappedEvents,
          choreInstances: choreRows.map((row) => {
            const template = Array.isArray(row.template) ? row.template[0] ?? null : row.template;

            return {
              id: row.id,
              householdId: row.household_id,
              templateId: row.template_id,
              title: template?.title ?? 'Chore',
              details: template?.description ?? null,
              startsAt: row.scheduled_for ?? row.due_window_end ?? new Date().toISOString(),
              endsAt: row.due_window_end ?? row.scheduled_for ?? new Date().toISOString(),
              iconKey: template?.icon_key ?? null,
              memberOwnerIds: row.assignments?.map((assignment) => assignment.member_user_id) ?? [],
              memberColorKey: null,
            };
          }),
          attendanceEntries: attendanceRows.map((row) => ({
            id: row.id,
            householdId: row.household_id,
            memberUserId: row.member_user_id,
            attendanceDate: row.attendance_date,
            status: row.status,
            note: row.note,
          })),
          mealPlanEntries: ((mealPlanResult.data ?? []) as MealPlanEntryRow[]).map((row) => ({
            id: row.id,
            householdId: row.household_id,
            recipeId: row.recipe_id,
            suggestionRunId: row.suggestion_run_id,
            suggestionId: row.suggestion_id,
            calendarItemId: row.calendar_item_id,
            title: row.title,
            slot: row.slot_key,
            plannedForDate: row.slot_date,
            startsAt: row.starts_at,
            endsAt: row.ends_at,
            status: row.status,
            servings: toNumber(row.servings_planned) ?? 1,
            servingSource: row.serving_source,
            attendanceMemberIds: row.attendance_member_ids ?? [],
            attendanceSnapshotDate: row.attendance_snapshot_date,
            notes: row.notes,
          })),
        })
          .map((item) => ({
            ...item,
            iconKey: item.iconKey ?? CALENDAR_SOURCE_ICON_MAP[item.sourceType],
          }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  const createEvent = useCallback(async (input: CalendarEventInput): Promise<void> => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const { error: insertError } = await supabase.from('calendar_events').insert({
      household_id: activeHouseholdId,
      created_by: user.id,
      activity_type: input.activity_type ?? 'event',
      title: input.title,
      description: input.description ?? null,
      location: input.location ?? null,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      timezone: input.timezone ?? 'UTC',
      all_day: input.all_day ?? false,
      recurrence_rule: input.recurrence_rule ?? null,
      recurrence_timezone: input.recurrence_timezone ?? input.timezone ?? 'UTC',
      recurrence_anchor: input.recurrence_anchor,
      icon_key:
        input.icon_key ??
        CALENDAR_SOURCE_ICON_MAP[input.activity_type === 'quiet_hours' ? 'quiet-hours' : input.activity_type ?? 'event'],
      visual_weight: input.visual_weight ?? (input.activity_type === 'event' ? 'strong' : 'secondary'),
      owner_member_user_ids: input.owner_member_user_ids ?? [],
    });

    if (insertError) {
      throw insertError;
    }

    await loadCalendar();
  }, [activeHouseholdId, loadCalendar, user]);

  const createActivityEntry = useCallback(async (
    activityType: Exclude<CalendarActivityType, 'event'>,
    input: Omit<CalendarEventInput, 'activity_type'>
  ): Promise<void> => {
    await createEvent({
      ...input,
      activity_type: activityType,
      visual_weight: input.visual_weight ?? 'secondary',
    });
  }, [createEvent]);

  const updateEvent = useCallback(async (id: string, updates: CalendarEventUpdateInput): Promise<void> => {
    const { error: updateError } = await supabase.from('calendar_events').update(updates).eq('id', id);

    if (updateError) {
      throw updateError;
    }

    await loadCalendar();
  }, [loadCalendar]);

  const upsertRsvp = useCallback(async (
    eventId: string,
    status: 'going' | 'maybe' | 'not_going',
    note?: string | null
  ): Promise<void> => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const { error: upsertError } = await supabase.from('event_rsvps').upsert({
      household_id: activeHouseholdId,
      event_id: eventId,
      member_user_id: user.id,
      status,
      responded_at: new Date().toISOString(),
      note: note ?? null,
    });

    if (upsertError) {
      throw upsertError;
    }

    await loadCalendar();
  }, [activeHouseholdId, loadCalendar, user]);

  useEffect(() => {
    if (!activeHouseholdId) {
      return;
    }

    loadCalendar();

    const channel = supabase
      .channel(REALTIME_CHANNEL_NAME(activeHouseholdId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events', filter: `household_id=eq.${activeHouseholdId}` }, loadCalendar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_rsvps', filter: `household_id=eq.${activeHouseholdId}` }, loadCalendar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chore_instances', filter: `household_id=eq.${activeHouseholdId}` }, loadCalendar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'member_attendance', filter: `household_id=eq.${activeHouseholdId}` }, loadCalendar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plan_entries', filter: `household_id=eq.${activeHouseholdId}` }, loadCalendar)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHouseholdId, loadCalendar]);

  return {
    events,
    rsvps,
    items,
    iconMap: CALENDAR_SOURCE_ICON_MAP,
    loading,
    error,
    loadCalendar,
    createEvent,
    createActivityEntry,
    updateEvent,
    upsertRsvp,
  };
}
