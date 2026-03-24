import { suggestCategory } from '@/lib/expenseMath';
import { findCatalogItemMatch } from '@/hooks/useInventory';
import { normalizeFoodName } from '@/lib/foodNormalization';
import { supabase } from '@/lib/supabase';
import type { ReceiptData } from '@/hooks/useReceipt';
import type { Member } from '@/hooks/useMembers';
import type { CreateExpenseInput } from '@/types/expenses';
import type { FoodCatalogItem, InventoryUnit } from '@/types/inventory';
import type { ShoppingCategoryKey, ShoppingListItem } from '@/types/shopping';

export interface ReceiptShoppingCandidate {
  id: string;
  title: string;
  category: ShoppingCategoryKey;
  unit: string | null;
  catalogItemId: string | null;
  status: ShoppingListItem['status'];
}

export interface GroceryReceiptReviewItem {
  receiptItemName: string;
  displayName: string;
  catalogItemId: string | null;
  categoryKey: ShoppingCategoryKey;
  unit: InventoryUnit;
  quantity: number;
  shouldAddToPantry: boolean;
  matchedShoppingItemIds: string[];
  matchedShoppingItemLabels: string[];
  includeShoppingMatches: boolean;
  priceCents: number;
  classification: 'shared' | 'personal';
  suggestedOwner: string | null;
}

export interface GroceryReceiptReview {
  receiptReviewId: string;
  householdId: string;
  storeName: string;
  date: string | null;
  storagePaths: string[];
  items: GroceryReceiptReviewItem[];
}

export interface GroceryReceiptCommitPayload {
  expense: CreateExpenseInput;
  receipt_review_id: string;
  storage_paths: string[];
  inventory_items: Array<{
    name: string;
    catalog_item_id: string | null;
    category_key: ShoppingCategoryKey;
    unit: InventoryUnit;
    quantity: number;
    price_cents: number;
    classification: 'shared' | 'personal';
    suggested_owner: string | null;
  }>;
  shopping_list_match_ids: string[];
}

export interface GroceryReceiptCommitResult {
  commit_id: string;
  expense_id: string;
  inventory_event_ids: string[];
  matched_shopping_item_ids: string[];
}

function toDateString(value: string | null | undefined): string {
  return value || new Date().toISOString().split('T')[0];
}

export function isLikelyGroceryReceipt(receiptData: ReceiptData): boolean {
  const store = normalizeFoodName(receiptData.store_name);
  const groceryKeywords = [
    'aldi',
    'costco',
    'freshco',
    'grocery',
    'iga',
    'kroger',
    'loblaws',
    'metro',
    'no frills',
    'superstore',
    'target',
    'trader joe',
    'walmart',
    'whole foods',
  ];

  if (groceryKeywords.some((keyword) => store.includes(keyword))) {
    return true;
  }

  const normalizedItems = receiptData.items.map((item) => normalizeFoodName(item.name)).filter(Boolean);
  const groceryLikeCount = normalizedItems.filter((item) =>
    /(milk|bread|egg|banana|apple|rice|pasta|chicken|beef|lettuce|spinach|yogurt|cheese|tomato|potato|onion)/.test(item)
  ).length;

  return receiptData.items.length >= 3 && groceryLikeCount >= Math.ceil(receiptData.items.length / 3);
}

export function buildReceiptExpenseInput(input: {
  receiptData: ReceiptData;
  items: ReceiptData['items'];
  taxCents: number;
  tipCents: number;
  totalCents: number;
  storeName: string;
  date: string;
  members: Member[];
  currentUserId: string;
  householdId: string;
}): CreateExpenseInput {
  const activeMembers = input.members.filter((member) => member.status === 'active');
  const memberCount = activeMembers.length || 1;
  const itemTotalsByUser: Record<string, number> = {};

  activeMembers.forEach((member) => {
    itemTotalsByUser[member.user_id] = 0;
  });

  const sharedItems = input.items.filter((item) => item.classification === 'shared');
  const personalItems = input.items.filter((item) => item.classification === 'personal');

  const sharedTotal = sharedItems.reduce((sum, item) => sum + item.price_cents, 0);
  const sharedPerPerson = Math.floor(sharedTotal / memberCount);
  const sharedRemainder = sharedTotal - sharedPerPerson * memberCount;

  activeMembers.forEach((member, index) => {
    itemTotalsByUser[member.user_id] =
      (itemTotalsByUser[member.user_id] ?? 0) + sharedPerPerson + (index < sharedRemainder ? 1 : 0);
  });

  personalItems.forEach((item) => {
    const ownerId = item.suggested_owner;
    if (ownerId && itemTotalsByUser[ownerId] !== undefined) {
      itemTotalsByUser[ownerId] += item.price_cents;
      return;
    }

    activeMembers.forEach((member, index) => {
      const perPerson = Math.floor(item.price_cents / memberCount);
      const extra = index < item.price_cents - perPerson * memberCount ? 1 : 0;
      itemTotalsByUser[member.user_id] = (itemTotalsByUser[member.user_id] ?? 0) + perPerson + extra;
    });
  });

  const grandItemTotal = Object.values(itemTotalsByUser).reduce((sum, amount) => sum + amount, 0);
  const splits: { user_id: string; amount_cents: number }[] = [];
  let distributedTax = 0;
  let distributedTip = 0;

  activeMembers.forEach((member, index) => {
    const itemAmount = itemTotalsByUser[member.user_id] ?? 0;
    let total: number;

    if (index === activeMembers.length - 1) {
      total = itemAmount + (input.taxCents - distributedTax) + (input.tipCents - distributedTip);
    } else {
      const ratio = grandItemTotal > 0 ? itemAmount / grandItemTotal : 1 / memberCount;
      const userTax = Math.floor(input.taxCents * ratio);
      const userTip = Math.floor(input.tipCents * ratio);
      total = itemAmount + userTax + userTip;
      distributedTax += userTax;
      distributedTip += userTip;
    }

    splits.push({ user_id: member.user_id, amount_cents: total });
  });

  return {
    household_id: input.householdId,
    description: input.storeName,
    amount_cents: input.totalCents,
    category: suggestCategory(input.storeName),
    paid_by: input.currentUserId,
    split_type: 'exact',
    splits,
    tax_cents: input.taxCents,
    tip_cents: input.tipCents,
    expense_date: toDateString(input.date),
  };
}

