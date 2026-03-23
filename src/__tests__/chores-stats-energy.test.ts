import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ChoresScreen from '@/app/(app)/chores';
import ChoreDetailScreen from '@/app/(app)/chores/[id]';

const mockUseChores = jest.fn();
const mockUseMembers = jest.fn();
const mockUseAuthStore = jest.fn();
const mockUseHouseholdStore = jest.fn();
const mockRouterPush = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock('@/hooks/useChores', () => ({
  useChores: () => mockUseChores(),
}));

jest.mock('@/hooks/useMembers', () => ({
  useMembers: (householdId: string | null) => mockUseMembers(householdId),
}));

jest.mock('@/stores/auth', () => ({
  useAuthStore: (selector: (state: { user: { id: string } | null }) => unknown) =>
    mockUseAuthStore(selector),
}));

jest.mock('@/stores/household', () => ({
  useHouseholdStore: () => mockUseHouseholdStore(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock('@/components/ui/Button', () => {
  const ReactLocal = require('react');
  const { Pressable, Text } = require('react-native');

  return {
    Button: ({ label, onPress }: { label: string; onPress?: () => void }) =>
      ReactLocal.createElement(
        Pressable,
        { onPress, accessibilityLabel: label },
        ReactLocal.createElement(Text, null, label)
      ),
  };
});

jest.mock('@/components/ui/Card', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');

  return {
    Card: ({ children }: { children: React.ReactNode }) =>
      ReactLocal.createElement(View, null, children),
  };
});

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

type MockState = {
  templates: Array<{
    id: string;
    title: string;
    description: string | null;
    area: string | null;
    estimated_minutes: number;
    recurrence_rule: string | null;
    recurrence_timezone: string;
    recurrence_anchor: string;
    next_occurrence_at: string | null;
    last_completed_at: string | null;
    kind: 'responsibility' | 'bonus';
  }>;
  instances: Array<{
    id: string;
    template_id: string;
    scheduled_for: string | null;
    status: 'open' | 'claimed' | 'completed' | 'skipped';
    claimed_by?: string | null;
  }>;
  assignments: Array<{
    id: string;
    template_id: string;
    instance_id: string | null;
    member_user_id: string;
  }>;
  completions: Array<{
    id: string;
    household_id: string;
    instance_id: string;
    template_id: string;
    completed_by: string;
    completed_at: string;
    actual_minutes: number | null;
    condition_state_at_completion: 'green' | 'yellow' | 'red';
    note: string | null;
    photo_path: string | null;
  }>;
};

function flattenText(node: renderer.ReactTestRendererJSON | renderer.ReactTestRendererJSON[] | string | null): string {
  if (!node) {
    return '';
  }

  if (typeof node === 'string') {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((item) => flattenText(item)).join(' ');
  }

  return flattenText(node.children as renderer.ReactTestRendererJSON[] | string | null);
}

function normalizedText(node: renderer.ReactTestRendererJSON | renderer.ReactTestRendererJSON[] | string | null) {
  return flattenText(node).replace(/\s+/g, ' ').trim();
}

describe('chores stats and detail screens', () => {
  let state: MockState;

  async function renderElement(element: React.ReactElement) {
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(element);
    });

    return tree!;
  }

  beforeEach(() => {
    state = {
      templates: [
        {
          id: 'template-1',
          title: 'Take out trash',
          description: 'Bins to curb',
          area: 'Kitchen',
          estimated_minutes: 12,
          recurrence_rule: 'DTSTART:20260320T080000Z\nRRULE:FREQ=DAILY',
          recurrence_timezone: 'UTC',
          recurrence_anchor: '2026-03-20T08:00:00.000Z',
          next_occurrence_at: '2026-03-23T08:00:00.000Z',
          last_completed_at: '2026-03-20T08:00:00.000Z',
          kind: 'responsibility',
        },
        {
          id: 'template-2',
          title: 'Bathroom reset',
          description: null,
          area: 'Bathroom',
          estimated_minutes: 20,
          recurrence_rule: 'DTSTART:20260321T080000Z\nRRULE:FREQ=WEEKLY;BYDAY=SA',
          recurrence_timezone: 'UTC',
          recurrence_anchor: '2026-03-21T08:00:00.000Z',
          next_occurrence_at: '2026-03-27T08:00:00.000Z',
          last_completed_at: '2026-03-21T08:00:00.000Z',
          kind: 'responsibility',
        },
      ],
      instances: [
        {
          id: 'instance-1',
          template_id: 'template-1',
          scheduled_for: '2026-03-23T08:00:00.000Z',
          status: 'open',
        },
        {
          id: 'instance-2',
          template_id: 'template-2',
          scheduled_for: '2026-03-27T08:00:00.000Z',
          status: 'open',
        },
      ],
      assignments: [
        {
          id: 'assignment-1',
          template_id: 'template-1',
          instance_id: 'instance-1',
          member_user_id: 'user-1',
        },
        {
          id: 'assignment-2',
          template_id: 'template-2',
          instance_id: 'instance-2',
          member_user_id: 'user-2',
        },
      ],
      completions: [
        {
          id: 'completion-1',
          household_id: 'household-1',
          instance_id: 'instance-older',
          template_id: 'template-1',
          completed_by: 'user-1',
          completed_at: '2026-03-22T08:00:00.000Z',
          actual_minutes: 24,
          condition_state_at_completion: 'yellow',
          note: 'Took out recycling too',
          photo_path: null,
        },
        {
          id: 'completion-2',
          household_id: 'household-1',
          instance_id: 'instance-oldest',
          template_id: 'template-1',
          completed_by: 'user-1',
          completed_at: '2026-03-10T08:00:00.000Z',
          actual_minutes: 18,
          condition_state_at_completion: 'green',
          note: null,
          photo_path: null,
        },
        {
          id: 'completion-3',
          household_id: 'household-1',
          instance_id: 'instance-2',
          template_id: 'template-2',
          completed_by: 'user-2',
          completed_at: '2026-03-21T08:00:00.000Z',
          actual_minutes: 40,
          condition_state_at_completion: 'red',
          note: 'Deep clean',
          photo_path: null,
        },
      ],
    };

    mockUseChores.mockImplementation(() => ({
      templates: state.templates,
      assignments: state.assignments,
      instances: state.instances,
      completions: state.completions,
      loading: false,
      error: null,
      createChore: jest.fn(),
      updateChore: jest.fn(),
      completeChore: jest.fn(),
      claimBonusChore: jest.fn(),
      upsertEnergyEntry: jest.fn(),
    }));

    mockUseMembers.mockImplementation(() => ({
      members: [
        {
          id: 'member-1',
          user_id: 'user-1',
          status: 'active',
          profile: { display_name: 'Alex', avatar_url: null, dietary_preferences: [] },
        },
        {
          id: 'member-2',
          user_id: 'user-2',
          status: 'active',
          profile: { display_name: 'Jamie', avatar_url: null, dietary_preferences: [] },
        },
      ],
      loadMembers: jest.fn(),
    }));

    mockUseAuthStore.mockImplementation((selector) => selector({ user: { id: 'user-1' } }));
    mockUseHouseholdStore.mockReturnValue({ activeHouseholdId: 'household-1' });
    mockUseLocalSearchParams.mockReturnValue({ id: 'template-1' });
    mockRouterPush.mockReset();
  });

  it('shows light fairness indicators on the main chores screen and links each card to the detail route', async () => {
    const tree = await renderElement(React.createElement(ChoresScreen));
    const text = normalizedText(tree.toJSON());

    expect(text).toContain('Fairness snapshot');
    expect(text).toContain('Alex');
    expect(text).toContain('2 tasks');
    expect(text).toContain('42 min');

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: 'Edit chore Take out trash' }).props.onPress();
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/chores/template-1');
  });

  it('renders completion history and both task-count and minute-based fairness metrics on the detail screen', async () => {
    const tree = await renderElement(React.createElement(ChoreDetailScreen));
    const text = normalizedText(tree.toJSON());

    expect(text).toContain('Completion History');
    expect(text).toContain('Household fairness');
    expect(text).toContain('Alex');
    expect(text).toContain('2 tasks');
    expect(text).toContain('42 min');
    expect(text).toContain('1 tasks over');
    expect(text).toContain('1 min over');
    expect(text).toContain('Avg duration 21 min');
    expect(text).toContain('Took out recycling too');
    expect(text).toContain('Mar');
  });
});
