import { TZDate } from '@date-fns/tz';
import type {
  AttendanceStatus,
  CalendarActivityType,
  CalendarEvent,
  HouseholdCalendarItem,
} from '@/types/calendar';

type ProjectedSourceType = HouseholdCalendarItem['sourceType'];

interface ProjectedChoreInstance {
  id: string;
  householdId: string;
  templateId: string;
  title: string;
  details: string | null;
  startsAt: string;
  endsAt: string;
  iconKey: string | null;
  memberOwnerIds: string[];
  memberColorKey: string | null;
}

interface ProjectedAttendanceEntry {
  id: string;
  householdId: string;
  memberUserId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  note: string | null;
}

interface ProjectCalendarItemsInput {
  events: CalendarEvent[];
  choreInstances: ProjectedChoreInstance[];
  attendanceEntries: ProjectedAttendanceEntry[];
}

interface AgendaGroup {
  date: string;
  items: HouseholdCalendarItem[];
}

const ACTIVITY_SOURCE_MAP: Record<CalendarActivityType, ProjectedSourceType> = {
  event: 'event',
  meal: 'meal',
  maintenance: 'maintenance',
  guest: 'guest',
  quiet_hours: 'quiet-hours',
  booking: 'booking',
};

function toDateKey(iso: string, timezone: string): string {
  const zoned = TZDate.tz(timezone, iso);
  const year = zoned.getFullYear();
  const month = String(zoned.getMonth() + 1).padStart(2, '0');
  const day = String(zoned.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function startOfAttendanceDay(attendanceDate: string): string {
  return `${attendanceDate}T00:00:00.000Z`;
}

function endOfAttendanceDay(attendanceDate: string): string {
  return `${attendanceDate}T23:59:59.999Z`;
}

function getSourcePriority(sourceType: HouseholdCalendarItem['sourceType']): number {
  switch (sourceType) {
    case 'chore':
      return 0;
    case 'event':
      return 1;
    case 'meal':
    case 'maintenance':
    case 'guest':
    case 'quiet-hours':
    case 'booking':
      return 2;
    case 'attendance':
      return 3;
  }
}

function getAgendaDate(item: HouseholdCalendarItem, timezone: string): string {
  if (item.sourceType === 'attendance') {
    return item.startsAt.slice(0, 10);
  }

  return toDateKey(item.startsAt, timezone);
}

export function projectCalendarItems(input: ProjectCalendarItemsInput): HouseholdCalendarItem[] {
  const eventItems = input.events.map<HouseholdCalendarItem>((event) => ({
    id: `calendar:${event.id}`,
    householdId: event.householdId,
    sourceId: event.id,
    sourceType: ACTIVITY_SOURCE_MAP[event.activityType],
    title: event.title,
    details: event.description,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    allDay: event.allDay,
    iconKey: event.iconKey,
    visualWeight: event.activityType === 'event' ? event.visualWeight : 'secondary',
    memberOwnerIds: event.memberOwnerIds,
    memberColorKey: event.memberColorKey,
    recurrenceRule: event.recurrenceRule,
    recurrenceTimezone: event.recurrenceTimezone,
    recurrenceAnchor: event.recurrenceAnchor,
    attendanceStatus: null,
    isProjected: event.activityType !== 'event',
    metadata: {
      activityType: event.activityType,
      createdBy: event.createdBy,
      location: event.location,
    },
  }));

  const choreItems = input.choreInstances.map<HouseholdCalendarItem>((chore) => ({
    id: `chore:${chore.id}`,
    householdId: chore.householdId,
    sourceId: chore.id,
    sourceType: 'chore',
    title: chore.title,
    details: chore.details,
    startsAt: chore.startsAt,
    endsAt: chore.endsAt,
    allDay: false,
    iconKey: chore.iconKey,
    visualWeight: 'secondary',
    memberOwnerIds: chore.memberOwnerIds,
    memberColorKey: chore.memberColorKey,
    recurrenceRule: null,
    recurrenceTimezone: null,
    recurrenceAnchor: null,
    attendanceStatus: null,
    isProjected: true,
    metadata: {
      templateId: chore.templateId,
    },
  }));

  const attendanceItems = input.attendanceEntries.map<HouseholdCalendarItem>((attendance) => ({
    id: `attendance:${attendance.id}`,
    householdId: attendance.householdId,
    sourceId: attendance.id,
    sourceType: 'attendance',
    title: attendance.status === 'home_tonight' ? 'Home tonight' : 'Away tonight',
    details: attendance.note,
    startsAt: startOfAttendanceDay(attendance.attendanceDate),
    endsAt: endOfAttendanceDay(attendance.attendanceDate),
    allDay: true,
    iconKey: null,
    visualWeight: 'secondary',
    memberOwnerIds: [attendance.memberUserId],
    memberColorKey: null,
    recurrenceRule: null,
    recurrenceTimezone: null,
    recurrenceAnchor: null,
    attendanceStatus: attendance.status,
    isProjected: true,
    metadata: null,
  }));

  return [...choreItems, ...eventItems, ...attendanceItems].sort((left, right) => {
    const sourcePriority = getSourcePriority(left.sourceType) - getSourcePriority(right.sourceType);
    if (sourcePriority !== 0) {
      return sourcePriority;
    }

    return new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime();
  });
}

export function groupAgendaItemsByDay(
  items: HouseholdCalendarItem[],
  timezone: string
): AgendaGroup[] {
  const groups = new Map<string, HouseholdCalendarItem[]>();

  for (const item of items) {
    const key = getAgendaDate(item, timezone);
    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, groupItems]) => ({
      date,
      items: groupItems.sort(
        (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
      ),
    }));
}
