import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import type { GeneratedRestockMetadata, ShoppingCategoryKey, ShoppingList, ShoppingListItem, ShoppingListSource } from '@/types/shopping';
import { useFoodRealtime } from './useFoodRealtime';

const SHOPPING_CATEGORY_ORDER: ShoppingCategoryKey[] = [
  'produce',
  'dairy',
  'meat_seafood',
  'bakery',
  'frozen',
  'pantry',
  'beverages',
  'snacks',
  'household',
  'personal_care',
  'other',
];

interface ShoppingListRow {
  id: string;
  household_id: string;
  title: string;
  notes: string | null;
  source: ShoppingListSource;
  status: 'active' | 'archived';
  created_by: string;
  recipe_id: string | null;
  meal_plan_entry_id: string | null;
  receipt_review_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ShoppingListItemRow {
  id: string;
  list_id: string;
  household_id: string;
  title: string;
  note: string | null;
  category_key: ShoppingCategoryKey;
  quantity: number | string | null;
  unit: string | null;
  status: 'pending' | 'purchased' | 'skipped';
  source: ShoppingListSource;
  catalog_item_id: string | null;
  recipe_id: string | null;
  meal_plan_entry_id: string | null;
  inventory_item_id: string | null;
  minimum_quantity: number | string | null;
  generated_restock: GeneratedRestockMetadata | null;
  checked_off_by: string | null;
  checked_off_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ShoppingListInput {
  title: string;
  notes?: string | null;
  source?: ShoppingListSource;
  recipeId?: string | null;
  mealPlanEntryId?: string | null;
  receiptReviewId?: string | null;
}

interface ShoppingListItemInput {
  listId: string;
  title: string;
  note?: string | null;
  category?: ShoppingCategoryKey;
  quantity?: number | null;
  unit?: string | null;
  source?: ShoppingListSource;
  catalogItemId?: string | null;
  recipeId?: string | null;
  mealPlanEntryId?: string | null;
  inventoryItemId?: string | null;
  minimumQuantity?: number | null;
  generatedRestock?: GeneratedRestockMetadata | null;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapShoppingList(row: ShoppingListRow): ShoppingList {
  return {
    id: row.id,
    householdId: row.household_id,
    title: row.title,
    notes: row.notes,
    source: row.source,
    status: row.status,
    createdBy: row.created_by,
    recipeId: row.recipe_id,
    mealPlanEntryId: row.meal_plan_entry_id,
    receiptReviewId: row.receipt_review_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapShoppingListItem(row: ShoppingListItemRow): ShoppingListItem {
  return {
    id: row.id,
    listId: row.list_id,
    householdId: row.household_id,
    title: row.title,
    note: row.note,
    category: row.category_key,
    quantity: toNumber(row.quantity),
    unit: row.unit,
    status: row.status,
    source: row.source,
    catalogItemId: row.catalog_item_id,
    recipeId: row.recipe_id,
    mealPlanEntryId: row.meal_plan_entry_id,
    inventoryItemId: row.inventory_item_id,
    minimumQuantity: toNumber(row.minimum_quantity),
    generatedRestock: row.generated_restock,
    checkedOffBy: row.checked_off_by,
    checkedOffAt: row.checked_off_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function sortShoppingItemsForDisplay(items: ShoppingListItem[]): ShoppingListItem[] {
  return [...items].sort((left, right) => {
    const leftChecked = Boolean(left.checkedOffAt);
    const rightChecked = Boolean(right.checkedOffAt);

    if (leftChecked !== rightChecked) {
      return leftChecked ? 1 : -1;
    }

    const leftCategoryIndex = SHOPPING_CATEGORY_ORDER.indexOf(left.category);
    const rightCategoryIndex = SHOPPING_CATEGORY_ORDER.indexOf(right.category);
    if (leftCategoryIndex !== rightCategoryIndex) {
      return leftCategoryIndex - rightCategoryIndex;
    }

    if (leftChecked && rightChecked) {
      return new Date(right.checkedOffAt ?? 0).getTime() - new Date(left.checkedOffAt ?? 0).getTime();
    }

    return left.title.localeCompare(right.title);
  });
}

export function groupShoppingItemsByCategory(items: ShoppingListItem[]) {
  const groups = new Map<ShoppingCategoryKey, ShoppingListItem[]>();

  for (const item of sortShoppingItemsForDisplay(items)) {
    const bucket = groups.get(item.category) ?? [];
    bucket.push(item);
    groups.set(item.category, bucket);
  }

  return SHOPPING_CATEGORY_ORDER
    .map((category) => ({
      category,
      items: groups.get(category) ?? [],
    }))
    .filter((group) => group.items.length > 0);
}

export function buildGeneratedRestockMap(items: ShoppingListItem[]) {
  return items.reduce<Record<string, ShoppingListItem>>((accumulator, item) => {
    const key = item.generatedRestock?.idempotencyKey;
    if (key && !accumulator[key]) {
      accumulator[key] = item;
    }
    return accumulator;
  }, {});
}

export function resolveActiveShoppingListId(lists: ShoppingList[], currentActiveListId: string | null) {
  if (currentActiveListId && lists.some((list) => list.id === currentActiveListId && list.status === 'active')) {
    return currentActiveListId;
  }

  return lists.find((list) => list.status === 'active')?.id ?? null;
}

export function useShopping() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const user = useAuthStore((state) => state.user);

  const loadShopping = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId) {
      setLists([]);
      setItems([]);
      setActiveListId(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [listsResult, itemsResult] = await Promise.all([
        supabase
          .from('shopping_lists')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('created_at', { ascending: false }),
        supabase
          .from('shopping_list_items')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('updated_at', { ascending: false }),
      ]);

      if (listsResult.error) throw listsResult.error;
      if (itemsResult.error) throw itemsResult.error;

      const nextLists = ((listsResult.data ?? []) as ShoppingListRow[]).map(mapShoppingList);
      const nextItems = ((itemsResult.data ?? []) as ShoppingListItemRow[]).map(mapShoppingListItem);

      setLists(nextLists);
      setItems(nextItems);
      setActiveListId((current) => resolveActiveShoppingListId(nextLists, current));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shopping lists');
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  useEffect(() => {
    loadShopping();
  }, [loadShopping]);

  useFoodRealtime(activeHouseholdId, loadShopping);

  const createList = useCallback(async (input: ShoppingListInput): Promise<string> => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const { data, error: insertError } = await supabase
      .from('shopping_lists')
      .insert({
        household_id: activeHouseholdId,
        title: input.title,
        notes: input.notes ?? null,
        source: input.source ?? 'manual',
        status: 'active',
        created_by: user.id,
        recipe_id: input.recipeId ?? null,
        meal_plan_entry_id: input.mealPlanEntryId ?? null,
        receipt_review_id: input.receiptReviewId ?? null,
      })
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    const nextListId = (data as ShoppingListRow).id;
    await loadShopping();
    setActiveListId(nextListId);
    return nextListId;
  }, [activeHouseholdId, loadShopping, user]);

  const updateList = useCallback(async (
    listId: string,
    updates: Partial<ShoppingListInput> & { status?: ShoppingList['status'] }
  ): Promise<void> => {
    const { error: updateError } = await supabase
      .from('shopping_lists')
      .update({
        title: updates.title,
        notes: updates.notes,
        source: updates.source,
        status: updates.status,
        recipe_id: updates.recipeId,
        meal_plan_entry_id: updates.mealPlanEntryId,
        receipt_review_id: updates.receiptReviewId,
      })
      .eq('id', listId);

    if (updateError) {
      throw updateError;
    }

    await loadShopping();
  }, [loadShopping]);

  const archiveList = useCallback(async (listId: string): Promise<void> => {
    await updateList(listId, { status: 'archived' });
  }, [updateList]);

  const createItem = useCallback(async (input: ShoppingListItemInput): Promise<void> => {
    if (!activeHouseholdId) {
      throw new Error('No active household');
    }

    const { error: insertError } = await supabase.from('shopping_list_items').insert({
      list_id: input.listId,
      household_id: activeHouseholdId,
      title: input.title,
      note: input.note ?? null,
      category_key: input.category ?? 'other',
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      status: 'pending',
      source: input.source ?? 'manual',
      catalog_item_id: input.catalogItemId ?? null,
      recipe_id: input.recipeId ?? null,
      meal_plan_entry_id: input.mealPlanEntryId ?? null,
      inventory_item_id: input.inventoryItemId ?? null,
      minimum_quantity: input.minimumQuantity ?? null,
      generated_restock: input.generatedRestock ?? null,
    });

    if (insertError) {
      throw insertError;
    }

    await loadShopping();
  }, [activeHouseholdId, loadShopping]);

  const updateItem = useCallback(async (
    itemId: string,
    updates: Partial<Omit<ShoppingListItemInput, 'listId'>>
  ): Promise<void> => {
    const { error: updateError } = await supabase
      .from('shopping_list_items')
      .update({
        title: updates.title,
        note: updates.note,
        category_key: updates.category,
        quantity: updates.quantity,
        unit: updates.unit,
        source: updates.source,
        catalog_item_id: updates.catalogItemId,
        recipe_id: updates.recipeId,
        meal_plan_entry_id: updates.mealPlanEntryId,
        inventory_item_id: updates.inventoryItemId,
        minimum_quantity: updates.minimumQuantity,
        generated_restock: updates.generatedRestock,
      })
      .eq('id', itemId);

    if (updateError) {
      throw updateError;
    }

    await loadShopping();
  }, [loadShopping]);

  const deleteItem = useCallback(async (itemId: string): Promise<void> => {
    const { error: deleteError } = await supabase.from('shopping_list_items').delete().eq('id', itemId);
    if (deleteError) {
      throw deleteError;
    }

    await loadShopping();
  }, [loadShopping]);

  const toggleItemChecked = useCallback(async (itemId: string, checked: boolean): Promise<void> => {
    const { error: updateError } = await supabase
      .from('shopping_list_items')
      .update({
        status: checked ? 'purchased' : 'pending',
        checked_off_at: checked ? new Date().toISOString() : null,
        checked_off_by: checked ? user?.id ?? null : null,
      })
      .eq('id', itemId);

    if (updateError) {
      throw updateError;
    }

    await loadShopping();
  }, [loadShopping, user]);

  const activeList = useMemo(
    () => lists.find((list) => list.id === activeListId) ?? null,
    [activeListId, lists]
  );
  const activeListItems = useMemo(
    () => sortShoppingItemsForDisplay(items.filter((item) => item.listId === activeListId)),
    [activeListId, items]
  );
  const groupedItems = useMemo(() => groupShoppingItemsByCategory(activeListItems), [activeListItems]);
  const generatedRestocks = useMemo(() => buildGeneratedRestockMap(activeListItems), [activeListItems]);

  return {
    lists,
    items,
    activeListId,
    activeList,
    activeListItems,
    groupedItems,
    generatedRestocks,
    loading,
    error,
    setActiveListId,
    loadShopping,
    createList,
    updateList,
    archiveList,
    createItem,
    updateItem,
    deleteItem,
    toggleItemChecked,
  };
}
