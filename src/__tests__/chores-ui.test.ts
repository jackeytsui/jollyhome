import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ChoresScreen from '@/app/(app)/chores';

const mockUseChores = jest.fn();
const mockUseMembers = jest.fn();
const mockUseAuthStore = jest.fn();
const mockUseHouseholdStore = jest.fn();

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
  }>;
  assignments: Array<{
    id: string;
    template_id: string;
    instance_id: string | null;
    member_user_id: string;
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

describe('chores UI', () => {
  let state: MockState;
  let createChoreMock: jest.Mock;
  let updateChoreMock: jest.Mock;

  async function renderScreen() {
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(React.createElement(ChoresScreen));
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
    };

    createChoreMock = jest.fn(async (payload) => {
      state.templates.push({
        id: 'template-3',
        title: payload.title,
        description: payload.description,
        area: payload.area,
        estimated_minutes: payload.estimated_minutes,
        recurrence_rule: payload.recurrence_rule,
        recurrence_timezone: payload.recurrence_timezone,
        recurrence_anchor: payload.recurrence_anchor,
        next_occurrence_at: payload.next_occurrence_at,
        last_completed_at: null,
        kind: payload.kind,
      });
      state.instances.push({
        id: 'instance-3',
        template_id: 'template-3',
        scheduled_for: payload.next_occurrence_at,
        status: 'open',
      });
      state.assignments.push(
        ...payload.assignedMemberIds.map((memberId: string, index: number) => ({
          id: `assignment-new-${index}`,
          template_id: 'template-3',
          instance_id: 'instance-3',
          member_user_id: memberId,
        }))
      );
    });

    updateChoreMock = jest.fn();

    mockUseChores.mockImplementation(() => ({
      templates: state.templates,
      assignments: state.assignments,
      instances: state.instances,
      completions: [],
      loading: false,
      error: null,
      createChore: createChoreMock,
      updateChore: updateChoreMock,
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
  });

  it('renders the personal-first layout with filter controls', async () => {
    const tree = await renderScreen();
    const text = flattenText(tree.toJSON());

    expect(text.indexOf('My chores today')).toBeGreaterThan(-1);
    expect(text.indexOf('Household queue')).toBeGreaterThan(text.indexOf('My chores today'));
    expect(text).toContain('Filters');
    expect(text).toContain('Assignee');
    expect(text).toContain('Area');
    expect(text).toContain('Status');
    expect(text).toContain('Urgency');
    expect(text).toContain('Take out trash');
    expect(text).toContain('Bathroom reset');
  });

  it('creates an assigned chore through the editor flow and filters by assignee', async () => {
    const tree = await renderScreen();

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: 'New chore' }).props.onPress();
    });

    await act(async () => {
      tree.root.findByProps({ testID: 'editor-title-input' }).props.onChangeText('Wipe counters');
    });

    await act(async () => {
      tree.root.findByProps({ testID: 'editor-area-input' }).props.onChangeText('Kitchen');
    });

    await act(async () => {
      tree.root.findByProps({ testID: 'editor-estimated-minutes-input' }).props.onChangeText('18');
    });

    await act(async () => {
      tree.root.findByProps({ testID: 'editor-member-user-1' }).props.onPress();
    });

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: 'Create chore' }).props.onPress();
    });

    await act(async () => {
      tree.update(React.createElement(ChoresScreen));
    });

    expect(createChoreMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Wipe counters',
        area: 'Kitchen',
        assignedMemberIds: ['user-1'],
        kind: 'responsibility',
      })
    );

    expect(flattenText(tree.toJSON())).toContain('Wipe counters');

    await act(async () => {
      tree.root.findByProps({ testID: 'filter-assignee-user-2' }).props.onPress();
    });

    expect(flattenText(tree.toJSON())).not.toContain('Wipe counters');
    expect(flattenText(tree.toJSON())).toContain('Bathroom reset');
  });
});
