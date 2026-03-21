---
phase: 02-expense-tracking-receipt-ocr
plan: "05"
subsystem: expenses
tags: [recurring, scheduling, payment-preferences, hooks, components]
dependency_graph:
  requires: [02-04]
  provides: [recurring-expense-templates, payment-preferences-ui]
  affects: [finances-tab]
tech_stack:
  added: []
  patterns:
    - client-side recurring trigger via useEffect on mount calling processOverdue
    - supabase.rpc for atomic expense creation from template
    - Swipeable rows from react-native-gesture-handler for swipe actions
    - BottomSheet from @gorhom/bottom-sheet for RecurrenceSchedulePicker
key_files:
  created:
    - src/hooks/useRecurring.ts
    - src/components/expenses/RecurringExpenseRow.tsx
    - src/components/expenses/RecurrenceSchedulePicker.tsx
    - src/app/(app)/payment-preferences.tsx
  modified:
    - src/app/(app)/finances.tsx
decisions:
  - "skipNext calculates next_due_date client-side before DB write — avoids round-trip, matches RPC behavior for non-overdue skips"
  - "RecurrenceSchedulePicker uses visible prop + useEffect on internal BottomSheet ref — consistent with DebtDetailSheet/ExpenseDetailSheet pattern"
  - "payment-preferences.tsx shows identifier TextInput only for selected app (display: none for others) — keeps form concise"
metrics:
  duration: "4 min"
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_changed: 5
---

# Phase 02 Plan 05: Recurring Expenses and Payment Preferences Summary

**One-liner:** Recurring expense templates with client-side auto-creation trigger (daily/weekly/biweekly/monthly/custom), swipeable row UI with skip/pause/resume/delete, and payment app preference settings page (Venmo, Cash App, PayPal, Zelle).

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | useRecurring hook with auto-creation trigger | cd673ab | src/hooks/useRecurring.ts |
| 2 | Recurring UI components and payment preferences screen | 34d7485 | RecurringExpenseRow.tsx, RecurrenceSchedulePicker.tsx, payment-preferences.tsx, finances.tsx |

## What Was Built

**`src/hooks/useRecurring.ts`**
- Full CRUD: `createTemplate`, `updateTemplate`, `deleteTemplate`
- State management: `pauseTemplate`, `resumeTemplate`
- Schedule advancement: `skipNext` with per-frequency date math (daily +1, weekly +7, biweekly +14, monthly same-day-next-month with month-end clamping, custom +N days)
- `processOverdue`: queries templates where next_due_date <= today AND not paused, calls `create_recurring_expense_instance` RPC for each, then reloads
- `useEffect` on mount: calls `processOverdue().then(() => loadTemplates())` when `activeHouseholdId` is truthy

**`src/components/expenses/RecurringExpenseRow.tsx`**
- Swipeable row via `react-native-gesture-handler` Swipeable
- Left swipe reveals: Skip (accent) + Pause/Resume (secondary)
- Right swipe reveals: Edit (accent) + Delete (destructive)
- Schedule label formatting for all 5 frequency types
- `is_paused` state: 50% opacity row + amber "Paused" badge

**`src/components/expenses/RecurrenceSchedulePicker.tsx`**
- BottomSheet at 50% snap with visible prop controlling expand/close
- Frequency list: Daily, Weekly, Biweekly, Monthly, Custom interval
- Day-of-week circle buttons (S M T W T F S) for Weekly/Biweekly
- Day-of-month TextInput (1–31) for Monthly
- Custom interval TextInput for Custom

**`src/app/(app)/payment-preferences.tsx`**
- SafeAreaView + ScrollView settings screen
- 4 app cards at 80px height (Venmo, Cash App, PayPal, Zelle) with accent border on selection
- Identifier TextInput shown only for selected app
- Save calls `updatePaymentPrefs()` from `useSettlements`
- Loads existing prefs on mount via `loadPaymentPrefs(user.id)`

**`src/app/(app)/finances.tsx`**
- Replaced "Recurring expenses coming soon" placeholder with live `RecurringExpenseRow` list
- Wired skip/pause/resume/delete callbacks from `useRecurring`
- Delete uses native Alert with destructive confirmation

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All created files found on disk. Both task commits verified in git log.
