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
    const body = await req.json();

    if (!body?.expense?.household_id || !body?.maintenance_request_id || !body?.receipt_review_id) {
      return new Response(JSON.stringify({ error: 'expense.household_id, maintenance_request_id, and receipt_review_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? '',
          },
        },
      }
    );

    const { data: expenseId, error: expenseError } = await client.rpc('create_expense', {
      p_household_id: body.expense.household_id,
      p_description: body.expense.description,
      p_amount_cents: body.expense.amount_cents,
      p_category: body.expense.category,
      p_paid_by: body.expense.paid_by,
      p_split_type: body.expense.split_type,
      p_splits: body.expense.splits,
      p_tax_cents: body.expense.tax_cents ?? 0,
      p_tip_cents: body.expense.tip_cents ?? 0,
      p_is_private: body.expense.is_private ?? false,
      p_receipt_url: body.expense.receipt_url ?? body.storage_paths?.[0] ?? null,
      p_expense_date: body.expense.expense_date ?? new Date().toISOString().slice(0, 10),
    });

    if (expenseError) {
      return new Response(JSON.stringify({ error: expenseError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestUpdates: Record<string, unknown> = {
      cost_cents: body.expense.amount_cents,
      latest_note: body.note ?? 'Repair receipt linked',
    };

    if (body.mark_resolved) {
      requestUpdates.status = 'resolved';
      requestUpdates.resolved_at = new Date().toISOString();
    }

    const { error: requestError } = await client
      .from('maintenance_requests')
      .update(requestUpdates)
      .eq('id', body.maintenance_request_id);

    if (requestError) {
      return new Response(JSON.stringify({ error: requestError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updateLogError } = await client
      .from('maintenance_updates')
      .insert({
        household_id: body.expense.household_id,
        request_id: body.maintenance_request_id,
        update_type: 'cost',
        note: body.note ?? 'Repair receipt linked',
        cost_cents: body.expense.amount_cents,
        metadata: {
          receipt_review_id: body.receipt_review_id,
          expense_id: expenseId,
          storage_paths: body.storage_paths ?? [],
        },
      });

    if (updateLogError) {
      return new Response(JSON.stringify({ error: updateLogError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      expense_id: expenseId,
      maintenance_request_id: body.maintenance_request_id,
      receipt_review_id: body.receipt_review_id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected repair receipt commit failure' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
