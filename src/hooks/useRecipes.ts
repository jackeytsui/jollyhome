import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useHouseholdStore } from '@/stores/household';
import type { Recipe, RecipeDifficulty, RecipeImportDraft, RecipeIngredient, RecipeSource } from '@/types/recipes';
import type { ShoppingCategoryKey } from '@/types/shopping';
import { useFoodRealtime } from './useFoodRealtime';

interface RecipeRow {
  id: string;
  household_id: string;
  title: string;
  summary: string | null;
  notes: string | null;
  source: RecipeSource;
  source_url: string | null;
  image_url: string | null;
  servings: number | string | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  total_minutes: number | null;
  difficulty: RecipeDifficulty | null;
  tags: string[] | null;
  favorite: boolean;
  imported_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  recipe_ingredients?: RecipeIngredientRow[] | null;
}

interface RecipeIngredientRow {
  id: string;
  recipe_id: string;
  household_id: string;
  title: string;
  note: string | null;
  quantity: number | string | null;
  unit: string | null;
  category_key: ShoppingCategoryKey;
  catalog_item_id: string | null;
  optional: boolean;
  sort_order: number;
}

interface RecipeInput {
  title: string;
  summary?: string | null;
  notes?: string | null;
  source?: RecipeSource;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  servings?: number | null;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  totalMinutes?: number | null;
  difficulty?: RecipeDifficulty | null;
  tags?: string[];
  favorite?: boolean;
  importedAt?: string | null;
  ingredients?: Array<{
    title: string;
    note?: string | null;
    quantity?: number | null;
    unit?: string | null;
    category?: ShoppingCategoryKey;
    catalogItemId?: string | null;
    optional?: boolean;
  }>;
}

const importDraftCache = new Map<string, RecipeImportDraft | null>();

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapRecipeIngredient(row: RecipeIngredientRow): RecipeIngredient {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    title: row.title,
    note: row.note,
    quantity: toNumber(row.quantity),
    unit: row.unit,
    category: row.category_key,
    catalogItemId: row.catalog_item_id,
    optional: row.optional,
    sortOrder: row.sort_order,
  };
}

function mapRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    householdId: row.household_id,
    title: row.title,
    summary: row.summary,
    notes: row.notes,
    source: row.source,
    sourceUrl: row.source_url,
    imageUrl: row.image_url,
    servings: toNumber(row.servings),
    prepMinutes: row.prep_minutes,
    cookMinutes: row.cook_minutes,
    totalMinutes: row.total_minutes,
    difficulty: row.difficulty,
    tags: row.tags ?? [],
    favorite: row.favorite,
    importedAt: row.imported_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildIngredientRows(recipeId: string, householdId: string, ingredients: RecipeInput['ingredients']) {
  return (ingredients ?? []).map((ingredient, index) => ({
    recipe_id: recipeId,
    household_id: householdId,
    title: ingredient.title,
    note: ingredient.note ?? null,
    quantity: ingredient.quantity ?? null,
    unit: ingredient.unit ?? null,
    category_key: ingredient.category ?? 'other',
    catalog_item_id: ingredient.catalogItemId ?? null,
    optional: ingredient.optional ?? false,
    sort_order: index,
  }));
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredientsByRecipeId, setIngredientsByRecipeId] = useState<Record<string, RecipeIngredient[]>>({});
  const [importDraft, setImportDraft] = useState<RecipeImportDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeHouseholdId = useHouseholdStore((state) => state.activeHouseholdId);
  const user = useAuthStore((state) => state.user);

  const loadRecipes = useCallback(async (): Promise<void> => {
    if (!activeHouseholdId) {
      setRecipes([]);
      setIngredientsByRecipeId({});
      setImportDraft(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('recipes')
        .select('*, recipe_ingredients(*)')
        .eq('household_id', activeHouseholdId)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      const rows = (data ?? []) as RecipeRow[];
      setRecipes(rows.map(mapRecipe));
      setIngredientsByRecipeId(
        rows.reduce<Record<string, RecipeIngredient[]>>((accumulator, row) => {
          accumulator[row.id] = (row.recipe_ingredients ?? []).map(mapRecipeIngredient);
          return accumulator;
        }, {})
      );
      setImportDraft(importDraftCache.get(activeHouseholdId) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  useFoodRealtime(activeHouseholdId, loadRecipes);

  const createRecipe = useCallback(async (input: RecipeInput): Promise<string> => {
    if (!activeHouseholdId || !user) {
      throw new Error('Not authenticated or no active household');
    }

    const { data, error: insertError } = await supabase
      .from('recipes')
      .insert({
        household_id: activeHouseholdId,
        created_by: user.id,
        title: input.title,
        summary: input.summary ?? null,
        notes: input.notes ?? null,
        source: input.source ?? 'manual',
        source_url: input.sourceUrl ?? null,
        image_url: input.imageUrl ?? null,
        servings: input.servings ?? null,
        prep_minutes: input.prepMinutes ?? null,
        cook_minutes: input.cookMinutes ?? null,
        total_minutes: input.totalMinutes ?? null,
        difficulty: input.difficulty ?? null,
        tags: input.tags ?? [],
        favorite: input.favorite ?? false,
        imported_at: input.importedAt ?? null,
      })
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    const recipeId = (data as RecipeRow).id;
    const ingredientRows = buildIngredientRows(recipeId, activeHouseholdId, input.ingredients);
    if (ingredientRows.length > 0) {
      const { error: ingredientError } = await supabase.from('recipe_ingredients').insert(ingredientRows);
      if (ingredientError) {
        throw ingredientError;
      }
    }

    await loadRecipes();
    return recipeId;
  }, [activeHouseholdId, loadRecipes, user]);

  const updateRecipe = useCallback(async (recipeId: string, input: Partial<RecipeInput>): Promise<void> => {
    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        title: input.title,
        summary: input.summary,
        notes: input.notes,
        source: input.source,
        source_url: input.sourceUrl,
        image_url: input.imageUrl,
        servings: input.servings,
        prep_minutes: input.prepMinutes,
        cook_minutes: input.cookMinutes,
        total_minutes: input.totalMinutes,
        difficulty: input.difficulty,
        tags: input.tags,
        favorite: input.favorite,
        imported_at: input.importedAt,
      })
      .eq('id', recipeId);

    if (updateError) {
      throw updateError;
    }

    if (input.ingredients) {
      const { error: deleteError } = await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
      if (deleteError) {
        throw deleteError;
      }

      if (!activeHouseholdId) {
        throw new Error('No active household');
      }

      const ingredientRows = buildIngredientRows(recipeId, activeHouseholdId, input.ingredients);
      if (ingredientRows.length > 0) {
        const { error: insertError } = await supabase.from('recipe_ingredients').insert(ingredientRows);
        if (insertError) {
          throw insertError;
        }
      }
    }

    await loadRecipes();
  }, [activeHouseholdId, loadRecipes]);

  const deleteRecipe = useCallback(async (recipeId: string): Promise<void> => {
    const { error: deleteError } = await supabase.from('recipes').delete().eq('id', recipeId);
    if (deleteError) {
      throw deleteError;
    }

    await loadRecipes();
  }, [loadRecipes]);

  const toggleFavorite = useCallback(async (recipeId: string, favorite: boolean): Promise<void> => {
    await updateRecipe(recipeId, { favorite });
  }, [updateRecipe]);

  const saveImportDraft = useCallback((draft: RecipeImportDraft | null) => {
    if (activeHouseholdId) {
      importDraftCache.set(activeHouseholdId, draft);
    }
    setImportDraft(draft);
  }, [activeHouseholdId]);

  const clearImportDraft = useCallback(() => {
    saveImportDraft(null);
  }, [saveImportDraft]);

  return {
    recipes,
    ingredientsByRecipeId,
    importDraft,
    loading,
    error,
    loadRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
    saveImportDraft,
    clearImportDraft,
  };
}
