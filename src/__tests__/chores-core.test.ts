import {
  buildRecurrenceRule,
  parseRecurrenceRule,
  getNextOccurrence,
  expandOccurrencesInRange,
} from '@/lib/recurrence';
import { useChores } from '@/hooks/useChores';

describe('chores core contracts', () => {
  it('builds and parses weekly recurrence rules with timezone metadata intact', () => {
    const recurrence = buildRecurrenceRule({
      frequency: 'weekly',
      interval: 1,
      byWeekday: ['MO', 'WE'],
      startsAt: '2026-03-23T18:00:00.000Z',
      timezone: 'America/Toronto',
    });

    expect(recurrence.rule).toContain('FREQ=WEEKLY');
    expect(recurrence.rule).toContain('BYDAY=MO,WE');

    expect(parseRecurrenceRule(recurrence.rule, recurrence.timezone)).toMatchObject({
      frequency: 'weekly',
      interval: 1,
      byWeekday: ['MO', 'WE'],
      timezone: 'America/Toronto',
    });
  });

  it('finds and expands future occurrences in a bounded range', () => {
    const recurrence = buildRecurrenceRule({
      frequency: 'daily',
      interval: 2,
      startsAt: '2026-03-22T08:00:00.000Z',
      timezone: 'America/Toronto',
    });

    expect(
      getNextOccurrence({
        rule: recurrence.rule,
        timezone: recurrence.timezone,
        after: '2026-03-23T12:00:00.000Z',
      })
    ).toBe('2026-03-24T08:00:00.000Z');

    expect(
      expandOccurrencesInRange({
        rule: recurrence.rule,
        timezone: recurrence.timezone,
        rangeStart: '2026-03-22T00:00:00.000Z',
        rangeEnd: '2026-03-28T23:59:59.999Z',
      })
    ).toEqual([
      '2026-03-22T08:00:00.000Z',
      '2026-03-24T08:00:00.000Z',
      '2026-03-26T08:00:00.000Z',
      '2026-03-28T08:00:00.000Z',
    ]);
  });

  it('exports the household chores hook contract for downstream screens', () => {
    expect(typeof useChores).toBe('function');
  });
});