function buildReceiptReviewId(input: {
  householdId: string;
  storeName: string;
  date: string | null;
  storagePaths: string[];
}): string {
  const normalizedStore = normalizeFoodName(input.storeName) || 'receipt';
  const suffix = (input.storagePaths[0] ?? Date.now().toString())
    .split('/')
    .pop()
    ?.replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 16) ?? 'manual';

  return `${input.householdId}:${normalizedStore}:${input.date ?? 'undated'}:${suffix}`;
}

function matchShoppingItems(
  receiptItemName: string,
  categoryKey: ShoppingCategoryKey,
  catalogItemId: string | null,
  shoppingItems: ReceiptShoppingCandidate[]
) {
  const normalizedReceiptName = normalizeFoodName(receiptItemName);

  return shoppingItems.filter((shoppingItem) => {
    if (shoppingItem.status !== 'pending') {
      return false;
    }

    if (catalogItemId && shoppingItem.catalogItemId === catalogItemId) {
      return true;
    }

    const normalizedShoppingName = normalizeFoodName(shoppingItem.title);
    return normalizedReceiptName === normalizedShoppingName && shoppingItem.category === categoryKey;
  });
}

export function stageGroceryReceiptReview(input: {
  receiptData: ReceiptData;
  householdId: string;
  storagePaths: string[];
  catalog: FoodCatalogItem[];
  shoppingItems: ReceiptShoppingCandidate[];
}): GroceryReceiptReview {
  const items = input.receiptData.items.map((item) => {
    const resolved = findCatalogItemMatch(input.catalog, {
      name: item.name,
      category: item.classification === 'personal' ? 'other' : undefined,
    });
    const matches = matchShoppingItems(
      item.name,
      resolved.categoryKey,
      resolved.catalogItemId,
      input.shoppingItems
    );
    const shouldAddToPantry = item.classification === 'shared';

    return {
      receiptItemName: item.name,
      displayName: resolved.displayName || item.name,
      catalogItemId: resolved.catalogItemId,
      categoryKey: resolved.categoryKey,
      unit: resolved.unit,
      quantity: 1,
      shouldAddToPantry,
      matchedShoppingItemIds: matches.map((match) => match.id),
      matchedShoppingItemLabels: matches.map((match) => match.title),
      includeShoppingMatches: matches.length > 0,
      priceCents: item.price_cents,
      classification: item.classification,
      suggestedOwner: item.suggested_owner,
    };
  });

  return {
    receiptReviewId: buildReceiptReviewId({
      householdId: input.householdId,
      storeName: input.receiptData.store_name,
      date: input.receiptData.date,
      storagePaths: input.storagePaths,
    }),
    householdId: input.householdId,
    storeName: input.receiptData.store_name,
    date: input.receiptData.date,
    storagePaths: input.storagePaths,
    items,
  };
}

export function buildGroceryReceiptCommitPayload(input: {
  expenseInput: CreateExpenseInput;
  review: GroceryReceiptReview;
}): GroceryReceiptCommitPayload {
  const shoppingListMatchIds = Array.from(
    new Set(
      input.review.items.flatMap((item) =>
        item.includeShoppingMatches ? item.matchedShoppingItemIds : []
      )
    )
  );

  return {
    expense: input.expenseInput,
    receipt_review_id: input.review.receiptReviewId,
    storage_paths: input.review.storagePaths,
    inventory_items: input.review.items
      .filter((item) => item.shouldAddToPantry && item.quantity > 0)
      .map((item) => ({
        name: item.displayName.trim() || item.receiptItemName,
        catalog_item_id: item.catalogItemId,
        category_key: item.categoryKey,
        unit: item.unit,
        quantity: item.quantity,
        price_cents: item.priceCents,
        classification: item.classification,
        suggested_owner: item.suggestedOwner,
      })),
    shopping_list_match_ids: shoppingListMatchIds,
  };
}

export async function commitGroceryReceipt(input: {
  expenseInput: CreateExpenseInput;
  review: GroceryReceiptReview;
  supabaseClient?: typeof supabase;
}): Promise<GroceryReceiptCommitResult> {
  const payload = buildGroceryReceiptCommitPayload(input);
  const client = input.supabaseClient ?? supabase;
  const { data, error } = await client.functions.invoke('commit-grocery-receipt', {
    body: payload,
  });

  if (error) {
    throw new Error(error.message ?? 'Failed to commit grocery receipt');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as GroceryReceiptCommitResult;
}
