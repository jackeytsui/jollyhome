jest.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: any }) => children,
}));
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children }: { children: any }) => children ?? null,
}));

import { buildRulesSummary } from '@/app/(app)/rules';
import {
  buildCoordinationEventPayload,
  getNextRuleVersionLabel,
  summarizeRuleAcknowledgements,
} from '@/hooks/useHouseRules';
import type { HouseRuleVersion, RuleAcknowledgement } from '@/types/rules';

describe('rules and coordination UI', () => {
  const versions: HouseRuleVersion[] = [
    {
      id: 'rules-2',
      householdId: 'house-1',
      createdBy: 'alex',
      versionLabel: 'v2',
      title: 'Spring house rules',
      body: 'Quiet hours start at 10 PM.\nGuests go on the calendar.',
      changeSummary: 'Added guest notice policy',
      isCurrent: true,
      publishedAt: '2026-03-24T00:00:00.000Z',
      createdAt: '2026-03-24T00:00:00.000Z',
      updatedAt: '2026-03-24T00:00:00.000Z',
    },
    {
      id: 'rules-1',
      householdId: 'house-1',
      createdBy: 'alex',
      versionLabel: 'v1',
      title: 'Initial rules',
      body: 'Clean shared spaces after use.',
      changeSummary: null,
      isCurrent: false,
      publishedAt: '2026-03-12T00:00:00.000Z',
      createdAt: '2026-03-12T00:00:00.000Z',
      updatedAt: '2026-03-12T00:00:00.000Z',
    },
  ];

  const acknowledgements: RuleAcknowledgement[] = [
    {
      id: 'ack-1',
      householdId: 'house-1',
      ruleVersionId: 'rules-2',
      memberId: 'alex',
      acknowledgedAt: '2026-03-24T01:00:00.000Z',
      createdAt: '2026-03-24T01:00:00.000Z',
    },
  ];

  const members = [
    {
      user_id: 'alex',
      profile: { display_name: 'Alex' },
    },
    {
      user_id: 'sam',
      profile: { display_name: 'Sam' },
    },
  ];

  it('keeps version history and identifies the next publish label', () => {
    expect(getNextRuleVersionLabel(versions)).toBe('v3');
    expect(buildRulesSummary(2, 1)).toEqual({
      headline: '2 rule versions on record',
      supporting: '1 members still need to acknowledge the current version',
    });
  });

  it('tracks who acknowledged the current version and who is still pending', () => {
    expect(
      summarizeRuleAcknowledgements(versions[0], acknowledgements, members)
    ).toEqual({
      acknowledgedCount: 1,
      pending: [
        {
          memberId: 'sam',
          memberName: 'Sam',
        },
      ],
    });
  });

  it('builds quiet-hours, guest, and booking events on the shared calendar contract', () => {
    expect(
      buildCoordinationEventPayload({
        activityType: 'quiet_hours',
        title: 'Weekday quiet hours',
        description: 'Keep shared spaces quiet after 10 PM',
        startsAt: '2026-03-24T22:00:00.000Z',
        endsAt: '2026-03-25T08:00:00.000Z',
      })
    ).toEqual(
      expect.objectContaining({
        activity_type: 'quiet_hours',
        icon_key: 'moon',
        visual_weight: 'secondary',
      })
    );

    expect(
      buildCoordinationEventPayload({
        activityType: 'guest',
        title: 'Sam visiting',
        startsAt: '2026-03-28T18:00:00.000Z',
        endsAt: '2026-03-29T10:00:00.000Z',
        metadata: { sleeping: 'guest room' },
      })
    ).toEqual(
      expect.objectContaining({
        activity_type: 'guest',
        icon_key: 'users',
        metadata: { sleeping: 'guest room' },
      })
    );

    expect(
      buildCoordinationEventPayload({
        activityType: 'booking',
        title: 'Guest room booking',
        startsAt: '2026-03-30T19:00:00.000Z',
        endsAt: '2026-03-30T22:00:00.000Z',
        location: 'Guest room',
      })
    ).toEqual(
      expect.objectContaining({
        activity_type: 'booking',
        icon_key: 'key',
        location: 'Guest room',
      })
    );
  });
});
