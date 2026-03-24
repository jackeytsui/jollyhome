-- ============================================================
-- Phase 6 Intelligence + Polish Schema (part 1)
-- Creates: notification preferences for per-member digest behavior
-- Includes: RLS policies, indexes, updated_at trigger
-- ============================================================

CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_hour SMALLINT NOT NULL DEFAULT 18 CHECK (digest_hour >= 0 AND digest_hour <= 23),
  digest_timezone TEXT NOT NULL DEFAULT 'UTC',
  category_preferences JSONB NOT NULL DEFAULT '{
    "expenses": "digest",
    "chores": "realtime",
    "calendar": "realtime",
    "meals": "digest",
    "supplies": "realtime",
    "maintenance": "realtime",
    "rules": "digest"
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, user_id)
);

CREATE INDEX notification_preferences_household_user_idx
  ON public.notification_preferences(household_id, user_id);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences: members can read own preferences"
  ON public.notification_preferences FOR SELECT
  USING (
    user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "notification_preferences: members can insert own preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "notification_preferences: members can update own preferences"
  ON public.notification_preferences FOR UPDATE
  USING (
    user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE TRIGGER set_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
