import { buildMaintenanceExpensePrefill } from '@/hooks/useMaintenance';
import { buildChoreSupplyWarnings } from '@/hooks/useInventory';
import {
  buildReceiptExpenseInput,
  buildRepairReceiptCommitPayload,
  commitRepairReceipt,
  isLikelyRepairReceipt,
  stageRepairReceiptReview,
} from '@/lib/receiptWorkflow';
import type { ReceiptData } from '@/hooks/useReceipt';
import type { FoodCatalogItem, InventoryAlert } from '@/types/inventory';
import type { MaintenanceRequest } from '@/types/maintenance';

describe('maintenance sync', () => {
  const repairReceipt: ReceiptData = {
    store_name: 'Home Depot',
    date: '2026-03-24',
    subtotal_cents: 8500,
    tax_cents: 850,
    tip_cents: 0,
    total_cents: 9350,
    items: [
      { name: 'Pipe seal tape', price_cents: 350, classification: 'shared', suggested_owner: null },
      { name: 'Sink trap kit', price_cents: 8150, classification: 'shared', suggested_owner: null },
    ],
  };

  const maintenanceRequests: MaintenanceRequest[] = [
    {
      id: 'maint-1',
      householdId: 'house-1',
      createdBy: 'alex',
      title: 'Kitchen sink leak',
      description: 'Need parts for under-sink leak',
      area: 'Kitchen',
      priority: 'urgent',
      status: 'in_progress',
      claimedBy: 'sam',
      claimedAt: null,
      resolvedAt: null,
      costCents: null,
      latestNote: 'Plumber suggested replacing trap',
      latestPhotoPath: null,
      appointmentEventId: null,
      createdAt: '2026-03-24T00:00:00.000Z',
      updatedAt: '2026-03-24T00:00:00.000Z',
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

  it('matches a repair receipt to a maintenance request and builds one commit payload', () => {
    expect(isLikelyRepairReceipt(repairReceipt)).toBe(true);

    const review = stageRepairReceiptReview({
      receiptData: repairReceipt,
      householdId: 'house-1',
      storagePaths: ['receipts/house-1/repair.jpg'],
      maintenanceRequests,
    });

    const expenseInput = buildReceiptExpenseInput({
      receiptData: repairReceipt,
      items: repairReceipt.items,
      taxCents: repairReceipt.tax_cents,
      tipCents: repairReceipt.tip_cents,
      totalCents: repairReceipt.total_cents,
      storeName: repairReceipt.store_name,
      date: repairReceipt.date ?? '',
      members,
      currentUserId: 'user-1',
      householdId: 'house-1',
    });

    const payload = buildRepairReceiptCommitPayload({
      expenseInput,
      review: {
        ...review,
        note: 'Parts purchased for kitchen repair',
        markResolved: true,
      },
    });

    expect(review.maintenanceRequestId).toBe('maint-1');
    expect(payload).toMatchObject({
      maintenance_request_id: 'maint-1',
      mark_resolved: true,
      note: 'Parts purchased for kitchen repair',
    });
  });

  it('calls the repair receipt edge function once', async () => {
    const review = stageRepairReceiptReview({
      receiptData: repairReceipt,
      householdId: 'house-1',
      storagePaths: ['receipts/house-1/repair.jpg'],
      maintenanceRequests,
    });
    const expenseInput = buildReceiptExpenseInput({
      receiptData: repairReceipt,
      items: repairReceipt.items,
      taxCents: repairReceipt.tax_cents,
      tipCents: repairReceipt.tip_cents,
      totalCents: repairReceipt.total_cents,
      storeName: repairReceipt.store_name,
      date: repairReceipt.date ?? '',
      members,
      currentUserId: 'user-1',
      householdId: 'house-1',
    });
    const invoke = jest.fn().mockResolvedValue({
      data: {
        expense_id: 'expense-1',
        maintenance_request_id: 'maint-1',
        receipt_review_id: review.receiptReviewId,
      },
      error: null,
    });

    const result = await commitRepairReceipt({
      expenseInput,
      review,
      supabaseClient: {
        functions: { invoke },
      } as never,
    });

    expect(invoke).toHaveBeenCalledWith('commit-repair-receipt', {
      body: expect.objectContaining({
        maintenance_request_id: 'maint-1',
      }),
    });
    expect(result.expense_id).toBe('expense-1');
  });

  it('builds maintenance expense prefills and chore supply warnings from existing state', () => {
    expect(
      buildMaintenanceExpensePrefill({
        request: {
          ...maintenanceRequests[0],
          costCents: 9350,
        },
        memberUserIds: ['user-1', 'user-2'],
        paidBy: 'user-1',
        householdId: 'house-1',
      })
    ).toEqual(
      expect.objectContaining({
        description: 'Kitchen sink leak repair',
        amount_cents: 9350,
        split_type: 'exact',
      })
    );

    const catalogItems: FoodCatalogItem[] = [
      {
        id: 'catalog-1',
        householdId: 'house-1',
        canonicalName: 'all purpose cleaner',
        displayName: 'All Purpose Cleaner',
        normalizedName: 'all purpose cleaner',
        barcode: null,
        category: 'household',
        defaultUnit: 'bottle',
        synonyms: [],
        source: 'manual',
        createdAt: '2026-03-24T00:00:00.000Z',
        updatedAt: '2026-03-24T00:00:00.000Z',
      },
    ];

    const lowStockAlerts: InventoryAlert[] = [
      {
        id: 'alert-1',
        householdId: 'house-1',
        inventoryItemId: 'inventory-1',
        catalogItemId: 'catalog-1',
        alertType: 'low_stock',
        status: 'open',
        thresholdQuantity: 1,
        currentQuantity: 0,
        triggeredByEventId: null,
        title: 'All Purpose Cleaner is low',
        message: null,
        createdAt: '2026-03-24T00:00:00.000Z',
        resolvedAt: null,
      },
    ];

    expect(
      buildChoreSupplyWarnings({
        title: 'Clean kitchen counters',
        area: 'Kitchen',
        catalogItems,
        lowStockAlerts,
      })
    ).toEqual([
      expect.objectContaining({
        title: 'Low cleaning supplies',
      }),
      expect.objectContaining({
        title: 'Restock prompt after completion',
      }),
    ]);
  });
});
