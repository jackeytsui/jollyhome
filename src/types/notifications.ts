export type NotificationCategory =
  | 'expenses'
  | 'chores'
  | 'calendar'
  | 'meals'
  | 'supplies'
  | 'maintenance'
  | 'rules';

export type NotificationDeliveryMode = 'realtime' | 'digest' | 'off';
export type NotificationFeature =
  | 'finances'
  | 'chores'
  | 'calendar'
  | 'shopping'
  | 'meals'
  | 'supplies'
  | 'maintenance'
  | 'rules';
export type NotificationFeatureRoute =
  | '/(app)/finances'
  | '/(app)/chores'
  | '/(app)/calendar'
  | '/(app)/shopping'
  | '/(app)/meals'
  | '/(app)/supplies'
  | '/(app)/maintenance'
  | '/(app)/rules';
export type DailyDigestSectionTone = 'neutral' | 'attention' | 'positive';

export interface NotificationReference {
  feature: NotificationFeature;
  route: NotificationFeatureRoute;
  entityId: string | null;
  title: string;
  subtitle: string | null;
}

export interface NotificationPreferences {
  householdId: string;
  userId: string;
  digestHour: number;
  digestTimezone: string;
  categoryModes: Record<NotificationCategory, NotificationDeliveryMode>;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DailyDigestSection {
  id: NotificationCategory;
  title: string;
  summary: string;
  count: number;
  tone: DailyDigestSectionTone;
  references: NotificationReference[];
}

export interface DailyDigestPreview {
  generatedAt: string;
  headline: string;
  subheadline: string;
  attentionCount: number;
  sections: DailyDigestSection[];
}
