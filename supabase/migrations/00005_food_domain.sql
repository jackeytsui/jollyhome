-- ============================================================
-- Phase 4 Shopping + Meals + Supplies Schema
-- Creates: food catalog, shopping lists/items, inventory, recipes,
--          meal plans, AI suggestion runs/feedback
-- Includes: RLS policies, indexes, triggers, RPC helpers, Realtime
-- ============================================================

-- 1. food_catalog_items
CREATE TABLE public.food_catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  canonical_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  barcode TEXT,
  category_key TEXT NOT NULL CHECK (
    category_key IN (
      'produce',
      'dairy',
      'meat_seafood',
      'bakery',
      'frozen',
      'pantry',
      'beverages',
      'snacks',
      'household',
      'personal_care',
      'other'
    )
  ),
  aisle_key TEXT NOT NULL,
  default_unit TEXT NOT NULL CHECK (
    default_unit IN ('count', 'g', 'kg', 'ml', 'l', 'oz', 'lb', 'package', 'bottle', 'can', 'box')
  ),
  synonyms TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'barcode', 'receipt', 'recipe', 'ai')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (household_id, normalized_name),
  UNIQUE NULLS NOT DISTINCT (household_id, barcode)
);

-- 2. recipes
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'url_import', 'ai_import')),
  source_url TEXT,
  image_url TEXT,
  servings NUMERIC(10,2),
  prep_minutes INTEGER,
  cook_minutes INTEGER,
  total_minutes INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  favorite BOOLEAN NOT NULL DEFAULT false,
  imported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. shopping_lists
CREATE TABLE public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'recipe', 'restock', 'meal_plan', 'receipt_review')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  meal_plan_entry_id UUID,
  receipt_review_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. inventory_items
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES public.food_catalog_items(id) ON DELETE CASCADE,
  quantity_on_hand NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL CHECK (
    unit IN ('count', 'g', 'kg', 'ml', 'l', 'oz', 'lb', 'package', 'bottle', 'can', 'box')
  ),
  minimum_quantity NUMERIC(12,3),
  preferred_reorder_quantity NUMERIC(12,3),
  storage_location TEXT,
  last_counted_at TIMESTAMPTZ,
  last_restocked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, catalog_item_id, unit)
);

-- 5. inventory_events
CREATE TABLE public.inventory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES public.food_catalog_items(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (
    source_type IN (
      'receipt_purchase',
      'meal_cooked',
      'manual_adjustment',
      'pantry_scan_seed',
      'restock_prediction'
    )
  ),
  delta_quantity NUMERIC(12,3) NOT NULL,
  quantity_after NUMERIC(12,3),
  unit TEXT NOT NULL CHECK (
    unit IN ('count', 'g', 'kg', 'ml', 'l', 'oz', 'lb', 'package', 'bottle', 'can', 'box')
  ),
  reason TEXT,
  source_id TEXT,
  source_ref TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. inventory_alerts
CREATE TABLE public.inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES public.food_catalog_items(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'expiring_soon', 'out_of_stock')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'resolved')),
  threshold_quantity NUMERIC(12,3),
  current_quantity NUMERIC(12,3),
  triggered_by_event_id UUID REFERENCES public.inventory_events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 7. recipe_ingredients
CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  note TEXT,
  quantity NUMERIC(12,3),
  unit TEXT CHECK (
    unit IN ('count', 'g', 'kg', 'ml', 'l', 'oz', 'lb', 'package', 'bottle', 'can', 'box')
  ),
  category_key TEXT NOT NULL CHECK (
    category_key IN (
      'produce',
      'dairy',
      'meat_seafood',
      'bakery',
      'frozen',
      'pantry',
      'beverages',
      'snacks',
      'household',
      'personal_care',
      'other'
    )
  ),
  catalog_item_id UUID REFERENCES public.food_catalog_items(id) ON DELETE SET NULL,
  optional BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 8. meal_suggestion_runs
CREATE TABLE public.meal_suggestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_date DATE NOT NULL,
  budget_cents INTEGER,
  dietary_preferences TEXT[] NOT NULL DEFAULT '{}',
  dietary_notes TEXT,
  attendance_member_ids UUID[] NOT NULL DEFAULT '{}',
  attendance_snapshot_date DATE,
  prep_time_bucket TEXT CHECK (prep_time_bucket IN ('quick', 'standard', 'project', 'batch')),
  planner_input JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  prompt_version TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. meal_plan_entries
