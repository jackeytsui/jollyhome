import {
  buildDailyDigestPreview,
  buildNotificationReferences,
  getDefaultNotificationPreferences,
  mapNotificationPreferencesRow,
} from '@/hooks/useNotifications';
import {
  buildFairnessOverview,
  buildHouseholdDashboard,
  buildMonthlyReport,
  buildSpendingInsights,
} from '@/lib/dashboard';
import {
  buildContextSuggestions,
  buildOnboardingSteps,
  buildUnifiedTimelineSummary,
} from '@/lib/onboarding';

describe('notifications dashboard', () => {
  it('provides stable default preferences and fills missing category modes', () => {
    expect(getDefaultNotificationPreferences('house-1', 'user-1')).toMatchObject({
      householdId: 'house-1',
      userId: 'user-1',
      digestHour: 18,
      digestTimezone: 'America/Toronto',
      categoryModes: expect.objectContaining({
        chores: 'realtime',
        expenses: 'digest',
        maintenance: 'realtime',
      }),
    });

    expect(
      mapNotificationPreferencesRow({
        household_id: 'house-1',
        user_id: 'user-1',
        digest_hour: 20,
        digest_timezone: 'America/New_York',
        category_preferences: {
          chores: 'off',
          meals: 'realtime',
        },
        created_at: '2026-03-24T00:00:00.000Z',
        updated_at: '2026-03-24T01:00:00.000Z',
      }).categoryModes
    ).toEqual(
      expect.objectContaining({
        chores: 'off',
        meals: 'realtime',
        calendar: 'realtime',
        expenses: 'digest',
      })
    );
  });

  it('builds cross-feature notification references instead of dead-end alert text', () => {
    const references = buildNotificationReferences({
      expenses: [
        {
          id: 'expense-1',
          description: 'Costco restock',
          amount_cents: 8450,
          expense_date: '2026-03-24',
        },
      ],
      choreInstances: [
        {
          id: 'chore-1',
          templateId: 'template-1',
          status: 'open',
          scheduledFor: '2026-03-24',
          dueWindowEnd: '2026-03-24',
        },
      ],
      choreTemplates: [
        {
          id: 'template-1',
          title: 'Reset kitchen',
          area: 'Kitchen',
        },
      ],
      calendarItems: [
        {
          id: 'calendar-1',
          householdId: 'house-1',
          sourceId: 'event-1',
          sourceType: 'event',
          title: 'Plumber visit',
          details: null,
          startsAt: '2026-03-25T10:00:00.000Z',
          endsAt: '2026-03-25T11:00:00.000Z',
          allDay: false,
          iconKey: null,
          visualWeight: 'medium',
          memberOwnerIds: [],
          memberColorKey: null,
          recurrenceRule: null,
          recurrenceTimezone: null,
          recurrenceAnchor: null,
          attendanceStatus: null,
          isProjected: false,
          metadata: null,
        },
      ],
      mealPlans: [
        {
          id: 'meal-1',
          title: 'House Curry',
          plannedForDate: '2026-03-26',
          slot: 'dinner',
          status: 'planned',
        },
      ],
      lowStockAlerts: [
        {
          id: 'alert-1',
          householdId: 'house-1',
          inventoryItemId: 'inventory-rice',
          catalogItemId: 'rice',
          alertType: 'low_stock',
          status: 'open',
          thresholdQuantity: 1,
          currentQuantity: 0.5,
          triggeredByEventId: 'event-1',
          title: 'Rice is running low',
          message: 'Add rice to the next shopping trip',
          createdAt: '2026-03-24T00:00:00.000Z',
          resolvedAt: null,
        },
      ],
      maintenanceRequests: [
        {
          id: 'request-1',
          title: 'Fix bathroom fan',
          priority: 'high',
          status: 'open',
          updatedAt: '2026-03-24T10:00:00.000Z',
        },
      ],
    });

    expect(references.expenses[0]).toMatchObject({
      feature: 'finances',
      route: '/(app)/finances',
      title: 'Costco restock',
    });
    expect(references.chores[0]).toMatchObject({
      feature: 'chores',
      route: '/(app)/chores',
      title: 'Reset kitchen',
    });
    expect(references.supplies[0]).toMatchObject({
      feature: 'supplies',
      route: '/(app)/supplies',
      title: 'Rice is running low',
    });
    expect(references.maintenance[0]).toMatchObject({
      feature: 'maintenance',
      route: '/(app)/maintenance',
      title: 'Fix bathroom fan',
    });
  });

  it('assembles a single digest view across chores, meals, balances, supplies, and calendar context', () => {
    const digest = buildDailyDigestPreview({
      householdName: 'Jolly Home',
      generatedAt: '2026-03-24T18:00:00.000Z',
      choreInstances: [
        {
          id: 'chore-1',
          templateId: 'template-1',
          status: 'claimed',
          scheduledFor: '2026-03-24',
          dueWindowEnd: '2026-03-24',
        },
      ],
      choreTemplates: [
        {
          id: 'template-1',
          title: 'Take out recycling',
          area: 'Garage',
        },
      ],
      mealPlans: [
        {
          id: 'meal-1',
          title: 'Veggie pasta',
          plannedForDate: '2026-03-25',
          slot: 'dinner',
          status: 'planned',
        },
      ],
      calendarItems: [
        {
          id: 'calendar-1',
          householdId: 'house-1',
          sourceId: 'maintenance-1',
          sourceType: 'maintenance',
          title: 'HVAC inspection',
          details: null,
          startsAt: '2026-03-26T09:00:00.000Z',
          endsAt: '2026-03-26T10:00:00.000Z',
          allDay: false,
          iconKey: null,
          visualWeight: 'secondary',
          memberOwnerIds: [],
          memberColorKey: null,
          recurrenceRule: null,
          recurrenceTimezone: null,
          recurrenceAnchor: null,
          attendanceStatus: null,
          isProjected: false,
          metadata: null,
        },
      ],
      lowStockAlerts: [
        {
          id: 'alert-1',
          householdId: 'house-1',
          inventoryItemId: 'inventory-detergent',
          catalogItemId: 'detergent',
          alertType: 'out_of_stock',
          status: 'open',
          thresholdQuantity: 1,
          currentQuantity: 0,
          triggeredByEventId: null,
          title: 'Laundry detergent out of stock',
          message: 'Restock before the next wash day',
          createdAt: '2026-03-24T00:00:00.000Z',
          resolvedAt: null,
        },
      ],
      simplifiedDebts: [
        {
          from: 'alex',
          to: 'sam',
          amount: 2450,
        },
      ],
      maintenanceRequests: [
        {
          id: 'request-1',
          title: 'Seal window draft',
          priority: 'medium',
          status: 'claimed',
          updatedAt: '2026-03-24T12:00:00.000Z',
        },
      ],
    });

    expect(digest).toMatchObject({
      generatedAt: '2026-03-24T18:00:00.000Z',
      headline: expect.stringMatching(/Jolly Home/),
      attentionCount: 3,
    });
    expect(digest.sections.map((section) => section.id)).toEqual([
      'chores',
      'meals',
      'calendar',
      'supplies',
      'expenses',
      'maintenance',
    ]);
    expect(digest.sections.find((section) => section.id === 'supplies')).toMatchObject({
      count: 1,
      tone: 'attention',
      summary: expect.stringMatching(/restocking/i),
    });
    expect(digest.sections.find((section) => section.id === 'expenses')?.references[0]).toMatchObject({
      feature: 'finances',
      subtitle: expect.stringContaining('$24.50'),
    });
  });

  it('builds a combined household dashboard, fairness summary, monthly report, and evidence-backed spending insights', () => {
    const dashboard = buildHouseholdDashboard({
      householdName: 'Jolly Home',
      simplifiedDebts: [{ from: 'alex', to: 'sam', amount: 2400 }],
      openChoreCount: 3,
      upcomingCalendarCount: 4,
      lowStockCount: 2,
      activeMaintenanceCount: 1,
      plannedMealCount: 5,
    });

    expect(dashboard).toMatchObject({
      headline: expect.stringMatching(/Jolly Home/),
      metrics: expect.arrayContaining([
        expect.objectContaining({ id: 'balances', value: '1', tone: 'attention' }),
        expect.objectContaining({ id: 'chores', value: '3' }),
      ]),
    });

    const fairness = buildFairnessOverview({
      householdId: 'house-1',
      members: [
        { userId: 'alex', displayName: 'Alex' },
        { userId: 'sam', displayName: 'Sam' },
      ],
      completions: [
        {
          householdId: 'house-1',
          templateId: 'kitchen',
          completedBy: 'alex',
          completedAt: '2026-03-22T10:00:00.000Z',
          actualMinutes: 35,
        },
        {
          householdId: 'house-1',
          templateId: 'bathroom',
          completedBy: 'alex',
          completedAt: '2026-03-23T10:00:00.000Z',
          actualMinutes: 25,
        },
        {
          householdId: 'house-1',
          templateId: 'trash',
          completedBy: 'sam',
          completedAt: '2026-03-23T12:00:00.000Z',
          actualMinutes: 10,
        },
      ],
      netBalances: {
        alex: 3200,
        sam: -3200,
      },
      now: '2026-03-24T12:00:00.000Z',
    });

    expect(fairness.members[0]).toMatchObject({
      memberName: 'Alex',
      status: 'carrying',
    });
    expect(fairness.members[1]).toMatchObject({
      memberName: 'Sam',
      status: 'supported',
    });

    const monthlyReport = buildMonthlyReport({
      now: '2026-03-24T12:00:00.000Z',
      expenses: [
        {
          id: 'expense-1',
          description: 'Trader Joe run',
          amount_cents: 7200,
          category: 'Groceries',
          expense_date: '2026-03-10',
        },
        {
          id: 'expense-2',
          description: 'Internet bill',
          amount_cents: 6500,
          category: 'Utilities',
          expense_date: '2026-03-11',
        },
      ],
      completions: [
        {
          householdId: 'house-1',
          templateId: 'kitchen',
          completedBy: 'alex',
          completedAt: '2026-03-12T10:00:00.000Z',
          actualMinutes: 30,
        },
      ],
      mealPlans: [
        {
          plannedForDate: '2026-03-20',
          status: 'planned',
        },
      ],
      lowStockAlerts: [
        {
          id: 'alert-1',
          householdId: 'house-1',
          inventoryItemId: 'inventory-1',
          catalogItemId: 'milk',
          alertType: 'low_stock',
          status: 'open',
          thresholdQuantity: 1,
          currentQuantity: 0,
          triggeredByEventId: null,
          title: 'Milk low',
          message: null,
          createdAt: '2026-03-12T00:00:00.000Z',
          resolvedAt: null,
        },
      ],
      calendarItems: [
        {
          id: 'event-1',
          householdId: 'house-1',
          sourceId: 'event-1',
          sourceType: 'event',
          title: 'Dinner party',
          details: null,
          startsAt: '2026-03-27T18:00:00.000Z',
          endsAt: '2026-03-27T20:00:00.000Z',
          allDay: false,
          iconKey: null,
          visualWeight: 'medium',
          memberOwnerIds: [],
          memberColorKey: null,
          recurrenceRule: null,
          recurrenceTimezone: null,
          recurrenceAnchor: null,
          attendanceStatus: null,
          isProjected: false,
          metadata: null,
        },
      ],
      maintenanceRequests: [
        { status: 'open' },
      ],
    });

    expect(monthlyReport).toMatchObject({
      monthLabel: 'March 2026',
      spendTotalCents: 13700,
      topCategory: 'Groceries',
      choresCompleted: 1,
      mealsPlanned: 1,
    });

    const insights = buildSpendingInsights({
      now: '2026-03-24T12:00:00.000Z',
      expenses: [
        {
          id: 'expense-1',
          description: 'Trader Joe run',
          amount_cents: 9000,
          category: 'Groceries',
          expense_date: '2026-03-10',
        },
        {
          id: 'expense-2',
          description: 'Costco restock',
          amount_cents: 11000,
          category: 'Groceries',
          expense_date: '2026-03-17',
        },
        {
          id: 'expense-3',
          description: 'Power bill',
          amount_cents: 7000,
          category: 'Utilities',
          expense_date: '2026-03-07',
        },
        {
          id: 'expense-4',
          description: 'Trader Joe run',
          amount_cents: 6000,
          category: 'Groceries',
          expense_date: '2026-02-12',
        },
      ],
    });

    expect(insights[0]).toMatchObject({
      id: 'month-over-month',
      tone: 'attention',
      route: '/(app)/finances',
    });
    expect(insights[1]).toMatchObject({
      id: 'top-category',
      title: expect.stringMatching(/Groceries/),
    });
    expect(insights[2]).toMatchObject({
      id: 'grocery-pattern',
      route: '/(app)/meals',
    });
  });

  it('builds unified timeline summaries and context-aware home suggestions', () => {
    const timeline = buildUnifiedTimelineSummary({
      now: '2026-03-24T12:00:00.000Z',
      items: [
        {
          id: 'timeline-1',
          householdId: 'house-1',
          sourceId: 'meal-1',
          sourceType: 'meal',
          title: 'Veggie curry',
          details: null,
          startsAt: '2026-03-24T18:00:00.000Z',
          endsAt: '2026-03-24T19:00:00.000Z',
          allDay: false,
          iconKey: null,
          visualWeight: 'medium',
          memberOwnerIds: [],
          memberColorKey: null,
          recurrenceRule: null,
          recurrenceTimezone: null,
          recurrenceAnchor: null,
          attendanceStatus: null,
          isProjected: true,
          metadata: null,
        },
        {
          id: 'timeline-2',
          householdId: 'house-1',
          sourceId: 'guest-1',
          sourceType: 'guest',
          title: 'Friends staying over',
          details: null,
          startsAt: '2026-03-25T20:00:00.000Z',
          endsAt: '2026-03-26T09:00:00.000Z',
          allDay: false,
          iconKey: null,
          visualWeight: 'secondary',
          memberOwnerIds: [],
          memberColorKey: null,
          recurrenceRule: null,
          recurrenceTimezone: null,
          recurrenceAnchor: null,
          attendanceStatus: null,
          isProjected: false,
          metadata: null,
        },
      ],
    });

    expect(timeline).toMatchObject({
      headline: expect.stringMatching(/timeline items/i),
    });
    expect(timeline.entries[0]).toMatchObject({
      title: 'Veggie curry',
      sourceType: 'meal',
    });

    const suggestions = buildContextSuggestions({
      lowStockTitles: ['Rice'],
      plannedMealTitles: ['Veggie curry'],
      openChoreTitles: ['Reset kitchen'],
      upcomingEventTitles: ['Friends staying over'],
      maintenanceTitles: ['Seal window draft'],
      spendingInsightSummaries: ['Groceries are the largest spend category this month'],
      fairnessSummary: ['Alex is carrying more shared load right now'],
    });

    expect(suggestions.map((item) => item.id)).toEqual([
      'restock-before-meals',
      'prep-before-event',
      'follow-up-maintenance',
      'review-spending',
    ]);
  });
});
