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

    const suggestions = ((planner_payload.days as Array<Record<string, unknown>> | undefined) ?? []).map((day, index) => ({
      id: `suggestion-${index + 1}`,
      householdId: household_id,
      suggestionRunId: 'pending',
      recipeId: ((planner_payload.recipes as Array<Record<string, unknown>> | undefined) ?? [])[index % (((planner_payload.recipes as Array<Record<string, unknown>> | undefined) ?? []).length || 1)]?.id ?? null,
      title: ((planner_payload.recipes as Array<Record<string, unknown>> | undefined) ?? [])[index % (((planner_payload.recipes as Array<Record<string, unknown>> | undefined) ?? []).length || 1)]?.title ?? `Suggested meal ${index + 1}`,
      slot: regenerate_slot?.plannedForDate === day.date && regenerate_slot.slot ? regenerate_slot.slot : 'dinner',
      plannedForDate: String(day.date),
      rationale: JSON.stringify({
        prepTimeBucket: day.prepTimeBucket,
        attendanceMemberIds: day.attendanceMemberIds,
        acceptedIds: accepted_ids,
      }),
      servings: Number(day.servings ?? 1),
      attendanceMemberIds: (day.attendanceMemberIds as string[] | undefined) ?? [],
      estimatedCostCents: 1800 + index * 250,
      tags: ['ai', String(day.prepTimeBucket), accepted_ids.length > 0 ? 'history' : 'pantry'],
      rank: index + 1,
    }));

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
