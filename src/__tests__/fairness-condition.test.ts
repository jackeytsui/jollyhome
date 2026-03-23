import { getConditionState, getConditionProgress, rankChoresForEnergy } from '@/lib/condition';
import { buildFairnessStats, getRollingAverageMinutes, summarizeMemberLoad } from '@/lib/fairness';

describe('fairness and condition', () => {
  it('computes elapsed-time condition states and progress without deadline semantics', () => {
    expect(
      getConditionState({
        lastCompletedAt: '2026-03-22T08:00:00.000Z',
        now: '2026-03-23T02:00:00.000Z',
        targetIntervalMinutes: 24 * 60,
      })
    ).toBe('green');

    expect(
      getConditionState({
        lastCompletedAt: '2026-03-22T08:00:00.000Z',
        now: '2026-03-23T14:00:00.000Z',
        targetIntervalMinutes: 24 * 60,
      })
    ).toBe('yellow');

    expect(
      getConditionProgress({
        lastCompletedAt: '2026-03-22T08:00:00.000Z',
        now: '2026-03-24T08:00:00.000Z',
        targetIntervalMinutes: 24 * 60,
      })
    ).toMatchObject({
      elapsedMinutes: 2880,
      ratio: 1,
      state: 'red',
    });
  });

  it('ranks chores by urgency while adapting effort to daily energy', () => {
    const ranked = rankChoresForEnergy(
      [
        {
          id: 'bathroom',
          title: 'Bathroom scrub',
          estimatedMinutes: 40,
          conditionState: 'red',
          conditionScore: 1,
        },
        {
          id: 'dishes',
          title: 'Dishes',
          estimatedMinutes: 12,
          conditionState: 'yellow',
          conditionScore: 0.7,
        },
        {
          id: 'trash',
          title: 'Take out trash',
          estimatedMinutes: 8,
          conditionState: 'red',
          conditionScore: 0.92,
        },
      ],
      'low'
    );

    expect(ranked.map((item) => item.id)).toEqual(['trash', 'bathroom', 'dishes']);
  });

  it('builds fairness rollups with rolling averages and member summaries', () => {
    const stats = buildFairnessStats({
      householdId: 'household-1',
      windowEnd: '2026-03-23T12:00:00.000Z',
      completions: [
        {
          householdId: 'household-1',
          templateId: 'kitchen-reset',
          completedBy: 'member-1',
          completedAt: '2026-03-22T08:00:00.000Z',
          actualMinutes: 24,
        },
        {
          householdId: 'household-1',
          templateId: 'kitchen-reset',
          completedBy: 'member-1',
          completedAt: '2026-03-10T08:00:00.000Z',
          actualMinutes: 18,
        },
        {
          householdId: 'household-1',
          templateId: 'bathroom',
          completedBy: 'member-2',
          completedAt: '2026-03-21T08:00:00.000Z',
          actualMinutes: 40,
        },
      ],
    });

    expect(stats).toEqual([
      expect.objectContaining({
        memberId: 'member-1',
        completedTaskCount: 2,
        completedMinutes: 42,
        rolling14DayTaskCount: 2,
        rolling14DayMinutes: 42,
      }),
      expect.objectContaining({
        memberId: 'member-2',
        completedTaskCount: 1,
        completedMinutes: 40,
      }),
    ]);

    expect(
      getRollingAverageMinutes(stats, {
        memberId: 'member-1',
        window: '14d',
      })
    ).toBe(21);

    expect(summarizeMemberLoad(stats)).toEqual({
      totalTasks: 3,
      totalMinutes: 82,
      averageFairnessDelta: 0,
    });
  });
});
