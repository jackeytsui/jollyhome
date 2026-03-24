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
    const body = await req.json() as {
      expense: {
        household_id: string;
        description: string;
        amount_cents: number;
        category: string | null;
        paid_by: string;
        split_type: string;
        splits: Array<{ user_id: string; amount_cents: number }>;
        tax_cents?: number;
        tip_cents?: number;
        receipt_url?: string | null;
        expense_date?: string;
      };
      receipt_review_id: string;
      storage_paths?: string[];
      inventory_items?: Array<Record<string, unknown>>;
      shopping_list_match_ids?: string[];
    };

    if (!body?.expense?.household_id || !body.receipt_review_id) {
      return new Response(JSON.stringify({ error: 'expense.household_id and receipt_review_id are required' }), {
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

    const { data, error } = await client.rpc('perform_grocery_receipt_commit', {
      p_household_id: body.expense.household_id,
      p_description: body.expense.description,
      p_amount_cents: body.expense.amount_cents,
      p_category: body.expense.category,
      p_paid_by: body.expense.paid_by,
      p_split_type: body.expense.split_type,
      p_splits: body.expense.splits,
      p_tax_cents: body.expense.tax_cents ?? 0,
      p_tip_cents: body.expense.tip_cents ?? 0,
      p_receipt_url: body.expense.receipt_url ?? body.storage_paths?.[0] ?? null,
      p_expense_date: body.expense.expense_date ?? new Date().toISOString().slice(0, 10),
      p_receipt_review_id: body.receipt_review_id,
      p_storage_paths: body.storage_paths ?? [],
      p_inventory_items: body.inventory_items ?? [],
      p_shopping_list_match_ids: body.shopping_list_match_ids ?? [],
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected grocery receipt commit failure' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
