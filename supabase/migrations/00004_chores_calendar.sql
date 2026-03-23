-- ============================================================
-- Phase 3 Chores + Calendar Schema
-- Creates: chore templates/assignments/instances/completions,
--          fairness inputs, calendar events, RSVPs, attendance
-- Includes: RLS policies, indexes, storage policies, RPC helpers
-- ============================================================

-- 1. chore_templates
CREATE TABLE public.chore_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  area TEXT,
  estimated_minutes INTEGER NOT NULL DEFAULT 15 CHECK (estimated_minutes > 0),
  recurrence_rule TEXT,
  recurrence_timezone TEXT NOT NULL DEFAULT 'UTC',
  recurrence_anchor TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_occurrence_at TIMESTAMPTZ,
  last_completed_at TIMESTAMPTZ,
  kind TEXT NOT NULL DEFAULT 'responsibility' CHECK (kind IN ('responsibility', 'bonus')),
  icon_key TEXT,
  visual_weight TEXT NOT NULL DEFAULT 'medium' CHECK (visual_weight IN ('light', 'medium', 'strong')),
  gamification_enabled BOOLEAN NOT NULL DEFAULT false,
  point_value INTEGER NOT NULL DEFAULT 0 CHECK (point_value >= 0),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. chore_assignments
CREATE TABLE public.chore_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.chore_templates(id) ON DELETE CASCADE,
  instance_id UUID,
  member_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_for TIMESTAMPTZ,
  assignment_status TEXT NOT NULL DEFAULT 'assigned' CHECK (assignment_status IN ('suggested', 'assigned', 'accepted', 'declined', 'skipped')),
  assignment_reason TEXT,
  suggested_by TEXT NOT NULL DEFAULT 'manual' CHECK (suggested_by IN ('ai', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. chore_instances
CREATE TABLE public.chore_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.chore_templates(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ,
  due_window_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'completed', 'skipped')),
  projected_from_recurrence BOOLEAN NOT NULL DEFAULT false,
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chore_assignments
  ADD CONSTRAINT chore_assignments_instance_id_fkey
  FOREIGN KEY (instance_id) REFERENCES public.chore_instances(id) ON DELETE CASCADE;

-- 4. chore_completions
CREATE TABLE public.chore_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.chore_templates(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES public.chore_instances(id) ON DELETE CASCADE,
  completed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actual_minutes INTEGER CHECK (actual_minutes >= 0),
  note TEXT,
  photo_path TEXT,
  condition_state_at_completion TEXT CHECK (condition_state_at_completion IN ('green', 'yellow', 'red')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. member_energy_entries
CREATE TABLE public.member_energy_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  energy_level TEXT NOT NULL CHECK (energy_level IN ('low', 'medium', 'high')),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, member_user_id, effective_date)
);

-- 6. member_chore_preferences
CREATE TABLE public.member_chore_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.chore_templates(id) ON DELETE CASCADE,
  area TEXT,
  preference_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  preferred BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. household_chore_settings
CREATE TABLE public.household_chore_settings (
  household_id UUID PRIMARY KEY REFERENCES public.households(id) ON DELETE CASCADE,
  gamification_enabled BOOLEAN NOT NULL DEFAULT false,
  streaks_enabled BOOLEAN NOT NULL DEFAULT false,
  leaderboard_enabled BOOLEAN NOT NULL DEFAULT false,
  bonus_claim_window_hours INTEGER NOT NULL DEFAULT 24 CHECK (bonus_claim_window_hours > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. calendar_events
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL DEFAULT 'event' CHECK (activity_type IN ('event', 'meal', 'maintenance', 'guest', 'quiet_hours', 'booking')),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  all_day BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  recurrence_timezone TEXT NOT NULL DEFAULT 'UTC',
  recurrence_anchor TIMESTAMPTZ NOT NULL DEFAULT now(),
  icon_key TEXT,
  visual_weight TEXT NOT NULL DEFAULT 'strong' CHECK (visual_weight IN ('light', 'medium', 'strong')),
  owner_member_user_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at >= starts_at)
);

-- 9. event_rsvps
CREATE TABLE public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  responded_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, member_user_id)
);

