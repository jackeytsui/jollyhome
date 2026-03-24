export type ShoppingCategoryKey =
  | 'produce'
  | 'dairy'
  | 'meat_seafood'
  | 'bakery'
  | 'frozen'
  | 'pantry'
  | 'beverages'
  | 'snacks'
  | 'household'
  | 'personal_care'
  | 'other';

export type ShoppingListSource = 'manual' | 'recipe' | 'restock' | 'meal_plan' | 'receipt_review';
export type ShoppingListStatus = 'active' | 'archived';
export type ShoppingListItemStatus = 'pending' | 'purchased' | 'skipped';

export interface GeneratedRestockMetadata {
  inventoryItemId: string | null;
  inventoryAlertId: string | null;
  inventoryEventId: string | null;
  sourceEventIds: string[];
  idempotencyKey: string;
  minimumQuantity: number | null;
  minQuantity?: number | null;
  onHandQuantity: number | null;
  suggestedPurchaseQuantity: number | null;
  generatedAt: string;
}

export interface ShoppingList {
  id: string;
  householdId: string;
  title: string;
  notes: string | null;
  source: ShoppingListSource;
  status: ShoppingListStatus;
  createdBy: string;
  recipeId: string | null;
  mealPlanEntryId: string | null;
  receiptReviewId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  listId: string;
  householdId: string;
  title: string;
  note: string | null;
  category: ShoppingCategoryKey;
  quantity: number | null;
  unit: string | null;
  status: ShoppingListItemStatus;
  source: ShoppingListSource;
  catalogItemId: string | null;
  recipeId: string | null;
  mealPlanEntryId: string | null;
  inventoryItemId: string | null;
  minimumQuantity: number | null;
  generatedRestock: GeneratedRestockMetadata | null;
  checkedOffBy: string | null;
  checkedOffAt: string | null;
  createdAt: string;
  updatedAt: string;
}
