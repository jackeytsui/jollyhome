-- Phase 07 follow-up: closed beta invite codes
-- Purpose: keep account creation invitation-only for user testing batches

CREATE TABLE IF NOT EXISTS public.beta_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  batch_label TEXT,
  note TEXT,
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beta_access_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beta_access_code_id UUID NOT NULL REFERENCES public.beta_access_codes(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS beta_access_codes_active_idx
  ON public.beta_access_codes(active, expires_at, code);

CREATE INDEX IF NOT EXISTS beta_access_redemptions_code_idx
  ON public.beta_access_redemptions(beta_access_code_id, redeemed_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS beta_access_redemptions_email_code_idx
  ON public.beta_access_redemptions(beta_access_code_id, lower(email));

CREATE TRIGGER set_beta_access_codes_updated_at
  BEFORE UPDATE ON public.beta_access_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.beta_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_access_redemptions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.beta_access_codes IS 'Invitation-only beta access codes for closed user testing.';
COMMENT ON TABLE public.beta_access_redemptions IS 'Audit log of beta code redemptions.';
