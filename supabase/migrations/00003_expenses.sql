-- ============================================================
-- Phase 2 Expense Schema
-- Creates: split_presets, payment_preferences, recurring_expense_templates,
--          expenses, expense_splits, expense_versions, settlements,
--          expense_disputes, dispute_comments
-- Includes: RLS policies, RPC functions, indexes, Realtime publication
-- ============================================================

-- 1. split_presets (referenced by expenses and recurring_expense_templates)
CREATE TABLE public.split_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shares JSONB NOT NULL,  -- [{"user_id": "...", "percentage": 40}, ...]
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. payment_preferences
CREATE TABLE public.payment_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_app TEXT CHECK (preferred_app IN ('venmo', 'cashapp', 'paypal', 'zelle')),
  venmo_username TEXT,
  cashapp_username TEXT,
  paypal_email TEXT,
  zelle_identifier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. recurring_expense_templates
CREATE TABLE public.recurring_expense_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  category TEXT,
  split_type TEXT NOT NULL,
  split_preset_id UUID REFERENCES public.split_presets(id),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  custom_interval_days INTEGER,
  next_due_date DATE NOT NULL,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  split_config JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT,
  paid_by UUID NOT NULL REFERENCES auth.users(id),
  split_type TEXT NOT NULL CHECK (split_type IN ('equal', 'percentage', 'exact', 'shares', 'preset')),
  split_preset_id UUID REFERENCES public.split_presets(id),
  tax_cents INTEGER NOT NULL DEFAULT 0,
  tip_cents INTEGER NOT NULL DEFAULT 0,
  is_private BOOLEAN NOT NULL DEFAULT false,
  receipt_url TEXT,
  recurring_template_id UUID REFERENCES public.recurring_expense_templates(id),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. expense_splits
CREATE TABLE public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  is_personal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. expense_versions (audit trail)
CREATE TABLE public.expense_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'edited', 'deleted')),
  previous_data JSONB,
  changed_fields TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. settlements
CREATE TABLE public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  to_user_id UUID NOT NULL REFERENCES auth.users(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  payment_method TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. expense_disputes
CREATE TABLE public.expense_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 9. dispute_comments
CREATE TABLE public.dispute_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.expense_disputes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Enable Row Level Security on ALL tables
-- ============================================================

ALTER TABLE public.split_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expense_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: expenses
-- ============================================================

CREATE POLICY "expenses: household members can read non-private"
  ON public.expenses FOR SELECT
  USING (
    deleted_at IS NULL
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND (
      is_private = false
      OR id IN (
        SELECT expense_id FROM public.expense_splits
        WHERE user_id = auth.uid()
      )
      OR paid_by = auth.uid()
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "expenses: creator can insert"
  ON public.expenses FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "expenses: creator can update"
  ON public.expenses FOR UPDATE
  USING (created_by = auth.uid());

-- ============================================================
-- RLS Policies: expense_splits
-- ============================================================

CREATE POLICY "expense_splits: member can read"
  ON public.expense_splits FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE deleted_at IS NULL
        AND household_id IN (
          SELECT household_id FROM public.household_members
          WHERE user_id = auth.uid() AND status = 'active'
        )
        AND (
          is_private = false
          OR id IN (SELECT expense_id FROM public.expense_splits WHERE user_id = auth.uid())
          OR paid_by = auth.uid()
          OR created_by = auth.uid()
        )
    )
  );

CREATE POLICY "expense_splits: creator can insert"
  ON public.expense_splits FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT id FROM public.expenses WHERE created_by = auth.uid()
    )
  );

-- ============================================================
-- RLS Policies: expense_versions
-- ============================================================

CREATE POLICY "expense_versions: member can read"
  ON public.expense_versions FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE deleted_at IS NULL
        AND household_id IN (
          SELECT household_id FROM public.household_members
          WHERE user_id = auth.uid() AND status = 'active'
        )
    )
  );

CREATE POLICY "expense_versions: creator can insert"
  ON public.expense_versions FOR INSERT
  WITH CHECK (changed_by = auth.uid());

-- ============================================================
-- RLS Policies: settlements
-- ============================================================

CREATE POLICY "settlements: household members can read"
  ON public.settlements FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "settlements: household members can insert"
  ON public.settlements FOR INSERT
  WITH CHECK (
    from_user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================
-- RLS Policies: expense_disputes
-- ============================================================

CREATE POLICY "expense_disputes: member can read"
  ON public.expense_disputes FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE deleted_at IS NULL
        AND household_id IN (
          SELECT household_id FROM public.household_members
          WHERE user_id = auth.uid() AND status = 'active'
        )
    )
  );

