import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveCanonicalFoodReference } from '@/lib/foodNormalization';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import type { FoodCatalogItem, InventoryAlert, InventoryEvent, InventoryEventSource, InventoryItem, InventoryUnit } from '@/types/inventory';
import type { ShoppingCategoryKey } from '@/types/shopping';
import { useFoodRealtime } from './useFoodRealtime';

interface FoodCatalogRow {
  id: string;
  household_id: string | null;
  canonical_name: string;
  display_name: string;
  normalized_name: string;
  barcode: string | null;
  category_key: ShoppingCategoryKey;
  default_unit: InventoryUnit;
  synonyms: string[] | null;
  source: FoodCatalogItem['source'];
  created_at: string;
  updated_at: string;
}

interface InventoryItemRow {
  id: string;
  household_id: string;
  catalog_item_id: string;
  quantity_on_hand: number | string;
  unit: InventoryUnit;
  minimum_quantity: number | string | null;
  preferred_reorder_quantity: number | string | null;
  storage_location: string | null;
  last_counted_at: string | null;
  last_restocked_at: string | null;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface InventoryEventRow {
  id: string;
  household_id: string;
  inventory_item_id: string;
  catalog_item_id: string;
  source_type: InventoryEventSource;
  delta_quantity: number | string;
  quantity_after: number | string | null;
  unit: InventoryUnit;
  reason: string | null;
  source_id: string | null;
  source_ref: string | null;
  occurred_at: string;
  created_by: string | null;
  metadata: Record<string, unknown> | null;
}

interface InventoryAlertRow {
  id: string;
  household_id: string;
  inventory_item_id: string;
  catalog_item_id: string;
  alert_type: InventoryAlert['alertType'];
  status: InventoryAlert['status'];
  threshold_quantity: number | string | null;
  current_quantity: number | string | null;
  triggered_by_event_id: string | null;
  title: string;
  message: string | null;
  created_at: string;
  resolved_at: string | null;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapFoodCatalogItem(row: FoodCatalogRow): FoodCatalogItem {
  return {
    id: row.id,
    householdId: row.household_id,
    canonicalName: row.canonical_name,
    displayName: row.display_name,
    normalizedName: row.normalized_name,
    barcode: row.barcode,
    category: row.category_key,
    defaultUnit: row.default_unit,
    synonyms: row.synonyms ?? [],
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInventoryItem(row: InventoryItemRow): InventoryItem {
  return {
    id: row.id,
    householdId: row.household_id,
    catalogItemId: row.catalog_item_id,
    quantityOnHand: toNumber(row.quantity_on_hand) ?? 0,
    unit: row.unit,
    minimumQuantity: toNumber(row.minimum_quantity),
    preferredReorderQuantity: toNumber(row.preferred_reorder_quantity),
    storageLocation: row.storage_location,
    lastCountedAt: row.last_counted_at,
    lastRestockedAt: row.last_restocked_at,
    expiresAt: row.expires_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInventoryEvent(row: InventoryEventRow): InventoryEvent {
  return {
    id: row.id,
    householdId: row.household_id,
    inventoryItemId: row.inventory_item_id,
    catalogItemId: row.catalog_item_id,
    sourceType: row.source_type,
    quantityDelta: toNumber(row.delta_quantity) ?? 0,
    quantityAfter: toNumber(row.quantity_after),
    unit: row.unit,
    reason: row.reason,
    sourceId: row.source_id,
    sourceRef: row.source_ref,
    occurredAt: row.occurred_at,
    createdBy: row.created_by,
    metadata: row.metadata,
  };
}

function mapInventoryAlert(row: InventoryAlertRow): InventoryAlert {
  return {
    id: row.id,
    householdId: row.household_id,
    inventoryItemId: row.inventory_item_id,
    catalogItemId: row.catalog_item_id,
    alertType: row.alert_type,
    status: row.status,
    thresholdQuantity: toNumber(row.threshold_quantity),
    currentQuantity: toNumber(row.current_quantity),
    triggeredByEventId: row.triggered_by_event_id,
    title: row.title,
    message: row.message,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

export function findCatalogItemMatch(
  catalog: FoodCatalogItem[],
  input: { name: string; barcode?: string | null; unit?: string | null; category?: string | null }
) {
  return resolveCanonicalFoodReference({
    rawName: input.name,
    rawUnit: input.unit ?? null,
    rawCategory: input.category ?? null,
    barcode: input.barcode ?? null,
    catalog,
  });
}

export function useInventory() {
  const [catalogItems, setCatalogItems] = useState<FoodCatalogItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryEvents, setInventoryEvents] = useState<InventoryEvent[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const user = useAuthStore((state) => state.user);

  const loadInventory = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId) {
      setCatalogItems([]);
      setInventoryItems([]);
      setInventoryEvents([]);
      setAlerts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [catalogResult, inventoryResult, eventsResult, alertsResult] = await Promise.all([
        supabase
          .from('food_catalog_items')
          .select('*')
          .or(`household_id.eq.${activeHouseholdId},household_id.is.null`)
          .order('display_name', { ascending: true }),
        supabase
          .from('inventory_items')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('updated_at', { ascending: false }),
        supabase
          .from('inventory_events')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('occurred_at', { ascending: false })
          .limit(100),
        supabase
          .from('inventory_alerts')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('created_at', { ascending: false }),
      ]);

      if (catalogResult.error) throw catalogResult.error;
      if (inventoryResult.error) throw inventoryResult.error;
      if (eventsResult.error) throw eventsResult.error;
      if (alertsResult.error) throw alertsResult.error;

      setCatalogItems(((catalogResult.data ?? []) as FoodCatalogRow[]).map(mapFoodCatalogItem));
      setInventoryItems(((inventoryResult.data ?? []) as InventoryItemRow[]).map(mapInventoryItem));
      setInventoryEvents(((eventsResult.data ?? []) as InventoryEventRow[]).map(mapInventoryEvent));
      setAlerts(((alertsResult.data ?? []) as InventoryAlertRow[]).map(mapInventoryAlert));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useFoodRealtime(activeHouseholdId, loadInventory);

  const resolveCatalogItem = useCallback(async (input: {
    name: string;
    barcode?: string | null;
    category?: string | null;
    unit?: string | null;
  }) => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const resolved = findCatalogItemMatch(catalogItems, input);
    if (resolved.catalogItemId) {
      return catalogItems.find((item) => item.id === resolved.catalogItemId) ?? null;
    }

    const { data, error: insertError } = await supabase
      .from('food_catalog_items')
      .insert({
        household_id: activeHouseholdId,
        canonical_name: resolved.canonicalName,
        display_name: resolved.displayName,
        normalized_name: resolved.normalizedName,
        barcode: input.barcode ?? null,
        category_key: resolved.categoryKey,
        aisle_key: resolved.aisleKey,
        default_unit: resolved.unit,
        synonyms: [],
        source: input.barcode ? 'barcode' : 'manual',
        created_by: user.id,
      })
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    await loadInventory();
    return mapFoodCatalogItem(data as FoodCatalogRow);
  }, [activeHouseholdId, catalogItems, loadInventory, user]);

  const adjustStock = useCallback(async (input: {
    catalogItemId: string;
    quantityDelta: number;
    unit: InventoryUnit;
    sourceType?: InventoryEventSource;
    reason?: string | null;
    sourceId?: string | null;
    sourceRef?: string | null;
    metadata?: Record<string, unknown> | null;
    minimumQuantity?: number | null;
    preferredReorderQuantity?: number | null;
    storageLocation?: string | null;
    notes?: string | null;
    occurredAt?: string;
  }) => {
    if (!activeHouseholdId) {
      throw new Error('No active household');
    }

    const { error: rpcError } = await supabase.rpc('upsert_inventory_event', {
      p_household_id: activeHouseholdId,
      p_catalog_item_id: input.catalogItemId,
      p_delta_quantity: input.quantityDelta,
      p_unit: input.unit,
      p_source_type: input.sourceType ?? 'manual_adjustment',
      p_reason: input.reason ?? null,
      p_source_id: input.sourceId ?? null,
      p_source_ref: input.sourceRef ?? null,
      p_metadata: input.metadata ?? null,
      p_minimum_quantity: input.minimumQuantity ?? null,
      p_preferred_reorder_quantity: input.preferredReorderQuantity ?? null,
      p_storage_location: input.storageLocation ?? null,
      p_notes: input.notes ?? null,
      p_occurred_at: input.occurredAt ?? new Date().toISOString(),
    });

    if (rpcError) {
      throw rpcError;
    }

    await loadInventory();
  }, [activeHouseholdId, loadInventory]);

  const updateThreshold = useCallback(async (input: {
    catalogItemId: string;
    unit: InventoryUnit;
    minimumQuantity: number | null;
    preferredReorderQuantity?: number | null;
    storageLocation?: string | null;
    notes?: string | null;
  }) => {
    await adjustStock({
      catalogItemId: input.catalogItemId,
      quantityDelta: 0,
      unit: input.unit,
      minimumQuantity: input.minimumQuantity,
      preferredReorderQuantity: input.preferredReorderQuantity ?? null,
      storageLocation: input.storageLocation ?? null,
      notes: input.notes ?? null,
    });
  }, [adjustStock]);

  const dismissAlert = useCallback(async (alertId: string): Promise<void> => {
    const { error: updateError } = await supabase
      .from('inventory_alerts')
      .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
      .eq('id', alertId);

    if (updateError) {
      throw updateError;
    }

    await loadInventory();
  }, [loadInventory]);

  const lowStockAlerts = useMemo(
    () => alerts.filter((alert) => alert.status === 'open' && ['low_stock', 'out_of_stock'].includes(alert.alertType)),
    [alerts]
  );

  return {
    catalogItems,
    inventoryItems,
    inventoryEvents,
    alerts,
    lowStockAlerts,
    loading,
    error,
    loadInventory,
    resolveCatalogItem,
    adjustStock,
    updateThreshold,
    dismissAlert,
  };
}
