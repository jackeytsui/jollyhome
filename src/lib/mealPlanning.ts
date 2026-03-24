import type { MealSuggestionAction, MealSuggestionFeedback } from '@/types/meals';
import type { InventoryAlert, InventoryEvent, InventoryItem } from '@/types/inventory';
import type { RecipeRecommendationSignal } from '@/types/recipes';
import type { MealSuggestionRecommendation } from '@/types/meals';

type PrepTimeBucket = 'quick' | 'standard' | 'project' | 'batch';

interface PlannerMember {
  userId: string;
  dietaryPreferences: string[];
}

interface PlannerRecipe {
  id: string;
  title: string;
  source: 'manual' | 'url_import' | 'ai_import';
  favorite: boolean;
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
  history: RecipeRecommendationSignal[];
}

export interface MealSuggestionRationaleInput {
  attendanceMemberIds: string[];
  prepTimeBucket: PrepTimeBucket;
  ingredientOverlap: number;
  pantryMatchCount?: number;
  isFavorite?: boolean;
  acceptedCount?: number;
  cookedCount?: number;
  rotationReason?: string | null;
  repeatCooldownActive?: boolean;
}

export interface MealRecommendationCandidate {
  id: string;
  title: string;
  source: PlannerRecipe['source'];
  favorite: boolean;
  prepMinutes: number | null;
  cookMinutes: number | null;
  totalMinutes: number | null;
  tags: string[];
  ingredients: PlannerRecipe['ingredients'];
}

export interface MealRecommendationContext {
  pantryItems: PlannerPantryItem[];
  history: RecipeRecommendationSignal[];
  attendanceMemberIds: string[];
  prepTimeBucket: PrepTimeBucket;
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
  history?: RecipeRecommendationSignal[];
}): {
  startDate: string;
  pantry: PlannerPantryItem[];
  recipes: PlannerRecipe[];
  days: PlannerDay[];
  history: RecipeRecommendationSignal[];
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
    history: input.history ?? [],
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
    history: [...input.history]
      .sort((left, right) => left.recipeId.localeCompare(right.recipeId))
      .map((signal) => ({ ...signal })),
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

  if (input.isFavorite) {
    reasons.push('household favorite worth rotating back in');
  }

  if ((input.acceptedCount ?? 0) > 0 || (input.cookedCount ?? 0) > 0) {
    reasons.push(
      `backed by household history (${input.acceptedCount ?? 0} accepts, ${input.cookedCount ?? 0} cooked)`
    );
  }

  if (input.rotationReason) {
    reasons.push(input.rotationReason);
  }

  if (input.repeatCooldownActive) {
    reasons.push('recent repeat cooldown applied so staples rotate instead of dominating');
  }

  return reasons;
}

function daysSince(date: string | null, anchorDate: string): number | null {
  if (!date) {
    return null;
  }

  const delta = new Date(`${anchorDate}T00:00:00.000Z`).getTime() - new Date(date).getTime();
  return Math.max(0, Math.floor(delta / (1000 * 60 * 60 * 24)));
}

function countPantryMatches(recipe: MealRecommendationCandidate, pantryItems: PlannerPantryItem[]) {
  const pantryIds = new Set(pantryItems.map((item) => item.catalogItemId));
  return recipe.ingredients.reduce((count, ingredient) => (
    ingredient.catalogItemId && pantryIds.has(ingredient.catalogItemId) ? count + 1 : count
  ), 0);
}

export function buildRecommendation(
  recipe: MealRecommendationCandidate,
  context: MealRecommendationContext,
  anchorDate: string
): MealSuggestionRecommendation {
  const history = context.history.find((item) => item.recipeId === recipe.id) ?? {
    recipeId: recipe.id,
    acceptedCount: 0,
    cookedCount: 0,
    lastUsedAt: null,
    lastAcceptedAt: null,
  };
  const pantryMatchCount = countPantryMatches(recipe, context.pantryItems);
  const ingredientCount = Math.max(recipe.ingredients.length, 1);
  const pantryFitScore = pantryMatchCount / ingredientCount;
  const daysSinceLastUsed = daysSince(history.lastUsedAt, anchorDate);
  const repeatCooldownActive = daysSinceLastUsed !== null && daysSinceLastUsed < 7;
  const isManualDish = recipe.source === 'manual';
  const rotationReason = isManualDish
    ? repeatCooldownActive
      ? 'manual staple is cooling off before it rotates back'
      : 'manual staple rotates back in once recent repeats cool down'
    : recipe.favorite
      ? 'favorite dish resurfaced because this week fits it well'
      : pantryMatchCount > 0
        ? 'pantry overlap makes this an efficient rotation'
        : null;

  return {
    pantryMatchCount,
    pantryFitScore: Number(pantryFitScore.toFixed(3)),
    isFavorite: recipe.favorite,
    isManualDish,
    acceptedCount: history.acceptedCount,
    cookedCount: history.cookedCount,
    lastUsedAt: history.lastUsedAt,
    daysSinceLastUsed,
    repeatCooldownActive,
    rotationReason,
    whyThisFits: buildSuggestionRationale({
      attendanceMemberIds: context.attendanceMemberIds,
      prepTimeBucket: context.prepTimeBucket,
      ingredientOverlap: pantryFitScore,
      pantryMatchCount,
      isFavorite: recipe.favorite,
      acceptedCount: history.acceptedCount,
      cookedCount: history.cookedCount,
      rotationReason,
      repeatCooldownActive,
    }),
  };
}

export function rankMealRecommendations(input: {
  recipes: MealRecommendationCandidate[];
  pantryItems: PlannerPantryItem[];
  history: RecipeRecommendationSignal[];
  day: PlannerDay;
  limit?: number;
}) {
  const ranked = input.recipes
    .map((recipe) => {
      const recommendation = buildRecommendation(
        recipe,
        {
          pantryItems: input.pantryItems,
          history: input.history,
          attendanceMemberIds: input.day.attendanceMemberIds,
          prepTimeBucket: input.day.prepTimeBucket,
        },
        input.day.date
      );
      const prepMinutes = recipe.totalMinutes ?? recipe.prepMinutes ?? recipe.cookMinutes ?? 45;
      const prepPenalty =
        input.day.prepTimeBucket === 'quick' && prepMinutes > 35
          ? 1.5
          : input.day.prepTimeBucket === 'project' && prepMinutes < 25
            ? 0.25
            : 0;
      const historyBoost = (recommendation.acceptedCount * 0.8) + (recommendation.cookedCount * 0.5);
      const favoriteBoost = recommendation.isFavorite ? 1.25 : 0;
      const pantryBoost = recommendation.pantryFitScore * 3;
      const manualRotationBoost = recommendation.isManualDish && !recommendation.repeatCooldownActive ? 0.8 : 0;
      const cooldownPenalty = recommendation.repeatCooldownActive ? 2 : 0;

      return {
        recipe,
        recommendation,
        score: Number((historyBoost + favoriteBoost + pantryBoost + manualRotationBoost - cooldownPenalty - prepPenalty).toFixed(3)),
      };
    })
    .sort((left, right) => right.score - left.score || left.recipe.title.localeCompare(right.recipe.title))
    .slice(0, input.limit ?? input.recipes.length);

  return ranked.map((item, index) => ({
    recipe: item.recipe,
    recommendation: item.recommendation,
    rank: index + 1,
    score: item.score,
  }));
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
