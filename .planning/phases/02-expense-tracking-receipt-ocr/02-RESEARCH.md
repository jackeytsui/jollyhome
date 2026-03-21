# Phase 2: Expense Tracking + Receipt OCR - Research

**Researched:** 2026-03-21
**Domain:** React Native expense splitting, debt simplification algorithms, AI receipt OCR, Supabase Realtime, camera integration
**Confidence:** HIGH (core patterns verified via existing codebase, prior research artifacts, and official library docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Expense Entry Flow**
- Quick-add first: Default view is minimal (amount, description, split type, members). "More details" expands to category, notes, receipt, date, tax/tip, privacy toggle
- Jolly NL input: "Tell Jolly..." text field at the top of the expenses tab. User types a sentence and Jolly parses it into a pre-filled quick-add card for confirmation
- NL confirmation: Jolly pre-fills the standard quick-add form with parsed values. User can edit any field before tapping "Add". Same UI as manual entry, just auto-populated
- Single expense per NL sentence: No batch parsing. One sentence = one expense
- Smart default split: Default to "equal split with all members"
- Jolly tone: Friendly but brief. No over-explaining
- Ambiguous NL handling: Jolly fills what it can, uses smart defaults. Highlights guessed fields with subtle indicator

**Split Types**
- Four split types: equal, custom percentages, exact amounts, shares
- Weighted household shares via presets: Household settings page where admin defines named split presets. Presets appear in split type dropdown for quick reuse
- Single currency per household

**Categories**
- Auto-suggest as you type based on description text
- Household can add custom categories beyond defaults
- AI-powered smart suggestions (EXPN-09)

**Tax & Tip**
- Not shown in quick-add by default. Available in "More details" expansion
- Auto-distributed proportionally among split members
- Receipt scans auto-extract tax and tip

**Edit, Delete & Disputes**
- Edit with audit trail: creator can edit any field; each edit creates a version in change history visible to all involved members; members notified of changes
- Soft delete: marks expense as deleted with "Deleted by X" visible in history
- Disputes: flag + comment thread

**Privacy**
- Default public, toggle private: Binary — visible to all household members OR only members involved in the split

**Balance & Settlement UX**
- Net balance summary at top of expenses tab (green = owed money, red = owes money)
- Collapsible header card
- Debt simplification: automatic (A->B + B->C = A->C)
- Settlement flow: tap "Settle up" -> choose full/partial -> deep links to Venmo/CashApp/PayPal/Zelle pre-filled with amount
- Payment app preferences: each member configures preferred app + username in their profile settings
- Settlement history: log of past settlements per member pair

**Receipt Scanning (AIEX-01..03)**
- Camera flow: tap scan -> camera with framing guide -> auto-capture when detected (or manual shutter) -> AI extracts (<4s) -> review card
- Gallery upload supported
- Multi-page receipt stitching: can scan multiple photos for one long receipt
- Item classification: color-coded tags — green "Shared" or orange "Personal: [Member name]". AI pre-classifies; tap any tag to toggle or reassign
- Mandatory review step: user MUST review and confirm before saving
- Receipt-to-split summary: after classification, auto-calculate split

**Recurring Expenses**
- Template + auto-create: expense auto-creates on due date; all involved members notified
- Flexible scheduling: monthly, weekly, biweekly, custom interval, specific day
- Skip/pause/edit without breaking future occurrences

**Expense History**
- Timeline with filter bar: date range, category, member, amount range, search by description
- Detail view with "Details" tab and "History" tab (change log)

**Expenses Tab Layout**
- Single scroll: Jolly NL input -> balance summary card -> quick add button -> recent expenses list -> recurring section
- No sub-tabs

**Empty States**
- Guided first-expense prompt with three entry points: quick add, scan receipt, Jolly NL field

**Data & Connectivity**
- Online-first with graceful degradation: Supabase is source of truth; offline shows cached data read-only, queues new expenses locally, syncs when reconnected; no offline editing/deleting
- Supabase Realtime subscriptions: live updates for new expenses and balance changes

### Claude's Discretion
- Debt simplification UX (how to show simplified vs original breakdown)
- Loading states and skeleton designs
- Exact color-coding for balance amounts
- Category default list and icons
- Receipt framing guide design
- Expense card visual design within warm & friendly direction
- Error state handling

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
- Receipt-to-everything pipeline (AIEX-04/SYNC-01) is scoped to Phase 4
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXPN-01 | User can add expense with amount, description, category in under 15 seconds | Quick-add form pattern, amount-first UX, Zod validation schema |
| EXPN-02 | User can split expense equally among selected members | Split calculation in pure TS utility function; RLS-guarded expense_splits table |
| EXPN-03 | User can split by custom percentages, exact amounts, or shares | Split type enum + validation (sum to 100% / sum to total amount) in shared utility |
| EXPN-04 | User can split by weighted household shares (set once, reuse) | split_presets table; preset id FK on expenses |
| EXPN-05 | User can view expense history with filters | Supabase query with dynamic .eq/.gte/.lte filters; filter bar UI |
| EXPN-06 | User can see running balance with automatic debt simplification | computeBalances() + simplifyDebts() pure functions; computed on read, never stored |
| EXPN-07 | User can mark a debt as settled (partial or full) | settlements table; settlement creation flow; balance recomputed after insert |
| EXPN-08 | User can create recurring expenses that auto-generate on schedule | recurring_expense_templates table; Supabase Edge Function or pg_cron trigger for auto-creation |
| EXPN-09 | User can categorize with smart category suggestions based on description | Client-side keyword matching OR Claude/OpenAI mini call via Edge Function |
| EXPN-10 | User can edit or delete expense with change history visible to all | expense_versions table (audit trail); soft-delete via deleted_at column |
| EXPN-11 | User can view settlement suggestions with pre-filled deep links | Linking.openURL with Venmo/CashApp/PayPal/Zelle URL schemes |
| EXPN-12 | User can dispute expense with note and discussion | expense_disputes + dispute_comments tables; dispute badge on expense card |
| EXPN-13 | Tax and tip auto-distributed proportionally on itemized receipt splits | Proportional tax/tip math in split utility; stored as separate fields on expense |
| EXPN-14 | User can set privacy tiers per expense | is_private boolean on expenses table; RLS SELECT policy checks split membership |
| AIEX-01 | Camera receipt scan: AI extracts store, date, items, prices, tax, total (<4s, 95%+ accuracy) | expo-camera + Supabase Storage + Edge Function -> OpenAI gpt-4o Vision |
| AIEX-02 | AI suggests which items are personal vs shared based on item names and household patterns | GPT-4o prompt with household member names + item list; classification in Edge Function response |
| AIEX-03 | Mandatory review+confirm step before saving AI-extracted data | ReceiptReviewCard with inline editing; "Confirm & Save" as the only save path from scan flow |
</phase_requirements>

---

## Summary

Phase 2 is the largest single-phase feature build in the HomeOS roadmap so far. It spans three interconnected domains: (1) expense entry and splitting, (2) balance tracking and settlement, and (3) AI receipt OCR. The good news is that the prior research phase established a clear architecture — Supabase Postgres as the ledger, pure TypeScript functions for split math and debt simplification, Edge Functions for AI calls, and Supabase Realtime for live updates. Phase 1 delivered all the infrastructure this builds on: auth, household membership, RLS, the AI credits system, and the Zustand/hook/StyleSheet patterns that must be followed consistently.

The most technically complex areas are the database schema (5+ new tables with correct RLS policies), the debt simplification algorithm (graph-based, computed on read), the receipt OCR pipeline (async: upload -> Edge Function -> OpenAI -> Realtime update -> review), and the recurring expense scheduler. The UI is already fully specified in the approved 02-UI-SPEC.md and 02-CONTEXT.md, leaving implementation decisions rather than design decisions.

The critical constraint is the existing code style: no React Query (the project uses local `useState` hooks), no NativeWind/Tailwind for new components, StyleSheet.create only. All new patterns must match what Phase 1 established. The project uses Expo SDK 55 (not 53 as research predicted — actual version confirmed from package.json), React Native 0.83.2, and all libraries confirmed against the installed versions.

**Primary recommendation:** Plan the phase in four waves: (W0) database schema + migration + RLS, (W1) expense entry + split logic + balance display, (W2) settlements + history + disputes + recurring, (W3) receipt OCR pipeline + Jolly NL parsing. Each wave is independently deployable and testable.

---

## Standard Stack

### Core (Already Installed — No New Core Dependencies)

| Library | Installed Version | Purpose | Why Standard |
|---------|------------------|---------|--------------|
| @supabase/supabase-js | 2.99.3 | Database client, Realtime subscriptions | Project standard; all data flows through Supabase |
| expo-camera | 55.0.10 | Camera access for receipt scanning | Already in package.json; expo-managed |
| expo-image-picker | 55.0.13 | Gallery receipt upload | Already in package.json; established in Phase 1 |
| expo-haptics | 55.0.9 | Haptic feedback on interactions | Already in package.json; used throughout |
| react-native-reanimated | 4.2.1 | Animations (skeleton, collapse, button scale) | Already in package.json; established |
| react-native-gesture-handler | 2.30.0 | Swipe actions on expense cards | Already in package.json; established |
| @gorhom/bottom-sheet | 5.2.8 | Bottom sheets (split selector, debt detail, dispute) | Already in package.json |
| zustand | 5.0.12 | Global expense state (new useExpenseStore) | Project standard; matches existing store pattern |
| expo-linking | 55.0.8 | Deep links to Venmo/CashApp/PayPal/Zelle | Already in package.json |
| lucide-react-native | 0.462.0 | Category icons, UI icons | Already in package.json |

### New Dependencies Required

| Library | Version (npm) | Purpose | Installation |
|---------|--------------|---------|-------------|
| expo-camera | 55.0.10 | Camera for receipt scan | `npx expo install expo-camera` (already installed per package.json) |

**Verified:** All required libraries are already installed in the project. No new `npm install` commands needed for core functionality. The AI calls go through a Supabase Edge Function (server-side), so the OpenAI SDK never touches the client bundle.

### Not Used in This Project (Despite Research Recommending Them)

| Library | Reason Not Used |
|---------|----------------|
| TanStack Query / React Query | Phase 1 established local `useState` hooks pattern. Do NOT introduce React Query — it would create two conflicting patterns in one codebase. |
| React Hook Form | Phase 1 uses plain TextInput with local state. Do NOT introduce RHF — inconsistent with existing forms. |
| Zod | Not currently installed. Do NOT add it for client validation — use plain TypeScript and manual checks matching existing pattern. |
| NativeWind | Already installed but NOT used in `src/` — all components use `StyleSheet.create`. Do NOT use Tailwind classes in new components. |

---

## Architecture Patterns

### Recommended File Structure for Phase 2

```
src/
├── app/(app)/
│   └── finances.tsx              # REPLACE Phase 1 stub entirely
├── components/expenses/
│   ├── JollyNLInput.tsx          # NL text field + parsing state
│   ├── QuickAddCard.tsx          # Expandable expense entry form
│   ├── SplitTypeSelector.tsx     # Chip row + bottom sheet for split config
│   ├── CategoryChipSuggestion.tsx
│   ├── MemberSplitRow.tsx
│   ├── BalanceSummaryCard.tsx    # Collapsible header card
│   ├── DebtDetailSheet.tsx       # Per-member debt + settle flow
│   ├── PaymentAppLinks.tsx       # Venmo/CashApp/etc deep-link chips
│   ├── SettlementHistoryRow.tsx
│   ├── ExpenseCard.tsx           # Pressable list item
│   ├── FilterBar.tsx
│   ├── ExpenseDetailSheet.tsx    # Two-tab modal: Details + History
│   ├── DisputeBadge.tsx
│   ├── ChangeHistoryRow.tsx
│   ├── RecurringExpenseRow.tsx
│   ├── RecurrenceSchedulePicker.tsx
│   ├── ExpenseSkeletonCard.tsx
│   ├── BalanceSkeletonCard.tsx
│   └── OfflineBanner.tsx
├── components/receipt/
│   ├── ReceiptCameraView.tsx     # Full-screen camera with framing guide
│   ├── ReceiptPageStack.tsx      # Multi-page indicator
│   ├── ReceiptReviewCard.tsx     # Extracted data review + edit
│   ├── ItemClassificationTag.tsx # Shared/Personal toggle pill
│   └── SplitSummaryPreview.tsx  # Per-person totals before confirm
├── hooks/
│   ├── useExpenses.ts            # Fetch, create, update, delete expenses
│   ├── useBalances.ts            # computeBalances() + simplifyDebts() + Realtime
│   ├── useSettlements.ts         # Create/list settlements
│   ├── useRecurring.ts           # Templates CRUD
│   └── useReceipt.ts            # Upload image, call Edge Function, poll result
├── stores/
│   └── expenses.ts              # Zustand: offline queue, filter state, open disputes
├── lib/
│   └── expenseMath.ts           # Pure TS: computeBalances, simplifyDebts, splitCalculation, proportionalTax
└── __tests__/
    └── expenses.test.ts         # Unit tests for expenseMath.ts functions
```

```
supabase/
├── migrations/
│   └── 00003_expenses.sql       # All expense tables + RLS in one migration
└── functions/
    ├── process-receipt/
    │   └── index.ts             # Upload -> OpenAI Vision -> return structured JSON
    └── parse-nl-expense/
        └── index.ts             # NL sentence -> structured expense fields
```

### Pattern 1: Ledger-Based Balances (Never Store Computed Values)

**What:** The `expenses` and `expense_splits` tables are the immutable ledger. Balances are computed on every read by `computeBalances()`. Debt simplification is computed on every balance view by `simplifyDebts()`. Neither result is ever stored.

**When to use:** All balance display, settlement suggestions, and "who owes who" queries.

**Why:** Editing or deleting an expense would require cascading updates to stored balances — an error-prone consistency problem. Computing from the ledger is correct by construction and trivially fast at household scale (5-15 people, <1000 expenses).

**Implementation:**
```typescript
// src/lib/expenseMath.ts

export interface LedgerEntry {
  paidBy: string;        // user_id
  splits: { userId: string; amount: number }[];
}

export interface Balance {
  from: string;   // user_id who owes
  to: string;     // user_id who is owed
  amount: number; // in cents (integer arithmetic avoids float drift)
}

export function computeBalances(entries: LedgerEntry[]): Record<string, number> {
  // net[userId] = positive means they're owed, negative means they owe
  const net: Record<string, number> = {};
  for (const entry of entries) {
    for (const split of entry.splits) {
      if (split.userId !== entry.paidBy) {
        net[split.userId] = (net[split.userId] ?? 0) - split.amount;
        net[entry.paidBy] = (net[entry.paidBy] ?? 0) + split.amount;
      }
    }
  }
  return net;
}

export function simplifyDebts(net: Record<string, number>): Balance[] {
  // Heap-based greedy: match largest creditor with largest debtor
  const givers = Object.entries(net)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);
  const receivers = Object.entries(net)
    .filter(([, v]) => v < 0)
    .sort(([, a], [, b]) => a - b);

  const result: Balance[] = [];
  let gi = 0, ri = 0;
  const g = givers.map(([id, amt]) => ({ id, amt }));
  const r = receivers.map(([id, amt]) => ({ id, amt: -amt }));

  while (gi < g.length && ri < r.length) {
    const settle = Math.min(g[gi].amt, r[ri].amt);
    result.push({ from: r[ri].id, to: g[gi].id, amount: settle });
    g[gi].amt -= settle;
    r[ri].amt -= settle;
    if (g[gi].amt === 0) gi++;
    if (r[ri].amt === 0) ri++;
  }
  return result;
}
```

**CRITICAL:** Store amounts as integers (cents). `241.85` -> `24185`. Float arithmetic causes drift: `0.1 + 0.2 !== 0.3` in JavaScript. All display formatting converts cents to dollars at render time only.

### Pattern 2: Database Schema for Expenses

```sql
-- supabase/migrations/00003_expenses.sql

-- Core expense table
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
  deleted_at TIMESTAMPTZ,          -- soft delete
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-person split amounts
CREATE TABLE public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  is_personal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit trail for edits
CREATE TABLE public.expense_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'edited', 'deleted')),
  previous_data JSONB,             -- snapshot of fields before change
  changed_fields TEXT[],          -- which fields changed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Settlements (debt payoffs)
CREATE TABLE public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  to_user_id UUID NOT NULL REFERENCES auth.users(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  payment_method TEXT,             -- 'venmo', 'cashapp', 'paypal', 'zelle', 'other'
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disputes
CREATE TABLE public.expense_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE public.dispute_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.expense_disputes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recurring templates
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Household split presets
CREATE TABLE public.split_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shares JSONB NOT NULL,            -- [{"user_id": "...", "percentage": 40}, ...]
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Member payment preferences (extends profiles table via separate table)
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
```

### Pattern 3: RLS Policies for Expense Tables

**Critical insight from Phase 1:** RLS on all tables from day one. The expense privacy feature (EXPN-14) requires that `is_private = true` expenses are readable ONLY by members in the split. This is a non-trivial RLS policy.

```sql
-- Standard household access policy (for non-private expenses)
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

-- Splits: visible if you can see the expense
-- (inherits visibility from expenses table via join)
CREATE POLICY "expense_splits: member can read"
  ON public.expense_splits FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE household_id IN (
        SELECT household_id FROM public.household_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );
```

### Pattern 4: Receipt OCR Pipeline (Async)

The flow is asynchronous — never block the UI waiting for AI:

```
1. User captures photo in ReceiptCameraView
   ↓
2. Upload image to Supabase Storage bucket 'receipts' (client-side, immediate)
   → returns storage_path (e.g., "receipts/{household_id}/{uuid}.jpg")
   ↓
3. Call Edge Function: POST /functions/v1/process-receipt
   Body: { storage_path, household_id, member_names: string[] }
   ↓ (Edge Function)
4. Edge Function reads image via service role signed URL
   → Calls OpenAI gpt-4o with vision prompt
   → Returns structured JSON: { store, date, items[], tax_cents, tip_cents, total_cents }
   → Items include AI classification: { name, price_cents, classification: 'shared'|'personal', suggested_owner_id }
   ↓
5. Client receives Edge Function response (synchronous call — <4s target)
   → Navigates to ReceiptReviewCard with pre-populated data
   → User reviews, edits any field, toggles classification tags
   ↓
6. User taps "Confirm & Save"
   → Standard expense creation with splits derived from classification
```

**Note:** The CONTEXT.md specifies the Edge Function response arrives synchronously enough for the review card (< 4s). This differs from the architecture doc's "async + Realtime" pattern. For receipt scanning, use a synchronous Edge Function call and await the response — simpler and sufficient for the latency target. Only use the async/Realtime pattern if latency exceeds 4s in testing.

**OpenAI Vision Prompt Pattern:**
```typescript
// supabase/functions/process-receipt/index.ts
const systemPrompt = `You are a receipt parsing assistant. Extract structured data from the receipt image.
Return JSON exactly matching this schema:
{
  "store_name": string,
  "date": "YYYY-MM-DD" | null,
  "items": [{ "name": string, "price_cents": integer, "classification": "shared"|"personal", "suggested_owner": string|null }],
  "subtotal_cents": integer,
  "tax_cents": integer,
  "tip_cents": integer,
  "total_cents": integer
}
Household members for classification hints: ${memberNames.join(', ')}
Classify items as "personal" if they are clearly individual (e.g., specific medications, personal care items with a single person's name).
Default to "shared" for food, household supplies, and anything ambiguous.`;
```

### Pattern 5: Supabase Realtime for Live Expense Updates

Follow the single-channel-per-household pattern from ARCHITECTURE.md:

```typescript
// src/hooks/useExpenses.ts
useEffect(() => {
  if (!householdId) return;

  const channel = supabase
    .channel(`household:${householdId}:expenses`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'expenses',
        filter: `household_id=eq.${householdId}`,
      },
      (_payload) => {
        // Refetch expenses list when any change arrives
        loadExpenses();
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [householdId]);
```

### Pattern 6: Jolly NL Parsing (Edge Function)

```typescript
// supabase/functions/parse-nl-expense/index.ts
// Input: { sentence: string, household_members: Member[], default_currency: string }
// Output: { description, amount_cents, split_type, members, category, confidence_flags }
// confidence_flags: array of field names Jolly guessed (shown with accent border in UI)
```

**Category suggestion fallback:** If AI credits are low or user is on free tier, use client-side keyword matching before calling the Edge Function:

```typescript
// src/lib/expenseMath.ts
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Groceries': ['costco', 'trader joe', 'whole foods', 'safeway', 'kroger', 'walmart', 'grocery', 'supermarket'],
  'Dining': ['restaurant', 'pizza', 'sushi', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'uber eats', 'doordash'],
  'Utilities': ['electric', 'gas', 'water', 'internet', 'wifi', 'pg&e', 'spectrum', 'comcast', 'utility'],
  'Rent': ['rent', 'lease', 'landlord'],
  'Transport': ['uber', 'lyft', 'gas station', 'parking', 'transit', 'bart', 'metro'],
  'Entertainment': ['netflix', 'spotify', 'hulu', 'disney', 'movie', 'concert', 'ticket'],
  'Healthcare': ['pharmacy', 'cvs', 'walgreens', 'doctor', 'dentist', 'prescription'],
  'Household': ['amazon', 'target', 'home depot', 'ikea', 'supplies', 'cleaning'],
};

export function suggestCategory(description: string): string | null {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return category;
  }
  return null;
}
```

### Pattern 7: Zustand Store for Expense State

Following the exact pattern from `src/stores/household.ts`:

```typescript
// src/stores/expenses.ts
import { create } from 'zustand';

interface QueuedExpense {
  localId: string;
  data: CreateExpenseInput;
  queuedAt: string;
}

interface ExpenseState {
  offlineQueue: QueuedExpense[];
  activeFilters: ExpenseFilters;
  enqueue: (expense: CreateExpenseInput) => void;
  dequeue: (localId: string) => void;
  setFilters: (filters: ExpenseFilters) => void;
  clearFilters: () => void;
}
```

### Pattern 8: Payment App Deep Links

```typescript
// src/lib/paymentLinks.ts
export function buildPaymentLink(app: string, username: string, amount: number, note: string): string {
  const formattedAmount = (amount / 100).toFixed(2);
  const encodedNote = encodeURIComponent(note);

  switch (app) {
    case 'venmo':
      return `venmo://paycharge?txn=pay&recipients=${username}&amount=${formattedAmount}&note=${encodedNote}`;
    case 'cashapp':
      return `cashapp://cash.app/$${username}/${formattedAmount}`;
    case 'paypal':
      return `https://www.paypal.com/paypalme/${username}/${formattedAmount}`;
    case 'zelle':
      // Zelle does not have a universal deep link — open banking app instead
      return `zellepay://`;
    default:
      return '';
  }
}
```

**Pitfall:** Venmo and CashApp deep link schemes change. Always use `Linking.canOpenURL()` before attempting to open. Fall back gracefully to web URL or display of username string if the app is not installed.

### Pattern 9: Recurring Expense Scheduling

**Option A (Recommended for Phase 2):** Client-side trigger on app foreground. When the expenses tab loads, check if any `recurring_expense_templates` have `next_due_date <= today` and `is_paused = false`. If yes, call an Edge Function or Supabase RPC to auto-create the expense and advance `next_due_date`.

**Option B:** Supabase pg_cron extension (Pro tier feature). Schedule a daily check at midnight. More robust but requires Supabase Pro and adds infrastructure complexity.

**Recommendation:** Use Option A for Phase 2 — simpler, no infrastructure change. pg_cron can be added in Phase 6 when the notification system exists to alert members.

```typescript
// src/hooks/useRecurring.ts
async function processOverdueTemplates(householdId: string): Promise<void> {
  const { data: templates } = await supabase
    .from('recurring_expense_templates')
    .select('*')
    .eq('household_id', householdId)
    .lte('next_due_date', new Date().toISOString().split('T')[0])
    .eq('is_paused', false);

  for (const template of templates ?? []) {
    await supabase.rpc('create_recurring_expense_instance', { template_id: template.id });
    // RPC advances next_due_date and creates expense + splits atomically
  }
}
```

### Anti-Patterns to Avoid

- **Storing computed balances:** Never add a `balance` column to users or households. Always compute from ledger. (See Pattern 1.)
- **Float arithmetic for money:** Use integer cents throughout. `241.85` = `24185` cents. (See Pattern 1.)
- **Blocking UI on OCR:** Never `await` the Edge Function call before showing any UI. Show the camera -> review card flow; if AI is called synchronously, show a loading state on the review card itself.
- **Separate Realtime channels per feature:** One channel per household. Route all events by type. (See Pattern 5.)
- **Application-level household filtering:** RLS handles this. Never add `WHERE household_id = ?` in hook code — trust Supabase RLS.
- **Introducing React Query:** This project uses `useState` hooks. Adding TanStack Query creates two data-fetching patterns. Stick to the established pattern.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Receipt OCR | Custom Tesseract pipeline | GPT-4o vision via Edge Function | Tesseract fails on crumpled/angled receipts; GPT-4o returns structured JSON with 95%+ accuracy per DEEP-EXPENSES.md research |
| Camera UI | Raw camera permissions + preview | `expo-camera` CameraView component | Handles permissions, preview, capture, orientation — already installed |
| Bottom sheets | Modal + animation from scratch | `@gorhom/bottom-sheet` (already installed v5.2.8) | Handles keyboard avoidance, gesture dismissal, backdrop, snap points |
| NL parsing | Manual regex on expense sentence | OpenAI gpt-4o-mini via Edge Function (< 1s, cheap) | Regex cannot handle "split between me and Jake, Sarah pays 40%" — too many natural language variations |
| Debt simplification graph | Custom graph traversal | `src/lib/expenseMath.ts` `simplifyDebts()` pure function (implement once, test thoroughly) | The algorithm is well-understood and small; no library needed, but DO NOT reimplment it per feature — one shared utility |
| Gallery image picker | Raw `expo-camera` gallery | `expo-image-picker` (already installed) | One-line API for camera roll access with correct permissions |
| Haptic feedback | `Vibration` API | `expo-haptics` (already installed) | iOS-quality haptic types (impact/notification) not available via Vibration API |
| Payment app links | Hardcoded URL schemes | `src/lib/paymentLinks.ts` utility + `Linking.canOpenURL()` check | URL schemes vary; canOpenURL prevents crashes on devices without the app |

---

## Common Pitfalls

### Pitfall 1: Float Arithmetic in Split Math

**What goes wrong:** Storing expense amounts as floats causes cents-off errors. `$241.85 / 3 = $80.6166...` — if you store this as float and round at display time, the three splits sum to `$80.62 + $80.62 + $80.61 = $241.85`, but floating point rounding during arithmetic can produce `$241.86` or `$241.84` with naive implementation.

**Why it happens:** JavaScript `Number` uses IEEE 754 double precision. `0.1 + 0.2 !== 0.3`.

**How to avoid:** Store all amounts as integers in cents. Perform integer arithmetic. Only divide at the final split step, and assign the remainder to the `paid_by` user. Example: `24185 cents / 3 = 8061, 8061, 8063` (last person gets the odd cent).

**Warning signs:** Any `toFixed(2)` call in split calculation logic — this is a smell. `toFixed` should only appear in display/formatting functions.

### Pitfall 2: RLS on expense_splits Referencing expenses

**What goes wrong:** An expense with `is_private = true` should be hidden from non-split members. But if `expense_splits` has a SELECT policy that allows any household member to read all splits, a member could infer the existence of private expenses by querying splits.

**How to avoid:** The `expense_splits` SELECT policy must join through `expenses` and respect the same privacy filter. See the RLS policy in Pattern 3. Test this explicitly in Wave 0.

**Warning signs:** Any `expense_splits` SELECT policy that uses only `household_id` without joining to `expenses` visibility rules.

### Pitfall 3: Realtime Subscription Memory Leaks

**What goes wrong:** If `supabase.removeChannel()` is not called in the `useEffect` cleanup, subscriptions accumulate across re-renders and component unmounts, eventually causing Supabase connection limit errors.

**How to avoid:** Always return a cleanup function from `useEffect` that calls `supabase.removeChannel(channel)`. Pattern shown in Pattern 5.

**Warning signs:** Supabase dashboard showing connection count growing over time; console warnings about channel limits.

### Pitfall 4: expo-camera Permissions on Android

**What goes wrong:** `expo-camera` on Android requires explicit permission request before the camera view renders. If you render `CameraView` without first calling `Camera.requestCameraPermissionsAsync()`, the component renders a blank black screen with no error.

**How to avoid:** Call `Camera.requestCameraPermissionsAsync()` before mounting `ReceiptCameraView`. Show a permission prompt screen if denied.

```typescript
import { Camera } from 'expo-camera';