-- 10. member_attendance
CREATE TABLE public.member_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('home_tonight', 'away_tonight')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, member_user_id, attendance_date)
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX chore_templates_household_idx ON public.chore_templates(household_id, is_archived, next_occurrence_at);
CREATE INDEX chore_assignments_household_member_idx ON public.chore_assignments(household_id, member_user_id, assignment_status);
CREATE INDEX chore_instances_household_status_idx ON public.chore_instances(household_id, status, scheduled_for);
CREATE INDEX chore_completions_household_completed_idx ON public.chore_completions(household_id, completed_at DESC);
CREATE INDEX member_energy_entries_household_date_idx ON public.member_energy_entries(household_id, effective_date DESC);
CREATE INDEX member_chore_preferences_household_member_idx ON public.member_chore_preferences(household_id, member_user_id);
CREATE INDEX calendar_events_household_range_idx ON public.calendar_events(household_id, starts_at, ends_at);
CREATE INDEX calendar_events_household_activity_idx ON public.calendar_events(household_id, activity_type);
CREATE INDEX event_rsvps_household_status_idx ON public.event_rsvps(household_id, status);
CREATE INDEX member_attendance_household_date_idx ON public.member_attendance(household_id, attendance_date DESC, status);

-- ============================================================
-- Enable Row Level Security
-- ============================================================

ALTER TABLE public.chore_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chore_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chore_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chore_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_energy_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_chore_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_chore_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_attendance ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Household-scoped RLS policies
-- ============================================================