CREATE POLICY "expense_disputes: member can insert"
  ON public.expense_disputes FOR INSERT
  WITH CHECK (
    opened_by = auth.uid()
    AND expense_id IN (
      SELECT id FROM public.expenses
      WHERE deleted_at IS NULL
        AND household_id IN (
          SELECT household_id FROM public.household_members
          WHERE user_id = auth.uid() AND status = 'active'
        )
    )
  );

-- ============================================================
-- RLS Policies: dispute_comments
-- ============================================================

CREATE POLICY "dispute_comments: member can read"
  ON public.dispute_comments FOR SELECT
  USING (
    dispute_id IN (
      SELECT ed.id FROM public.expense_disputes ed
      JOIN public.expenses e ON e.id = ed.expense_id
      WHERE e.deleted_at IS NULL
        AND e.household_id IN (
          SELECT household_id FROM public.household_members
          WHERE user_id = auth.uid() AND status = 'active'
        )
    )
  );

CREATE POLICY "dispute_comments: member can insert"
  ON public.dispute_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND dispute_id IN (
      SELECT ed.id FROM public.expense_disputes ed
      JOIN public.expenses e ON e.id = ed.expense_id
      WHERE e.deleted_at IS NULL
        AND e.household_id IN (
          SELECT household_id FROM public.household_members
          WHERE user_id = auth.uid() AND status = 'active'
        )
    )
  );

-- ============================================================
-- RLS Policies: split_presets
-- ============================================================

CREATE POLICY "split_presets: household members can read"
  ON public.split_presets FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "split_presets: household members can insert"
  ON public.split_presets FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "split_presets: creator can update"
  ON public.split_presets FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "split_presets: creator can delete"
  ON public.split_presets FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================
-- RLS Policies: payment_preferences
-- ============================================================

CREATE POLICY "payment_preferences: household members can read"
  ON public.payment_preferences FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT user_id FROM public.household_members
      WHERE household_id IN (
        SELECT household_id FROM public.household_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
      AND status = 'active'
    )
  );

CREATE POLICY "payment_preferences: user can insert own"
  ON public.payment_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "payment_preferences: user can update own"
  ON public.payment_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS Policies: recurring_expense_templates
-- ============================================================

CREATE POLICY "recurring_expense_templates: household members can read"
  ON public.recurring_expense_templates FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "recurring_expense_templates: household members can insert"
  ON public.recurring_expense_templates FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "recurring_expense_templates: creator can update"
  ON public.recurring_expense_templates FOR UPDATE
  USING (created_by = auth.uid());

-- ============================================================
-- Indexes for common query patterns
-- ============================================================

CREATE INDEX idx_expenses_household_date
  ON public.expenses(household_id, expense_date DESC);

CREATE INDEX idx_expenses_household_category
  ON public.expenses(household_id, category);

CREATE INDEX idx_expense_splits_expense_id
  ON public.expense_splits(expense_id);

CREATE INDEX idx_expense_splits_user_id
  ON public.expense_splits(user_id);

CREATE INDEX idx_settlements_household
  ON public.settlements(household_id);

CREATE INDEX idx_recurring_templates_due
  ON public.recurring_expense_templates(household_id, next_due_date)
  WHERE is_paused = false;

-- ============================================================
-- Trigger: auto-update updated_at timestamps
-- ============================================================

CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_payment_preferences_updated_at
  BEFORE UPDATE ON public.payment_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_recurring_expense_templates_updated_at
  BEFORE UPDATE ON public.recurring_expense_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- RPC Functions
-- ============================================================