const [permission, requestPermission] = Camera.useCameraPermissions();
if (!permission?.granted) {
  return <PermissionPromptView onRequest={requestPermission} />;
}
```

**Warning signs:** Black screen in camera view with no error thrown.

### Pitfall 5: @gorhom/bottom-sheet in Expo Router Modals

**What goes wrong:** `@gorhom/bottom-sheet` v5 requires `GestureHandlerRootView` as a root ancestor. Expo Router wraps the app in this by default, but if a screen is rendered as a modal (via `href: { pathname, params }` + `presentation: 'modal'`), the gesture handler context may not propagate correctly.

**How to avoid:** Render bottom sheets within the main tab screen rather than as separate routes. The `DebtDetailSheet`, `SplitTypeSelector`, and `ExpenseDetailSheet` components should be rendered as overlays within `finances.tsx`, not as separate Expo Router screens.

**Warning signs:** Bottom sheet gesture handling works on iOS but not Android; sheet doesn't respond to swipe-to-dismiss.

### Pitfall 6: Debt Simplification Correctness

**What goes wrong:** The naive "find biggest debtor, pair with biggest creditor" greedy algorithm can produce a non-minimal set of transfers in edge cases with equal amounts. Also, floating point errors in net position calculation can leave residual amounts of `0.000001` cents that never resolve.

**How to avoid:** Use integer cents throughout (pitfall 1 fix also fixes this). Apply an epsilon threshold: ignore balances where `|amount| < 1` cent. Test the simplifyDebts function with the specific cases: A->B->C->A cycle (should produce 0 transfers), A owes B $10 and B owes C $10 (should produce A->C $10, not two transfers).

### Pitfall 7: OpenAI Vision Structured Output Schema Compliance

**What goes wrong:** GPT-4o sometimes returns slightly different JSON structure than prompted — e.g., `price` instead of `price_cents`, or missing fields. If the Edge Function passes the raw response to the client without validation, the review card crashes on null field access.

**How to avoid:** In the Edge Function, validate the OpenAI response against the expected schema before returning. Fill defaults for missing fields (`tax_cents: 0`, `tip_cents: 0`). Return a sanitized, guaranteed-shape object.

**Warning signs:** Crashes on ReceiptReviewCard that only occur sometimes, not reproducibly.

---

## Code Examples

### Proportional Tax/Tip Distribution (EXPN-13)

```typescript
// src/lib/expenseMath.ts
export function distributeTaxProportionally(
  itemTotalsByCents: Record<string, number>, // userId -> cents of their items
  taxCents: number,
  tipCents: number
): Record<string, number> {
  const grandItemTotal = Object.values(itemTotalsByCents).reduce((a, b) => a + b, 0);
  if (grandItemTotal === 0) return {};

  const result: Record<string, number> = {};
  let distributedTax = 0;
  let distributedTip = 0;
  const userIds = Object.keys(itemTotalsByCents);

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const ratio = itemTotalsByCents[userId] / grandItemTotal;

    if (i === userIds.length - 1) {
      // Last person gets the remainder to avoid rounding drift
      result[userId] = itemTotalsByCents[userId] + (taxCents - distributedTax) + (tipCents - distributedTip);
    } else {
      const userTax = Math.floor(taxCents * ratio);
      const userTip = Math.floor(tipCents * ratio);
      result[userId] = itemTotalsByCents[userId] + userTax + userTip;
      distributedTax += userTax;
      distributedTip += userTip;
    }
  }
  return result;
}
```

### Supabase RPC for Atomic Expense Creation

Creating an expense + its splits atomically prevents partial writes:

```sql
-- In migration 00003_expenses.sql
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

  -- Create initial version record
  INSERT INTO public.expense_versions (expense_id, changed_by, change_type)
  VALUES (v_expense_id, auth.uid(), 'created');

  RETURN v_expense_id;