CREATE POLICY "chore_templates: household members can read"
  ON public.chore_templates FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "chore_templates: household members can insert"
  ON public.chore_templates FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "chore_templates: household members can update"
  ON public.chore_templates FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "chore_assignments: household members can read"
  ON public.chore_assignments FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "chore_assignments: household members can insert"
  ON public.chore_assignments FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "chore_assignments: household members can update"
  ON public.chore_assignments FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "chore_instances: household members can read"
  ON public.chore_instances FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "chore_instances: household members can insert"
  ON public.chore_instances FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "chore_instances: household members can update"
  ON public.chore_instances FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "chore_completions: household members can read"
  ON public.chore_completions FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "chore_completions: household members can insert"
  ON public.chore_completions FOR INSERT
  WITH CHECK (
    completed_by = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "member_energy_entries: member can read same household"
  ON public.member_energy_entries FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "member_energy_entries: member can upsert own rows"
  ON public.member_energy_entries FOR INSERT
  WITH CHECK (
    member_user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "member_energy_entries: member can update own rows"
  ON public.member_energy_entries FOR UPDATE
  USING (member_user_id = auth.uid());

CREATE POLICY "member_chore_preferences: household members can read"
  ON public.member_chore_preferences FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "member_chore_preferences: member can manage own preferences"
  ON public.member_chore_preferences FOR INSERT
  WITH CHECK (
    member_user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "member_chore_preferences: member can update own preferences"
  ON public.member_chore_preferences FOR UPDATE
  USING (member_user_id = auth.uid());

CREATE POLICY "household_chore_settings: household members can read"
  ON public.household_chore_settings FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "household_chore_settings: admins can manage"
  ON public.household_chore_settings FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "household_chore_settings: admins can update"
  ON public.household_chore_settings FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "calendar_events: household members can read"
  ON public.calendar_events FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "calendar_events: household members can insert"
  ON public.calendar_events FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "calendar_events: household members can update"
  ON public.calendar_events FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "event_rsvps: household members can read"
  ON public.event_rsvps FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "event_rsvps: member can manage own RSVP"
  ON public.event_rsvps FOR INSERT
  WITH CHECK (
    member_user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "event_rsvps: member can update own RSVP"
  ON public.event_rsvps FOR UPDATE
  USING (member_user_id = auth.uid());

CREATE POLICY "member_attendance: household members can read"
  ON public.member_attendance FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "member_attendance: member can manage own attendance"
  ON public.member_attendance FOR INSERT
  WITH CHECK (
    member_user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "member_attendance: member can update own attendance"
  ON public.member_attendance FOR UPDATE
  USING (member_user_id = auth.uid());

-- ============================================================
-- Optional chore photo bucket and storage policies
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'chore-photos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('chore-photos', 'chore-photos', false);
  END IF;
END $$;

CREATE POLICY "storage: household members can read chore photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chore-photos'
    AND split_part(name, '/', 1) IN (
      SELECT household_id::text FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "storage: household members can upload chore photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chore-photos'
    AND owner = auth.uid()
    AND split_part(name, '/', 1) IN (
      SELECT household_id::text FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "storage: owner can update chore photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'chore-photos' AND owner = auth.uid());

CREATE POLICY "storage: owner can delete chore photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chore-photos' AND owner = auth.uid());

-- ============================================================
-- RPC helpers
-- ============================================================

CREATE OR REPLACE FUNCTION public.complete_chore_instance(
  p_instance_id UUID,
  p_actual_minutes INTEGER DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_photo_path TEXT DEFAULT NULL,
  p_condition_state TEXT DEFAULT NULL
)
RETURNS public.chore_completions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instance public.chore_instances%ROWTYPE;
  v_template public.chore_templates%ROWTYPE;
  v_completion public.chore_completions%ROWTYPE;
BEGIN
  SELECT * INTO v_instance
  FROM public.chore_instances
  WHERE id = p_instance_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chore instance not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = v_instance.household_id
      AND user_id = auth.uid()
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized for this household';
  END IF;

  IF v_instance.status NOT IN ('open', 'claimed') THEN
    RAISE EXCEPTION 'Chore instance is not completable';
  END IF;

  SELECT * INTO v_template
  FROM public.chore_templates
  WHERE id = v_instance.template_id;

  INSERT INTO public.chore_completions (
    household_id,
    template_id,
    instance_id,
    completed_by,
    completed_at,
    actual_minutes,
    note,
    photo_path,
    condition_state_at_completion
  )
  VALUES (
    v_instance.household_id,
    v_instance.template_id,
    v_instance.id,
    auth.uid(),
    now(),
    p_actual_minutes,
    p_note,
    p_photo_path,
    p_condition_state
  )
  RETURNING * INTO v_completion;

  UPDATE public.chore_instances
  SET
    status = 'completed',
    claimed_by = COALESCE(claimed_by, auth.uid()),
    claimed_at = COALESCE(claimed_at, now()),
    updated_at = now()
  WHERE id = v_instance.id;

  UPDATE public.chore_templates
  SET
    last_completed_at = v_completion.completed_at,
    updated_at = now()
  WHERE id = v_template.id;

  RETURN v_completion;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_bonus_chore(
  p_instance_id UUID
)
RETURNS public.chore_instances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instance public.chore_instances%ROWTYPE;
  v_template public.chore_templates%ROWTYPE;
BEGIN
  SELECT * INTO v_instance
  FROM public.chore_instances
  WHERE id = p_instance_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chore instance not found';
  END IF;

  SELECT * INTO v_template
  FROM public.chore_templates
  WHERE id = v_instance.template_id;

  IF v_template.kind <> 'bonus' THEN
    RAISE EXCEPTION 'Only bonus chores can be claimed';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = v_instance.household_id
      AND user_id = auth.uid()
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized for this household';
  END IF;

  UPDATE public.chore_instances
  SET
    status = 'claimed',
    claimed_by = auth.uid(),
    claimed_at = now(),
    updated_at = now()
  WHERE id = v_instance.id
    AND status = 'open'
  RETURNING * INTO v_instance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bonus chore is no longer claimable';
  END IF;

  INSERT INTO public.chore_assignments (
    household_id,
    template_id,
    instance_id,
    member_user_id,
    assigned_for,
    assignment_status,
    assignment_reason,
    suggested_by
  )
  VALUES (
    v_instance.household_id,
    v_instance.template_id,
    v_instance.id,
    auth.uid(),
    v_instance.scheduled_for,
    'accepted',
    'bonus claim',
    'manual'
  );

  RETURN v_instance;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_attendance_status(
  p_household_id UUID,
  p_attendance_date DATE,
  p_status TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS public.member_attendance
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attendance public.member_attendance%ROWTYPE;
BEGIN
  IF p_status NOT IN ('home_tonight', 'away_tonight') THEN
    RAISE EXCEPTION 'Invalid attendance status';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = p_household_id
      AND user_id = auth.uid()
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized for this household';
  END IF;

  INSERT INTO public.member_attendance (
    household_id,
    member_user_id,
    attendance_date,
    status,
    note,
    created_at,
    updated_at
  )
  VALUES (
    p_household_id,
    auth.uid(),
    p_attendance_date,
    p_status,
    p_note,
    now(),
    now()
  )
  ON CONFLICT (household_id, member_user_id, attendance_date)
  DO UPDATE SET
    status = EXCLUDED.status,
    note = EXCLUDED.note,
    updated_at = now()
  RETURNING * INTO v_attendance;

  RETURN v_attendance;
END;
$$;

-- ============================================================
-- Realtime publication additions
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.chore_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chore_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chore_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chore_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.member_energy_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.member_chore_preferences;
ALTER PUBLICATION supabase_realtime ADD TABLE public.household_chore_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rsvps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.member_attendance;
