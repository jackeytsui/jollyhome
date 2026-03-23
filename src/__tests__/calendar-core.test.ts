import { projectCalendarItems, groupAgendaItemsByDay } from '@/lib/calendarProjection';
import { useCalendar } from '@/hooks/useCalendar';
import { useAttendance } from '@/hooks/useAttendance';

describe('calendar projection', () => {
  it('projects events, chores, attendance, and lightweight household activity types into one timeline', () => {
    const items = projectCalendarItems({
      events: [
        {
          id: 'event-1',
          householdId: 'household-1',
          createdBy: 'member-1',
          activityType: 'event',
          title: 'House dinner',
          description: 'Everyone is home tonight',
          location: 'Kitchen',
          startsAt: '2026-03-23T18:00:00.000Z',
          endsAt: '2026-03-23T19:00:00.000Z',
          timezone: 'America/Toronto',
          allDay: false,
          recurrenceRule: null,
          recurrenceTimezone: 'America/Toronto',
          recurrenceAnchor: '2026-03-23T18:00:00.000Z',
          iconKey: 'calendar',
          visualWeight: 'strong',
          memberOwnerIds: ['member-1'],
          memberColorKey: 'sage',
          createdAt: '2026-03-22T18:00:00.000Z',
          updatedAt: '2026-03-22T18:00:00.000Z',
        },
        {
          id: 'meal-1',
          householdId: 'household-1',
          createdBy: 'member-1',
          activityType: 'meal',
          title: 'Meal plan',
          description: null,
          location: null,
          startsAt: '2026-03-23T20:00:00.000Z',
          endsAt: '2026-03-23T21:00:00.000Z',
          timezone: 'America/Toronto',
          allDay: false,
          recurrenceRule: null,
          recurrenceTimezone: 'America/Toronto',
          recurrenceAnchor: '2026-03-23T20:00:00.000Z',
          iconKey: 'utensils',
          visualWeight: 'light',
          memberOwnerIds: ['member-1'],
          memberColorKey: 'sage',
          createdAt: '2026-03-22T18:00:00.000Z',
          updatedAt: '2026-03-22T18:00:00.000Z',
        },
      ],
      choreInstances: [
        {
          id: 'chore-1',
          householdId: 'household-1',
          templateId: 'template-1',
          title: 'Take out trash',
          details: 'Bins to curb',
          startsAt: '2026-03-23T07:00:00.000Z',
          endsAt: '2026-03-23T07:30:00.000Z',
          iconKey: 'sparkles',
          memberOwnerIds: ['member-2'],
          memberColorKey: 'sky',
        },
      ],
      attendanceEntries: [
        {
          id: 'attendance-1',
          householdId: 'household-1',
          memberUserId: 'member-2',
          attendanceDate: '2026-03-23',
          status: 'home_tonight',
          note: null,
        },
      ],
    });

    expect(items.map((item) => item.sourceType)).toEqual(['chore', 'event', 'meal', 'attendance']);
    expect(items.find((item) => item.sourceType === 'event')?.visualWeight).toBe('strong');
    expect(items.find((item) => item.sourceType === 'meal')?.visualWeight).toBe('secondary');
    expect(items.find((item) => item.sourceType === 'attendance')?.attendanceStatus).toBe('home_tonight');
  });

  it('groups projected items into agenda days using household-local dates', () => {
    const groups = groupAgendaItemsByDay(
      [
        {
          id: 'calendar-item-1',
          householdId: 'household-1',
          sourceId: 'event-1',
          sourceType: 'event',
          title: 'House dinner',
          details: null,
          startsAt: '2026-03-23T18:00:00.000Z',
          endsAt: '2026-03-23T19:00:00.000Z',
          allDay: false,
          iconKey: 'calendar',
          visualWeight: 'strong',
          memberOwnerIds: ['member-1'],
          memberColorKey: 'sage',
          recurrenceRule: null,
          recurrenceTimezone: null,
          recurrenceAnchor: null,
          attendanceStatus: null,
          isProjected: false,
          metadata: null,
        },
        {
          id: 'calendar-item-2',
          householdId: 'household-1',
          sourceId: 'attendance-1',
          sourceType: 'attendance',
          title: 'Home tonight',
          details: null,
          startsAt: '2026-03-24T00:00:00.000Z',
          endsAt: '2026-03-24T23:59:59.999Z',
          allDay: true,
          iconKey: 'home',
          visualWeight: 'secondary',
          memberOwnerIds: ['member-2'],
          memberColorKey: 'sky',
          recurrenceRule: null,
          recurrenceTimezone: null,
          recurrenceAnchor: null,
          attendanceStatus: 'home_tonight',
          isProjected: true,
          metadata: null,
        },
      ],
      'America/Toronto'
    );

    expect(groups).toEqual([
      { date: '2026-03-23', items: [expect.objectContaining({ id: 'calendar-item-1' })] },
      { date: '2026-03-24', items: [expect.objectContaining({ id: 'calendar-item-2' })] },
    ]);
  });

  it('exports calendar and attendance hook contracts for downstream screens', () => {
    expect(typeof useCalendar).toBe('function');
    expect(typeof useAttendance).toBe('function');
  });
});
