import type { ShoppingCategoryKey } from '@/types/shopping';

interface MealEntryDemandInput {
  recipeId: string;
  servingsPlanned: number;
}

interface RecipeDemandIngredient {
  catalogItemId: string | null;
  title: string;
  quantity: number | null;
  unit: string | null;
  category: ShoppingCategoryKey;
}

interface RecipeDemandInput {
  id: string;
  servings: number | null;
  ingredients: RecipeDemandIngredient[];
}

interface InventorySnapshotRow {
  catalogItemId: string;
  quantityOnHand: number;
  unit: string;
}

export interface PantryDemandRow {
  catalogItemId: string;
  title: string;
  category: ShoppingCategoryKey;
  neededQuantity: number;
  unit: string;
}

export interface PantryDiffRow extends PantryDemandRow {
  onHandQuantity: number;
  missingQuantity: number;
}

function roundQuantity(value: number): number {
  return Number(value.toFixed(3));
}

export function rollupMealPlanDemand(input: {
  mealEntries: MealEntryDemandInput[];
  recipes: RecipeDemandInput[];
}): PantryDemandRow[] {
  const recipesById = new Map(input.recipes.map((recipe) => [recipe.id, recipe]));
  const demand = new Map<string, PantryDemandRow>();

  for (const mealEntry of input.mealEntries) {
    const recipe = recipesById.get(mealEntry.recipeId);
    if (!recipe) {
      continue;
    }

    const scale = recipe.servings && recipe.servings > 0 ? mealEntry.servingsPlanned / recipe.servings : 1;

    for (const ingredient of recipe.ingredients) {
      if (!ingredient.catalogItemId || ingredient.quantity === null || ingredient.unit === null) {
        continue;
      }

      const key = `${ingredient.catalogItemId}:${ingredient.unit}`;
      const existing = demand.get(key);
      const neededQuantity = roundQuantity((existing?.neededQuantity ?? 0) + ingredient.quantity * scale);

      demand.set(key, {
        catalogItemId: ingredient.catalogItemId,
        title: ingredient.title,
        category: ingredient.category,
        unit: ingredient.unit,
        neededQuantity,
      });
    }
  }

  return [...demand.values()];
}

export function buildPantryDiff(input: {
  inventory: InventorySnapshotRow[];
  demand: PantryDemandRow[];
}): PantryDiffRow[] {
  const inventoryByKey = new Map(
    input.inventory.map((item) => [`${item.catalogItemId}:${item.unit}`, roundQuantity(item.quantityOnHand)])
  );

  return input.demand
    .map((row) => {
      const onHandQuantity = inventoryByKey.get(`${row.catalogItemId}:${row.unit}`) ?? 0;

      return {
        ...row,
        onHandQuantity,
        missingQuantity: roundQuantity(Math.max(row.neededQuantity - onHandQuantity, 0)),
      };
    });
}

export function buildCookedMealInventoryEvents(input: {
  mealPlanEntryId: string;
  recipeId: string;
  servingsPlanned: number;
  recipeServings: number | null;
  ingredients: Array<{
    catalogItemId: string | null;
    quantity: number | null;
    unit: string | null;
  }>;
}): Array<{
  mealPlanEntryId: string;
  recipeId: string;
  catalogItemId: string;
  quantityDelta: number;
  unit: string;
  sourceType: 'meal_cooked';
}> {
  const scale =
    input.recipeServings && input.recipeServings > 0 ? input.servingsPlanned / input.recipeServings : 1;

  return input.ingredients
    .filter((ingredient): ingredient is { catalogItemId: string; quantity: number; unit: string } => {
      return Boolean(ingredient.catalogItemId && ingredient.quantity !== null && ingredient.unit);
    })
    .map((ingredient) => ({
      mealPlanEntryId: input.mealPlanEntryId,
      recipeId: input.recipeId,
      catalogItemId: ingredient.catalogItemId,
      quantityDelta: roundQuantity(ingredient.quantity * scale * -1),
      unit: ingredient.unit,
      sourceType: 'meal_cooked',
    }));
}
