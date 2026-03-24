import type { FoodCatalogItem, InventoryUnit } from '@/types/inventory';
import type { ShoppingCategoryKey } from '@/types/shopping';

const CATEGORY_ALIASES: Record<string, ShoppingCategoryKey> = {
  bakery: 'bakery',
  beverage: 'beverages',
  beverages: 'beverages',
  dairy: 'dairy',
  eggs: 'dairy',
  freezer: 'frozen',
  frozen: 'frozen',
  fridge: 'dairy',
  grocery: 'pantry',
  household: 'household',
  meat: 'meat_seafood',
  pantry: 'pantry',
  personal: 'personal_care',
  produce: 'produce',
  protein: 'meat_seafood',
  seafood: 'meat_seafood',
  shelf: 'pantry',
  snack: 'snacks',
  snacks: 'snacks',
};

const UNIT_ALIASES: Record<string, InventoryUnit> = {
  bottle: 'bottle',
  bottles: 'bottle',
  box: 'box',
  boxes: 'box',
  can: 'can',
  cans: 'can',
  count: 'count',
  each: 'count',
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  l: 'l',
  lb: 'lb',
  lbs: 'lb',
  litre: 'l',
  litres: 'l',
  liter: 'l',
  liters: 'l',
  ml: 'ml',
  ounce: 'oz',
  ounces: 'oz',
  oz: 'oz',
  pack: 'package',
  packs: 'package',
  package: 'package',
  packages: 'package',
  unit: 'count',
};

export const DEFAULT_AISLE_BY_CATEGORY: Record<ShoppingCategoryKey, string> = {
  bakery: 'bakery',
  beverages: 'beverages',
  dairy: 'refrigerated',
  frozen: 'frozen',
  household: 'household',
  meat_seafood: 'meat-seafood',
  other: 'misc',
  pantry: 'pantry',
  personal_care: 'personal-care',
  produce: 'produce',
  snacks: 'snacks',
};

export interface CanonicalFoodResolution {
  catalogItemId: string | null;
  canonicalName: string;
  normalizedName: string;
  displayName: string;
  categoryKey: ShoppingCategoryKey;
  aisleKey: string;
  unit: InventoryUnit;
}

export interface PantryPhotoDetection {
  label: string;
  confidence: number;
  quantity: number | null;
  unit: string | null;
}

export interface StagedPantryPhotoItem extends CanonicalFoodResolution {
  confidence: number;
  quantity: number | null;
  rawLabel: string;
  status: 'matched' | 'needs_review';
}

function cleanToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[%/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeFoodName(value: string): string {
  return cleanToken(value);
}

export function normalizeUnit(value: string | null | undefined): InventoryUnit {
  const normalized = cleanToken(value ?? '');
  return UNIT_ALIASES[normalized] ?? 'count';
}

export function normalizeCategoryKey(value: string | null | undefined): ShoppingCategoryKey {
  const normalized = cleanToken(value ?? '');

  if (normalized in CATEGORY_ALIASES) {
    return CATEGORY_ALIASES[normalized];
  }

  const tokens = normalized.split(' ');
  for (const token of tokens) {
    if (token in CATEGORY_ALIASES) {
      return CATEGORY_ALIASES[token];
    }
  }

  return 'other';
}

function matchesCatalogItem(catalogItem: FoodCatalogItem, normalizedName: string, barcode?: string): boolean {
  if (barcode && catalogItem.barcode && catalogItem.barcode === barcode) {
    return true;
  }

  if (catalogItem.normalizedName === normalizedName) {
    return true;
  }

  return catalogItem.synonyms.some((alias) => cleanToken(alias) === normalizedName);
}

export function resolveCanonicalFoodReference(input: {
  rawName: string;
  rawCategory?: string | null;
  rawUnit?: string | null;
  barcode?: string | null;
  catalog?: FoodCatalogItem[];
}): CanonicalFoodResolution {
  const normalizedName = normalizeFoodName(input.rawName);
  const normalizedCategory = normalizeCategoryKey(input.rawCategory);
  const normalizedUnit = normalizeUnit(input.rawUnit);
  const matchedItem = (input.catalog ?? []).find((item) =>
    matchesCatalogItem(item, normalizedName, input.barcode ?? undefined)
  );

  const categoryKey = matchedItem?.category ?? normalizedCategory;
  const canonicalName = matchedItem?.canonicalName ?? normalizedName;
  const displayName = matchedItem?.displayName ?? input.rawName.trim();

  return {
    catalogItemId: matchedItem?.id ?? null,
    canonicalName,
    normalizedName: matchedItem?.normalizedName ?? normalizedName,
    displayName,
    categoryKey,
    aisleKey: DEFAULT_AISLE_BY_CATEGORY[categoryKey],
    unit: matchedItem?.defaultUnit ?? normalizedUnit,
  };
}

export function stagePantryPhotoReview(input: {
  detections: PantryPhotoDetection[];
  catalog?: FoodCatalogItem[];
}): StagedPantryPhotoItem[] {
  return input.detections.map((detection) => {
    const resolved = resolveCanonicalFoodReference({
      rawName: detection.label,
      rawUnit: detection.unit,
      catalog: input.catalog,
    });

    return {
      ...resolved,
      confidence: detection.confidence,
      quantity: detection.quantity,
      rawLabel: detection.label,
      status: resolved.catalogItemId ? 'matched' : 'needs_review',
    };
  });
}
