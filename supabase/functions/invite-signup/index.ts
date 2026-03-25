import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeCode(input: string) {
  return input.trim().toUpperCase();
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Server auth configuration is incomplete.' }, 500);
    }

    const {
      invite_code,
      email,
      password,
      display_name,
    } = (await req.json()) as {
      invite_code?: string;
      email?: string;
      password?: string;
      display_name?: string;
    };

    if (!invite_code || !email || !password || !display_name) {
      return jsonResponse({ error: 'invite_code, email, password, and display_name are required.' }, 400);
    }

    if (password.length < 8) {
      return jsonResponse({ error: 'Password must be at least 8 characters.' }, 400);
    }

    const normalizedCode = normalizeCode(invite_code);
    const normalizedEmail = email.trim().toLowerCase();

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: codeRow, error: codeError } = await admin
      .from('beta_access_codes')
      .select('id, code, active, max_uses, used_count, expires_at')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (codeError) {
      return jsonResponse({ error: 'Unable to validate invite code right now.' }, 500);
    }

    if (!codeRow) {
      return jsonResponse({ error: 'That invite code is not valid.' }, 400);
    }

    if (!codeRow.active) {
      return jsonResponse({ error: 'That invite code is not active.' }, 400);
    }

    if (codeRow.expires_at && new Date(codeRow.expires_at).getTime() < Date.now()) {
      return jsonResponse({ error: 'That invite code has expired.' }, 400);
    }

    if (codeRow.used_count >= codeRow.max_uses) {
      return jsonResponse({ error: 'That invite code has already been fully used.' }, 400);
    }

    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        display_name,
        invite_code: normalizedCode,
      },
    });

    if (createError) {
      if (createError.message.toLowerCase().includes('already')) {
        return jsonResponse({ error: 'An account with that email already exists.' }, 409);
      }
      return jsonResponse({ error: createError.message }, 400);
    }

    const nextUsedCount = codeRow.used_count + 1;

    const { error: updateError } = await admin
      .from('beta_access_codes')
      .update({ used_count: nextUsedCount })
      .eq('id', codeRow.id);

    if (updateError) {
      return jsonResponse({ error: 'User created, but invite tracking failed. Please contact support before proceeding.' }, 500);
    }

    await admin.from('beta_access_redemptions').insert({
      beta_access_code_id: codeRow.id,
      email: normalizedEmail,
      user_id: userData.user?.id ?? null,
    });

    return jsonResponse({
      user_id: userData.user?.id ?? null,
      email: normalizedEmail,
      invite_code: normalizedCode,
      email_confirmation_required: false,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected invite signup failure.' },
      500
    );
  }
});
