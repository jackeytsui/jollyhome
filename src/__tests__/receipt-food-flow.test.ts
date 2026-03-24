import {
  buildGroceryReceiptCommitPayload,
  buildReceiptExpenseInput,
  commitGroceryReceipt,
  isLikelyGroceryReceipt,
  stageGroceryReceiptReview,
  type ReceiptShoppingCandidate,
} from '@/lib/receiptWorkflow';
import type { ReceiptData } from '@/hooks/useReceipt';
import type { FoodCatalogItem } from '@/types/inventory';

describe('grocery receipt workflow', () => {
  const receiptData: ReceiptData = {
    store_name: 'Trader Joe\'s',
    date: '2026-03-24',
    subtotal_cents: 940,
    tax_cents: 60,
    tip_cents: 0,
    total_cents: 1000,
    items: [
      { name: 'Greek Yogurt', price_cents: 400, classification: 'shared', suggested_owner: null },
      { name: 'Bananas', price_cents: 300, classification: 'shared', suggested_owner: null },
      { name: 'Sparkling Water', price_cents: 240, classification: 'personal', suggested_owner: 'user-2' },
    ],
  };

  const catalog: FoodCatalogItem[] = [
    {
      id: 'catalog-yogurt',
      householdId: 'house-1',
      canonicalName: 'greek yogurt',
      displayName: 'Greek Yogurt',
      normalizedName: 'greek yogurt',
      barcode: null,
      category: 'dairy',
      defaultUnit: 'count',
      synonyms: [],
      source: 'manual',
      createdAt: '2026-03-20T00:00:00Z',
      updatedAt: '2026-03-20T00:00:00Z',
    },
  ];

  const shoppingItems: ReceiptShoppingCandidate[] = [
    {
      id: 'shop-yogurt',
      title: 'Greek Yogurt',
      category: 'dairy',
      unit: 'count',
      catalogItemId: 'catalog-yogurt',
      status: 'pending',
    },
    {
      id: 'shop-bananas',
      title: 'Bananas',
      category: 'produce',
      unit: 'count',
      catalogItemId: null,
      status: 'pending',
    },
  ];

  const members = [
    {
      id: 'member-1',
      user_id: 'user-1',
      role: 'admin' as const,
      status: 'active' as const,
      joined_at: '2026-01-01T00:00:00Z',
      profile: { display_name: 'Alex', avatar_url: null, dietary_preferences: [] },
    },
    {
      id: 'member-2',
      user_id: 'user-2',
      role: 'member' as const,
      status: 'active' as const,
      joined_at: '2026-01-01T00:00:00Z',
      profile: { display_name: 'Sam', avatar_url: null, dietary_preferences: [] },
    },
  ];

  it('detects grocery receipts from merchant and line items', () => {
    expect(isLikelyGroceryReceipt(receiptData)).toBe(true);
    expect(isLikelyGroceryReceipt({
      ...receiptData,
      store_name: 'Coffee Shop',
      items: [{ name: 'Latte', price_cents: 650, classification: 'personal', suggested_owner: null }],
    })).toBe(false);
  });

  it('stages pantry resolution and shopping matches before commit', () => {
    const review = stageGroceryReceiptReview({
      receiptData,
      householdId: 'house-1',
      storagePaths: ['receipts/house-1/demo.jpg'],
      catalog,
      shoppingItems,
    });

    expect(review.receiptReviewId).toContain('house-1');
    expect(review.items[0]).toMatchObject({
      displayName: 'Greek Yogurt',
      catalogItemId: 'catalog-yogurt',
      categoryKey: 'dairy',
      matchedShoppingItemIds: ['shop-yogurt'],
      shouldAddToPantry: true,
    });
    expect(review.items[1]).toMatchObject({
      displayName: 'Bananas',
      categoryKey: 'other',
      matchedShoppingItemIds: [],
    });
  });

  it('creates expense and inventory payloads together for atomic commit', () => {
    const review = stageGroceryReceiptReview({
      receiptData,
      householdId: 'house-1',
      storagePaths: ['receipts/house-1/demo.jpg'],
      catalog,
      shoppingItems,
    });
    review.items[1] = {
      ...review.items[1],
      categoryKey: 'produce',
      matchedShoppingItemIds: ['shop-bananas'],
      matchedShoppingItemLabels: ['Bananas'],
      includeShoppingMatches: true,
    };
    review.items[2] = {
      ...review.items[2],
      shouldAddToPantry: false,
    };

    const expenseInput = buildReceiptExpenseInput({
      receiptData,
      items: receiptData.items,
      taxCents: receiptData.tax_cents,
      tipCents: receiptData.tip_cents,
      totalCents: receiptData.total_cents,
      storeName: receiptData.store_name,
      date: receiptData.date ?? '',
      members,
      currentUserId: 'user-1',
      householdId: 'house-1',
    });

    const payload = buildGroceryReceiptCommitPayload({ expenseInput, review });

    expect(payload.expense).toMatchObject({
      household_id: 'house-1',
      description: 'Trader Joe\'s',
      amount_cents: 1000,
      paid_by: 'user-1',
    });
    expect(payload.expense.splits).toEqual([
      { user_id: 'user-1', amount_cents: 372 },
      { user_id: 'user-2', amount_cents: 628 },
    ]);
    expect(payload.inventory_items).toEqual([
      expect.objectContaining({ name: 'Greek Yogurt', catalog_item_id: 'catalog-yogurt', quantity: 1 }),
      expect.objectContaining({ name: 'Bananas', category_key: 'produce', quantity: 1 }),
    ]);
    expect(payload.shopping_list_match_ids).toEqual(['shop-yogurt', 'shop-bananas']);
  });

  it('calls the atomic commit edge function once', async () => {
    const review = stageGroceryReceiptReview({
      receiptData,
      householdId: 'house-1',
      storagePaths: ['receipts/house-1/demo.jpg'],
      catalog,
      shoppingItems,
    });
    const expenseInput = buildReceiptExpenseInput({
      receiptData,
      items: receiptData.items,
      taxCents: receiptData.tax_cents,
      tipCents: receiptData.tip_cents,
      totalCents: receiptData.total_cents,
      storeName: receiptData.store_name,
      date: receiptData.date ?? '',
      members,
      currentUserId: 'user-1',
      householdId: 'house-1',
    });
    const invoke = jest.fn().mockResolvedValue({
      data: {
        commit_id: 'commit-1',
        expense_id: 'expense-1',
        inventory_event_ids: ['event-1'],
        matched_shopping_item_ids: ['shop-yogurt'],
      },
      error: null,
    });

    const result = await commitGroceryReceipt({
      expenseInput,
      review,
      supabaseClient: {
        functions: { invoke },
      } as never,
    });

    expect(invoke).toHaveBeenCalledWith('commit-grocery-receipt', {
      body: expect.objectContaining({
        receipt_review_id: review.receiptReviewId,
      }),
    });
    expect(result.expense_id).toBe('expense-1');
  });
});
