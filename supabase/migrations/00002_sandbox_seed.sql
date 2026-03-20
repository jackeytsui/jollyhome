-- ============================================================
-- Phase 1: Sandbox / Demo Mode
-- Creates: sandbox_data table with RLS
--          create_sandbox_data() and clear_sandbox_data() functions
-- ============================================================

-- 1. sandbox_data table (top-level DDL — NOT inside function body)
CREATE TABLE IF NOT EXISTS public.sandbox_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL, -- 'expense', 'chore', 'meal', 'event', 'member'
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. RLS on sandbox_data (top-level DDL)
ALTER TABLE public.sandbox_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sandbox_data_read" ON public.sandbox_data FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "sandbox_data_delete" ON public.sandbox_data FOR DELETE
  USING (household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "sandbox_data_insert" ON public.sandbox_data FOR INSERT
  WITH CHECK (household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- ============================================================
-- Seed function — ONLY DML inside the function body
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_sandbox_data(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
BEGIN
  -- Create sandbox household
  INSERT INTO households (name, is_sandbox, created_by)
  VALUES ('Demo Household', true, p_user_id)
  RETURNING id INTO v_household_id;

  -- Add user as admin member
  INSERT INTO household_members (household_id, user_id, role, status)
  VALUES (v_household_id, p_user_id, 'admin', 'active');

  -- Set as active household on profile
  UPDATE profiles SET active_household_id = v_household_id WHERE id = p_user_id;

  -- Seed demo household members (stored in sandbox_data, not real members)
  INSERT INTO sandbox_data (household_id, data_type, data) VALUES
    (v_household_id, 'member', '{"name": "Alex", "avatar_initials": "A", "dietary": ["vegetarian"]}'),
    (v_household_id, 'member', '{"name": "Sam", "avatar_initials": "S", "dietary": ["gluten-free"]}'),
    (v_household_id, 'member', '{"name": "Jordan", "avatar_initials": "J", "dietary": []}');

  -- Seed demo expenses
  INSERT INTO sandbox_data (household_id, data_type, data) VALUES
    (v_household_id, 'expense', '{"description": "Groceries at Trader Joe''s", "amount": 87.50, "category": "groceries", "paid_by": "You", "split": "equal", "date": "2 days ago"}'),
    (v_household_id, 'expense', '{"description": "Electric bill - March", "amount": 142.00, "category": "utilities", "paid_by": "Alex", "split": "equal", "date": "5 days ago"}'),
    (v_household_id, 'expense', '{"description": "Pizza night", "amount": 35.00, "category": "dining", "paid_by": "Sam", "split": "equal", "date": "1 week ago"}'),
    (v_household_id, 'expense', '{"description": "Cleaning supplies", "amount": 28.99, "category": "household", "paid_by": "You", "split": "equal", "date": "1 week ago"}');

  -- Seed demo chores
  INSERT INTO sandbox_data (household_id, data_type, data) VALUES
    (v_household_id, 'chore', '{"title": "Vacuum living room", "area": "Living Room", "assigned_to": "You", "condition": "yellow", "last_done": "4 days ago"}'),
    (v_household_id, 'chore', '{"title": "Clean bathroom", "area": "Bathroom", "assigned_to": "Alex", "condition": "red", "last_done": "8 days ago"}'),
    (v_household_id, 'chore', '{"title": "Take out trash", "area": "Kitchen", "assigned_to": "Sam", "condition": "green", "last_done": "today"}'),
    (v_household_id, 'chore', '{"title": "Do dishes", "area": "Kitchen", "assigned_to": "Jordan", "condition": "yellow", "last_done": "2 days ago"}');

  -- Seed demo meals
  INSERT INTO sandbox_data (household_id, data_type, data) VALUES
    (v_household_id, 'meal', '{"name": "Pasta Primavera", "day": "Monday", "type": "dinner", "prep_time": "30 min"}'),
    (v_household_id, 'meal', '{"name": "Chicken Stir Fry", "day": "Tuesday", "type": "dinner", "prep_time": "25 min"}'),
    (v_household_id, 'meal', '{"name": "Taco Night", "day": "Wednesday", "type": "dinner", "prep_time": "20 min"}');

  -- Seed demo calendar events
  INSERT INTO sandbox_data (household_id, data_type, data) VALUES
    (v_household_id, 'event', '{"title": "House Meeting", "date": "This Saturday", "time": "10:00 AM", "type": "event"}'),
    (v_household_id, 'event', '{"title": "Quiet Hours", "date": "Daily", "time": "10 PM - 8 AM", "type": "quiet_hours"}');

  RETURN v_household_id;
END;
$$;

-- ============================================================
-- Clear function — removes sandbox household and all related data
-- ============================================================

CREATE OR REPLACE FUNCTION public.clear_sandbox_data(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Delete sandbox households (CASCADE deletes members, invites, sandbox_data)
  DELETE FROM households
  WHERE created_by = p_user_id AND is_sandbox = true;

  -- Restore active_household_id to a real (non-sandbox) household, or NULL
  UPDATE profiles
  SET active_household_id = (
    SELECT hm.household_id
    FROM household_members hm
    JOIN households h ON h.id = hm.household_id
    WHERE hm.user_id = p_user_id
      AND hm.status = 'active'
      AND h.is_sandbox = false
    LIMIT 1
  )
  WHERE id = p_user_id;
END;
$$;
