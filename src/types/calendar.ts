export type EventRsvpStatus = 'going' | 'maybe' | 'not_going';
export type AttendanceStatus = 'home_tonight' | 'away_tonight';
export type CalendarVisualWeight = 'light' | 'medium' | 'strong';

export interface CalendarEvent {
  id: string;
  householdId: string;
  createdBy: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  allDay: boolean;
  recurrenceRule: string | null;
  recurrenceTimezone: string;
  recurrenceAnchor: string;
  iconKey: string | null;
  visualWeight: CalendarVisualWeight;
  memberOwnerIds: string[];
  memberColorKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventRsvp {
  id: string;
  eventId: string;
  householdId: string;
  memberId: string;
  status: EventRsvpStatus;
  respondedAt: string | null;
  note: string | null;
}

export interface HouseholdCalendarItem {
  id: string;
  householdId: string;
  sourceId: string;
  sourceType: 'event' | 'chore' | 'attendance' | 'meal' | 'maintenance' | 'guest' | 'quiet-hours' | 'booking';
  title: string;
  details: string | null;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  iconKey: string | null;
  visualWeight: CalendarVisualWeight;
  memberOwnerIds: string[];
  memberColorKey: string | null;
  recurrenceRule: string | null;
  recurrenceTimezone: string | null;
  recurrenceAnchor: string | null;
  attendanceStatus: AttendanceStatus | null;
  isProjected: boolean;
  metadata: Record<string, unknown> | null;
}
