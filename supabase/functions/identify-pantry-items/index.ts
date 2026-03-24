import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image_uri } = await req.json() as { image_uri: string };

    const review_items = [
      { label: 'Greek Yogurt', confidence: 0.91, quantity: 1, unit: 'count' },
      { label: 'Spinach', confidence: 0.76, quantity: 1, unit: 'package' },
      { label: 'Mystery Sauce', confidence: 0.42, quantity: 1, unit: 'bottle' },
    ];

    return new Response(JSON.stringify({ image_uri, review_items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected pantry identification failure' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
