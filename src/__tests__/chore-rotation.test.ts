import {
  buildRotationRationale,
  rebalanceSuggestions,
  scoreRotationSuggestions,
  type RotationContext,
} from '@/lib/choreRotation';

function buildContext(overrides: Partial<RotationContext> = {}): RotationContext {
  return {
    chores: [
      {
        instanceId: 'instance-trash',
        templateId: 'template-trash',
        title: 'Take out trash',
        area: 'Kitchen',
        estimatedMinutes: 20,
      },
    ],
    members: [
      {
        id: 'alex',
        name: 'Alex',
        active: true,
        availabilityScore: 0.95,
        calendarConflictMinutes: 0,
        attendanceStatus: 'home_tonight',
        trailingTaskCount: 1,
        trailingMinutes: 15,
        learnedAverageMinutes: 18,
        preferenceScore: 0.5,
      },
      {
        id: 'blair',
        name: 'Blair',
        active: true,
        availabilityScore: 0.35,
        calendarConflictMinutes: 45,
        attendanceStatus: 'away_tonight',
        trailingTaskCount: 4,
        trailingMinutes: 120,
        learnedAverageMinutes: 28,
        preferenceScore: -0.2,
      },
    ],
    ...overrides,
  };
}

describe('chore rotation scoring', () => {
  it('prefers members with stronger current availability and lower trailing load', () => {
    const [suggestion] = scoreRotationSuggestions(buildContext());

    expect(suggestion).toBeDefined();
    expect(suggestion?.recommendedMemberId).toBe('alex');
    expect(suggestion?.rankings[0]?.memberId).toBe('alex');
    expect(suggestion?.rankings[1]?.memberId).toBe('blair');
  });

  it('stays stateless and does not require queue position to rank suggestions', () => {
    const context = buildContext({
      members: [
        {
          id: 'alex',
          name: 'Alex',
          active: true,
          availabilityScore: 0.55,
          calendarConflictMinutes: 45,
          attendanceStatus: 'home_tonight',
          trailingTaskCount: 2,
          trailingMinutes: 40,
          learnedAverageMinutes: 18,
          preferenceScore: 0,
        },
        {
          id: 'blair',
          name: 'Blair',
          active: true,
          availabilityScore: 0.7,
          calendarConflictMinutes: 10,
          attendanceStatus: 'home_tonight',
          trailingTaskCount: 0,
          trailingMinutes: 0,
          learnedAverageMinutes: 12,
          preferenceScore: 0.2,
        },
      ],
    });

    const [first] = scoreRotationSuggestions(context);
    const [second] = scoreRotationSuggestions({
      ...context,
      members: context.members.map((member) => ({
        ...member,
        queuePosition: member.id === 'alex' ? 99 : 1,
      })),
    });

    expect(first?.recommendedMemberId).toBe('blair');
    expect(second?.recommendedMemberId).toBe('blair');
    expect(second?.rankings.map((entry) => entry.memberId)).toEqual(
      first?.rankings.map((entry) => entry.memberId)
    );
  });

  it('uses learned average actual minutes when estimating effort', () => {
    const [suggestion] = scoreRotationSuggestions(
      buildContext({
        chores: [
          {
            instanceId: 'instance-bathroom',
            templateId: 'template-bathroom',
            title: 'Bathroom reset',
            area: 'Bathroom',
            estimatedMinutes: 20,
          },
        ],
        members: [
          {
            id: 'alex',
            name: 'Alex',
            active: true,
            availabilityScore: 0.85,
            calendarConflictMinutes: 0,
            attendanceStatus: 'home_tonight',
            trailingTaskCount: 2,
            trailingMinutes: 75,
            learnedAverageMinutes: 55,
            preferenceScore: 0.1,
          },
          {
            id: 'blair',
            name: 'Blair',
            active: true,
            availabilityScore: 0.8,
            calendarConflictMinutes: 0,
            attendanceStatus: 'home_tonight',
            trailingTaskCount: 2,
            trailingMinutes: 30,
            learnedAverageMinutes: 15,
            preferenceScore: 0.1,
          },
        ],
      })
    );

    expect(suggestion?.estimatedEffortMinutes).toBe(35);
    expect(suggestion?.recommendedMemberId).toBe('blair');
  });

  it('rebalances when attendance, calendar conflicts, or active roster changes', () => {
    const baseContext = buildContext({
      members: [
        {
          id: 'alex',
          name: 'Alex',
          active: true,
          availabilityScore: 0.9,
          calendarConflictMinutes: 0,
          attendanceStatus: 'home_tonight',
          trailingTaskCount: 3,
          trailingMinutes: 60,
          learnedAverageMinutes: 20,
          preferenceScore: 0.3,
        },
        {
          id: 'blair',
          name: 'Blair',
          active: true,
          availabilityScore: 0.7,
          calendarConflictMinutes: 0,
          attendanceStatus: 'home_tonight',
          trailingTaskCount: 1,
          trailingMinutes: 10,
          learnedAverageMinutes: 18,
          preferenceScore: 0.1,
        },
      ],
    });

    const [initial] = scoreRotationSuggestions(baseContext);
    const [attendanceShifted] = rebalanceSuggestions({
      ...baseContext,
      members: baseContext.members.map((member) =>
        member.id === 'alex'
          ? {
              ...member,
              availabilityScore: 0.15,
              calendarConflictMinutes: 120,
              attendanceStatus: 'away_tonight',
            }
          : member
      ),
    });
    const [rosterShifted] = rebalanceSuggestions({
      ...baseContext,
      members: [
        ...baseContext.members,
        {
          id: 'casey',
          name: 'Casey',
          active: true,
          availabilityScore: 0.88,
          calendarConflictMinutes: 0,
          attendanceStatus: 'home_tonight',
          trailingTaskCount: 0,
          trailingMinutes: 0,
          learnedAverageMinutes: 18,
          preferenceScore: 0.4,
        },
      ],
    });

    expect(initial?.recommendedMemberId).toBe('alex');
    expect(attendanceShifted?.recommendedMemberId).toBe('blair');
    expect(rosterShifted?.recommendedMemberId).toBe('casey');
  });

  it('builds explainable rationales from availability, load, preference, duration, and roster signals', () => {
    const rationale = buildRotationRationale({
      memberName: 'Alex',
      availabilityScore: 0.92,
      attendanceStatus: 'home_tonight',
      trailingMinutes: 15,
      trailingTaskCount: 1,
      learnedAverageMinutes: 18,
      estimatedEffortMinutes: 24,
      preferenceScore: 0.6,
      activeMemberCount: 4,
      rosterChanged: true,
    });

    expect(rationale.length).toBeGreaterThan(0);
    expect(rationale.join(' ')).toMatch(/availability|load|preference|duration|roster/i);
  });
});
