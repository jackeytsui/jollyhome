import { groupAgendaItemsByDay, projectCalendarItems } from '@/lib/calendarProjection';
import { CALENDAR_SOURCE_ICON_MAP } from '@/hooks/useCalendar';
import type { CalendarEvent } from '@/types/calendar';

const baseEvent = {
  householdId: 'household-1',
  createdBy: 'user-1',
  description: null,
  location: null,
  timezone: 'UTC',
  allDay: false,
  recurrenceRule: null,
  recurrenceTimezone: 'UTC',
  recurrenceAnchor: '2026-03-22T18:00:00.000Z',
  memberOwnerIds: ['user-1'],
  memberColorKey: null,
  createdAt: '2026-03-21T00:00:00.000Z',
  updatedAt: '2026-03-21T00:00:00.000Z',
} satisfies Omit<CalendarEvent, 'id' | 'activityType' | 'title' | 'startsAt' | 'endsAt' | 'iconKey' | 'visualWeight'>;

describe('projectCalendarItems', () => {
  it('keeps event entries visually primary while projecting all CALD-04 activity types', () => {
    const events: CalendarEvent[] = [
      {
        ...baseEvent,
        id: 'event-1',
        activityType: 'event',
        title: 'House meeting',
        startsAt: '2026-03-22T18:00:00.000Z',
        endsAt: '2026-03-22T19:00:00.000Z',
        iconKey: CALENDAR_SOURCE_ICON_MAP.event,
        visualWeight: 'strong',
      },
      {
        ...baseEvent,
        id: 'meal-1',
        activityType: 'meal',
        title: 'Taco night',
        startsAt: '2026-03-22T19:30:00.000Z',
        endsAt: '2026-03-22T20:00:00.000Z',
        iconKey: CALENDAR_SOURCE_ICON_MAP.meal,
        visualWeight: 'medium',
      },
      {
        ...baseEvent,
        id: 'maintenance-1',
        activityType: 'maintenance',
        title: 'HVAC check',
        startsAt: '2026-03-23T10:00:00.000Z',
        endsAt: '2026-03-23T11:00:00.000Z',
        iconKey: CALENDAR_SOURCE_ICON_MAP.maintenance,
        visualWeight: 'medium',
      },
      {
        ...baseEvent,
        id: 'guest-1',
        activityType: 'guest',
        title: 'Guest arrival',
        startsAt: '2026-03-24T17:00:00.000Z',
        endsAt: '2026-03-24T18:00:00.000Z',
        iconKey: CALENDAR_SOURCE_ICON_MAP.guest,
        visualWeight: 'medium',
      },
      {
        ...baseEvent,
        id: 'quiet-1',
        activityType: 'quiet_hours',
        title: 'Quiet hours',
        startsAt: '2026-03-25T22:00:00.000Z',
        endsAt: '2026-03-25T23:00:00.000Z',
        iconKey: CALENDAR_SOURCE_ICON_MAP['quiet-hours'],
        visualWeight: 'medium',
      },
      {
        ...baseEvent,
        id: 'booking-1',
        activityType: 'booking',
        title: 'Guest room booking',
        startsAt: '2026-03-26T08:00:00.000Z',
        endsAt: '2026-03-26T10:00:00.000Z',
        iconKey: CALENDAR_SOURCE_ICON_MAP.booking,
        visualWeight: 'medium',
      },
    ];

    const projected = projectCalendarItems({
      events,
      choreInstances: [
        {
          id: 'chore-1',
          householdId: 'household-1',
          templateId: 'template-1',
          title: 'Take out recycling',
          details: null,
          startsAt: '2026-03-22T08:00:00.000Z',
          endsAt: '2026-03-22T08:30:00.000Z',
          iconKey: null,
          memberOwnerIds: ['user-2'],
          memberColorKey: null,
        },
      ],
      attendanceEntries: [
        {
          id: 'attendance-1',
          householdId: 'household-1',
          memberUserId: 'user-3',
          attendanceDate: '2026-03-22',
          status: 'away_tonight',
          note: 'Late shift',
        },
      ],
      mealPlanEntries: [
        {
          id: 'planned-meal-1',
          householdId: 'household-1',
          recipeId: 'recipe-1',
          suggestionRunId: 'run-1',
          suggestionId: 'suggestion-1',
          calendarItemId: null,
          title: 'Projected pasta night',
          slot: 'dinner',
          plannedForDate: '2026-03-22',
          startsAt: '2026-03-22T19:30:00.000Z',
          endsAt: '2026-03-22T20:15:00.000Z',
          status: 'planned',
          servings: 3,
          servingSource: 'attendance',
          attendanceMemberIds: ['user-1', 'user-2', 'user-3'],
          attendanceSnapshotDate: '2026-03-22',
          notes: 'Use pantry tomatoes first',
        },
      ],
    });

    const bySourceType = Object.fromEntries(projected.map((item) => [item.sourceType, item]));

    expect(bySourceType.event.visualWeight).toBe('strong');
    expect(bySourceType.chore.visualWeight).toBe('secondary');
    expect(bySourceType.attendance.visualWeight).toBe('secondary');
    expect(bySourceType.meal.visualWeight).toBe('secondary');
    expect(bySourceType.maintenance.visualWeight).toBe('secondary');
    expect(bySourceType.guest.visualWeight).toBe('secondary');
    expect(bySourceType['quiet-hours'].visualWeight).toBe('secondary');
    expect(bySourceType.booking.visualWeight).toBe('secondary');

    expect(bySourceType.chore.iconKey).toBeNull();
    expect(bySourceType.attendance.iconKey).toBeNull();
    expect(bySourceType.meal.iconKey).toBe(CALENDAR_SOURCE_ICON_MAP.meal);
    expect(bySourceType.meal.metadata).toEqual(
      expect.objectContaining({
        recipeId: 'recipe-1',
        servings: 3,
        attendanceMemberIds: ['user-1', 'user-2', 'user-3'],
      })
    );
  });

  it('groups agenda items by day in chronological order', () => {
    const projected = projectCalendarItems({
      events: [
        {
          ...baseEvent,
          id: 'event-1',
          activityType: 'event',
          title: 'Breakfast sync',
          startsAt: '2026-03-22T08:00:00.000Z',
          endsAt: '2026-03-22T08:30:00.000Z',
          iconKey: CALENDAR_SOURCE_ICON_MAP.event,
          visualWeight: 'strong',
        },
        {
          ...baseEvent,
          id: 'event-2',
          activityType: 'event',
          title: 'Late cleanup',
          startsAt: '2026-03-23T21:00:00.000Z',
          endsAt: '2026-03-23T21:30:00.000Z',
          iconKey: CALENDAR_SOURCE_ICON_MAP.event,
          visualWeight: 'strong',
        },
      ],
      choreInstances: [],
      attendanceEntries: [],
      mealPlanEntries: [],
    });

    const groups = groupAgendaItemsByDay(projected, 'UTC');

    expect(groups).toHaveLength(2);
    expect(groups[0]?.date).toBe('2026-03-22');
    expect(groups[0]?.items[0]?.title).toBe('Breakfast sync');
    expect(groups[1]?.date).toBe('2026-03-23');
  });
});