END;
$$;
```

### getOutstandingBalance Integration (from Phase 1 stub)

`src/components/household/LeaveHouseholdDialog.tsx` has a stub with `TODO(Phase-2)`. Replace it:

```typescript
// src/lib/expenseMath.ts — add this function
export async function getOutstandingBalance(
  supabase: SupabaseClient,
  householdId: string,
  userId: string
): Promise<number> {
  // Fetch all non-deleted expenses + splits for household
  const { data: splits } = await supabase
    .from('expense_splits')
    .select('amount_cents, expense:expenses!inner(paid_by, deleted_at, household_id)')
    .eq('expense.household_id', householdId)
    .is('expense.deleted_at', null)
    .eq('user_id', userId);

  // ... compute net position for userId
  // Return absolute value of net position in cents
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tesseract OCR for receipts | GPT-4o vision endpoint | 2023-2024 | 95%+ accuracy vs ~70%; no model management; returns structured JSON |
| expo-camera `Camera` class | `expo-camera` `CameraView` component | SDK 50 | New API — use `CameraView` not deprecated `Camera` component |
| Supabase `from().on()` Realtime | `supabase.channel().on('postgres_changes', ...)` | 2023 | New channel-based API; old API removed in supabase-js v2 |
| Manual debt simplification (stored) | Graph algorithm (computed on read) | Always best practice | Splitwise used this from day 1; never store computed balances |
| Splitwise itemized split (Pro only) | HomeOS itemized split (free) | This phase | Core acquisition hook — must be free |

**Deprecated/outdated:**
- `expo-camera` `Camera` class: replaced by `CameraView` in SDK 50+. The installed version (SDK 55) uses `CameraView`.
- Supabase old realtime API (`.on()` on table references): replaced by channel-based API. Current `@supabase/supabase-js` 2.x uses the new API.

---

## Open Questions

1. **Recurring expense auto-creation timing**
   - What we know: CONTEXT.md says "on due date, expense auto-creates". Client-side check on tab load is the recommended approach for Phase 2.
   - What's unclear: If the user doesn't open the app on the due date, the expense doesn't auto-create until next app open. Is this acceptable?
   - Recommendation: Yes, acceptable for Phase 2. Document the behavior: "Recurring expenses create when the app is opened on or after the due date." pg_cron for true server-side scheduling is Phase 6 scope.

2. **AI credits consumption for receipt OCR**
   - What we know: Phase 1 built an AI credits system (50 credits/month per user). CONTEXT.md says receipt scanning uses "AI credits system from Phase 1."
   - What's unclear: Should receipt OCR cost 1 credit? Should Jolly NL parsing cost 1 credit? What is the credit cost per operation?
   - Recommendation: Document assumptions in Wave 0 schema notes. Suggested: receipt OCR = 2 credits (vision API is 2x cost of text), Jolly NL = 1 credit. Planner should confirm with user before locking.

3. **Offline queue persistence**
   - What we know: CONTEXT.md says "queue new expenses locally, sync when back online." Phase 1 uses MMKV for persistence.
   - What's unclear: Should the offline queue survive app kills? If the app is killed while offline, queued expenses are in Zustand memory only — they'd be lost.
   - Recommendation: Persist the `offlineQueue` in the Zustand store using the MMKV-backed `persist` middleware, same pattern as `src/stores/settings.ts`. This is a safe default.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 with jest-expo preset |
| Config file | `jest.config.ts` (root) |
| Setup file | `src/__tests__/setup.ts` |
| Quick run command | `npx jest src/__tests__/expenses.test.ts --passWithNoTests` |
| Full suite command | `npm test` |

**Note:** Tests must be placed in `src/__tests__/` and named `*.test.ts` to match the `testMatch` glob in `jest.config.ts`. Test files with `.tsx` extension are NOT matched — use `.ts` with mocked React Native components.

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXPN-02 | Equal split divides total evenly, odd cents to payer | unit | `npx jest src/__tests__/expenses.test.ts -t "equal split"` | No — Wave 0 |
| EXPN-03 | Percentage split validates sum to 100%; exact split validates sum to total | unit | `npx jest src/__tests__/expenses.test.ts -t "split validation"` | No — Wave 0 |
| EXPN-06 | computeBalances() produces correct net positions | unit | `npx jest src/__tests__/expenses.test.ts -t "computeBalances"` | No — Wave 0 |
| EXPN-06 | simplifyDebts() minimizes transfer count; A->B->C->A = 0 transfers | unit | `npx jest src/__tests__/expenses.test.ts -t "simplifyDebts"` | No — Wave 0 |
| EXPN-13 | distributeTaxProportionally() sums exactly to tax+tip input | unit | `npx jest src/__tests__/expenses.test.ts -t "proportionalTax"` | No — Wave 0 |
| EXPN-11 | buildPaymentLink() produces correct URL scheme per app | unit | `npx jest src/__tests__/expenses.test.ts -t "paymentLink"` | No — Wave 0 |
| EXPN-09 | suggestCategory() matches keywords case-insensitively | unit | `npx jest src/__tests__/expenses.test.ts -t "suggestCategory"` | No — Wave 0 |
| EXPN-14 | Private expense RLS: non-split member cannot read | manual | Supabase Studio SQL editor | No |
| AIEX-01 | Receipt OCR returns structured JSON with store/items/tax/total | manual | Test with real camera in Expo Go | No |
| AIEX-03 | Confirm & Save is the only path to save from receipt flow | manual | UI walkthrough in Expo Go | No |

### Sampling Rate

- **Per task commit:** `npx jest src/__tests__/expenses.test.ts --passWithNoTests`
- **Per wave merge:** `npm test` (full suite — all 6 test files)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/expenses.test.ts` — covers EXPN-02, EXPN-03, EXPN-06, EXPN-13, EXPN-11, EXPN-09
- [ ] `src/lib/expenseMath.ts` — pure functions that the test file exercises (must exist before tests can pass)

*(Existing test infrastructure: jest.config.ts, setup.ts, and 5 passing test files already established in Phase 1. No framework install needed.)*

---

## Sources

### Primary (HIGH confidence)

- Existing codebase: `package.json`, `jest.config.ts`, `src/__tests__/setup.ts`, `src/stores/household.ts`, `src/hooks/useMembers.ts`, `src/app/(app)/finances.tsx`, `supabase/migrations/00001_foundation.sql` — actual installed versions and established patterns
- `.planning/research/STACK.md` — tech stack decisions with sources
- `.planning/research/ARCHITECTURE.md` — system design patterns with sources
- `.planning/research/DEEP-EXPENSES.md` — competitive analysis with sources
- `.planning/phases/02-expense-tracking-receipt-ocr/02-CONTEXT.md` — locked user decisions
- `.planning/phases/02-expense-tracking-receipt-ocr/02-UI-SPEC.md` — approved UI design contract

### Secondary (MEDIUM confidence)

- npm registry: verified current versions for @gorhom/bottom-sheet (5.2.8), expo-camera (55.0.10), react-hook-form (7.71.2), zod (4.3.6) — versions from live npm view
- DEEP-EXPENSES.md: Splitwise debt simplification algorithm documented with Medium article source (heap-based greedy approach)
- ARCHITECTURE.md: OCR pipeline pattern with DZone source

### Tertiary (LOW confidence — flag for validation)

- Payment app URL schemes: Venmo `venmo://paycharge`, CashApp `cashapp://cash.app/$`, PayPal `paypalme/` — these change without notice. Verify against each app's current documentation before implementation.
- OpenAI gpt-4o structured output prompt format — verify against current OpenAI docs at implementation time; prompt engineering for receipts may need iteration.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed against installed `package.json`; versions verified against npm registry
- Architecture: HIGH — patterns derived from existing codebase patterns and prior research artifacts with authoritative sources
- Database schema: HIGH — follows Phase 1 migration patterns; RLS policies follow established household membership check pattern
- Debt simplification algorithm: HIGH — well-documented heap-based greedy approach from Splitwise's own documentation
- Receipt OCR pipeline: MEDIUM — Edge Function + OpenAI pattern confirmed by architecture research; specific prompt engineering requires iteration
- Payment app deep links: LOW — URL schemes not verified against current app docs; must verify before implementation

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable stack; re-verify OpenAI API and payment app URL schemes at implementation time)
