---
phase: 02-expense-tracking-receipt-ocr
plan: 02
subsystem: ui
tags: [react-native, supabase, reanimated, haptics, bottom-sheet, expenses, zustand]

requires:
  - phase: 02-01
    provides: expenseMath.ts (computeBalances, simplifyDebts, calculateSplit, suggestCategory), types/expenses.ts, stores/expenses.ts (offline queue)

provides:
  - useExpenses hook: fetch, create expenses via Supabase RPC with Realtime subscription and offline queue
  - useBalances hook: compute simplified debts from ledger entries with settlement adjustment
  - QuickAddCard: expandable expense entry form supporting all 4 split types + presets
  - SplitTypeSelector: horizontal chip row for split type selection
  - MemberSplitRow: per-member row with value inputs for weighted split types
  - CategoryChipSuggestion: debounced category inference with modal picker
  - BalanceSummaryCard: collapsible card with animated height transition and per-member net balances
  - ExpenseCard: pressable card with scale animation, category emoji, formatted amount
  - ExpenseSkeletonCard / BalanceSkeletonCard: shimmer loading placeholders
  - OfflineBanner: slide-in amber fixed banner
  - finances.tsx: full Phase 2 replacement — NL placeholder, balance card, quick-add bottom sheet, expense list, empty states

affects: [03-chores-calendar, 05-recurring-expenses, 06-receipt-scanning, 07-jolly-nlp]

tech-stack:
  added: []
  patterns:
    - "Expense data hooks follow useState + useCallback + useEffect pattern (consistent with useMembers)"
    - "Supabase Realtime subscriptions scoped to household_id filter — cleanup via supabase.removeChannel"
    - "Bottom sheet (@gorhom/bottom-sheet v5) for quick-add form at 85% snap point"
    - "StyleSheet.create throughout — no NativeWind/Tailwind"
    - "Skeleton shimmer uses Reanimated translateX loop (-width to +width, 1.2s repeat)"
    - "BalanceSummaryCard uses Reanimated height interpolation 200ms ease-out"
    - "OfflineBanner uses Reanimated translateY slide-in 250ms ease-out"

key-files:
  created:
    - src/hooks/useExpenses.ts
    - src/hooks/useBalances.ts
    - src/components/expenses/QuickAddCard.tsx
    - src/components/expenses/SplitTypeSelector.tsx
    - src/components/expenses/MemberSplitRow.tsx
    - src/components/expenses/CategoryChipSuggestion.tsx
    - src/components/expenses/BalanceSummaryCard.tsx
    - src/components/expenses/ExpenseCard.tsx
    - src/components/expenses/ExpenseSkeletonCard.tsx
    - src/components/expenses/BalanceSkeletonCard.tsx
    - src/components/expenses/OfflineBanner.tsx
  modified:
    - src/app/(app)/finances.tsx (full Phase 1 stub replacement)

key-decisions:
  - "Offline detection in createExpense uses error message heuristic (network/fetch/offline keywords) — pragmatic approach without NetInfo dependency"
  - "useBalances subscribes to both expenses and settlements tables on same Reanimated channel for single cleanup"
  - "BalanceSummaryCard fixed expanded height at 200px rather than dynamic measurement — avoids layout measurement complexity in first implementation"
  - "QuickAddCard exact split values entered in dollars (not cents) for UX then converted on save"
  - "Category picker uses Modal rather than bottom sheet to avoid nesting BottomSheet inside BottomSheet"

patterns-established:
  - "Expense hooks: useState for data/loading/error, useCallback for load functions, useEffect for mount + Realtime"
  - "All expense components use StyleSheet.create with colors from @/constants/theme"
  - "Touch targets: minHeight 44px on all interactive elements"

requirements-completed: [EXPN-01, EXPN-02, EXPN-03, EXPN-04, EXPN-06, EXPN-09]

duration: 5min
completed: 2026-03-21
---

# Phase 02 Plan 02: Expense UI Components and Full Finances Tab Summary

**Quick-add expense form with 4 split types (equal/percentage/exact/shares + presets), Reanimated collapsible balance card with debt simplification, Supabase Realtime data hooks with offline queue fallback, and full finances tab replacing Phase 1 stub**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-21T12:46:55Z
- **Completed:** 2026-03-21T12:52:21Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Built `useExpenses` and `useBalances` data hooks with Supabase Realtime subscriptions scoped to household, offline queue integration, and settlement-adjusted balance computation
- Created 9 expense UI components covering entry (QuickAddCard, SplitTypeSelector, MemberSplitRow, CategoryChipSuggestion), display (ExpenseCard, BalanceSummaryCard), loading states (ExpenseSkeletonCard, BalanceSkeletonCard), and offline UX (OfflineBanner)
- Replaced Phase 1 finances.tsx stub entirely with full expenses tab: NL input placeholder, collapsible balance card, quick-add bottom sheet, expense list with skeleton loading, empty states per UI-SPEC copywriting, and offline banner

## Task Commits

1. **Task 1: Data hooks — useExpenses and useBalances** - `9704d79` (feat)
2. **Task 2: Expense entry components and expenses tab layout** - `f2bb913` (feat)

## Files Created/Modified

- `src/hooks/useExpenses.ts` — fetch/create expenses via Supabase RPC + Realtime + offline queue
- `src/hooks/useBalances.ts` — balance computation with settlement adjustment + Realtime
- `src/components/expenses/QuickAddCard.tsx` — expandable form supporting all 4 split types
- `src/components/expenses/SplitTypeSelector.tsx` — horizontal chip row
- `src/components/expenses/MemberSplitRow.tsx` — per-member value input row
- `src/components/expenses/CategoryChipSuggestion.tsx` — debounced category inference + modal picker
- `src/components/expenses/BalanceSummaryCard.tsx` — collapsible balance card with Reanimated height animation
- `src/components/expenses/ExpenseCard.tsx` — pressable card with scale animation
- `src/components/expenses/ExpenseSkeletonCard.tsx` — shimmer loading placeholder
- `src/components/expenses/BalanceSkeletonCard.tsx` — shimmer loading placeholder (56px height)
- `src/components/expenses/OfflineBanner.tsx` — slide-in amber banner
- `src/app/(app)/finances.tsx` — full replacement (Phase 1 stub removed)

## Decisions Made

- Offline detection uses error message heuristic (network/fetch keywords) rather than adding NetInfo dependency — keeps dependency count low
- useBalances subscribes to both expenses and settlements on the same Reanimated channel for clean single cleanup
- Category picker uses Modal (not nested BottomSheet) to avoid @gorhom/bottom-sheet nesting limitations
- QuickAddCard exact split amounts entered in dollars for UX, converted to cents on save

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Full expense entry UI ready for Plan 03 (chores/calendar)
- Data hooks ready for receipt OCR pre-fill (Plan 06) via `prefilled` prop on QuickAddCard
- NL input placeholder ready for Jolly AI wiring (Plan 07)
- Balance card ready for DebtDetailSheet (future plan)

---
*Phase: 02-expense-tracking-receipt-ocr*
*Completed: 2026-03-21*
