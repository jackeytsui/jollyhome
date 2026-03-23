describe('fairness and condition scaffolds', () => {
  it('captures fairness totals by task count and effort for future stateless rebalancing', () => {
    const stats = {
      householdId: 'household-1',
      memberId: 'member-1',
      completedTaskCount: 8,
      completedMinutes: 195,
      rolling14DayTaskCount: 3,
      rolling14DayMinutes: 82,
      rolling30DayTaskCount: 6,
      rolling30DayMinutes: 156,
      fairnessDelta: -0.12,
      lastCompletedAt: '2026-03-22T09:00:00.000Z',
    };

    expect(stats.completedMinutes).toBeGreaterThan(stats.rolling14DayMinutes);
  });

  it('captures daily energy input without coupling it to gamification state', () => {
    const energy = {
      householdId: 'household-1',
      memberId: 'member-1',
      energyLevel: 'medium',
      effectiveDate: '2026-03-23',
      note: null,
      createdAt: '2026-03-23T07:00:00.000Z',
    };

    expect(energy.energyLevel).toBe('medium');
  });

  it.todo('reserves D-11 stateless rebalancing fairness calculations after missed chores');
  it.todo('reserves D-22 fairness and urgency behavior when gamification is turned off');
  it.todo('reserves AICH-05 learned-duration weighting in fairness scoring over rolling windows');
});
