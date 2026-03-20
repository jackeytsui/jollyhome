-- ============================================================
-- Phase 1 Foundation Schema
-- Creates: profiles, households, household_members,
--          household_invites, ai_credits tables with RLS
-- ============================================================

-- 1. profiles — extends auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  avatar_type TEXT CHECK (avatar_type IN ('photo', 'illustrated', 'initials')) DEFAULT 'initials',
  dietary_preferences JSONB DEFAULT '[]'::jsonb,
  dietary_notes TEXT,
  active_household_id UUID,
  biometric_enabled BOOLEAN NOT NULL DEFAULT false,
  theme_override TEXT CHECK (theme_override IN ('light', 'dark', 'system')) DEFAULT 'system',
  language_override TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. households
CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  is_sandbox BOOLEAN NOT NULL DEFAULT false,
  join_approval_required BOOLEAN NOT NULL DEFAULT false,
  invite_expiry_days INTEGER DEFAULT 7,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. household_members
CREATE TABLE public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, user_id)
);

-- 4. household_invites
CREATE TABLE public.household_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  use_count INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ai_credits
CREATE TABLE public.ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  credits_used INTEGER NOT NULL DEFAULT 0,
  credits_total INTEGER NOT NULL DEFAULT 50,
  period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()),
  period_end TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);

-- Add foreign key on profiles.active_household_id after households table created
ALTER TABLE public.profiles ADD CONSTRAINT fk_active_household
  FOREIGN KEY (active_household_id) REFERENCES public.households(id) ON DELETE SET NULL;

-- ============================================================
-- Enable Row Level Security on all tables
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: profiles
-- ============================================================

CREATE POLICY "profiles: users can read own profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR id IN (
      SELECT user_id FROM public.household_members
      WHERE household_id IN (
        SELECT household_id FROM public.household_members
        WHERE user_id = auth.uid() AND status = 'active'
      ) AND status = 'active'
    )
  );

CREATE POLICY "profiles: users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- RLS Policies: households
-- ============================================================

CREATE POLICY "households: active members can read"
  ON public.households FOR SELECT
  USING (
    id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "households: authenticated users can create"
  ON public.households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "households: admins can update"
  ON public.households FOR UPDATE
  USING (
    id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================
-- RLS Policies: household_members
-- ============================================================

CREATE POLICY "household_members: active members can read same household"
  ON public.household_members FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members hm2
      WHERE hm2.user_id = auth.uid() AND hm2.status = 'active'
    )
  );

CREATE POLICY "household_members: admins can update"
  ON public.household_members FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members hm2
      WHERE hm2.user_id = auth.uid() AND hm2.role = 'admin' AND hm2.status = 'active'
    )
  );

CREATE POLICY "household_members: user can delete own or admin can delete others"
  ON public.household_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR household_id IN (
      SELECT household_id FROM public.household_members hm2
      WHERE hm2.user_id = auth.uid() AND hm2.role = 'admin' AND hm2.status = 'active'
    )
  );

-- ============================================================
-- RLS Policies: household_invites
-- ============================================================

CREATE POLICY "household_invites: admins can read"
  ON public.household_invites FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "household_invites: admins can insert"
  ON public.household_invites FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "household_invites: admins can delete"
  ON public.household_invites FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- ============================================================
-- RLS Policies: ai_credits
-- ============================================================

CREATE POLICY "ai_credits: users can read own credits"
  ON public.ai_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_credits: users can update own credits"
  ON public.ai_credits FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- SECURITY DEFINER function for invite lookup (unauthenticated users)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_household_invite(invite_token UUID)
RETURNS TABLE (
  id UUID,
  household_id UUID,
  household_name TEXT,
  household_avatar_url TEXT,
  member_count BIGINT,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  use_count INTEGER,
  is_valid BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    hi.id,
    hi.household_id,
    h.name AS household_name,
    h.avatar_url AS household_avatar_url,
    (SELECT COUNT(*) FROM household_members hm WHERE hm.household_id = hi.household_id AND hm.status = 'active') AS member_count,
    hi.expires_at,
    hi.max_uses,
    hi.use_count,
    (hi.expires_at IS NULL OR hi.expires_at > now()) AND (hi.max_uses IS NULL OR hi.use_count < hi.max_uses) AS is_valid
  FROM household_invites hi
  JOIN households h ON h.id = hi.household_id
  WHERE hi.token = invite_token;
$$;

-- ============================================================
-- Trigger: auto-create profile on new user signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Trigger: auto-update updated_at timestamps
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
