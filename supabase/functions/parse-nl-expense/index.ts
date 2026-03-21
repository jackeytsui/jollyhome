import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface HouseholdMember {
  id: string;
  name: string;
}

interface ParseNLExpenseBody {
  sentence: string;
  household_members: HouseholdMember[];
  default_currency: string;
}

interface ParsedExpense {
  description: string;
  amount_cents: number | null;
  split_type: 'equal' | 'percentage' | 'exact';
  members: string[] | null;
  category: string | null;
  confidence_flags: string[];
  credits_remaining?: number;
}

async function decrementAiCredits(
  supabase: ReturnType<typeof createClient>,
  householdId: string
): Promise<number | undefined> {
  // Fetch current credits
  const { data: before } = await supabase
    .from('ai_credits')
    .select('credits_remaining')
    .eq('household_id', householdId)
    .single();

  if (!before) return undefined;

  const newCount = Math.max(0, (before.credits_remaining as number) - 1);

  const { data: after } = await supabase
    .from('ai_credits')
    .update({ credits_remaining: newCount })
    .eq('household_id', householdId)
    .select('credits_remaining')
    .single();

  return (after?.credits_remaining as number | undefined);
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate user JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ParseNLExpenseBody = await req.json();
    const { sentence, household_members: members } = body;

    if (!sentence || typeof sentence !== 'string' || sentence.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'sentence is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve household for AI credits check
    const { data: membership } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    const householdId: string | undefined = membership?.household_id;

    // Check AI credits before calling OpenAI (NL parsing costs 1 credit)
    if (householdId) {
      const { data: credits } = await supabase
        .from('ai_credits')
        .select('credits_remaining')
        .eq('household_id', householdId)
        .single();

      if (credits && (credits.credits_remaining as number) < 1) {
        return new Response(
          JSON.stringify({
            error: 'Insufficient AI credits',
            credits_remaining: credits.credits_remaining,
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const memberNames = members.map((m) => m.name).join(', ');
    const systemPrompt = `You are Jolly, a friendly expense tracking assistant. Parse the user's sentence into structured expense data.
Return JSON matching this schema:
{
  "description": string (brief expense description),
  "amount_cents": integer | null (dollar amount converted to cents, e.g., $42.50 = 4250),
  "split_type": "equal" | "percentage" | "exact",
  "members": string[] | null (names of members to split with, null = all),
  "category": string | null (one of: Groceries, Dining, Utilities, Rent, Transport, Entertainment, Healthcare, Household, Other),
  "confidence_flags": string[] (fields you guessed rather than extracted from the sentence)
}
Household members: ${memberNames || 'no members listed'}
Rules:
- If no amount specified, set amount_cents to null and add "amount_cents" to confidence_flags
- If no members specified, set members to null (means split with everyone) and add "members" to confidence_flags
- If no split type specified, default to "equal" and add "split_type" to confidence_flags
- Extract amounts like "$42", "42 dollars", "42.50" correctly
- "split with Jake" means members = ["Jake"]
- "Sarah pays 40%" means percentage split with Sarah at 40%
- Always default to "equal" split unless explicitly stated otherwise`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sentence },
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI error:', errorText);
      return new Response(
        JSON.stringify({ error: 'AI parsing failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json();
    const rawContent: string | undefined = openaiData.choices?.[0]?.message?.content;
    if (!rawContent) {
      return new Response(
        JSON.stringify({ error: 'Empty response from AI' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsed: Partial<{
      description: string;
      amount_cents: number | null;
      split_type: string;
      members: string[] | null;
      category: string | null;
      confidence_flags: string[];
    }>;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON from AI' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize response — guarantee output shape
    const description: string = typeof parsed.description === 'string' && parsed.description
      ? parsed.description
      : sentence.trim();

    const amount_cents: number | null =
      typeof parsed.amount_cents === 'number' && parsed.amount_cents > 0
        ? Math.round(parsed.amount_cents)
        : null;

    const VALID_SPLIT_TYPES = ['equal', 'percentage', 'exact'] as const;
    const split_type: 'equal' | 'percentage' | 'exact' = VALID_SPLIT_TYPES.includes(
      parsed.split_type as 'equal' | 'percentage' | 'exact'
    )
      ? (parsed.split_type as 'equal' | 'percentage' | 'exact')
      : 'equal';

    const confidence_flags: string[] = Array.isArray(parsed.confidence_flags)
      ? parsed.confidence_flags.filter((f) => typeof f === 'string')
      : [];

    // Map member names back to IDs from the household_members input
    let memberIds: string[] | null = null;
    if (Array.isArray(parsed.members) && parsed.members.length > 0) {
      const resolvedIds: string[] = [];
      for (const name of parsed.members) {
        const nameLower = name.toLowerCase().trim();
        const match = members.find((m) => {
          const mLower = m.name.toLowerCase().trim();
          return mLower === nameLower || mLower.includes(nameLower) || nameLower.includes(mLower);
        });
        if (match) {
          resolvedIds.push(match.id);
        }
      }
      memberIds = resolvedIds.length > 0 ? resolvedIds : null;
    }

    const category: string | null =
      typeof parsed.category === 'string' && parsed.category ? parsed.category : null;

    // Deduct 1 AI credit after successful parse
    let creditsRemaining: number | undefined;
    if (householdId) {
      creditsRemaining = await decrementAiCredits(supabase, householdId);
    }

    const result: ParsedExpense = {
      description,
      amount_cents,
      split_type,
      members: memberIds,
      category,
      confidence_flags,
      ...(creditsRemaining !== undefined ? { credits_remaining: creditsRemaining } : {}),
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('parse-nl-expense error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
