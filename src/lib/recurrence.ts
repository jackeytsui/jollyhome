import { TZDate } from '@date-fns/tz';
import { RRule, RRuleSet, Weekday, rrulestr } from 'rrule';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurrenceWeekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

export interface BuildRecurrenceRuleInput {
  frequency: RecurrenceFrequency;
  interval?: number;
  byWeekday?: RecurrenceWeekday[];
  byMonthDay?: number[];
  count?: number;
  until?: string | null;
  startsAt: string;
  timezone: string;
}

export interface BuiltRecurrenceRule {
  rule: string;
  timezone: string;
  startsAt: string;
}

export interface ParsedRecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  byWeekday: RecurrenceWeekday[];
  byMonthDay: number[];
  count: number | null;
  until: string | null;
  startsAt: string | null;
  timezone: string;
}

interface OccurrenceQuery {
  rule: string;
  timezone: string;
  after: string;
}

interface OccurrenceRangeQuery {
  rule: string;
  timezone: string;
  rangeStart: string;
  rangeEnd: string;
}

const WEEKDAY_MAP: Record<RecurrenceWeekday, typeof RRule.MO> = {
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
  SU: RRule.SU,
};

const FREQ_MAP: Record<RecurrenceFrequency, number> = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
  yearly: RRule.YEARLY,
};

const REVERSE_FREQ_MAP: Record<number, RecurrenceFrequency> = {
  [RRule.DAILY]: 'daily',
  [RRule.WEEKLY]: 'weekly',
  [RRule.MONTHLY]: 'monthly',
  [RRule.YEARLY]: 'yearly',
};

function normalizeIso(value: Date | string): string {
  return new Date(value).toISOString();
}

function parseRule(rule: string): RRule {
  const parsed: unknown = rrulestr(rule);

  if (parsed instanceof RRule) {
    return parsed;
  }

  if (parsed && typeof parsed === 'object' && 'rrules' in parsed && parsed instanceof RRuleSet) {
    const [firstRule] = parsed.rrules();
    if (firstRule) {
      return firstRule;
    }
  }

  throw new Error('Unsupported recurrence rule');
}

export function buildRecurrenceRule(input: BuildRecurrenceRuleInput): BuiltRecurrenceRule {
  const startsAt = normalizeIso(TZDate.tz(input.timezone, input.startsAt));
  const rule = new RRule({
    freq: FREQ_MAP[input.frequency],
    interval: input.interval ?? 1,
    byweekday: input.byWeekday?.map((day) => WEEKDAY_MAP[day]),
    bymonthday: input.byMonthDay,
    count: input.count ?? undefined,
    until: input.until ? new Date(input.until) : undefined,
    dtstart: new Date(startsAt),
  });

  return {
    rule: rule.toString(),
    timezone: input.timezone,
    startsAt,
  };
}

export function parseRecurrenceRule(rule: string, timezone: string = 'UTC'): ParsedRecurrenceRule {
  const parsed = parseRule(rule);
  const { origOptions } = parsed;
  const rawWeekdays = Array.isArray(origOptions.byweekday)
    ? origOptions.byweekday
    : origOptions.byweekday !== undefined
      ? [origOptions.byweekday]
      : [];
  const rawMonthDays = Array.isArray(origOptions.bymonthday)
    ? origOptions.bymonthday
    : origOptions.bymonthday !== undefined
      ? [origOptions.bymonthday]
      : [];

  return {
    frequency: REVERSE_FREQ_MAP[origOptions.freq ?? RRule.DAILY],
    interval: origOptions.interval ?? 1,
    byWeekday: rawWeekdays.map((weekday) =>
      (weekday as Weekday).toString().slice(0, 2).toUpperCase() as RecurrenceWeekday
    ),
    byMonthDay: rawMonthDays.filter((day): day is number => typeof day === 'number'),
    count: origOptions.count ?? null,
    until: origOptions.until ? normalizeIso(origOptions.until) : null,
    startsAt: parsed.options.dtstart ? normalizeIso(parsed.options.dtstart) : null,
    timezone,
  };
}

export function getNextOccurrence(query: OccurrenceQuery): string | null {
  const parsed = parseRule(query.rule);
  const next = parsed.after(TZDate.tz(query.timezone, query.after), false);

  return next ? normalizeIso(next) : null;
}

export function expandOccurrencesInRange(query: OccurrenceRangeQuery): string[] {
  const parsed = parseRule(query.rule);

  return parsed
    .between(TZDate.tz(query.timezone, query.rangeStart), TZDate.tz(query.timezone, query.rangeEnd), true)
    .map((date) => normalizeIso(date));
}
