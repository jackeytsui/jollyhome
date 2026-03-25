import { buildAssistantSnapshot, buildGroundedAssistantResponse } from '@/lib/assistantActions';

describe('household assistant', () => {
  const snapshot = buildAssistantSnapshot({
    householdName: 'Jolly Home',
    dashboardHeadline: 'Jolly Home has 3 active coordination areas',
    monthlySpendCents: 18400,
    topSpendCategory: 'Groceries',
    openChoreTitles: ['Reset kitchen', 'Laundry fold'],
    upcomingEventTitles: ['Plumber visit', 'Dinner with friends'],
    lowStockTitles: ['Laundry detergent', 'Rice'],
    plannedMealTitles: ['Veggie curry', 'Chicken tacos'],
    maintenanceTitles: ['Seal window draft'],
    fairnessSummary: ['Alex is carrying more shared load right now', 'Sam is being supported on both labor and balances'],
    spendingInsightSummaries: ['Groceries are the largest spend category this month'],
    activeShoppingListId: 'list-1',
  });

  it('answers with grounded finance context and bounded actions', () => {
    const response = buildGroundedAssistantResponse('How are we doing on spending this month?', snapshot);

    expect(response.answer).toMatch(/184\.00/);
    expect(response.facts).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Groceries/),
      ])
    );
    expect(response.actions[0]).toMatchObject({
      type: 'navigate',
      route: '/(app)/finances',
    });
  });

  it('offers explicit shopping actions for pantry questions', () => {
    const response = buildGroundedAssistantResponse('What should I restock from the pantry?', snapshot);

    expect(response.answer).toMatch(/stock alerts/i);
    expect(response.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'create_shopping_item',
          shoppingItemDraft: expect.objectContaining({
            title: 'Laundry detergent',
          }),
        }),
        expect.objectContaining({
          type: 'navigate',
          route: '/(app)/shopping',
        }),
      ])
    );
  });

  it('covers chores, meals, maintenance, calendar, and generic questions from snapshot data', () => {
    expect(buildGroundedAssistantResponse('What chores need attention?', snapshot).actions[0]).toMatchObject({
      route: '/(app)/chores',
    });
    expect(buildGroundedAssistantResponse('What should we cook?', snapshot).actions[0]).toMatchObject({
      route: '/(app)/meals',
    });
    expect(buildGroundedAssistantResponse('Any maintenance issues?', snapshot).actions[0]).toMatchObject({
      route: '/(app)/maintenance',
    });
    expect(buildGroundedAssistantResponse('What is coming up?', snapshot).actions[0]).toMatchObject({
      route: '/(app)/calendar',
    });
    expect(buildGroundedAssistantResponse('How is the house doing?', snapshot).facts[0]).toMatch(
      /active coordination areas/
    );
  });
});
