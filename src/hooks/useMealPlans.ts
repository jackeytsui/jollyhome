import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateAttendanceServings } from '@/lib/mealPlanning';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import type { MealPlanEntry, MealPlanEntryStatus, MealPlanSlot, MealServingSource, MealSuggestion, MealSuggestionFeedback, MealSuggestionRun } from '@/types/meals';
import type { RecipeRecommendationSignal } from '@/types/recipes';
import type { ShoppingListItem } from '@/types/shopping';
import { useFoodRealtime } from './useFoodRealtime';

interface MealPlanEntryRow {
  id: string;
  household_id: string;
  recipe_id: string | null;
  suggestion_run_id: string | null;
  suggestion_id: string | null;
  calendar_item_id: string | null;
  title: string;
  slot_key: MealPlanSlot;
  slot_date: string;
  starts_at: string | null;
  ends_at: string | null;
  status: MealPlanEntryStatus;
  servings_planned: number | string;
  serving_source: MealServingSource;
  attendance_member_ids: string[] | null;
  attendance_snapshot_date: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface MealSuggestionRunRow {
  id: string;
  household_id: string;
  requested_by: string;
  source_date: string;
  budget_cents: number | null;
  dietary_preferences: string[] | null;
  dietary_notes: string | null;
  attendance_member_ids: string[] | null;
  attendance_snapshot_date: string | null;
  status: MealSuggestionRun['status'];
  prompt_version: string | null;
  generated_at: string | null;
  created_at: string;
  suggestions: MealSuggestion[] | null;
}

interface MealSuggestionFeedbackRow {
  id: string;
  household_id: string;
  suggestion_run_id: string;
  suggestion_id: string | null;
  meal_plan_entry_id: string | null;
  action: MealSuggestionFeedback['action'];
  rating: MealSuggestionFeedback['rating'];
  feedback_note: string | null;
  replacement_suggestion_id: string | null;
  recipe_id: string | null;
  created_by: string;
  created_at: string;
}

interface ShoppingListItemRow {
  id: string;
  list_id: string;
  household_id: string;
  title: string;
  note: string | null;
  category_key: ShoppingListItem['category'];
  quantity: number | string | null;
  unit: string | null;
  status: ShoppingListItem['status'];
  source: ShoppingListItem['source'];
  catalog_item_id: string | null;
  recipe_id: string | null;
  meal_plan_entry_id: string | null;
  inventory_item_id: string | null;
  minimum_quantity: number | string | null;
  generated_restock: ShoppingListItem['generatedRestock'];
  checked_off_by: string | null;
  checked_off_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MealPlanEntryInput {
  id?: string;
  recipeId?: string | null;
  suggestionRunId?: string | null;
  suggestionId?: string | null;
  calendarItemId?: string | null;
  title: string;
  slot: MealPlanSlot;
  plannedForDate: string;
  plannedForStartAt?: string | null;
  plannedForEndAt?: string | null;
  status?: MealPlanEntryStatus;
  servings?: number | null;
  servingSource?: MealServingSource;
  attendanceMemberIds?: string[];
  attendanceSnapshotDate?: string | null;
  notes?: string | null;
}

interface SuggestionFeedbackInput {
  suggestionRunId: string;
  suggestionId: string | null;
  action: MealSuggestionFeedback['action'];
  mealPlanEntryId?: string | null;
  feedbackNote?: string | null;
  replacementSuggestionId?: string | null;
  recipeId?: string | null;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function startOfWeekIso(anchorDate = new Date()) {
  const utc = new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth(), anchorDate.getUTCDate()));
  const day = utc.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + offset);
  return utc.toISOString().slice(0, 10);
}

export function buildMealWeekRange(weekStart: string) {
  return {
    weekStart,
    weekEnd: addDays(weekStart, 6),
  };
}

export function deriveMealServings(input: {
  attendanceMemberIds?: string[];
  explicitServings?: number | null;
  recipeServings?: number | null;
}) {
  if (input.explicitServings && input.explicitServings > 0) {
    return {
      servings: input.explicitServings,
      servingSource: 'manual' as MealServingSource,
    };
  }

  if ((input.attendanceMemberIds ?? []).length > 0) {
    return {
      servings: calculateAttendanceServings(input.attendanceMemberIds ?? [], input.recipeServings ?? 1),
      servingSource: 'attendance' as MealServingSource,
    };
  }

  return {
    servings: input.recipeServings && input.recipeServings > 0 ? input.recipeServings : 1,
    servingSource: 'recipe_default' as MealServingSource,
  };
}

