export type CoordinationActivityType = 'quiet_hours' | 'guest' | 'booking';

export interface HouseRuleVersion {
  id: string;
  householdId: string;
  createdBy: string;
  versionLabel: string;
  title: string;
  body: string;
  changeSummary: string | null;
  isCurrent: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleAcknowledgement {
  id: string;
  householdId: string;
  ruleVersionId: string;
  memberId: string;
  acknowledgedAt: string | null;
  createdAt: string;
}

export interface HouseRuleVersionInput {
  title: string;
  body: string;
  changeSummary?: string | null;
}

export interface CoordinationEventInput {
  activityType: CoordinationActivityType;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string;
  endsAt: string;
  ownerMemberUserIds?: string[];
  metadata?: Record<string, unknown> | null;
}

export interface PendingRuleAcknowledgement {
  memberId: string;
  memberName: string;
}