-- 1. create_expense: atomically creates expense + splits + initial version record
CREATE OR REPLACE FUNCTION public.create_expense(
  p_household_id UUID,
  p_description TEXT,
  p_amount_cents INTEGER,
  p_category TEXT,
  p_paid_by UUID,
  p_split_type TEXT,
  p_splits JSONB,  -- [{"user_id": "...", "amount_cents": 12345}]
  p_tax_cents INTEGER DEFAULT 0,
  p_tip_cents INTEGER DEFAULT 0,
  p_is_private BOOLEAN DEFAULT false,
  p_receipt_url TEXT DEFAULT NULL,
  p_expense_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_expense_id UUID;
BEGIN
  INSERT INTO public.expenses (
    household_id, created_by, description, amount_cents, category,
    paid_by, split_type, tax_cents, tip_cents, is_private, receipt_url, expense_date
  ) VALUES (
    p_household_id, auth.uid(), p_description, p_amount_cents, p_category,
    p_paid_by, p_split_type, p_tax_cents, p_tip_cents, p_is_private, p_receipt_url, p_expense_date
  ) RETURNING id INTO v_expense_id;

  INSERT INTO public.expense_splits (expense_id, user_id, amount_cents)
  SELECT v_expense_id, (s->>'user_id')::UUID, (s->>'amount_cents')::INTEGER
  FROM jsonb_array_elements(p_splits) AS s;

  INSERT INTO public.expense_versions (expense_id, changed_by, change_type)
  VALUES (v_expense_id, auth.uid(), 'created');

  RETURN v_expense_id;
END;
$$;

-- 2. update_expense: snapshots previous data, updates expense, replaces splits
CREATE OR REPLACE FUNCTION public.update_expense(
  p_expense_id UUID,
  p_description TEXT,
  p_amount_cents INTEGER,
  p_category TEXT,
  p_split_type TEXT,
  p_splits JSONB,
  p_tax_cents INTEGER DEFAULT 0,
  p_tip_cents INTEGER DEFAULT 0,
  p_is_private BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_previous_data JSONB;
BEGIN
  -- Snapshot previous state
  SELECT to_jsonb(e) INTO v_previous_data
  FROM public.expenses e
  WHERE e.id = p_expense_id AND e.created_by = auth.uid();

  IF v_previous_data IS NULL THEN
    RAISE EXCEPTION 'Expense not found or not owned by current user';
  END IF;

  -- Create version record
  INSERT INTO public.expense_versions (expense_id, changed_by, change_type, previous_data)
  VALUES (p_expense_id, auth.uid(), 'edited', v_previous_data);

  -- Update expense
  UPDATE public.expenses SET
    description = p_description,
    amount_cents = p_amount_cents,
    category = p_category,
    split_type = p_split_type,
    tax_cents = p_tax_cents,
    tip_cents = p_tip_cents,
    is_private = p_is_private,
    updated_at = now()
  WHERE id = p_expense_id AND created_by = auth.uid();

  -- Replace splits
  DELETE FROM public.expense_splits WHERE expense_id = p_expense_id;

  INSERT INTO public.expense_splits (expense_id, user_id, amount_cents)
  SELECT p_expense_id, (s->>'user_id')::UUID, (s->>'amount_cents')::INTEGER
  FROM jsonb_array_elements(p_splits) AS s;
END;
$$;

-- 3. soft_delete_expense: marks as deleted, creates version record
CREATE OR REPLACE FUNCTION public.soft_delete_expense(
  p_expense_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.expenses SET
    deleted_at = now(),
    deleted_by = auth.uid(),
    updated_at = now()
  WHERE id = p_expense_id AND created_by = auth.uid() AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found, not owned by current user, or already deleted';
  END IF;

  INSERT INTO public.expense_versions (expense_id, changed_by, change_type)
  VALUES (p_expense_id, auth.uid(), 'deleted');
END;
$$;

-- 4. create_recurring_expense_instance: creates expense from template, advances next_due_date
CREATE OR REPLACE FUNCTION public.create_recurring_expense_instance(
  p_template_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_template public.recurring_expense_templates;
  v_expense_id UUID;
  v_next_date DATE;
BEGIN
  SELECT * INTO v_template
  FROM public.recurring_expense_templates
  WHERE id = p_template_id AND is_paused = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or is paused';
  END IF;

  -- Create the expense instance
  INSERT INTO public.expenses (
    household_id, created_by, description, amount_cents, category,
    paid_by, split_type, split_preset_id, recurring_template_id, expense_date
  ) VALUES (
    v_template.household_id, auth.uid(), v_template.description, v_template.amount_cents,
    v_template.category, auth.uid(), v_template.split_type, v_template.split_preset_id,
    v_template.id, v_template.next_due_date
  ) RETURNING id INTO v_expense_id;

  -- Insert splits from split_config
  INSERT INTO public.expense_splits (expense_id, user_id, amount_cents)
  SELECT v_expense_id, (s->>'user_id')::UUID, (s->>'amount_cents')::INTEGER
  FROM jsonb_array_elements(v_template.split_config) AS s;

  -- Create initial version record
  INSERT INTO public.expense_versions (expense_id, changed_by, change_type)
  VALUES (v_expense_id, auth.uid(), 'created');

  -- Advance next_due_date based on frequency
  v_next_date := CASE v_template.frequency
    WHEN 'daily'    THEN v_template.next_due_date + INTERVAL '1 day'
    WHEN 'weekly'   THEN v_template.next_due_date + INTERVAL '7 days'
    WHEN 'biweekly' THEN v_template.next_due_date + INTERVAL '14 days'
    WHEN 'monthly'  THEN v_template.next_due_date + INTERVAL '1 month'
    WHEN 'custom'   THEN v_template.next_due_date + (v_template.custom_interval_days || ' days')::INTERVAL
    ELSE v_template.next_due_date + INTERVAL '1 month'
  END;

  UPDATE public.recurring_expense_templates
  SET next_due_date = v_next_date, updated_at = now()
  WHERE id = p_template_id;

  RETURN v_expense_id;
END;
$$;

-- ============================================================
-- Enable Supabase Realtime on key tables
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;