function mapMealPlanEntry(row: MealPlanEntryRow): MealPlanEntry {
  return {
    id: row.id,
    householdId: row.household_id,
    recipeId: row.recipe_id,
    suggestionRunId: row.suggestion_run_id,
    suggestionId: row.suggestion_id,
    calendarItemId: row.calendar_item_id,
    title: row.title,
    slot: row.slot_key,
    plannedForDate: row.slot_date,
    plannedForStartAt: row.starts_at,
    plannedForEndAt: row.ends_at,
    status: row.status,
    servings: toNumber(row.servings_planned) ?? 1,
    servingSource: row.serving_source,
    attendanceMemberIds: row.attendance_member_ids ?? [],
    attendanceSnapshotDate: row.attendance_snapshot_date,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSuggestionRun(row: MealSuggestionRunRow): MealSuggestionRun {
  return {
    id: row.id,
    householdId: row.household_id,
    requestedBy: row.requested_by,
    sourceDate: row.source_date,
    budgetCents: row.budget_cents,
    dietaryPreferences: row.dietary_preferences ?? [],
    dietaryNotes: row.dietary_notes,
    attendanceMemberIds: row.attendance_member_ids ?? [],
    attendanceSnapshotDate: row.attendance_snapshot_date,
    status: row.status,
    promptVersion: row.prompt_version,
    generatedAt: row.generated_at,
    createdAt: row.created_at,
  };
}

function coerceSuggestion(input: MealSuggestion, householdId: string, runId: string): MealSuggestion {
  return {
    ...input,
    householdId: input.householdId ?? householdId,
    suggestionRunId: input.suggestionRunId ?? runId,
    recommendation: input.recommendation ?? null,
  };
}

export function buildRecipeRecommendationSignals(input: {
  mealPlans: MealPlanEntry[];
  feedback: MealSuggestionFeedback[];
}): RecipeRecommendationSignal[] {
  const byRecipe = new Map<string, RecipeRecommendationSignal>();

  for (const entry of input.mealPlans) {
    if (!entry.recipeId) {
      continue;
    }
    const current = byRecipe.get(entry.recipeId) ?? {
      recipeId: entry.recipeId,
      acceptedCount: 0,
      cookedCount: 0,
      lastUsedAt: null,
      lastAcceptedAt: null,
    };
    if (entry.status === 'cooked') {
      current.cookedCount += 1;
      current.lastUsedAt = !current.lastUsedAt || entry.plannedForDate > current.lastUsedAt
        ? entry.plannedForDate
        : current.lastUsedAt;
    }
    byRecipe.set(entry.recipeId, current);
  }

  for (const item of input.feedback) {
    if (!item.recipeId) {
      continue;
    }
    const current = byRecipe.get(item.recipeId) ?? {
      recipeId: item.recipeId,
      acceptedCount: 0,
      cookedCount: 0,
      lastUsedAt: null,
      lastAcceptedAt: null,
    };
    if (item.action === 'accept') {
      current.acceptedCount += 1;
      current.lastAcceptedAt = !current.lastAcceptedAt || item.createdAt > current.lastAcceptedAt
        ? item.createdAt
        : current.lastAcceptedAt;
      current.lastUsedAt = !current.lastUsedAt || item.createdAt > current.lastUsedAt
        ? item.createdAt
        : current.lastUsedAt;
    }
    byRecipe.set(item.recipeId, current);
  }

  return [...byRecipe.values()].sort((left, right) => left.recipeId.localeCompare(right.recipeId));
}

function mapSuggestionFeedback(row: MealSuggestionFeedbackRow): MealSuggestionFeedback {
  return {
    id: row.id,
    householdId: row.household_id,
    suggestionRunId: row.suggestion_run_id,
    suggestionId: row.suggestion_id,
    mealPlanEntryId: row.meal_plan_entry_id,
    action: row.action,
    rating: row.rating,
    feedbackNote: row.feedback_note,
    replacementSuggestionId: row.replacement_suggestion_id,
    recipeId: row.recipe_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function mapShoppingListItem(row: ShoppingListItemRow): ShoppingListItem {
  return {
    id: row.id,
    listId: row.list_id,
    householdId: row.household_id,
    title: row.title,
    note: row.note,
    category: row.category_key,
    quantity: toNumber(row.quantity),
    unit: row.unit,
    status: row.status,
    source: row.source,
    catalogItemId: row.catalog_item_id,
    recipeId: row.recipe_id,
    mealPlanEntryId: row.meal_plan_entry_id,
    inventoryItemId: row.inventory_item_id,
    minimumQuantity: toNumber(row.minimum_quantity),
    generatedRestock: row.generated_restock,
    checkedOffBy: row.checked_off_by,
    checkedOffAt: row.checked_off_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useMealPlans() {
  const [weekStart, setWeekStart] = useState(startOfWeekIso());
  const [mealPlans, setMealPlans] = useState<MealPlanEntry[]>([]);
  const [suggestionRuns, setSuggestionRuns] = useState<MealSuggestionRun[]>([]);
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [feedback, setFeedback] = useState<MealSuggestionFeedback[]>([]);
  const [recentMeals, setRecentMeals] = useState<MealPlanEntry[]>([]);
  const [generatedShoppingItems, setGeneratedShoppingItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const user = useAuthStore((state) => state.user);

  const loadMealPlans = useCallback(async (nextWeekStart = weekStart): Promise<void> => {
    if (!activeHouseholdId) {
      setMealPlans([]);
      setSuggestionRuns([]);
      setSuggestions([]);
      setFeedback([]);
      setGeneratedShoppingItems([]);
      setRecentMeals([]);
      return;
    }

    const range = buildMealWeekRange(nextWeekStart);

    setLoading(true);
    setError(null);

    try {
      const [mealPlansResult, runsResult, feedbackResult, recentMealsResult] = await Promise.all([
        supabase
          .from('meal_plan_entries')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .gte('slot_date', range.weekStart)
          .lte('slot_date', range.weekEnd)
          .order('slot_date', { ascending: true }),
        supabase
          .from('meal_suggestion_runs')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .gte('source_date', range.weekStart)
          .lte('source_date', range.weekEnd)
          .order('created_at', { ascending: false }),
        supabase
          .from('meal_suggestion_feedback')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('meal_plan_entries')
          .select('*')
          .eq('household_id', activeHouseholdId)
          .order('updated_at', { ascending: false })
          .limit(100),
      ]);

      if (mealPlansResult.error) throw mealPlansResult.error;
      if (runsResult.error) throw runsResult.error;
      if (feedbackResult.error) throw feedbackResult.error;
      if (recentMealsResult.error) throw recentMealsResult.error;

      const mappedRuns = ((runsResult.data ?? []) as MealSuggestionRunRow[]).map(mapSuggestionRun);

      setMealPlans(((mealPlansResult.data ?? []) as MealPlanEntryRow[]).map(mapMealPlanEntry));
      setSuggestionRuns(mappedRuns);
      setSuggestions(
        ((runsResult.data ?? []) as MealSuggestionRunRow[]).flatMap((row) =>
          (row.suggestions ?? []).map((suggestion) => coerceSuggestion(suggestion, row.household_id, row.id))
        )
      );
      const mappedFeedback = ((feedbackResult.data ?? []) as MealSuggestionFeedbackRow[]).map(mapSuggestionFeedback);
      setFeedback(mappedFeedback);
      setRecentMeals(((recentMealsResult.data ?? []) as MealPlanEntryRow[]).map(mapMealPlanEntry));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId, weekStart]);

  useEffect(() => {
    loadMealPlans();
  }, [loadMealPlans]);

  useFoodRealtime(activeHouseholdId, () => loadMealPlans());

  const saveMealPlanEntry = useCallback(async (input: MealPlanEntryInput): Promise<void> => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const derived = deriveMealServings({
      attendanceMemberIds: input.attendanceMemberIds,
      explicitServings: input.servings ?? null,
    });

    const payload = {
      household_id: activeHouseholdId,
      recipe_id: input.recipeId ?? null,
      suggestion_run_id: input.suggestionRunId ?? null,
      suggestion_id: input.suggestionId ?? null,
      calendar_item_id: input.calendarItemId ?? null,
      title: input.title,
      slot_key: input.slot,
      slot_date: input.plannedForDate,
      starts_at: input.plannedForStartAt ?? null,
      ends_at: input.plannedForEndAt ?? null,
      status: input.status ?? 'planned',
      servings_planned: derived.servings,
      serving_source: input.servingSource ?? derived.servingSource,
      attendance_member_ids: input.attendanceMemberIds ?? [],
      attendance_snapshot_date: input.attendanceSnapshotDate ?? null,
      notes: input.notes ?? null,
      created_by: user.id,
    };

    const query = supabase.from('meal_plan_entries');
    const result = input.id
      ? await query.update(payload).eq('id', input.id)
      : await query.insert(payload);

    if (result.error) {
      throw result.error;
    }

    await loadMealPlans();
  }, [activeHouseholdId, loadMealPlans, user]);

  const deleteMealPlanEntry = useCallback(async (entryId: string): Promise<void> => {
    const { error: deleteError } = await supabase.from('meal_plan_entries').delete().eq('id', entryId);
    if (deleteError) {
      throw deleteError;
    }

    await loadMealPlans();
  }, [loadMealPlans]);

  const generateShoppingList = useCallback(async (input?: {
    listId?: string | null;
    weekStart?: string | null;
    mealPlanEntryIds?: string[] | null;
  }) => {
    if (!activeHouseholdId) {
      throw new Error('No active household');
    }

    const { data, error: rpcError } = await supabase.rpc('generate_meal_plan_shopping_list', {
      p_household_id: activeHouseholdId,
      p_list_id: input?.listId ?? null,
      p_week_start: input?.weekStart ?? weekStart,
      p_meal_plan_entry_ids: input?.mealPlanEntryIds ?? null,
    });

    if (rpcError) {
      throw rpcError;
    }

    const mappedItems = ((data ?? []) as ShoppingListItemRow[]).map(mapShoppingListItem);
    setGeneratedShoppingItems(mappedItems);
    await loadMealPlans(input?.weekStart ?? weekStart);
    return mappedItems;
  }, [activeHouseholdId, loadMealPlans, weekStart]);

  const markMealCooked = useCallback(async (mealPlanEntryId: string, note?: string | null) => {
    const { data, error: rpcError } = await supabase.rpc('mark_meal_cooked', {
      p_meal_plan_entry_id: mealPlanEntryId,
      p_note: note ?? null,
    });

    if (rpcError) {
      throw rpcError;
    }

    await loadMealPlans();
    return data;
  }, [loadMealPlans]);

  const submitSuggestionFeedback = useCallback(async (input: SuggestionFeedbackInput) => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const { error: insertError } = await supabase.from('meal_suggestion_feedback').insert({
      household_id: activeHouseholdId,
      suggestion_run_id: input.suggestionRunId,
      suggestion_id: input.suggestionId,
      meal_plan_entry_id: input.mealPlanEntryId ?? null,
      action: input.action,
      feedback_note: input.feedbackNote ?? null,
      replacement_suggestion_id: input.replacementSuggestionId ?? null,
      recipe_id: input.recipeId ?? null,
      created_by: user.id,
    });

    if (insertError) {
      throw insertError;
    }

    await loadMealPlans();
  }, [activeHouseholdId, loadMealPlans, user]);

  const weeklyEntries = useMemo(
    () => [...mealPlans].sort((left, right) => {
      if (left.plannedForDate !== right.plannedForDate) {
        return left.plannedForDate.localeCompare(right.plannedForDate);
      }
      return left.slot.localeCompare(right.slot);
    }),
    [mealPlans]
  );

  const recommendationSignals = useMemo(
    () => buildRecipeRecommendationSignals({ mealPlans: recentMeals, feedback }),
    [feedback, recentMeals]
  );

  return {
    weekStart,
    mealPlans: weeklyEntries,
    suggestionRuns,
    suggestions,
    feedback,
    recommendationSignals,
    generatedShoppingItems,
    loading,
    error,
    setWeekStart,
    loadMealPlans,
    saveMealPlanEntry,
    deleteMealPlanEntry,
    generateShoppingList,
    markMealCooked,
    submitSuggestionFeedback,
  };
}
