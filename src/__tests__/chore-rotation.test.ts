import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { supabase } from '@/lib/supabase';
import { useAttendance } from '@/hooks/useAttendance';
import { useCalendar } from '@/hooks/useCalendar';
import { useChores } from '@/hooks/useChores';
import { useChoreRotation } from '@/hooks/useChoreRotation';
import { useMembers } from '@/hooks/useMembers';
import { useHouseholdStore } from '@/stores/household';
import {
  buildRotationRationale,
  rebalanceSuggestions,
  scoreRotationSuggestions,
  type RotationContext,
} from '@/lib/choreRotation';

jest.mock('@/hooks/useAttendance', () => ({
  useAttendance: jest.fn(),
}));

jest.mock('@/hooks/useCalendar', () => ({
  useCalendar: jest.fn(),
}));

jest.mock('@/hooks/useChores', () => ({
  useChores: jest.fn(),
}));

jest.mock('@/hooks/useMembers', () => ({
  useMembers: jest.fn(),
}));

jest.mock('@/stores/household', () => ({
  useHouseholdStore: jest.fn(),
}));

const mockedSupabase = supabase as {
  from: jest.Mock;
};
const mockedUseAttendance = useAttendance as jest.Mock;
const mockedUseCalendar = useCalendar as jest.Mock;
const mockedUseChores = useChores as jest.Mock;
const mockedUseMembers = useMembers as jest.Mock;
const mockedUseHouseholdStore = useHouseholdStore as jest.Mock;

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('preferences affect the recommended assignee for equally available members', () => {
    const context = buildContext({
      members: [
        {
          id: 'alex',
          name: 'Alex',
          active: true,
          availabilityScore: 0.75,
          calendarConflictMinutes: 0,
          attendanceStatus: 'home_tonight',
          trailingTaskCount: 2,
          trailingMinutes: 40,
          learnedAverageMinutes: 20,
          preferenceScore: -0.5,
        },
        {
          id: 'blair',
          name: 'Blair',
          active: true,
          availabilityScore: 0.75,
          calendarConflictMinutes: 0,
          attendanceStatus: 'home_tonight',
          trailingTaskCount: 2,
          trailingMinutes: 40,
          learnedAverageMinutes: 20,
          preferenceScore: 0.8,
        },
      ],
    });

    const [suggestion] = scoreRotationSuggestions(context);

    expect(suggestion?.recommendedMemberId).toBe('blair');
    expect(suggestion?.rankings[0]?.score).toBeGreaterThan(suggestion?.rankings[1]?.score ?? 0);
  });

  it('mentions downward preference pressure when stored preferences are negative', () => {
    const [suggestion] = scoreRotationSuggestions(
      buildContext({
        members: [
          {
            id: 'alex',
            name: 'Alex',
            active: true,
            availabilityScore: 0.8,
            calendarConflictMinutes: 0,
            attendanceStatus: 'home_tonight',
            trailingTaskCount: 1,
            trailingMinutes: 10,
            learnedAverageMinutes: 18,
            preferenceScore: -0.8,
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
            preferenceScore: 0,
          },
        ],
      })
    );

    expect(suggestion?.rankings[0]?.memberId).toBe('blair');
    expect(suggestion?.rankings[1]?.rationale.join(' ')).toMatch(/nudges this chore downward/i);
  });
});

describe('useChoreRotation preference loading', () => {
  function HookProbe({ onValue }: { onValue: (value: ReturnType<typeof useChoreRotation>) => void }) {
    onValue(useChoreRotation());
    return null;
  }

  it('reads member_chore_preferences for the active household and maps them into preference-aware suggestions', async () => {
    const preferenceRows = [
      {
        member_user_id: 'alex',
        template_id: 'template-trash',
        area: null,
        preference_score: -0.6,
        preferred: false,
      },
      {
        member_user_id: 'blair',
        template_id: 'template-trash',
        area: null,
        preference_score: 0.9,
        preferred: true,
      },
    ];

    const eq = jest.fn().mockResolvedValue({ data: preferenceRows, error: null });
    const select = jest.fn().mockReturnValue({ eq });
    mockedSupabase.from.mockImplementation((table: string) => {
      if (table === 'member_chore_preferences') {
        return { select };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    mockedUseHouseholdStore.mockImplementation((selector: (state: { activeHouseholdId: string | null }) => unknown) =>
      selector({ activeHouseholdId: 'household-1' })
    );
    mockedUseChores.mockReturnValue({
      templates: [
        {
          id: 'template-trash',
          title: 'Take out trash',
          area: 'Kitchen',
          estimated_minutes: 20,
        },
      ],
      instances: [
        {
          id: 'instance-trash',
          template_id: 'template-trash',
          status: 'open',
        },
      ],
      completions: [],
      energyEntries: [],
      assignments: [],
      loadChores: jest.fn(),
      loading: false,
      error: null,
    });
    mockedUseAttendance.mockReturnValue({
      attendance: [
        { member_user_id: 'alex', attendance_date: '2026-03-23', status: 'home_tonight' },
        { member_user_id: 'blair', attendance_date: '2026-03-23', status: 'home_tonight' },
      ],
      loadAttendance: jest.fn(),
      loading: false,
      error: null,
    });
    mockedUseCalendar.mockReturnValue({
      items: [],
      loadCalendar: jest.fn(),
      loading: false,
      error: null,
    });
    mockedUseMembers.mockReturnValue({
      members: [
        {
          user_id: 'alex',
          status: 'active',
          profile: { display_name: 'Alex' },
        },
        {
          user_id: 'blair',
          status: 'active',
          profile: { display_name: 'Blair' },
        },
      ],
      loadMembers: jest.fn(),
      isLoading: false,
      error: null,
    });

    let latestValue: ReturnType<typeof useChoreRotation> | undefined;

    await act(async () => {
      create(createElement(HookProbe, {
        onValue: (value) => {
          latestValue = value;
        },
      }));
    });

    expect(mockedSupabase.from).toHaveBeenCalledWith('member_chore_preferences');
    expect(select).toHaveBeenCalledWith('member_user_id, template_id, area, preference_score, preferred');
    expect(eq).toHaveBeenCalledWith('household_id', 'household-1');
    expect(latestValue?.suggestions[0]?.recommendedMemberId).toBe('blair');
  });
});
