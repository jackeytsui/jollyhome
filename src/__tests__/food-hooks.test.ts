import { supabase } from '@/lib/supabase';
import {
  __resetFoodRealtimeRegistryForTests,
  FOOD_REALTIME_CHANNEL_NAME,
  FOOD_REALTIME_TABLES,
  subscribeFoodRealtime,
} from '@/hooks/useFoodRealtime';
import {
  buildGeneratedRestockMap,
  resolveActiveShoppingListId,
  sortShoppingItemsForDisplay,
} from '@/hooks/useShopping';
import { buildMealWeekRange, deriveMealServings } from '@/hooks/useMealPlans';

describe('food hooks', () => {
  beforeEach(() => {
    __resetFoodRealtimeRegistryForTests();
    jest.clearAllMocks();
  });

  it('shares one household realtime channel across food subscribers and tears it down once', () => {
    const listeners: Array<() => void> = [];
    const channelOn = jest.fn().mockImplementation((_event, _filter, callback) => {
      listeners.push(callback as () => void);
      return channelMock;
    });
    const channelMock = {
      on: channelOn,
      subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    };

    (supabase.channel as jest.Mock).mockReturnValue(channelMock);

    const refreshShopping = jest.fn();
    const refreshInventory = jest.fn();

    const unsubscribeShopping = subscribeFoodRealtime('household-1', refreshShopping);
    const unsubscribeInventory = subscribeFoodRealtime('household-1', refreshInventory);

    expect(supabase.channel).toHaveBeenCalledTimes(1);
    expect(supabase.channel).toHaveBeenCalledWith(FOOD_REALTIME_CHANNEL_NAME('household-1'));
    expect(channelOn).toHaveBeenCalledTimes(FOOD_REALTIME_TABLES.length);

    listeners[0]?.();
    expect(refreshShopping).toHaveBeenCalledTimes(1);
    expect(refreshInventory).toHaveBeenCalledTimes(1);

    unsubscribeShopping();
    expect(supabase.removeChannel).not.toHaveBeenCalled();

    unsubscribeInventory();
    expect(supabase.removeChannel).toHaveBeenCalledTimes(1);
    expect(supabase.removeChannel).toHaveBeenCalledWith(channelMock);
  });

  it('sorts shopping items with pending rows first and dedupes generated restocks by idempotency key', () => {
    const sorted = sortShoppingItemsForDisplay([
      {
        id: 'checked-1',
        listId: 'list-1',
        householdId: 'household-1',
        title: 'Milk',
        note: null,
        category: 'dairy',
        quantity: 1,
        unit: 'count',
        status: 'purchased',
        source: 'restock',
        catalogItemId: 'catalog-milk',
        recipeId: null,
        mealPlanEntryId: null,
        inventoryItemId: 'inventory-1',
        minimumQuantity: 1,
        generatedRestock: { idempotencyKey: 'restock-milk', sourceEventIds: [], inventoryItemId: 'inventory-1', inventoryAlertId: 'alert-1', inventoryEventId: 'event-1', minimumQuantity: 1, onHandQuantity: 0, suggestedPurchaseQuantity: 1, generatedAt: '2026-03-24T10:00:00.000Z' },
        checkedOffBy: 'user-1',
        checkedOffAt: '2026-03-24T10:00:00.000Z',
        createdAt: '2026-03-24T09:00:00.000Z',
        updatedAt: '2026-03-24T10:00:00.000Z',
      },
      {
        id: 'pending-1',
        listId: 'list-1',
        householdId: 'household-1',
        title: 'Apples',
        note: null,
        category: 'produce',
        quantity: 4,
        unit: 'count',
        status: 'pending',
        source: 'manual',
        catalogItemId: null,
        recipeId: null,
        mealPlanEntryId: null,
        inventoryItemId: null,
        minimumQuantity: null,
        generatedRestock: null,
        checkedOffBy: null,
        checkedOffAt: null,
        createdAt: '2026-03-24T09:00:00.000Z',
        updatedAt: '2026-03-24T09:00:00.000Z',
      },
      {
        id: 'checked-duplicate',
        listId: 'list-1',
        householdId: 'household-1',
        title: 'Milk backup',
        note: null,
        category: 'dairy',
        quantity: 1,
        unit: 'count',
        status: 'pending',
        source: 'restock',
        catalogItemId: 'catalog-milk',
        recipeId: null,
        mealPlanEntryId: null,
        inventoryItemId: 'inventory-1',
        minimumQuantity: 1,
        generatedRestock: { idempotencyKey: 'restock-milk', sourceEventIds: [], inventoryItemId: 'inventory-1', inventoryAlertId: 'alert-1', inventoryEventId: 'event-2', minimumQuantity: 1, onHandQuantity: 0, suggestedPurchaseQuantity: 1, generatedAt: '2026-03-24T10:05:00.000Z' },
        checkedOffBy: null,
        checkedOffAt: null,
        createdAt: '2026-03-24T09:05:00.000Z',
        updatedAt: '2026-03-24T10:05:00.000Z',
      },
    ]);

    expect(sorted.map((item) => item.id)).toEqual(['pending-1', 'checked-duplicate', 'checked-1']);
    expect(Object.keys(buildGeneratedRestockMap(sorted))).toEqual(['restock-milk']);
    expect(
      resolveActiveShoppingListId(
        [
          {
            id: 'archived-list',
            householdId: 'household-1',
            title: 'Done',
            notes: null,
            source: 'manual',
            status: 'archived',
            createdBy: 'user-1',
            recipeId: null,
            mealPlanEntryId: null,
            receiptReviewId: null,
            createdAt: '2026-03-24T00:00:00.000Z',
            updatedAt: '2026-03-24T00:00:00.000Z',
          },
          {
            id: 'active-list',
            householdId: 'household-1',
            title: 'Weekly',
            notes: null,
            source: 'manual',
            status: 'active',
            createdBy: 'user-1',
            recipeId: null,
            mealPlanEntryId: null,
            receiptReviewId: null,
            createdAt: '2026-03-24T00:00:00.000Z',
            updatedAt: '2026-03-24T00:00:00.000Z',
          },
        ],
        'archived-list'
      )
    ).toBe('active-list');
  });

  it('derives meal servings from attendance and keeps weekly meal windows to seven days', () => {
    expect(
      deriveMealServings({
        attendanceMemberIds: ['user-1', 'user-2', 'user-3'],
        explicitServings: null,
        recipeServings: 2,
      })
    ).toEqual({ servings: 3, servingSource: 'attendance' });

    expect(
      deriveMealServings({
        attendanceMemberIds: [],
        explicitServings: 5,
        recipeServings: 2,
      })
    ).toEqual({ servings: 5, servingSource: 'manual' });

    expect(buildMealWeekRange('2026-03-23')).toEqual({
      weekStart: '2026-03-23',
      weekEnd: '2026-03-29',
    });
  });
});
