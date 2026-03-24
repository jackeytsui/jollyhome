// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      household_id,
      planner_payload,
      accepted_ids = [],
      regenerate_slot = null,
    } = await req.json() as {
      household_id: string;
      planner_payload: Record<string, unknown>;
      accepted_ids?: string[];
      regenerate_slot?: { plannedForDate: string; slot: string } | null;
    };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const recipes = (planner_payload.recipes as Array<Record<string, unknown>> | undefined) ?? [];
    const pantry = (planner_payload.pantry as Array<Record<string, unknown>> | undefined) ?? [];
    const history = (planner_payload.history as Array<Record<string, unknown>> | undefined) ?? [];
    const pantryIds = new Set(pantry.map((item) => item.catalogItemId).filter(Boolean));
    const scoreRecipe = (recipe: Record<string, unknown>, date: string) => {
      const recommendationHistory = history.find((item) => item.recipeId === recipe.id) ?? {};
      const ingredients = (recipe.ingredients as Array<Record<string, unknown>> | undefined) ?? [];
      const pantryMatchCount = ingredients.filter((ingredient) => ingredient.catalogItemId && pantryIds.has(ingredient.catalogItemId)).length;
      const ingredientCount = Math.max(ingredients.length, 1);
      const pantryFitScore = pantryMatchCount / ingredientCount;
      const acceptedCount = Number(recommendationHistory.acceptedCount ?? 0);
      const cookedCount = Number(recommendationHistory.cookedCount ?? 0);
      const lastUsedAt = recommendationHistory.lastUsedAt ? String(recommendationHistory.lastUsedAt) : null;
      const daysSinceLastUsed = lastUsedAt
        ? Math.max(0, Math.floor((new Date(`${date}T00:00:00.000Z`).getTime() - new Date(lastUsedAt).getTime()) / (1000 * 60 * 60 * 24)))
        : null;
      const repeatCooldownActive = daysSinceLastUsed !== null && daysSinceLastUsed < 7;
      const isFavorite = Boolean(recipe.favorite);
      const isManualDish = recipe.source === 'manual';
      const rotationReason = isManualDish
        ? repeatCooldownActive
          ? 'manual staple is cooling off before it rotates back'
          : 'manual staple rotates back in once recent repeats cool down'
        : isFavorite
          ? 'favorite dish resurfaced because this week fits it well'
          : pantryMatchCount > 0
            ? 'pantry overlap makes this an efficient rotation'
            : null;
      return {
        pantryMatchCount,
        pantryFitScore,
        acceptedCount,
        cookedCount,
        lastUsedAt,
        daysSinceLastUsed,
        repeatCooldownActive,
        isFavorite,
        isManualDish,
        rotationReason,
        whyThisFits: [
          pantryMatchCount > 0 ? `uses ${pantryMatchCount} pantry item${pantryMatchCount === 1 ? '' : 's'} already on hand` : null,
          isFavorite ? 'household favorite worth rotating back in' : null,
          acceptedCount > 0 || cookedCount > 0 ? `backed by household history (${acceptedCount} accepts, ${cookedCount} cooked)` : null,
          rotationReason,
          repeatCooldownActive ? 'recent repeat cooldown applied so staples rotate instead of dominating' : null,
        ].filter(Boolean),
        score: (pantryFitScore * 3) + (acceptedCount * 0.8) + (cookedCount * 0.5) + (isFavorite ? 1.25 : 0) + (isManualDish && !repeatCooldownActive ? 0.8 : 0) - (repeatCooldownActive ? 2 : 0),
      };
    };

    const suggestions = ((planner_payload.days as Array<Record<string, unknown>> | undefined) ?? []).map((day, index) => {
      const rankedRecipes = recipes
        .map((recipe) => ({
          recipe,
          recommendation: scoreRecipe(recipe, String(day.date)),
        }))
        .sort((left, right) => right.recommendation.score - left.recommendation.score || String(left.recipe.title).localeCompare(String(right.recipe.title)));
      const picked = regenerate_slot?.plannedForDate === day.date && regenerate_slot.slot
        ? rankedRecipes.find((item) => !accepted_ids.includes(String(item.recipe.id))) ?? rankedRecipes[0]
        : rankedRecipes[0];
      const recipe = picked?.recipe ?? {};
      const recommendation = picked?.recommendation ?? {
        pantryMatchCount: 0,
        pantryFitScore: 0,
        acceptedCount: 0,
        cookedCount: 0,
        lastUsedAt: null,
        daysSinceLastUsed: null,
        repeatCooldownActive: false,
        isFavorite: false,
        isManualDish: false,
        rotationReason: null,
        whyThisFits: [],
      };

      return {
        id: `suggestion-${index + 1}`,
        householdId: household_id,
        suggestionRunId: 'pending',
        recipeId: recipe.id ?? null,
        title: recipe.title ?? `Suggested meal ${index + 1}`,
        slot: regenerate_slot?.plannedForDate === day.date && regenerate_slot.slot ? regenerate_slot.slot : 'dinner',
        plannedForDate: String(day.date),
        rationale: JSON.stringify({
          prepTimeBucket: day.prepTimeBucket,
          attendanceMemberIds: day.attendanceMemberIds,
          acceptedIds: accepted_ids,
          whyThisFits: recommendation.whyThisFits,
        }),
        servings: Number(day.servings ?? 1),
        attendanceMemberIds: (day.attendanceMemberIds as string[] | undefined) ?? [],
        estimatedCostCents: 1800 + index * 250,
        tags: ['ai', String(day.prepTimeBucket), recommendation.pantryMatchCount > 0 ? 'pantry-fit' : 'history-fit'],
        rank: index + 1,
        recommendation,
      };
    });

    const { data: run, error } = await supabase
      .from('meal_suggestion_runs')
      .insert({
        household_id,
        requested_by: null,
        source_date: planner_payload.startDate ?? new Date().toISOString().slice(0, 10),
        dietary_preferences: [],
        attendance_member_ids: [],
        planner_input: planner_payload,
        suggestions,
        status: 'completed',
        prompt_version: 'phase4-plan06-v1',
        generated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message, suggestions }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(run), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected AI meal plan failure' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
