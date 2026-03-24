import type { ShoppingCategoryKey } from './shopping';

export type FoodCatalogSource = 'manual' | 'barcode' | 'receipt' | 'recipe' | 'ai';
export type InventoryUnit =
  | 'count'
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'oz'
  | 'lb'
  | 'package'
  | 'bottle'
  | 'can'
  | 'box';
export type InventoryEventSource =
  | 'manual_adjustment'
  | 'purchase'
  | 'consumption'
  | 'waste'
  | 'recipe_cook'
  | 'receipt_commit'
  | 'pantry_photo_review'
  | 'restock_generation';
export type InventoryAlertType = 'low_stock' | 'expiring_soon' | 'out_of_stock';
export type InventoryAlertStatus = 'open' | 'dismissed' | 'resolved';

export interface FoodCatalogItem {
  id: string;
  householdId: string | null;
  canonicalName: string;
  displayName: string;
  normalizedName: string;
  barcode: string | null;
  category: ShoppingCategoryKey;
  defaultUnit: InventoryUnit;
  synonyms: string[];
  source: FoodCatalogSource;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  householdId: string;
  catalogItemId: string;
  quantityOnHand: number;
  unit: InventoryUnit;
  minimumQuantity: number | null;
  preferredReorderQuantity: number | null;
  storageLocation: string | null;
  lastCountedAt: string | null;
  lastRestockedAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryEvent {
  id: string;
  householdId: string;
  inventoryItemId: string;
  catalogItemId: string;
  sourceType: InventoryEventSource;
  quantityDelta: number;
  quantityAfter: number | null;
  unit: InventoryUnit;
  reason: string | null;
  sourceId: string | null;
  sourceRef: string | null;
  occurredAt: string;
  createdBy: string | null;
  metadata: Record<string, unknown> | null;
}

export interface InventoryAlert {
  id: string;
  householdId: string;
  inventoryItemId: string;
  catalogItemId: string;
  alertType: InventoryAlertType;
  status: InventoryAlertStatus;
  thresholdQuantity: number | null;
  currentQuantity: number | null;
  triggeredByEventId: string | null;
  title: string;
  message: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
