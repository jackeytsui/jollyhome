import { resolveCanonicalFoodReference, stagePantryPhotoReview } from '@/lib/foodNormalization';
import { groupShoppingItemsByCategory } from '@/hooks/useShopping';
import type { FoodCatalogItem } from '@/types/inventory';

describe('shopping and supplies UI', () => {
  it('presents grouped catalog suggestions consistently across shopping and pantry flows', () => {
    const catalog: FoodCatalogItem[] = [
      {
        id: 'catalog-banana',
        householdId: 'household-1',
        canonicalName: 'banana',
        displayName: 'Bananas',
        normalizedName: 'banana',
        barcode: '111',
        category: 'produce',
        defaultUnit: 'count',
        synonyms: ['bananas'],
        source: 'manual',
        createdAt: '2026-03-24T00:00:00.000Z',
        updatedAt: '2026-03-24T00:00:00.000Z',
      },
      {
        id: 'catalog-milk',
        householdId: 'household-1',
        canonicalName: 'milk',
        displayName: 'Whole Milk',
        normalizedName: 'milk',
        barcode: '222',
        category: 'dairy',
        defaultUnit: 'bottle',
        synonyms: ['whole milk'],
        source: 'barcode',
        createdAt: '2026-03-24T00:00:00.000Z',
        updatedAt: '2026-03-24T00:00:00.000Z',
      },
    ];

    const pantryMatch = resolveCanonicalFoodReference({
      rawName: 'Whole Milk',
      rawUnit: 'bottle',
      catalog: [...catalog],
    });
    const shoppingMatch = resolveCanonicalFoodReference({
      rawName: 'Bananas',
      rawUnit: 'count',
      catalog: [...catalog],
    });

    expect(pantryMatch).toEqual(
      expect.objectContaining({
        catalogItemId: 'catalog-milk',
        categoryKey: 'dairy',
        unit: 'bottle',
      })
    );
    expect(shoppingMatch).toEqual(
      expect.objectContaining({
        catalogItemId: 'catalog-banana',
        categoryKey: 'produce',
      })
    );

    expect(
      groupShoppingItemsByCategory([
        {
          id: 'item-1',
          listId: 'list-1',
          householdId: 'household-1',
          title: 'Whole Milk',
          note: null,
          category: pantryMatch.categoryKey,
          quantity: 1,
          unit: pantryMatch.unit,
          status: 'pending',
          source: 'manual',
          catalogItemId: pantryMatch.catalogItemId,
          recipeId: null,
          mealPlanEntryId: null,
          inventoryItemId: null,
          minimumQuantity: null,
          generatedRestock: null,
          checkedOffBy: null,
          checkedOffAt: null,
          createdAt: '2026-03-24T00:00:00.000Z',
          updatedAt: '2026-03-24T00:00:00.000Z',
        },
        {
          id: 'item-2',
          listId: 'list-1',
          householdId: 'household-1',
          title: 'Bananas',
          note: null,
          category: shoppingMatch.categoryKey,
          quantity: 6,
          unit: shoppingMatch.unit,
          status: 'pending',
          source: 'manual',
          catalogItemId: shoppingMatch.catalogItemId,
          recipeId: null,
          mealPlanEntryId: null,
          inventoryItemId: null,
          minimumQuantity: null,
          generatedRestock: null,
          checkedOffBy: null,
          checkedOffAt: null,
          createdAt: '2026-03-24T00:00:00.000Z',
          updatedAt: '2026-03-24T00:00:00.000Z',
        },
      ]).map((group) => group.category)
    ).toEqual(['produce', 'dairy']);
  });

  it('keeps pantry-photo suggestions in manual review state before inventory writes', () => {
    const staged = stagePantryPhotoReview({
      detections: [
        { label: 'Greek Yogurt', confidence: 0.92, quantity: 1, unit: 'tub' },
        { label: 'Mystery Sauce', confidence: 0.44, quantity: 1, unit: 'bottle' },
      ],
      catalog: [
        {
          id: 'catalog-yogurt',
          householdId: 'household-1',
          canonicalName: 'greek yogurt',
          displayName: 'Greek Yogurt',
          normalizedName: 'greek yogurt',
          barcode: null,
          category: 'dairy',
          defaultUnit: 'count',
          synonyms: ['yogurt'],
          source: 'manual',
          createdAt: '2026-03-24T00:00:00.000Z',
          updatedAt: '2026-03-24T00:00:00.000Z',
        },
      ],
    });

    expect(staged).toEqual([
      expect.objectContaining({
        rawLabel: 'Greek Yogurt',
        status: 'matched',
        catalogItemId: 'catalog-yogurt',
      }),
      expect.objectContaining({
        rawLabel: 'Mystery Sauce',
        status: 'needs_review',
        catalogItemId: null,
      }),
    ]);
    expect(staged.every((item) => item.status === 'matched' || item.status === 'needs_review')).toBe(true);
  });
});
