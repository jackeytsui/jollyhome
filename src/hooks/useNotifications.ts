import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import type { HouseholdCalendarItem } from '@/types/calendar';
import type { ChoreInstance, ChoreTemplate } from '@/types/chores';
import type { Expense } from '@/types/expenses';
import type { InventoryAlert } from '@/types/inventory';
import type { MaintenanceRequest } from '@/types/maintenance';
import type { MealPlanEntry } from '@/types/meals';
import type {
  DailyDigestPreview,
  DailyDigestSection,
  NotificationCategory,
  NotificationDeliveryMode,
  NotificationFeatureRoute,
  NotificationPreferences,
  NotificationReference,
} from '@/types/notifications';

interface NotificationPreferenceRow {
  household_id: string;
  user_id: string;
  digest_hour: number;
  digest_timezone: string;
  category_preferences: Partial<Record<NotificationCategory, NotificationDeliveryMode>> | null;
  created_at: string;
  updated_at: string;
}

interface DigestExpense extends Pick<Expense, 'id' | 'description' | 'amount_cents' | 'expense_date'> {}
interface DigestChore extends Pick<ChoreInstance, 'id' | 'templateId' | 'status' | 'scheduledFor' | 'dueWindowEnd'> {}
interface DigestMeal extends Pick<MealPlanEntry, 'id' | 'title' | 'plannedForDate' | 'slot' | 'status'> {}
interface DigestMaintenance extends Pick<MaintenanceRequest, 'id' | 'title' | 'priority' | 'status' | 'updatedAt'> {}
interface DigestInput {
  householdName?: string | null;
  generatedAt?: string;
  expenses?: DigestExpense[];
  choreInstances?: DigestChore[];
  choreTemplates?: Pick<ChoreTemplate, 'id' | 'title' | 'area'>[];
  calendarItems?: HouseholdCalendarItem[];
  mealPlans?: DigestMeal[];
  lowStockAlerts?: InventoryAlert[];
  simplifiedDebts?: Array<{ from: string; to: string; amount: number }>;
  maintenanceRequests?: DigestMaintenance[];
}

export const NOTIFICATION_CATEGORY_ORDER: NotificationCategory[] = [
  'expenses',
  'chores',
  'calendar',
  'meals',
  'supplies',
  'maintenance',
  'rules',
];

export const DEFAULT_NOTIFICATION_CATEGORY_MODES: Record<NotificationCategory, NotificationDeliveryMode> = {
  expenses: 'digest',
  chores: 'realtime',
  calendar: 'realtime',
  meals: 'digest',
  supplies: 'realtime',
  maintenance: 'realtime',
  rules: 'digest',
};

function currencyFromCents(amountCents: number) {
  return `$${(amountCents / 100).toFixed(2)}`;
}

function formatMemberId(memberId: string) {
  return memberId.replace(/[-_]/g, ' ');
}

function normalizeCategoryModes(
  input?: Partial<Record<NotificationCategory, NotificationDeliveryMode>> | null
) {
  return NOTIFICATION_CATEGORY_ORDER.reduce<Record<NotificationCategory, NotificationDeliveryMode>>((acc, category) => {
    acc[category] = input?.[category] ?? DEFAULT_NOTIFICATION_CATEGORY_MODES[category];
    return acc;
  }, {} as Record<NotificationCategory, NotificationDeliveryMode>);
}

function buildReference(
  feature: NotificationReference['feature'],
  route: NotificationFeatureRoute,
  title: string,
  subtitle: string | null,
  entityId: string | null
): NotificationReference {
  return {
    feature,
    route,
    entityId,
    title,
    subtitle,
  };
}

function describeBalancePair(input: { from: string; to: string; amount: number }) {
  return `${formatMemberId(input.from)} owes ${formatMemberId(input.to)} ${currencyFromCents(input.amount)}`;
}

function buildExpenseReferences(expenses: DigestExpense[]): NotificationReference[] {
  return expenses.slice(0, 3).map((expense) => (
    buildReference(
      'finances',
      '/(app)/finances',
      expense.description,
      `${currencyFromCents(expense.amount_cents)} on ${expense.expense_date}`,
      expense.id
    )
  ));
}

function buildChoreReferences(
  choreInstances: DigestChore[],
  choreTemplates: Pick<ChoreTemplate, 'id' | 'title' | 'area'>[]
): NotificationReference[] {
  return choreInstances.slice(0, 3).map((instance) => {
    const template = choreTemplates.find((item) => item.id === instance.templateId);
    const due = instance.dueWindowEnd ?? instance.scheduledFor ?? 'Unscheduled';
    return buildReference(
      'chores',
      '/(app)/chores',
      template?.title ?? 'Household chore',
      `${template?.area ?? 'Home'} • due ${due}`,
      instance.id
    );
  });
}

