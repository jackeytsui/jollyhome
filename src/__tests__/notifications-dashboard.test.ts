import {
  buildDailyDigestPreview,
  buildNotificationReferences,
  getDefaultNotificationPreferences,
  mapNotificationPreferencesRow,
} from '@/hooks/useNotifications';

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
});