CREATE TABLE public.meal_plan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  suggestion_run_id UUID REFERENCES public.meal_suggestion_runs(id) ON DELETE SET NULL,
  suggestion_id TEXT,
  calendar_item_id UUID REFERENCES public.calendar_events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slot_key TEXT NOT NULL CHECK (slot_key IN ('breakfast', 'lunch', 'dinner', 'snack')),
  slot_date DATE NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'cooked', 'skipped')),
  servings_planned NUMERIC(10,2) NOT NULL DEFAULT 1,
  serving_source TEXT NOT NULL DEFAULT 'manual' CHECK (serving_source IN ('manual', 'attendance', 'recipe_default')),
  attendance_member_ids UUID[] NOT NULL DEFAULT '{}',
  attendance_snapshot_date DATE,
  notes TEXT,
  cooked_at TIMESTAMPTZ,
  cooked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, slot_date, slot_key)
);

ALTER TABLE public.shopping_lists
  ADD CONSTRAINT shopping_lists_meal_plan_entry_id_fkey
  FOREIGN KEY (meal_plan_entry_id) REFERENCES public.meal_plan_entries(id) ON DELETE SET NULL;

-- 10. shopping_list_items
CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  note TEXT,
  category_key TEXT NOT NULL CHECK (
    category_key IN (
      'produce',
      'dairy',
      'meat_seafood',
      'bakery',
      'frozen',
      'pantry',
      'beverages',
      'snacks',
      'household',
      'personal_care',
      'other'
    )
  ),
  quantity NUMERIC(12,3),
  unit TEXT CHECK (
    unit IN ('count', 'g', 'kg', 'ml', 'l', 'oz', 'lb', 'package', 'bottle', 'can', 'box')
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'purchased', 'skipped')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'recipe', 'restock', 'meal_plan', 'receipt_review')),
  catalog_item_id UUID REFERENCES public.food_catalog_items(id) ON DELETE SET NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  meal_plan_entry_id UUID REFERENCES public.meal_plan_entries(id) ON DELETE SET NULL,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  minimum_quantity NUMERIC(12,3),
  generated_restock JSONB,
  checked_off_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_off_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. meal_suggestion_feedback
CREATE TABLE public.meal_suggestion_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  suggestion_run_id UUID NOT NULL REFERENCES public.meal_suggestion_runs(id) ON DELETE CASCADE,
  suggestion_id TEXT,
  meal_plan_entry_id UUID REFERENCES public.meal_plan_entries(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('accept', 'swap', 'regenerate', 'reject')),
  rating TEXT CHECK (rating IN ('positive', 'negative', 'neutral')),
  feedback_note TEXT,
  replacement_suggestion_id TEXT,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX food_catalog_items_household_category_idx
  ON public.food_catalog_items(household_id, category_key, canonical_name);
CREATE INDEX food_catalog_items_barcode_idx
  ON public.food_catalog_items(barcode);
CREATE INDEX recipes_household_updated_idx
  ON public.recipes(household_id, updated_at DESC);
CREATE INDEX shopping_lists_household_status_idx
  ON public.shopping_lists(household_id, status, created_at DESC);
CREATE INDEX shopping_list_items_household_status_idx
  ON public.shopping_list_items(household_id, status, category_key, checked_off_at);
CREATE INDEX shopping_list_items_catalog_idx
  ON public.shopping_list_items(household_id, catalog_item_id);
CREATE INDEX inventory_items_household_category_idx
  ON public.inventory_items(household_id, catalog_item_id, minimum_quantity);
CREATE INDEX inventory_events_household_occurred_idx
  ON public.inventory_events(household_id, occurred_at DESC, source_type);
CREATE INDEX inventory_alerts_household_status_idx
  ON public.inventory_alerts(household_id, status, alert_type, created_at DESC);
CREATE INDEX recipe_ingredients_recipe_sort_idx
  ON public.recipe_ingredients(recipe_id, sort_order);
CREATE INDEX meal_plan_entries_household_slot_idx
  ON public.meal_plan_entries(household_id, slot_date, slot_key, status);
CREATE INDEX meal_suggestion_runs_household_date_idx
  ON public.meal_suggestion_runs(household_id, source_date DESC, status);