function buildCalendarReferences(calendarItems: HouseholdCalendarItem[]): NotificationReference[] {
  return calendarItems.slice(0, 3).map((item) => (
    buildReference(
      'calendar',
      '/(app)/calendar',
      item.title,
      item.startsAt,
      item.id
    )
  ));
}

function buildMealReferences(mealPlans: DigestMeal[]): NotificationReference[] {
  return mealPlans.slice(0, 3).map((meal) => (
    buildReference(
      'meals',
      '/(app)/meals',
      meal.title,
      `${meal.slot} • ${meal.plannedForDate}`,
      meal.id
    )
  ));
}

function buildSupplyReferences(lowStockAlerts: InventoryAlert[]): NotificationReference[] {
  return lowStockAlerts.slice(0, 3).map((alert) => (
    buildReference(
      'supplies',
      '/(app)/supplies',
      alert.title,
      alert.message ?? `Current quantity ${alert.currentQuantity ?? 0}`,
      alert.inventoryItemId
    )
  ));
}

function buildMaintenanceReferences(requests: DigestMaintenance[]): NotificationReference[] {
  return requests.slice(0, 3).map((request) => (
    buildReference(
      'maintenance',
      '/(app)/maintenance',
      request.title,
      `${request.priority} priority • ${request.status}`,
      request.id
    )
  ));
}

export function getDefaultNotificationPreferences(householdId: string, userId: string): NotificationPreferences {
  return {
    householdId,
    userId,
    digestHour: 18,
    digestTimezone: 'America/Toronto',
    categoryModes: { ...DEFAULT_NOTIFICATION_CATEGORY_MODES },
    createdAt: null,
    updatedAt: null,
  };
}

