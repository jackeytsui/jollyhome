-- ============================================================
-- Phase 5 Maintenance + House Rules Schema (part 1)
-- Creates: maintenance requests and timeline updates
-- Includes: RLS policies, indexes, updated_at trigger
-- ============================================================

CREATE TABLE public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  area TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'in_progress', 'resolved')),
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  cost_cents INTEGER CHECK (cost_cents IS NULL OR cost_cents >= 0),
  latest_note TEXT,
  latest_photo_path TEXT,
  appointment_event_id UUID REFERENCES public.calendar_events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.maintenance_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  update_type TEXT NOT NULL CHECK (update_type IN ('note', 'status', 'photo', 'cost', 'appointment', 'general')),
  note TEXT,
  photo_path TEXT,
  from_status TEXT CHECK (from_status IS NULL OR from_status IN ('open', 'claimed', 'in_progress', 'resolved')),
  to_status TEXT CHECK (to_status IS NULL OR to_status IN ('open', 'claimed', 'in_progress', 'resolved')),
  cost_cents INTEGER CHECK (cost_cents IS NULL OR cost_cents >= 0),
  appointment_event_id UUID REFERENCES public.calendar_events(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX maintenance_requests_household_status_idx
  ON public.maintenance_requests(household_id, status, updated_at DESC);

CREATE INDEX maintenance_requests_household_area_idx
  ON public.maintenance_requests(household_id, area, priority);

CREATE INDEX maintenance_updates_household_request_idx
  ON public.maintenance_updates(household_id, request_id, created_at DESC);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maintenance_requests: household members can read"
  ON public.maintenance_requests FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "maintenance_requests: household members can insert"
  ON public.maintenance_requests FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "maintenance_requests: household members can update"
  ON public.maintenance_requests FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "maintenance_updates: household members can read"
  ON public.maintenance_updates FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "maintenance_updates: household members can insert"
  ON public.maintenance_updates FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE TRIGGER set_maintenance_requests_updated_at
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
