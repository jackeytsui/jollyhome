import {
  buildRecommendation,
  buildPredictiveRestockSuggestions,
  rankMealRecommendations,
  bucketPrepTimeAvailability,
  buildMealPlannerInputs,
  buildMealSuggestionFeedback,
  buildSuggestionRationale,
  serializeMealPlannerPayload,
  scoreIngredientOverlap,
} from '@/lib/mealPlanning';

describe('food AI helpers', () => {
  it('builds attendance-aware planner inputs with dietary and prep-time context', () => {
    const planner = buildMealPlannerInputs({
      startDate: '2026-03-24',
      members: [
        { userId: 'u1', dietaryPreferences: ['vegetarian'] },
        { userId: 'u2', dietaryPreferences: ['gluten_free'] },
        { userId: 'u3', dietaryPreferences: [] },
      ],
      attendanceByDate: {
        '2026-03-24': ['u1', 'u2', 'u3'],
        '2026-03-25': ['u1'],
      },
      calendarLoadByDate: {
        '2026-03-24': 25,
        '2026-03-25': 95,
      },
      pantryItems: [{ catalogItemId: 'rice', quantityOnHand: 2, unit: 'kg' }],
      recipes: [
        {
          id: 'fried-rice',
          title: 'Fried Rice',
          source: 'manual',
          favorite: false,
          prepMinutes: 20,
          cookMinutes: 15,
          totalMinutes: 35,
          tags: ['quick', 'budget'],
          ingredients: [
            { catalogItemId: 'rice', quantity: 0.4, unit: 'kg' },
            { catalogItemId: 'egg', quantity: 4, unit: 'count' },
          ],
        },
      ],
    });

    expect(planner.days[0]).toMatchObject({
      date: '2026-03-24',
      attendanceMemberIds: ['u1', 'u2', 'u3'],
      servings: 3,
      prepTimeBucket: 'quick',
      dietaryPreferences: ['gluten_free', 'vegetarian'],
    });
    expect(planner.days[1]).toMatchObject({
      date: '2026-03-25',
      servings: 1,
      prepTimeBucket: 'project',
    });
    expect(planner.pantry).toHaveLength(1);
    expect(planner.history).toEqual([]);
    expect(serializeMealPlannerPayload(planner).days[0]?.attendanceMemberIds).toEqual(['u1', 'u2', 'u3']);
  });

  it('scores ingredient overlap to support waste-reducing suggestions', () => {
    expect(
      scoreIngredientOverlap(
        ['rice', 'egg', 'soy sauce'],
        ['egg', 'soy sauce', 'green onion', 'tofu']
      )
    ).toBeCloseTo(0.4, 5);
    expect(bucketPrepTimeAvailability(15)).toBe('quick');
    expect(bucketPrepTimeAvailability(50)).toBe('standard');
    expect(bucketPrepTimeAvailability(95)).toBe('project');
    expect(
      buildSuggestionRationale({
        attendanceMemberIds: ['u1', 'u2'],
        prepTimeBucket: 'quick',
        ingredientOverlap: 0.5,
        pantryMatchCount: 2,
      })
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/2 household members home/i),
        expect.stringMatching(/low-prep/i),
        expect.stringMatching(/50% ingredient overlap/i),
        expect.stringMatching(/uses 2 pantry items/i),
      ])
    );
  });

  it('builds feedback payloads for accept, swap, and regenerate suggestion outcomes', () => {
    expect(
      buildMealSuggestionFeedback({
        householdId: 'house-1',
        suggestionRunId: 'run-1',
        suggestionId: 'suggestion-1',
        action: 'accept',
        mealPlanEntryId: 'meal-1',
        createdBy: 'u1',
      })
    ).toMatchObject({
      householdId: 'house-1',
      suggestionRunId: 'run-1',
      suggestionId: 'suggestion-1',
      action: 'accept',
      mealPlanEntryId: 'meal-1',
      replacementSuggestionId: null,
    });

    expect(
      buildMealSuggestionFeedback({
        householdId: 'house-1',
        suggestionRunId: 'run-1',
        suggestionId: 'suggestion-1',
        replacementSuggestionId: 'suggestion-2',
        action: 'swap',
        recipeId: 'recipe-2',
        createdBy: 'u1',
      })
    ).toMatchObject({
      action: 'swap',
      replacementSuggestionId: 'suggestion-2',
      recipeId: 'recipe-2',
    });

    expect(
      buildMealSuggestionFeedback({
        householdId: 'house-1',
        suggestionRunId: 'run-1',
        suggestionId: null,
        action: 'regenerate',
        feedbackNote: 'Need a faster option',
        createdBy: 'u1',
      })
    ).toMatchObject({
      action: 'regenerate',
      feedbackNote: 'Need a faster option',
    });
  });

  it('builds predictive restock suggestions from usage trends and open alerts', () => {
    const predictions = buildPredictiveRestockSuggestions({
      inventoryItems: [
        {
          id: 'inventory-rice',
          householdId: 'house-1',
          catalogItemId: 'rice',
          quantityOnHand: 0.5,
          unit: 'kg',
          minimumQuantity: 1,
          preferredReorderQuantity: 3,
          storageLocation: null,
          lastCountedAt: null,
          lastRestockedAt: null,
          expiresAt: null,
          notes: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-24T00:00:00.000Z',
        },
      ],
      inventoryEvents: [
        {
          id: 'event-1',
          householdId: 'house-1',
          inventoryItemId: 'inventory-rice',
          catalogItemId: 'rice',
          sourceType: 'meal_cooked',
          quantityDelta: -0.8,
          quantityAfter: 1.2,
          unit: 'kg',
          reason: null,
          sourceId: null,
          sourceRef: null,
          occurredAt: '2026-03-24T00:00:00.000Z',
          createdBy: 'u1',
          metadata: null,
        },
        {
          id: 'event-2',
          householdId: 'house-1',
          inventoryItemId: 'inventory-rice',
          catalogItemId: 'rice',
          sourceType: 'meal_cooked',
          quantityDelta: -0.6,
          quantityAfter: 2,
          unit: 'kg',
          reason: null,
          sourceId: null,
          sourceRef: null,
          occurredAt: '2026-03-21T00:00:00.000Z',
          createdBy: 'u1',
          metadata: null,
        },
      ],
      alerts: [
        {
          id: 'alert-1',
          householdId: 'house-1',
          inventoryItemId: 'inventory-rice',
          catalogItemId: 'rice',
          alertType: 'low_stock',
          status: 'open',
          thresholdQuantity: 1,
          currentQuantity: 0.5,
          triggeredByEventId: 'event-1',
          title: 'Low stock',
          message: null,
          createdAt: '2026-03-24T00:00:00.000Z',
          resolvedAt: null,
        },
      ],
    });

    expect(predictions[0]).toMatchObject({
      catalogItemId: 'rice',
      inventoryItemId: 'inventory-rice',
      alertId: 'alert-1',
    });
    expect(predictions[0]?.suggestedQuantity).toBeGreaterThan(0);
  });

  it('ranks manual favorites with pantry fit and history while cooling down recent repeats', () => {
    const ranked = rankMealRecommendations({
      recipes: [
        {
          id: 'manual-curry',
          title: 'House Curry',
          source: 'manual',
          favorite: true,
          prepMinutes: 25,
          cookMinutes: 20,
          totalMinutes: 45,
          tags: ['favorite'],
          ingredients: [
            { catalogItemId: 'rice', quantity: 1, unit: 'kg' },
            { catalogItemId: 'coconut-milk', quantity: 1, unit: 'can' },
          ],
        },
        {
          id: 'recent-pasta',
          title: 'Creamy Pasta',
          source: 'manual',
          favorite: false,
          prepMinutes: 20,
          cookMinutes: 15,
          totalMinutes: 35,
          tags: [],
          ingredients: [{ catalogItemId: 'pasta', quantity: 1, unit: 'box' }],
        },
      ],
      pantryItems: [
        { catalogItemId: 'rice', quantityOnHand: 2, unit: 'kg' },
        { catalogItemId: 'coconut-milk', quantityOnHand: 2, unit: 'can' },
      ],
      history: [
        {
          recipeId: 'manual-curry',
          acceptedCount: 3,
          cookedCount: 2,
          lastUsedAt: '2026-03-10T00:00:00.000Z',
          lastAcceptedAt: '2026-03-10T00:00:00.000Z',
        },
        {
          recipeId: 'recent-pasta',
          acceptedCount: 1,
          cookedCount: 1,
          lastUsedAt: '2026-03-22T00:00:00.000Z',
          lastAcceptedAt: '2026-03-22T00:00:00.000Z',
        },
      ],
      day: {
        date: '2026-03-24',
        attendanceMemberIds: ['u1', 'u2'],
        servings: 2,
        prepMinutesAvailable: 45,
        prepTimeBucket: 'standard',
        dietaryPreferences: [],
      },
    });

    expect(ranked[0]?.recipe.id).toBe('manual-curry');
    expect(ranked[0]?.recommendation).toMatchObject({
      isFavorite: true,
      isManualDish: true,
      pantryMatchCount: 2,
      repeatCooldownActive: false,
    });
    expect(ranked[1]?.recommendation.repeatCooldownActive).toBe(true);
  });

  it('builds structured recommendation reasons instead of placeholder tags alone', () => {
    const recommendation = buildRecommendation(
      {
        id: 'manual-tacos',
        title: 'Manual Tacos',
        source: 'manual',
        favorite: true,
        prepMinutes: 25,
        cookMinutes: 15,
        totalMinutes: 40,
        tags: [],
        ingredients: [{ catalogItemId: 'beans', quantity: 1, unit: 'can' }],
      },
      {
        pantryItems: [{ catalogItemId: 'beans', quantityOnHand: 3, unit: 'can' }],
        history: [
          {
            recipeId: 'manual-tacos',
            acceptedCount: 2,
            cookedCount: 1,
            lastUsedAt: '2026-03-12T00:00:00.000Z',
            lastAcceptedAt: '2026-03-12T00:00:00.000Z',
          },
        ],
        attendanceMemberIds: ['u1'],
        prepTimeBucket: 'quick',
      },
      '2026-03-24'
    );

    expect(recommendation.whyThisFits).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/pantry item/i),
        expect.stringMatching(/favorite/i),
        expect.stringMatching(/history/i),
        expect.stringMatching(/manual staple/i),
      ])
    );
  });
});
