import {
  bucketPrepTimeAvailability,
  buildMealPlannerInputs,
  buildMealSuggestionFeedback,
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
});
