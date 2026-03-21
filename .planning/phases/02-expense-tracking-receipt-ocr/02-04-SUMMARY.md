---
phase: 02-expense-tracking-receipt-ocr
plan: 04
subsystem: expenses-ui
tags: [expense-detail, history, filter, dispute, audit-trail, soft-delete]
dependency_graph:
  requires: [02-02, 02-03]
  provides: [ExpenseDetailSheet, FilterBar, expense-history-screen, DisputeBadge, ChangeHistoryRow]
  affects: [finances.tsx, useExpenses]
tech_stack:
  added: []
  patterns: [two-tab-bottom-sheet, paginated-flatlist, dynamic-supabase-query, soft-delete-rpc, dispute-thread]
key_files:
  created:
    - src/components/expenses/ExpenseDetailSheet.tsx
    - src/components/expenses/ChangeHistoryRow.tsx
    - src/components/expenses/DisputeBadge.tsx
    - src/components/expenses/FilterBar.tsx
    - src/app/(app)/expense-history.tsx
  modified:
    - src/hooks/useExpenses.ts
    - src/app/(app)/finances.tsx
decisions:
  - "ExpenseDetailSheet controls its own BottomSheet ref via useEffect on visible prop — same pattern as DebtDetailSheet from Plan 03"
  - "FilterBar uses controlled open panel state (one panel open at a time) — avoids nested scroll complexity"
  - "loadFilteredExpenses added to useExpenses as a separate callback — avoids breaking existing loadExpenses used by finances.tsx"
  - "expense-history.tsx uses local expenses state + filtersRef to avoid double-renders when filter changes trigger page reset"
  - "finances.tsx 'See all expenses' link always visible (removed length > 10 gate) — better UX, history screen handles empty state"
metrics:
  duration: 5 min
  completed_date: "2026-03-21"
  tasks: 2
  files: 7
---

# Phase 02 Plan 04: Expense History, Detail Sheet, Filters, and Disputes Summary

**One-liner:** Two-tab ExpenseDetailSheet with edit/delete/dispute + audit trail, five-type FilterBar, paginated expense history screen, and inline ExpenseCard detail on finances tab.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ExpenseDetailSheet with edit, delete, dispute, and change history | dcc7643 | ExpenseDetailSheet.tsx, ChangeHistoryRow.tsx, DisputeBadge.tsx |
| 2 | Expense history screen, filter bar, and finances.tsx ExpenseCard wiring | c29b384 | FilterBar.tsx, expense-history.tsx, finances.tsx, useExpenses.ts |

## What Was Built

### Task 1: ExpenseDetailSheet + Support Components

**`DisputeBadge`** — Amber pill (open) or green pill (resolved) with Flag lucide icon. Height 20px, border radius 10px, font 14px/600. Color-coded per dispute status.

**`ChangeHistoryRow`** — Avatar (20px initials) + action text + relative timestamp. Action text generated from `change_type` (created/edited/deleted). Edited rows show expandable diff (old value strikethrough -> updated). Relative time function: minutes, hours, "Yesterday", days, date.

**`ExpenseDetailSheet`** — `@gorhom/bottom-sheet` at 80%/95% snap points. Two-tab layout (Details / History) with underline indicator. Details tab shows: amount (Display 28px, accent), description (Heading 20px), category chip, date, paid-by avatar, split breakdown, receipt thumbnail (tappable full-size via Modal), privacy indicator (Lock icon). History tab fetches `expense_versions` and `expense_disputes` with `dispute_comments`.

Action buttons:
- **Edit** (creator only): inline edit mode for description, amount, category → calls `supabase.rpc('update_expense', ...)` → haptic success → `onUpdate()`
- **Delete** (creator only): Alert confirmation "Delete this expense? This will update balances for everyone involved." → `supabase.rpc('soft_delete_expense', ...)` → haptic success → `onUpdate()` + `onClose()`
- **Dispute** (all involved): TextInput "Add a note for your housemates..." → inserts `expense_disputes` + `dispute_comments` → haptic notification

Dispute thread in History tab renders comments with add-comment TextInput at bottom.

### Task 2: FilterBar + Expense History Screen + finances.tsx Wiring

**`FilterBar`** — Horizontal ScrollView of 5 chip Pressables: Date, Category, Member, Amount, Search. Each chip opens an inline panel below the row. Active chips use accent orange (#F97316) background + white text. Clear button appears when any filter is active. Chip dimensions: height 32px, border-radius 16px, padding 12px.

**`expense-history.tsx`** — Full-screen Expo Router page. SafeAreaView + FlatList with 20 items/page pagination (`onEndReached` → `handleEndReached`). Sticky FilterBar at top. Each ExpenseCard opens ExpenseDetailSheet. Empty state: "No expenses match your filters" + Clear Filters button. Footer activity indicator for `loadingMore`.

**`useExpenses.loadFilteredExpenses(filters, page)`** — Dynamic Supabase query builder. Applies `.eq`, `.gte`, `.lte`, `.ilike` conditionally for all 6 filter fields. Returns `ExpenseWithSplits[]` for the requested page.

**`finances.tsx`** — Added `selectedExpense` state + `ExpenseDetailSheet` at bottom. Each `ExpenseCard.onPress` now calls `setSelectedExpense(expense)`. "See all expenses" link calls `router.push('/expense-history')`.

## Decisions Made

1. **ExpenseDetailSheet controls its own BottomSheet ref via useEffect on visible prop** — same pattern established by DebtDetailSheet in Plan 03.
2. **FilterBar uses single-panel-open state** — only one filter panel open at a time; simpler than accordion; avoids nested ScrollView conflicts.
3. **loadFilteredExpenses as separate callback in useExpenses** — keeps `loadExpenses` (used by finances.tsx + realtime subscription) unmodified; expense-history.tsx has its own local state.
4. **filtersRef in expense-history.tsx** — stores current filters in a ref to avoid stale closure in `handleEndReached` without triggering re-renders.
5. **'See all expenses' always visible** — removed the `expenses.length > 10` gate; the history screen handles empty/filtered states well, and the link educates users that a full history exists.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

Files exist:
- src/components/expenses/ExpenseDetailSheet.tsx — FOUND
- src/components/expenses/ChangeHistoryRow.tsx — FOUND
- src/components/expenses/DisputeBadge.tsx — FOUND
- src/components/expenses/FilterBar.tsx — FOUND
- src/app/(app)/expense-history.tsx — FOUND

Commits exist:
- dcc7643 — FOUND
- c29b384 — FOUND

Tests: 38 passed (NODE_OPTIONS=--experimental-vm-modules npx jest src/__tests__/expenses.test.ts)

## Self-Check: PASSED
