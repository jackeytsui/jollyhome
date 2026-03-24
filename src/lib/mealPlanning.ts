import type { MealSuggestionAction, MealSuggestionFeedback } from '@/types/meals';

type PrepTimeBucket = 'quick' | 'standard' | 'project' | 'batch';

interface PlannerMember {
  userId: string;
  dietaryPreferences: string[];
}

interface PlannerRecipe {
  id: string;
  title: string;
  prepMinutes: number | null;
  cookMinutes: number | null;
  totalMinutes: number | null;
  tags: string[];
  ingredients: Array<{
    catalogItemId: string | null;
    quantity: number | null;
    unit: string | null;
  }>;
}

interface PlannerPantryItem {
  catalogItemId: string;
  quantityOnHand: number;
  unit: string;
}

export function bucketPrepTimeAvailability(minutesAvailable: number): PrepTimeBucket {
  if (minutesAvailable <= 30) {
    return 'quick';
  }

  if (minutesAvailable <= 60) {
    return 'standard';
  }

  if (minutesAvailable <= 120) {
    return 'project';
  }

  return 'batch';
}

export function calculateAttendanceServings(attendanceMemberIds: string[], fallbackServings = 1): number {
  return attendanceMemberIds.length > 0 ? attendanceMemberIds.length : fallbackServings;
}

export function scoreIngredientOverlap(left: string[], right: string[]): number {
  const leftSet = new Set(left.filter(Boolean));
  const rightSet = new Set(right.filter(Boolean));
  const union = new Set([...leftSet, ...rightSet]);

  if (union.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const value of leftSet) {
    if (rightSet.has(value)) {
      intersection += 1;
    }
  }

  return intersection / union.size;
}

export function buildMealPlannerInputs(input: {
  startDate: string;
  members: PlannerMember[];
  attendanceByDate: Record<string, string[]>;
  calendarLoadByDate: Record<string, number>;
  pantryItems: PlannerPantryItem[];
  recipes: PlannerRecipe[];
}): {
  startDate: string;
  pantry: PlannerPantryItem[];
  recipes: PlannerRecipe[];
  days: Array<{
    date: string;
    attendanceMemberIds: string[];
    servings: number;
    prepMinutesAvailable: number;
    prepTimeBucket: PrepTimeBucket;
    dietaryPreferences: string[];
  }>;
} {
  const allDates = new Set<string>([
    ...Object.keys(input.attendanceByDate),
    ...Object.keys(input.calendarLoadByDate),
  ]);

  const days = [...allDates]
    .sort((left, right) => left.localeCompare(right))
    .map((date) => {
      const attendanceMemberIds = input.attendanceByDate[date] ?? [];
      const dietaryPreferences = [...new Set(
        input.members
          .filter((member) => attendanceMemberIds.includes(member.userId))
          .flatMap((member) => member.dietaryPreferences)
      )].sort();
      const prepMinutesAvailable = input.calendarLoadByDate[date] ?? 45;

      return {
        date,
        attendanceMemberIds,
        servings: calculateAttendanceServings(attendanceMemberIds, 1),
        prepMinutesAvailable,
        prepTimeBucket: bucketPrepTimeAvailability(prepMinutesAvailable),
        dietaryPreferences,
      };
    });

  return {
    startDate: input.startDate,
    pantry: input.pantryItems,
    recipes: input.recipes,
    days,
  };
}

export function buildMealSuggestionFeedback(input: {
  householdId: string;
  suggestionRunId: string;
  suggestionId: string | null;
  action: MealSuggestionAction;
  createdBy: string;
  mealPlanEntryId?: string | null;
  rating?: MealSuggestionFeedback['rating'];
  feedbackNote?: string | null;
  replacementSuggestionId?: string | null;
  recipeId?: string | null;
}): Omit<MealSuggestionFeedback, 'id'> {
  return {
    householdId: input.householdId,
    suggestionRunId: input.suggestionRunId,
    suggestionId: input.suggestionId,
    mealPlanEntryId: input.mealPlanEntryId ?? null,
    action: input.action,
    rating: input.rating ?? null,
    feedbackNote: input.feedbackNote ?? null,
    replacementSuggestionId: input.replacementSuggestionId ?? null,
    recipeId: input.recipeId ?? null,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
}
