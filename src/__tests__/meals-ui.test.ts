jest.mock('react-native-draggable-flatlist', () => 'DraggableFlatList');
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: any }) => children,
}));
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children }: { children: any }) => children ?? null,
}));

import { buildMealBoardItems } from '@/components/meals/MealBoard';
import { getMealSuggestionWhyThisFits } from '@/components/meals/AIMealPlanSheet';
import { draftToRecipeEditorValues } from '@/components/meals/RecipeEditorSheet';
import { buildRecipeRecommendationSignals, deriveMealServings } from '@/hooks/useMealPlans';

describe('meals UI', () => {
  it('updates meal planner portions from Home tonight attendance per SYNC-07', () => {
    expect(
      deriveMealServings({
        attendanceMemberIds: ['alex', 'blair', 'casey'],
        explicitServings: null,
        recipeServings: 2,
      })
    ).toEqual({
      servings: 3,
      servingSource: 'attendance',
    });

    const board = buildMealBoardItems(
      ['2026-03-24'],
      [
        {
          id: 'meal-1',
          householdId: 'household-1',
          recipeId: 'recipe-1',
          suggestionRunId: null,
          suggestionId: null,
          calendarItemId: null,
          title: 'Taco night',
          slot: 'dinner',
          plannedForDate: '2026-03-24',
          plannedForStartAt: null,
          plannedForEndAt: null,
          status: 'planned',
          servings: 3,
          servingSource: 'attendance',
          attendanceMemberIds: ['alex', 'blair', 'casey'],
          attendanceSnapshotDate: '2026-03-24',
          notes: null,
          createdBy: 'alex',
          createdAt: '2026-03-24T00:00:00.000Z',
          updatedAt: '2026-03-24T00:00:00.000Z',
        },
      ],
      { '2026-03-24': ['alex', 'blair', 'casey'] }
    );

    expect(board.find((item) => item.slot === 'dinner')?.attendanceCount).toBe(3);
    expect(board.find((item) => item.slot === 'dinner')?.entry?.servings).toBe(3);
  });

  it('turns an imported recipe draft into reviewable editor values instead of auto-saving it', () => {
    const editorValues = draftToRecipeEditorValues({
      sourceUrl: 'https://example.com/lasagna',
      sourceLabel: 'Example Kitchen',
      title: 'Lasagna',
      summary: 'Comfort-food classic',
      servings: 6,
      prepMinutes: 20,
      cookMinutes: 45,
      totalMinutes: 65,
      imageUrl: 'https://example.com/lasagna.jpg',
      ingredients: [
        {
          id: 'draft-1',
          recipeId: 'draft',
          title: '1 box lasagna noodles',
          note: null,
          quantity: 1,
          unit: 'box',
          category: 'pantry',
          catalogItemId: null,
          optional: false,
          sortOrder: 0,
        },
      ],
      instructions: ['Boil noodles', 'Layer sauce and cheese'],
      tags: ['comfort', 'batch'],
    });

    expect(editorValues).toEqual(
      expect.objectContaining({
        title: 'Lasagna',
        source: 'url_import',
        sourceUrl: 'https://example.com/lasagna',
        tags: ['comfort', 'batch'],
      })
    );
    expect(editorValues.notes).toContain('Boil noodles');
    expect(editorValues.ingredients[0]?.title).toBe('1 box lasagna noodles');
  });

  it('surfaces why a manual favorite rotated back into AI suggestions', () => {
    const reasons = getMealSuggestionWhyThisFits({
      id: 'suggestion-1',
      householdId: 'house-1',
      suggestionRunId: 'run-1',
      recipeId: 'recipe-1',
      title: 'House Curry',
      slot: 'dinner',
      plannedForDate: '2026-03-24',
      rationale: null,
      servings: 2,
      attendanceMemberIds: ['alex', 'blair'],
      estimatedCostCents: 1800,
      tags: ['ai'],
      rank: 1,
      recommendation: {
        pantryMatchCount: 2,
        pantryFitScore: 1,
        isFavorite: true,
        isManualDish: true,
        acceptedCount: 3,
        cookedCount: 2,
        lastUsedAt: '2026-03-12T00:00:00.000Z',
        daysSinceLastUsed: 12,
        repeatCooldownActive: false,
        rotationReason: 'manual staple rotates back in once recent repeats cool down',
        whyThisFits: [
          'uses 2 pantry items already on hand',
          'household favorite worth rotating back in',
          'manual staple rotates back in once recent repeats cool down',
        ],
      },
    });

    expect(reasons).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/pantry/i),
        expect.stringMatching(/favorite/i),
        expect.stringMatching(/rotates back/i),
      ])
    );
  });

  it('builds recipe recommendation signals from accepted feedback and cooked history', () => {
    expect(
      buildRecipeRecommendationSignals({
        mealPlans: [
          {
            id: 'meal-1',
            householdId: 'house-1',
            recipeId: 'recipe-1',
            suggestionRunId: null,
            suggestionId: null,
            calendarItemId: null,
            title: 'House Curry',
            slot: 'dinner',
            plannedForDate: '2026-03-20',
            plannedForStartAt: null,
            plannedForEndAt: null,
            status: 'cooked',
            servings: 2,
            servingSource: 'attendance',
            attendanceMemberIds: ['alex', 'blair'],
            attendanceSnapshotDate: '2026-03-20',
            notes: null,
            createdBy: 'alex',
            createdAt: '2026-03-20T00:00:00.000Z',
            updatedAt: '2026-03-20T00:00:00.000Z',
          },
        ],
        feedback: [
          {
            id: 'feedback-1',
            householdId: 'house-1',
            suggestionRunId: 'run-1',
            suggestionId: 'suggestion-1',
            mealPlanEntryId: 'meal-1',
            action: 'accept',
            rating: null,
            feedbackNote: null,
            replacementSuggestionId: null,
            recipeId: 'recipe-1',
            createdBy: 'alex',
            createdAt: '2026-03-19T00:00:00.000Z',
          },
        ],
      })
    ).toEqual([
      expect.objectContaining({
        recipeId: 'recipe-1',
        acceptedCount: 1,
        cookedCount: 1,
      }),
    ]);
  });
});
