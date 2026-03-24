import {
  DEFAULT_AISLE_BY_CATEGORY,
  normalizeUnit,
  resolveCanonicalFoodReference,
  stagePantryPhotoReview,
} from '@/lib/foodNormalization';
import { buildCookedMealInventoryEvents, buildPantryDiff, rollupMealPlanDemand } from '@/lib/pantryDiff';

describe('food core helpers', () => {
  it('groups shopping, pantry, recipes, and receipt rows around canonical catalog items', () => {
    const milk = {
      id: 'milk',
      canonicalName: 'milk',
      displayName: 'Milk',
      normalizedName: 'milk',
      barcode: '012345678905',
      category: 'dairy' as const,
      defaultUnit: 'l' as const,
      synonyms: ['whole milk', '2 percent milk', '2% milk'],
      source: 'manual' as const,
      householdId: 'house-1',
      createdAt: '2026-03-24T00:00:00.000Z',
      updatedAt: '2026-03-24T00:00:00.000Z',
    };

    const resolvedByAlias = resolveCanonicalFoodReference({
      rawName: 'Whole Milk 2%',
      rawCategory: 'Dairy + Eggs',
      rawUnit: 'litres',
      catalog: [milk],
    });

    const resolvedByBarcode = resolveCanonicalFoodReference({
      rawName: 'store brand milk',
      rawCategory: 'fridge',
      rawUnit: 'L',
      barcode: '012345678905',
      catalog: [milk],
    });

    expect(resolvedByAlias.catalogItemId).toBe('milk');
    expect(resolvedByAlias.canonicalName).toBe('milk');
    expect(resolvedByAlias.categoryKey).toBe('dairy');
    expect(resolvedByAlias.aisleKey).toBe(DEFAULT_AISLE_BY_CATEGORY.dairy);
    expect(resolvedByAlias.unit).toBe('l');
    expect(resolvedByBarcode.catalogItemId).toBe('milk');
    expect(normalizeUnit('packs')).toBe('package');
  });

  it('stages pantry photo detections for manual review before inventory changes', () => {
    const staged = stagePantryPhotoReview({
      detections: [
        { label: 'Bananas', confidence: 0.93, quantity: 6, unit: 'count' },
        { label: 'Mystery Sauce', confidence: 0.41, quantity: 1, unit: 'bottle' },
      ],
      catalog: [
        {
          id: 'banana',
          canonicalName: 'banana',
          displayName: 'Bananas',
          normalizedName: 'banana',
          barcode: null,
          category: 'produce',
          defaultUnit: 'count',
          synonyms: ['bananas'],
          source: 'manual',
          householdId: 'house-1',
          createdAt: '2026-03-24T00:00:00.000Z',
          updatedAt: '2026-03-24T00:00:00.000Z',
        },
      ],
    });

    expect(staged[0]).toMatchObject({
      status: 'matched',
      catalogItemId: 'banana',
      normalizedName: 'banana',
      aisleKey: DEFAULT_AISLE_BY_CATEGORY.produce,
    });
    expect(staged[1]).toMatchObject({
      status: 'needs_review',
      catalogItemId: null,
      normalizedName: 'mystery sauce',
    });
  });

  it('calculates pantry deficits and cooked-meal deductions from normalized demand', () => {
    const demand = rollupMealPlanDemand({
      mealEntries: [
        { recipeId: 'recipe-1', servingsPlanned: 4 },
        { recipeId: 'recipe-2', servingsPlanned: 2 },
      ],
      recipes: [
        {
          id: 'recipe-1',
          servings: 2,
          ingredients: [
            { catalogItemId: 'milk', title: 'Milk', quantity: 1, unit: 'l', category: 'dairy' as const },
            { catalogItemId: 'egg', title: 'Eggs', quantity: 2, unit: 'count', category: 'dairy' as const },
          ],
        },
        {
          id: 'recipe-2',
          servings: 2,
          ingredients: [
            { catalogItemId: 'milk', title: 'Milk', quantity: 0.5, unit: 'l', category: 'dairy' as const },
            { catalogItemId: 'egg', title: 'Eggs', quantity: 4, unit: 'count', category: 'dairy' as const },
          ],
        },
      ],
    });

    const diff = buildPantryDiff({
      inventory: [
        { catalogItemId: 'milk', quantityOnHand: 1.2, unit: 'l' },
        { catalogItemId: 'egg', quantityOnHand: 3, unit: 'count' },
      ],
      demand,
    });

    expect(diff).toEqual([
      expect.objectContaining({
        catalogItemId: 'milk',
        neededQuantity: 2.5,
        onHandQuantity: 1.2,
        missingQuantity: 1.3,
      }),
      expect.objectContaining({
        catalogItemId: 'egg',
        neededQuantity: 8,
        onHandQuantity: 3,
        missingQuantity: 5,
      }),
    ]);

    expect(
      buildCookedMealInventoryEvents({
        mealPlanEntryId: 'meal-1',
        recipeId: 'recipe-1',
        servingsPlanned: 4,
        recipeServings: 2,
        ingredients: [
          { catalogItemId: 'milk', quantity: 1, unit: 'l' },
          { catalogItemId: 'egg', quantity: 2, unit: 'count' },
        ],
      })
    ).toEqual([
      expect.objectContaining({
        catalogItemId: 'milk',
        quantityDelta: -2,
        sourceType: 'meal_cooked',
      }),
      expect.objectContaining({
        catalogItemId: 'egg',
        quantityDelta: -4,
        sourceType: 'meal_cooked',
      }),
    ]);
  });
});