export function mapNotificationPreferencesRow(row: NotificationPreferenceRow): NotificationPreferences {
  return {
    householdId: row.household_id,
    userId: row.user_id,
    digestHour: row.digest_hour,
    digestTimezone: row.digest_timezone,
    categoryModes: normalizeCategoryModes(row.category_preferences),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function buildNotificationReferences(input: DigestInput): Record<NotificationCategory, NotificationReference[]> {
  const chores = (input.choreInstances ?? []).filter((item) => item.status === 'open' || item.status === 'claimed');
  const calendar = [...(input.calendarItems ?? [])]
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
    .slice(0, 3);
  const meals = (input.mealPlans ?? []).filter((item) => item.status === 'planned');
  const maintenance = (input.maintenanceRequests ?? []).filter((item) => item.status !== 'resolved');

  return {
    expenses: buildExpenseReferences(input.expenses ?? []),
    chores: buildChoreReferences(chores, input.choreTemplates ?? []),
    calendar: buildCalendarReferences(calendar),
    meals: buildMealReferences(meals),
    supplies: buildSupplyReferences(input.lowStockAlerts ?? []),
    maintenance: buildMaintenanceReferences(maintenance),
    rules: [
      buildReference(
        'rules',
        '/(app)/rules',
        'House rules and acknowledgements',
        'Review updates, quiet hours, and bookings',
        null
      ),
    ],
  };
}

export function buildDailyDigestPreview(input: DigestInput): DailyDigestPreview {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const references = buildNotificationReferences(input);
  const chores = (input.choreInstances ?? []).filter((item) => item.status === 'open' || item.status === 'claimed');
  const plannedMeals = (input.mealPlans ?? []).filter((item) => item.status === 'planned');
  const lowStockAlerts = input.lowStockAlerts ?? [];
  const calendarItems = [...(input.calendarItems ?? [])]
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
    .slice(0, 3);
  const balances = input.simplifiedDebts ?? [];
  const maintenance = (input.maintenanceRequests ?? []).filter((item) => item.status !== 'resolved');

  const sections: DailyDigestSection[] = [];

  sections.push({
    id: 'chores',
    title: 'Chores',
    summary: chores.length > 0
      ? `${chores.length} chores still need attention tonight`
      : 'No open chores are waiting right now',
    count: chores.length,
    tone: chores.length > 0 ? 'attention' : 'positive',
    references: references.chores,
  });

  sections.push({
    id: 'meals',
    title: 'Meals',
    summary: plannedMeals.length > 0
      ? `${plannedMeals.length} planned meals are ready for the week`
      : 'No meals are planned yet for the upcoming week',
    count: plannedMeals.length,
    tone: plannedMeals.length > 0 ? 'neutral' : 'attention',
    references: references.meals,
  });

  sections.push({
    id: 'calendar',
    title: 'Calendar',
    summary: calendarItems.length > 0
      ? `${calendarItems.length} household events are coming up next`
      : 'The household timeline is quiet right now',
    count: calendarItems.length,
    tone: 'neutral',
    references: references.calendar,
  });

  sections.push({
    id: 'supplies',
    title: 'Supplies',
    summary: lowStockAlerts.length > 0
      ? `${lowStockAlerts.length} pantry or household items need restocking`
      : 'No low-stock alerts are currently open',
    count: lowStockAlerts.length,
    tone: lowStockAlerts.length > 0 ? 'attention' : 'positive',
    references: references.supplies,
  });

  sections.push({
    id: 'expenses',
    title: 'Balances',
    summary: balances.length > 0
      ? `${balances.length} household balances still need settling`
      : 'No unsettled balances are left to reconcile',
    count: balances.length,
    tone: balances.length > 0 ? 'attention' : 'positive',
    references: balances.slice(0, 3).map((balance, index) => (
      buildReference('finances', '/(app)/finances', `Balance ${index + 1}`, describeBalancePair(balance), null)
    )),
  });

  sections.push({
    id: 'maintenance',
    title: 'Maintenance',
    summary: maintenance.length > 0
      ? `${maintenance.length} repair or upkeep requests are still active`
      : 'No active maintenance requests need follow-up',
    count: maintenance.length,
    tone: maintenance.length > 0 ? 'neutral' : 'positive',
    references: references.maintenance,
  });

  const attentionCount = sections.filter((section) => section.tone === 'attention' && section.count > 0).length;
  const householdLabel = input.householdName ? `${input.householdName}` : 'Your household';

  return {
    generatedAt,
    headline: attentionCount > 0
      ? `${householdLabel} has ${attentionCount} areas that need attention`
      : `${householdLabel} is on track today`,
    subheadline: attentionCount > 0
      ? 'Review the highlighted sections and jump straight into the right workflow.'
      : 'Nothing urgent surfaced across chores, meals, calendar, supplies, or balances.',
    attentionCount,
    sections,
  };
}

export function useNotifications() {
  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const user = useAuthStore((state) => state.user);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fallbackPreferences = useMemo(() => {
    if (!activeHouseholdId || !user?.id) {
      return null;
    }
    return getDefaultNotificationPreferences(activeHouseholdId, user.id);
  }, [activeHouseholdId, user?.id]);

  const loadPreferences = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId || !user?.id) {
      setPreferences(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: loadError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (loadError) {
        throw loadError;
      }

      setPreferences(
        data
          ? mapNotificationPreferencesRow(data as NotificationPreferenceRow)
          : getDefaultNotificationPreferences(activeHouseholdId, user.id)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notification preferences');
      setPreferences(getDefaultNotificationPreferences(activeHouseholdId, user.id));
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId, user?.id]);

  const persistPreferences = useCallback(async (nextPreferences: NotificationPreferences): Promise<void> => {
    setSaving(true);
    setError(null);

    try {
      const { error: persistError } = await supabase.from('notification_preferences').upsert(
        {
          household_id: nextPreferences.householdId,
          user_id: nextPreferences.userId,
          digest_hour: nextPreferences.digestHour,
          digest_timezone: nextPreferences.digestTimezone,
          category_preferences: nextPreferences.categoryModes,
        },
        {
          onConflict: 'household_id,user_id',
        }
      );

      if (persistError) {
        throw persistError;
      }

      setPreferences({
        ...nextPreferences,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notification preferences');
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateCategoryMode = useCallback(async (
    category: NotificationCategory,
    mode: NotificationDeliveryMode
  ): Promise<void> => {
    const current = preferences ?? fallbackPreferences;
    if (!current) {
      return;
    }

    const nextPreferences: NotificationPreferences = {
      ...current,
      categoryModes: {
        ...current.categoryModes,
        [category]: mode,
      },
    };

    setPreferences(nextPreferences);
    await persistPreferences(nextPreferences);
  }, [fallbackPreferences, persistPreferences, preferences]);

  const updateDigestTiming = useCallback(async (digestHour: number): Promise<void> => {
    const current = preferences ?? fallbackPreferences;
    if (!current) {
      return;
    }

    const nextPreferences: NotificationPreferences = {
      ...current,
      digestHour,
    };

    setPreferences(nextPreferences);
    await persistPreferences(nextPreferences);
  }, [fallbackPreferences, persistPreferences, preferences]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences: preferences ?? fallbackPreferences,
    loading,
    saving,
    error,
    loadPreferences,
    updateCategoryMode,
    updateDigestTiming,
  };
}
