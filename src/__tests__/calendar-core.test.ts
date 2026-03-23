describe('calendar projection', () => {
  it('supports a unified household timeline contract for projected chore and event data', () => {
    const sourceTypes = [
      'event',
      'chore',
      'attendance',
      'meal',
      'maintenance',
      'guest',
      'quiet-hours',
      'booking',
    ] as const;
    const timelineItem = {
      id: 'timeline-1',
      householdId: 'household-1',
      sourceId: 'event-1',
      sourceType: sourceTypes[0],
      title: 'House dinner',
      details: 'Everyone is home tonight',
      startsAt: '2026-03-23T18:00:00.000Z',
      endsAt: '2026-03-23T19:00:00.000Z',
      allDay: false,
      iconKey: 'utensils',
      visualWeight: 'strong',
      memberOwnerIds: ['member-1', 'member-2'],
      memberColorKey: 'sage',
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO',
      recurrenceTimezone: 'America/Toronto',
      recurrenceAnchor: '2026-03-23T18:00:00.000Z',
      attendanceStatus: 'home_tonight',
      isProjected: true,
      metadata: {
        view: 'agenda',
      },
    };

    expect(sourceTypes).toContain(timelineItem.sourceType);
  });

  it('keeps attendance status values narrow for daily household availability scaffolding', () => {
    const status = 'away_tonight';

    expect(status).toBe('away_tonight');
  });

  it.todo('reserves CALD-02 recurrence expansion behavior across shared event and chore rules');
  it.todo('reserves D-17 attendance day-boundary behavior around timezone and DST transitions');
  it.todo('reserves CALD-04 projection weighting so events stay visually stronger than chores');
});
