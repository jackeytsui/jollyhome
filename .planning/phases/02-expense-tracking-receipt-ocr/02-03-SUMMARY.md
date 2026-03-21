---
phase: 02-expense-tracking-receipt-ocr
plan: 03
subsystem: ui
tags: [react-native, supabase, bottom-sheet, deep-links, expo-haptics, settlement]

# Dependency graph
requires:
  - phase: 02-expense-tracking-receipt-ocr
    provides: "Plan 01: Settlement, Balance, PaymentPreferences types; paymentLinks.ts deep link builder"
  - phase: 02-expense-tracking-receipt-ocr
    provides: "Plan 02: BalanceSummaryCard with onMemberPress, useBalances with simplifiedDebts"
provides:
  - "useSettlements hook for creating/listing settlements and managing payment preferences via Supabase"
  - "DebtDetailSheet bottom sheet with full/partial settle flow, original debt chain toggle, and history"
  - "PaymentAppLinks horizontal chip row with Venmo/Cash App/PayPal/Zelle deep links and preferred-app priority"
  - "SettlementHistoryRow list item for past settlements with date, amount, and payment method"
  - "finances.tsx wired: tapping a member in BalanceSummaryCard opens DebtDetailSheet"
affects:
  - 02-04
  - 02-05
  - 02-06
  - 02-07

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Settlement creation uses insert + reload pattern matching useExpenses hook style"
    - "PaymentPreferences upsert with onConflict: 'user_id' for idempotent preference storage"
    - "DebtDetailSheet controls its BottomSheet ref directly via visible prop in useEffect"
    - "Payment app preferred sort: spread PAYMENT_APPS array, sort preferred key to front"
    - "Linking.canOpenURL guard before openURL with Alert fallback showing username for manual entry"

key-files:
  created:
    - src/hooks/useSettlements.ts
    - src/components/expenses/DebtDetailSheet.tsx
    - src/components/expenses/PaymentAppLinks.tsx
    - src/components/expenses/SettlementHistoryRow.tsx
  modified:
    - src/app/(app)/finances.tsx

key-decisions:
  - "DebtDetailSheet controls its own BottomSheet ref via useEffect on visible prop — avoids lifting ref to parent"
  - "loadSettlements uses Supabase .or() with two and() clauses to fetch both directions of a member pair"
  - "PGRST116 (no rows) error suppressed in loadPaymentPrefs — null prefs is valid first-run state"
  - "PaymentAppLinks shows 50% opacity + Not set up label for apps without configured username, Alert with username on tap"

patterns-established:
  - "Settlement hook pattern: local useState, async functions, reload-on-mutation, boolean return from mutations"
  - "PaymentAppLinks preferred sort: spread array, sort preferred_app key to index 0"

requirements-completed: [EXPN-07, EXPN-11]

# Metrics
duration: 10min
completed: 2026-03-21
---

# Phase 02 Plan 03: Settlement Flow Summary

**Settlement bottom sheet with Supabase-backed history, full/partial settlement, and Venmo/Cash App/PayPal/Zelle deep links with recipient preferred-app prioritization, wired into finances.tsx via BalanceSummaryCard.onMemberPress**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-21T12:54:50Z
- **Completed:** 2026-03-21T13:05:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- useSettlements hook handles settlement creation (insert to Supabase), history loading per member pair, and payment preference upsert/load
- DebtDetailSheet bottom sheet with settle form (editable amount), PaymentAppLinks integration, original chain toggle, and settlement history section
- PaymentAppLinks horizontal scrollview with deep links, preferred app sorted first with border ring, unset apps shown at 50% opacity
- finances.tsx fully wired: selectedDebtMember state, onMemberPress opens sheet, onSettled refreshes balances

## Task Commits

1. **Task 1: useSettlements hook** - `7dddd0c` (feat)
2. **Task 2: Settlement UI components and finances.tsx wiring** - `609c9fa` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/hooks/useSettlements.ts` - Supabase-backed settlements CRUD and payment preferences management
- `src/components/expenses/DebtDetailSheet.tsx` - Bottom sheet with settle flow, original chain toggle, and settlement history
- `src/components/expenses/PaymentAppLinks.tsx` - Payment app chip row with deep links, preferred-app priority
- `src/components/expenses/SettlementHistoryRow.tsx` - Settlement history list row (date + amount + method)
- `src/app/(app)/finances.tsx` - Wired DebtDetailSheet via selectedDebtMember state and BalanceSummaryCard.onMemberPress

## Decisions Made

- DebtDetailSheet controls its own BottomSheet ref via useEffect on `visible` prop — avoids lifting ref state to parent finances.tsx
- `loadSettlements` uses Supabase `.or()` with two `and()` clauses to fetch settlements in both directions for a member pair
- PGRST116 (no rows found) suppressed in `loadPaymentPrefs` — null prefs is valid first-run state, not an error
- PaymentAppLinks shows chips at 50% opacity with "Not set up" label when no username configured; tapping shows Alert with copy-paste instructions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all 38 existing expense tests continued to pass after changes.

## User Setup Required

None - no external service configuration required beyond existing Supabase setup.

## Next Phase Readiness

- Settlement flow complete, ready for Plan 04 (expense history/filtering) or Plan 05 (recurring templates)
- `useSettlements` hook ready to be consumed by any future component needing settlement data

---
*Phase: 02-expense-tracking-receipt-ocr*
*Completed: 2026-03-21*
