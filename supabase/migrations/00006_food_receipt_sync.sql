-- ============================================================
-- Phase 4: Atomic grocery receipt sync
-- Creates: grocery_receipt_commits audit table
-- Includes: perform_grocery_receipt_commit transactional RPC
-- ============================================================

CREATE TABLE public.grocery_receipt_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  receipt_review_id TEXT NOT NULL,
  receipt_url TEXT,
  matched_shopping_item_ids UUID[] NOT NULL DEFAULT '{}',
  inventory_event_ids UUID[] NOT NULL DEFAULT '{}',
  committed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, receipt_review_id)
);

ALTER TABLE public.grocery_receipt_commits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grocery_receipt_commits: household members can read"
  ON public.grocery_receipt_commits FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "grocery_receipt_commits: household members can insert"
  ON public.grocery_receipt_commits FOR INSERT
  WITH CHECK (
    committed_by = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE INDEX grocery_receipt_commits_household_created_idx
  ON public.grocery_receipt_commits(household_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.perform_grocery_receipt_commit(
  p_household_id UUID,
  p_description TEXT,
  p_amount_cents INTEGER,
  p_category TEXT,
  p_paid_by UUID,
  p_split_type TEXT,
  p_splits JSONB,
  p_tax_cents INTEGER DEFAULT 0,
  p_tip_cents INTEGER DEFAULT 0,
  p_receipt_url TEXT DEFAULT NULL,
  p_expense_date DATE DEFAULT CURRENT_DATE,
  p_receipt_review_id TEXT DEFAULT NULL,
  p_storage_paths TEXT[] DEFAULT '{}',
  p_inventory_items JSONB DEFAULT '[]'::jsonb,
  p_shopping_list_match_ids UUID[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_expense_id UUID;
  v_commit_id UUID;
  v_inventory_input JSONB;
  v_inventory_event public.inventory_events%ROWTYPE;
  v_inventory_event_ids UUID[] := '{}';
  v_matched_ids UUID[] := '{}';
  v_catalog_id UUID;
  v_display_name TEXT;
  v_canonical_name TEXT;
  v_normalized_name TEXT;
  v_category_key TEXT;
  v_unit TEXT;
  v_quantity NUMERIC;
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

  IF p_receipt_review_id IS NULL OR length(trim(p_receipt_review_id)) = 0 THEN
    RAISE EXCEPTION 'receipt_review_id is required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.grocery_receipt_commits
    WHERE household_id = p_household_id
      AND receipt_review_id = p_receipt_review_id
  ) THEN
    RAISE EXCEPTION 'This grocery receipt review has already been committed';
  END IF;

  v_expense_id := public.create_expense(
    p_household_id,
    p_description,
    p_amount_cents,
    p_category,
    p_paid_by,
    p_split_type,
    p_splits,
    p_tax_cents,
    p_tip_cents,
    false,
    p_receipt_url,
    p_expense_date
  );

  FOR v_inventory_input IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_inventory_items, '[]'::jsonb))
  LOOP
    v_quantity := COALESCE((v_inventory_input->>'quantity')::NUMERIC, 0);
    IF v_quantity <= 0 THEN
      CONTINUE;
    END IF;

    v_catalog_id := NULLIF(v_inventory_input->>'catalog_item_id', '')::UUID;
    v_display_name := COALESCE(NULLIF(trim(v_inventory_input->>'name'), ''), 'Receipt item');
    v_canonical_name := lower(v_display_name);
    v_normalized_name := trim(regexp_replace(regexp_replace(lower(v_display_name), '[^a-z0-9\s]+', ' ', 'g'), '\s+', ' ', 'g'));
    v_category_key := COALESCE(NULLIF(v_inventory_input->>'category_key', ''), 'other');
    v_unit := COALESCE(NULLIF(v_inventory_input->>'unit', ''), 'count');

    IF v_category_key NOT IN (
      'produce', 'dairy', 'meat_seafood', 'bakery', 'frozen',
      'pantry', 'beverages', 'snacks', 'household', 'personal_care', 'other'
    ) THEN
      v_category_key := 'other';
    END IF;

    IF v_unit NOT IN ('count', 'g', 'kg', 'ml', 'l', 'oz', 'lb', 'package', 'bottle', 'can', 'box') THEN
      v_unit := 'count';
    END IF;

    IF v_catalog_id IS NULL THEN
      INSERT INTO public.food_catalog_items (
        household_id,
        canonical_name,
        display_name,
        normalized_name,
        category_key,
        aisle_key,
        default_unit,
        synonyms,
        source,
        created_by
      )
      VALUES (
        p_household_id,
        v_canonical_name,
        v_display_name,
        v_normalized_name,
        v_category_key,
        CASE v_category_key
          WHEN 'produce' THEN 'produce'
          WHEN 'dairy' THEN 'refrigerated'
          WHEN 'meat_seafood' THEN 'meat-seafood'
          WHEN 'bakery' THEN 'bakery'
          WHEN 'frozen' THEN 'frozen'
          WHEN 'pantry' THEN 'pantry'
          WHEN 'beverages' THEN 'beverages'
          WHEN 'snacks' THEN 'snacks'
          WHEN 'household' THEN 'household'
          WHEN 'personal_care' THEN 'personal-care'
          ELSE 'misc'
        END,
        v_unit,
        '{}',
        'receipt',
        auth.uid()
      )
      ON CONFLICT (household_id, normalized_name)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        category_key = EXCLUDED.category_key,
        default_unit = EXCLUDED.default_unit,
        updated_at = now()
      RETURNING id INTO v_catalog_id;
    END IF;

    v_inventory_event := public.upsert_inventory_event(
      p_household_id,
      v_catalog_id,
      v_quantity,
      v_unit,
      'receipt_purchase',
      COALESCE(NULLIF(trim(v_inventory_input->>'reason'), ''), format('Receipt purchase from %s', p_description)),
      p_receipt_review_id,
      v_expense_id::text,
      jsonb_build_object(
        'receiptReviewId', p_receipt_review_id,
        'expenseId', v_expense_id,
        'storagePaths', p_storage_paths,
        'priceCents', COALESCE((v_inventory_input->>'price_cents')::INTEGER, 0),
        'classification', v_inventory_input->>'classification',
        'suggestedOwner', v_inventory_input->>'suggested_owner'
      ),
      NULL,
      NULL,
      NULL,
      NULL,
      now()
    );

    v_inventory_event_ids := array_append(v_inventory_event_ids, v_inventory_event.id);
  END LOOP;

  UPDATE public.shopping_list_items
  SET
    status = 'purchased',
    checked_off_at = COALESCE(checked_off_at, now()),
    checked_off_by = COALESCE(checked_off_by, auth.uid()),
    updated_at = now()
  WHERE household_id = p_household_id
    AND id = ANY(COALESCE(p_shopping_list_match_ids, '{}'::UUID[]))
    AND status = 'pending';

  SELECT COALESCE(array_agg(id), '{}'::UUID[]) INTO v_matched_ids
  FROM public.shopping_list_items
  WHERE household_id = p_household_id
    AND id = ANY(COALESCE(p_shopping_list_match_ids, '{}'::UUID[]))
    AND status = 'purchased';

  INSERT INTO public.grocery_receipt_commits (
    household_id,
    expense_id,
    receipt_review_id,
    receipt_url,
    matched_shopping_item_ids,
    inventory_event_ids,
    committed_by,
    metadata
  )
  VALUES (
    p_household_id,
    v_expense_id,
    p_receipt_review_id,
    p_receipt_url,
    v_matched_ids,
    v_inventory_event_ids,
    auth.uid(),
    jsonb_build_object(
      'storagePaths', p_storage_paths,
      'inventoryCount', COALESCE(jsonb_array_length(p_inventory_items), 0),
      'shoppingMatchCount', COALESCE(array_length(v_matched_ids, 1), 0)
    )
  )
  RETURNING id INTO v_commit_id;

  RETURN jsonb_build_object(
    'commit_id', v_commit_id,
    'expense_id', v_expense_id,
    'inventory_event_ids', v_inventory_event_ids,
    'matched_shopping_item_ids', v_matched_ids
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.perform_grocery_receipt_commit(
  UUID, TEXT, INTEGER, TEXT, UUID, TEXT, JSONB, INTEGER, INTEGER, TEXT, DATE, TEXT, TEXT[], JSONB, UUID[]
) TO authenticated;
