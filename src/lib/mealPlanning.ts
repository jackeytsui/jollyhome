import type { MealSuggestionAction, MealSuggestionFeedback } from '@/types/meals';
import type { InventoryAlert, InventoryEvent, InventoryItem } from '@/types/inventory';

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

interface PlannerDay {
  date: string;
  attendanceMemberIds: string[];
  servings: number;
  prepMinutesAvailable: number;
  prepTimeBucket: PrepTimeBucket;
  dietaryPreferences: string[];
}

export interface MealPlannerPayload {
  startDate: string;
  pantry: PlannerPantryItem[];
  recipes: PlannerRecipe[];
  days: PlannerDay[];
}

export interface MealSuggestionRationaleInput {
  attendanceMemberIds: string[];
  prepTimeBucket: PrepTimeBucket;
  ingredientOverlap: number;
  pantryMatchCount?: number;
}

export interface PredictiveRestockSuggestion {
  catalogItemId: string;
  inventoryItemId: string;
  unit: string;
  suggestedQuantity: number;
  averageDailyUsage: number;
  alertId: string | null;
  reason: string;
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
  days: PlannerDay[];
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

export function serializeMealPlannerPayload(input: ReturnType<typeof buildMealPlannerInputs>): MealPlannerPayload {
  return {
    startDate: input.startDate,
    pantry: input.pantry.map((item) => ({
      catalogItemId: item.catalogItemId,
      quantityOnHand: Number(item.quantityOnHand.toFixed(3)),
      unit: item.unit,
    })),
    recipes: input.recipes.map((recipe) => ({
      ...recipe,
      tags: [...recipe.tags].sort(),
      ingredients: recipe.ingredients.map((ingredient) => ({
        catalogItemId: ingredient.catalogItemId,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      })),
    })),
    days: input.days.map((day) => ({
      ...day,
      attendanceMemberIds: [...day.attendanceMemberIds].sort(),
      dietaryPreferences: [...day.dietaryPreferences].sort(),
    })),
  };
}

export function buildSuggestionRationale(input: MealSuggestionRationaleInput): string[] {
  const reasons: string[] = [];

  reasons.push(
    input.attendanceMemberIds.length > 0
      ? `${input.attendanceMemberIds.length} household member${input.attendanceMemberIds.length === 1 ? '' : 's'} home that night`
      : 'fallback serving count because attendance is empty'
  );

  const prepLabel =
    input.prepTimeBucket === 'quick'
      ? 'fits a low-prep evening'
      : input.prepTimeBucket === 'standard'
        ? 'matches a normal prep window'
        : input.prepTimeBucket === 'project'
          ? 'works on a higher-effort cooking night'
          : 'best suited to a batch-cooking block';
  reasons.push(prepLabel);

  if (input.ingredientOverlap > 0) {
    reasons.push(`${Math.round(input.ingredientOverlap * 100)}% ingredient overlap to reduce waste`);
  }

  if ((input.pantryMatchCount ?? 0) > 0) {
    reasons.push(`uses ${input.pantryMatchCount} pantry item${input.pantryMatchCount === 1 ? '' : 's'} already on hand`);
  }

  return reasons;
}

export function buildPredictiveRestockSuggestions(input: {
  inventoryItems: InventoryItem[];
  inventoryEvents: InventoryEvent[];
  alerts: InventoryAlert[];
}): PredictiveRestockSuggestion[] {
  return input.inventoryItems.reduce<PredictiveRestockSuggestion[]>((accumulator, item) => {
    const usageEvents = input.inventoryEvents.filter(
      (event) => event.inventoryItemId === item.id && event.quantityDelta < 0
    );
    if (usageEvents.length === 0) {
      return accumulator;
    }

    const totalUsage = usageEvents.reduce((sum, event) => sum + Math.abs(event.quantityDelta), 0);
    const spanDays = Math.max(
      1,
      Math.ceil(
        (new Date(usageEvents[0].occurredAt).getTime() - new Date(usageEvents[usageEvents.length - 1].occurredAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const averageDailyUsage = Number((totalUsage / spanDays).toFixed(3));
    const projectedSevenDayNeed = averageDailyUsage * 7;
    const threshold = item.minimumQuantity ?? 0;
    const suggestedQuantity = Math.max(
      0,
      Number(((item.preferredReorderQuantity ?? threshold + projectedSevenDayNeed) - item.quantityOnHand).toFixed(3))
    );

    if (suggestedQuantity <= 0) {
      return accumulator;
    }

    const alert = input.alerts.find((candidate) => candidate.inventoryItemId === item.id && candidate.status === 'open') ?? null;

    accumulator.push({
      catalogItemId: item.catalogItemId,
      inventoryItemId: item.id,
      unit: item.unit,
      suggestedQuantity,
      averageDailyUsage,
      alertId: alert?.id ?? null,
      reason: `Usage trend suggests ${projectedSevenDayNeed.toFixed(1)} ${item.unit} needed over the next week`,
    });

    return accumulator;
  }, []);
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
