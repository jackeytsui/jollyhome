import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReceiptItem {
  name: string;
  price_cents: number;
  classification: 'shared' | 'personal';
  suggested_owner: string | null;
}

interface ReceiptData {
  store_name: string;
  date: string | null;
  items: ReceiptItem[];
  subtotal_cents: number;
  tax_cents: number;
  tip_cents: number;
  total_cents: number;
}

function validateAndSanitizeReceipt(raw: Record<string, unknown>): ReceiptData {
  // Ensure required top-level fields exist with sensible defaults
  const store_name = typeof raw.store_name === 'string' ? raw.store_name : 'Unknown Store';
  const date = typeof raw.date === 'string' ? raw.date : null;
  const subtotal_cents = typeof raw.subtotal_cents === 'number' ? Math.round(raw.subtotal_cents) : 0;
  const tax_cents = typeof raw.tax_cents === 'number' ? Math.round(raw.tax_cents) : 0;
  const tip_cents = typeof raw.tip_cents === 'number' ? Math.round(raw.tip_cents) : 0;
  const total_cents = typeof raw.total_cents === 'number' ? Math.round(raw.total_cents) : subtotal_cents + tax_cents + tip_cents;

  // Validate and sanitize items array
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items: ReceiptItem[] = rawItems.map((item: unknown) => {
    const i = (item ?? {}) as Record<string, unknown>;
    const name = typeof i.name === 'string' ? i.name : 'Unknown Item';
    // Support both price_cents (correct) and price (fallback if AI returns wrong field)
    let price_cents: number;
    if (typeof i.price_cents === 'number') {
      price_cents = Math.round(i.price_cents);
    } else if (typeof i.price === 'number') {
      // If AI returned dollars instead of cents (e.g., 4.99), convert
      price_cents = i.price < 100 ? Math.round(i.price * 100) : Math.round(i.price);
    } else {
      price_cents = 0;
    }
    const classification: 'shared' | 'personal' =
      i.classification === 'personal' ? 'personal' : 'shared';
    const suggested_owner = typeof i.suggested_owner === 'string' ? i.suggested_owner : null;

    return { name, price_cents, classification, suggested_owner };
  });

  return { store_name, date, items, subtotal_cents, tax_cents, tip_cents, total_cents };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { storage_paths, household_id, member_names } = await req.json() as {
      storage_paths: string[];
      household_id: string;
      member_names: string[];
    };

    if (!storage_paths || !Array.isArray(storage_paths) || storage_paths.length === 0) {
      return new Response(
        JSON.stringify({ error: 'storage_paths must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!household_id) {
      return new Response(
        JSON.stringify({ error: 'household_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key for storage access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check AI credits before calling OpenAI (receipt OCR = 2 credits)
    const { data: creditsData, error: creditsError } = await supabase
      .from('ai_credits')
      .select('credits_remaining')
      .eq('household_id', household_id)
      .single();

    if (creditsError && creditsError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({ error: 'Failed to check AI credits', details: creditsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const credits_remaining = creditsData?.credits_remaining ?? 0;
    if (credits_remaining < 2) {
      return new Response(
        JSON.stringify({ error: 'Insufficient AI credits', credits_remaining }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download each image as base64
    const imageContents: { type: 'image_url'; image_url: { url: string } }[] = [];

    for (const storagePath of storage_paths) {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('receipts')
        .createSignedUrl(storagePath, 60);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        return new Response(
          JSON.stringify({ error: 'Failed to generate signed URL', details: signedUrlError?.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch the image from the signed URL
      const imageResponse = await fetch(signedUrlData.signedUrl);
      if (!imageResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch image from storage' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      const contentType = imageResponse.headers.get('content-type') ?? 'image/jpeg';

      imageContents.push({
        type: 'image_url',
        image_url: { url: `data:${contentType};base64,${base64Image}` },
      });
    }

    const memberNamesStr = Array.isArray(member_names) && member_names.length > 0
      ? member_names.join(', ')
      : 'household members';

    const systemPrompt = `You are a receipt parsing assistant. Extract structured data from the receipt image(s).
Return JSON exactly matching this schema:
{
  "store_name": string,
  "date": "YYYY-MM-DD" | null,
  "items": [{ "name": string, "price_cents": integer, "classification": "shared"|"personal", "suggested_owner": string|null }],
  "subtotal_cents": integer,
  "tax_cents": integer,
  "tip_cents": integer,
  "total_cents": integer
}
Household members for classification hints: ${memberNamesStr}
Classify items as "personal" if they are clearly individual (e.g., specific medications, personal care items with a single person's name).
Default to "shared" for food, household supplies, and anything ambiguous.
All prices must be in cents (integer). $4.99 = 499.
If multiple images are provided, they are pages of the same receipt — combine items from all pages.`;

    // Call OpenAI API directly via fetch (no SDK)
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please extract all data from this receipt.' },
              ...imageContents,
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.text();
      return new Response(
        JSON.stringify({ error: 'Failed to process receipt', details: errorBody }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json() as {
      choices: { message: { content: string } }[];
    };

    const rawContent = openaiData.choices?.[0]?.message?.content;
    if (!rawContent) {
      return new Response(
        JSON.stringify({ error: 'Failed to process receipt', details: 'Empty response from AI' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsedReceipt: Record<string, unknown>;
    try {
      parsedReceipt = JSON.parse(rawContent);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Failed to process receipt', details: 'AI returned invalid JSON' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize the response shape (Pitfall 7)
    const validatedReceipt = validateAndSanitizeReceipt(parsedReceipt);

    // Deduct 2 AI credits after successful OCR
    const { error: deductError } = await supabase
      .from('ai_credits')
      .update({ credits_remaining: credits_remaining - 2 })
      .eq('household_id', household_id);

    if (deductError) {
      // Log but don't fail — receipt was processed successfully
      console.error('Failed to deduct AI credits:', deductError.message);
    }

    const newCreditsRemaining = credits_remaining - 2;

    return new Response(
      JSON.stringify({ ...validatedReceipt, credits_remaining: newCreditsRemaining }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to process receipt', details: errorMessage }),
      { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