CREATE INDEX meal_suggestion_feedback_household_created_idx
  ON public.meal_suggestion_feedback(household_id, created_at DESC);

-- ============================================================
-- Triggers
-- ============================================================

CREATE TRIGGER set_food_catalog_items_updated_at
  BEFORE UPDATE ON public.food_catalog_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_shopping_lists_updated_at
  BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_meal_plan_entries_updated_at
  BEFORE UPDATE ON public.meal_plan_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_shopping_list_items_updated_at
  BEFORE UPDATE ON public.shopping_list_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Enable Row Level Security
-- ============================================================

ALTER TABLE public.food_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_suggestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_suggestion_feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Household-scoped RLS policies
-- ============================================================

CREATE POLICY "food_catalog_items: household members can read"
  ON public.food_catalog_items FOR SELECT
  USING (
    household_id IS NULL
    OR household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "food_catalog_items: household members can insert"
  ON public.food_catalog_items FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND (
      household_id IS NULL
      OR household_id IN (
        SELECT household_id FROM public.household_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "food_catalog_items: household members can update"
  ON public.food_catalog_items FOR UPDATE
  USING (
    household_id IS NULL
    OR household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "recipes: household members can read"
  ON public.recipes FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "recipes: household members can insert"
  ON public.recipes FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "recipes: household members can update"
  ON public.recipes FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "shopping_lists: household members can read"
  ON public.shopping_lists FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "shopping_lists: household members can insert"
  ON public.shopping_lists FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "shopping_lists: household members can update"
  ON public.shopping_lists FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "shopping_list_items: household members can read"
  ON public.shopping_list_items FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "shopping_list_items: household members can insert"
  ON public.shopping_list_items FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "shopping_list_items: household members can update"
  ON public.shopping_list_items FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "inventory_items: household members can read"
  ON public.inventory_items FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "inventory_items: household members can insert"
  ON public.inventory_items FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "inventory_items: household members can update"
  ON public.inventory_items FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "inventory_events: household members can read"
  ON public.inventory_events FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "inventory_events: household members can insert"
  ON public.inventory_events FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "inventory_alerts: household members can read"
  ON public.inventory_alerts FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "inventory_alerts: household members can insert"
  ON public.inventory_alerts FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "inventory_alerts: household members can update"
  ON public.inventory_alerts FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "recipe_ingredients: household members can read"
  ON public.recipe_ingredients FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "recipe_ingredients: household members can insert"
  ON public.recipe_ingredients FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "recipe_ingredients: household members can update"
  ON public.recipe_ingredients FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "meal_suggestion_runs: household members can read"
  ON public.meal_suggestion_runs FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "meal_suggestion_runs: household members can insert"
  ON public.meal_suggestion_runs FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "meal_suggestion_runs: household members can update"
  ON public.meal_suggestion_runs FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "meal_plan_entries: household members can read"
  ON public.meal_plan_entries FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "meal_plan_entries: household members can insert"
  ON public.meal_plan_entries FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "meal_plan_entries: household members can update"
  ON public.meal_plan_entries FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "meal_suggestion_feedback: household members can read"
  ON public.meal_suggestion_feedback FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "meal_suggestion_feedback: household members can insert"
  ON public.meal_suggestion_feedback FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================
-- RPC helpers
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_inventory_event(
  p_household_id UUID,
  p_catalog_item_id UUID,
  p_delta_quantity NUMERIC,
  p_unit TEXT,
  p_source_type TEXT,
  p_reason TEXT DEFAULT NULL,
  p_source_id TEXT DEFAULT NULL,
  p_source_ref TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_minimum_quantity NUMERIC DEFAULT NULL,
  p_preferred_reorder_quantity NUMERIC DEFAULT NULL,
  p_storage_location TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_occurred_at TIMESTAMPTZ DEFAULT now()
)
RETURNS public.inventory_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inventory public.inventory_items%ROWTYPE;
  v_event public.inventory_events%ROWTYPE;
  v_catalog public.food_catalog_items%ROWTYPE;
  v_current_quantity NUMERIC(12,3);
BEGIN
  IF p_source_type NOT IN (
    'receipt_purchase',
    'meal_cooked',
    'manual_adjustment',
    'pantry_scan_seed',
    'restock_prediction'
  ) THEN
    RAISE EXCEPTION 'Invalid inventory source type';
  END IF;

  IF p_unit NOT IN ('count', 'g', 'kg', 'ml', 'l', 'oz', 'lb', 'package', 'bottle', 'can', 'box') THEN
    RAISE EXCEPTION 'Invalid inventory unit';
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

  SELECT * INTO v_catalog
  FROM public.food_catalog_items
  WHERE id = p_catalog_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Catalog item not found';
  END IF;

  INSERT INTO public.inventory_items (
    household_id,
    catalog_item_id,
    quantity_on_hand,
    unit,
    minimum_quantity,
    preferred_reorder_quantity,
    storage_location,
    notes,
    last_counted_at,
    last_restocked_at
  )
  VALUES (
    p_household_id,
    p_catalog_item_id,
    p_delta_quantity,
    p_unit,
    p_minimum_quantity,
    p_preferred_reorder_quantity,
    p_storage_location,
    p_notes,
    CASE WHEN p_source_type = 'pantry_scan_seed' THEN p_occurred_at ELSE NULL END,
    CASE WHEN p_delta_quantity > 0 THEN p_occurred_at ELSE NULL END
  )
  ON CONFLICT (household_id, catalog_item_id, unit)
  DO UPDATE SET
    quantity_on_hand = public.inventory_items.quantity_on_hand + EXCLUDED.quantity_on_hand,
    minimum_quantity = COALESCE(EXCLUDED.minimum_quantity, public.inventory_items.minimum_quantity),
    preferred_reorder_quantity = COALESCE(EXCLUDED.preferred_reorder_quantity, public.inventory_items.preferred_reorder_quantity),
    storage_location = COALESCE(EXCLUDED.storage_location, public.inventory_items.storage_location),
    notes = COALESCE(EXCLUDED.notes, public.inventory_items.notes),
    last_counted_at = CASE
      WHEN p_source_type = 'pantry_scan_seed' THEN p_occurred_at
      ELSE public.inventory_items.last_counted_at
    END,
    last_restocked_at = CASE
      WHEN p_delta_quantity > 0 THEN p_occurred_at
      ELSE public.inventory_items.last_restocked_at
    END,
    updated_at = now()
  RETURNING * INTO v_inventory;

  v_current_quantity := GREATEST(v_inventory.quantity_on_hand, 0);

  UPDATE public.inventory_items
  SET quantity_on_hand = v_current_quantity
  WHERE id = v_inventory.id
  RETURNING * INTO v_inventory;

  INSERT INTO public.inventory_events (
    household_id,
    inventory_item_id,
    catalog_item_id,
    source_type,
    delta_quantity,
    quantity_after,
    unit,
    reason,
    source_id,
    source_ref,
    occurred_at,
    created_by,
    metadata
  )
  VALUES (
    p_household_id,
    v_inventory.id,
    p_catalog_item_id,
    p_source_type,
    p_delta_quantity,
    v_current_quantity,
    p_unit,
    p_reason,
    p_source_id,
    p_source_ref,
    p_occurred_at,
    auth.uid(),
    p_metadata
  )
  RETURNING * INTO v_event;

  IF v_inventory.minimum_quantity IS NOT NULL AND v_current_quantity <= v_inventory.minimum_quantity THEN
    UPDATE public.inventory_alerts
    SET
      status = 'resolved',
      resolved_at = now()
    WHERE inventory_item_id = v_inventory.id
      AND status = 'open'
      AND alert_type IN ('low_stock', 'out_of_stock')
      AND v_current_quantity > v_inventory.minimum_quantity;

    IF NOT EXISTS (
      SELECT 1
      FROM public.inventory_alerts
      WHERE inventory_item_id = v_inventory.id
        AND status = 'open'
        AND alert_type = CASE WHEN v_current_quantity = 0 THEN 'out_of_stock' ELSE 'low_stock' END
    ) THEN
      INSERT INTO public.inventory_alerts (
        household_id,
        inventory_item_id,
        catalog_item_id,
        alert_type,
        status,
        threshold_quantity,
        current_quantity,
        triggered_by_event_id,
        title,
        message
      )
      VALUES (
        p_household_id,
        v_inventory.id,
        p_catalog_item_id,
        CASE WHEN v_current_quantity = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
        'open',
        v_inventory.minimum_quantity,
        v_current_quantity,
        v_event.id,
        CASE WHEN v_current_quantity = 0 THEN 'Out of stock' ELSE 'Low stock' END,
        format(
          '%s is at %s %s against a minimum of %s %s.',
          v_catalog.display_name,
          trim(to_char(v_current_quantity, 'FM999999990.###')),
          v_inventory.unit,
          trim(to_char(v_inventory.minimum_quantity, 'FM999999990.###')),
          v_inventory.unit
        )
      );
    END IF;
  ELSE
    UPDATE public.inventory_alerts
    SET
      status = 'resolved',
      current_quantity = v_current_quantity,
      resolved_at = now()
    WHERE inventory_item_id = v_inventory.id
      AND status = 'open'
      AND alert_type IN ('low_stock', 'out_of_stock');
  END IF;

  RETURN v_event;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_meal_plan_shopping_list(
  p_household_id UUID,
  p_list_id UUID DEFAULT NULL,
  p_week_start DATE DEFAULT NULL,
  p_meal_plan_entry_ids UUID[] DEFAULT NULL
)
RETURNS SETOF public.shopping_list_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_list public.shopping_lists%ROWTYPE;
  v_week_start DATE := COALESCE(p_week_start, CURRENT_DATE);
  v_week_end DATE := COALESCE(p_week_start, CURRENT_DATE) + 6;
  v_row RECORD;
  v_item public.shopping_list_items%ROWTYPE;
  v_missing NUMERIC(12,3);
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = p_household_id
      AND user_id = auth.uid()
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized for this household';
  END IF;

  IF p_list_id IS NULL THEN
    INSERT INTO public.shopping_lists (
      household_id,
      title,
      notes,
      source,
      status,
      created_by
    )
    VALUES (
      p_household_id,
      format('Meal plan week of %s', v_week_start),
      'Generated from meal plan entries',
      'meal_plan',
      'active',
      auth.uid()
    )
    RETURNING * INTO v_list;
  ELSE
    SELECT * INTO v_list
    FROM public.shopping_lists
    WHERE id = p_list_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Shopping list not found';
    END IF;
  END IF;

  FOR v_row IN
    WITH selected_entries AS (
      SELECT mpe.*
      FROM public.meal_plan_entries mpe
      WHERE mpe.household_id = p_household_id
        AND mpe.status = 'planned'
        AND (
          p_meal_plan_entry_ids IS NOT NULL
          AND mpe.id = ANY (p_meal_plan_entry_ids)
          OR p_meal_plan_entry_ids IS NULL
          AND mpe.slot_date BETWEEN v_week_start AND v_week_end
        )
    ),
    ingredient_demand AS (
      SELECT
        ri.catalog_item_id,
        COALESCE(ri.title, fc.display_name, fc.canonical_name) AS title,
        COALESCE(ri.category_key, fc.category_key) AS category_key,
        COALESCE(ri.unit, fc.default_unit) AS unit,
        SUM(
          COALESCE(ri.quantity, 0) *
          CASE
            WHEN r.servings IS NULL OR r.servings = 0 THEN 1
            ELSE selected_entries.servings_planned / r.servings
          END
        ) AS needed_quantity,
        array_agg(selected_entries.id) AS meal_plan_entry_ids,
        array_agg(DISTINCT r.id) FILTER (WHERE r.id IS NOT NULL) AS recipe_ids
      FROM selected_entries
      JOIN public.recipes r ON r.id = selected_entries.recipe_id
      JOIN public.recipe_ingredients ri ON ri.recipe_id = r.id
      LEFT JOIN public.food_catalog_items fc ON fc.id = ri.catalog_item_id
      WHERE ri.optional = false
        AND ri.catalog_item_id IS NOT NULL
      GROUP BY ri.catalog_item_id, COALESCE(ri.title, fc.display_name, fc.canonical_name), COALESCE(ri.category_key, fc.category_key), COALESCE(ri.unit, fc.default_unit)
    ),
    pantry_snapshot AS (
      SELECT
        household_id,
        catalog_item_id,
        unit,
        SUM(quantity_on_hand) AS on_hand_quantity,
        MAX(id) AS inventory_item_id,
        MAX(minimum_quantity) AS minimum_quantity
      FROM public.inventory_items
      WHERE household_id = p_household_id
      GROUP BY household_id, catalog_item_id, unit
    )
    SELECT
      ingredient_demand.*,
      COALESCE(pantry_snapshot.on_hand_quantity, 0) AS on_hand_quantity,
      pantry_snapshot.inventory_item_id,
      pantry_snapshot.minimum_quantity
    FROM ingredient_demand
    LEFT JOIN pantry_snapshot
      ON pantry_snapshot.household_id = p_household_id
     AND pantry_snapshot.catalog_item_id = ingredient_demand.catalog_item_id
     AND pantry_snapshot.unit = ingredient_demand.unit
  LOOP
    v_missing := GREATEST(v_row.needed_quantity - v_row.on_hand_quantity, 0);

    IF v_missing > 0 THEN
      INSERT INTO public.shopping_list_items (
        list_id,
        household_id,
        title,
        category_key,
        quantity,
        unit,
        status,
        source,
        catalog_item_id,
        recipe_id,
        meal_plan_entry_id,
        inventory_item_id,
        minimum_quantity,
        generated_restock
      )
      VALUES (
        v_list.id,
        p_household_id,
        v_row.title,
        v_row.category_key,
        v_missing,
        v_row.unit,
        'pending',
        'meal_plan',
        v_row.catalog_item_id,
        COALESCE(v_row.recipe_ids[1], NULL),
        COALESCE(v_row.meal_plan_entry_ids[1], NULL),
        v_row.inventory_item_id,
        v_row.minimum_quantity,
        jsonb_build_object(
          'sourceEventIds', '[]'::jsonb,
          'minimumQuantity', v_row.minimum_quantity,
          'onHandQuantity', v_row.on_hand_quantity,
          'suggestedPurchaseQuantity', v_missing,
          'generatedAt', now()
        )
      )
      ON CONFLICT DO NOTHING
      RETURNING * INTO v_item;

      IF FOUND THEN
        RETURN NEXT v_item;
      END IF;
    END IF;
  END LOOP;

  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_meal_cooked(
  p_meal_plan_entry_id UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS public.meal_plan_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry public.meal_plan_entries%ROWTYPE;
  v_recipe public.recipes%ROWTYPE;
  v_ingredient RECORD;
  v_scale NUMERIC(12,3);
BEGIN
  SELECT * INTO v_entry
  FROM public.meal_plan_entries
  WHERE id = p_meal_plan_entry_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Meal plan entry not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = v_entry.household_id
      AND user_id = auth.uid()
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized for this household';
  END IF;

  IF v_entry.status <> 'planned' THEN
    RAISE EXCEPTION 'Meal plan entry is not cookable';
  END IF;

  IF v_entry.recipe_id IS NULL THEN
    RAISE EXCEPTION 'Meal plan entry has no recipe';
  END IF;

  SELECT * INTO v_recipe
  FROM public.recipes
  WHERE id = v_entry.recipe_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recipe not found';
  END IF;

  v_scale := CASE
    WHEN v_recipe.servings IS NULL OR v_recipe.servings = 0 THEN 1
    ELSE v_entry.servings_planned / v_recipe.servings
  END;

  FOR v_ingredient IN
    SELECT *
    FROM public.recipe_ingredients
    WHERE recipe_id = v_recipe.id
      AND optional = false
      AND catalog_item_id IS NOT NULL
      AND quantity IS NOT NULL
  LOOP
    PERFORM public.upsert_inventory_event(
      v_entry.household_id,
      v_ingredient.catalog_item_id,
      (COALESCE(v_ingredient.quantity, 0) * v_scale) * -1,
      COALESCE(v_ingredient.unit, 'count'),
      'meal_cooked',
      COALESCE(p_note, format('Cooked meal %s', v_entry.title)),
      v_entry.id::text,
      v_recipe.id::text,
      jsonb_build_object(
        'mealPlanEntryId', v_entry.id,
        'recipeId', v_recipe.id,
        'slotDate', v_entry.slot_date,
        'slotKey', v_entry.slot_key
      ),
      NULL,
      NULL,
      NULL,
      NULL,
      now()
    );
  END LOOP;

  UPDATE public.meal_plan_entries
  SET
    status = 'cooked',
    notes = COALESCE(p_note, notes),
    cooked_at = now(),
    cooked_by = auth.uid(),
    updated_at = now()
  WHERE id = v_entry.id
  RETURNING * INTO v_entry;

  RETURN v_entry;
END;
$$;

-- ============================================================
-- Realtime publication additions
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.food_catalog_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recipes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_list_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recipe_ingredients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_suggestion_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_plan_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_suggestion_feedback;
