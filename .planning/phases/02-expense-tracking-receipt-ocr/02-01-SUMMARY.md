---
phase: 02-expense-tracking-receipt-ocr
plan: 01
subsystem: expense-foundation
tags: [database, types, math, testing, zustand, migration]
dependency_graph:
  requires:
    - 01-foundation-household (households table, household_members, RLS pattern)
  provides:
    - expense domain types (Expense, LedgerEntry, Balance, etc.)
    - pure math functions (calculateSplit, computeBalances, simplifyDebts, distributeTaxProportionally, suggestCategory)
    - payment link builder (buildPaymentLink)
    - database migration (9 tables, 23 RLS policies, 4 RPC functions)
    - Zustand expense store (offline queue + filter state)
  affects:
    - All subsequent Phase 2 plans (types and math functions are shared foundations)
tech_stack:
  added:
    - NODE_OPTIONS=--experimental-vm-modules (jest workaround for jest-expo + Jest 30 lazy-getter issue)
  patterns:
    - Ledger-based balance computation (never store computed balances)
    - Integer cents for all money arithmetic (no floats)
    - SECURITY DEFINER RPC for atomic multi-table writes
    - Zustand + MMKV persist with partialize for offline queue
key_files:
  created:
    - src/types/expenses.ts (all expense domain types)
    - src/lib/expenseMath.ts (pure math functions + CATEGORY_KEYWORDS)
    - src/lib/paymentLinks.ts (payment app deep link builder)
    - src/__tests__/expenses.test.ts (38 unit tests)
    - src/stores/expenses.ts (Zustand store with MMKV offline queue)
    - supabase/migrations/00003_expenses.sql (9 tables, 23 policies, 4 RPCs)
  modified:
    - package.json (test scripts: add NODE_OPTIONS=--experimental-vm-modules)
decisions:
  - "NODE_OPTIONS=--experimental-vm-modules required to bypass jest-expo + Jest 30 lazy-getter isInsideTestCode check — expo/src/winter/runtime.native.ts installs lazy globals that trigger require() calls outside test code scope"
  - "shares split remainder goes to first people (not last) — matches expected output of calculateSplit('shares', 10000, [{u1,2},{u2,1}]) = [6667, 3333]"
  - "equal split remainder also goes to first people — first (remainder) members get base+1 — consistent algorithm across all split types"
metrics:
  duration: 22 min
  completed_date: "2026-03-21"
  tasks: 3
  files: 6
---

# Phase 2 Plan 1: Expense Foundation — Types, Math, Migration, Store Summary

**One-liner:** Integer-cent split math (equal/percentage/exact/shares), ledger-based balance computation with debt simplification, 9-table Postgres schema with private-expense RLS, and MMKV-backed Zustand offline queue — all tested and ready for Phase 2 UI plans.

## Tasks Completed

| # | Task | Commit | Key Output |
|---|------|--------|------------|
| 1 | Types, pure math functions, payment links with TDD | 05d828f | src/types/expenses.ts, src/lib/expenseMath.ts, src/lib/paymentLinks.ts, src/__tests__/expenses.test.ts (38 tests) |
| 2 | Database migration with tables, RLS policies, and RPC functions | d71b905 | supabase/migrations/00003_expenses.sql (9 tables, 23 policies, 4 RPCs) |
| 3 | Zustand expense store with offline queue and filter state | 347b481 | src/stores/expenses.ts |

## Test Results

```
Test Suites: 1 passed, 1 total
Tests:       38 passed, 38 total
```

All behaviors from plan spec verified:
- calculateSplit: equal (with remainder), percentage (validates sum=100), exact (validates sum=total), shares (proportional)
- computeBalances: net position per user, multi-expense accumulation
- simplifyDebts: A->B->C chain collapses to single transfer, zero balances return []
- distributeTaxProportionally: sum of results equals inputs + tax + tip exactly
- suggestCategory: case-insensitive keyword matching
- buildPaymentLink: correct URL schemes for all 4 payment apps

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] jest-expo + Jest 30 lazy-getter causes test suite failure**
- **Found during:** Task 1 (RED phase — tests failed to run at all, not just fail assertions)
- **Issue:** `expo/src/winter/runtime.native.ts` installs lazy getters for `__ExpoImportMetaRegistry`, `structuredClone`, etc. on the global. When Jest's `isInsideTestCode === false` (after any test callback completes), any `require()` inside a lazy getter throws `"You are trying to import a file outside of the scope of the test code"`. This affected ALL test files with actual `it()` callbacks (not just `it.todo()`).
- **Fix:** Added `NODE_OPTIONS=--experimental-vm-modules` to test scripts in package.json. This sets `supportsDynamicImport = true` in jest-runtime, which bypasses the `isInsideTestCode === false` check at `index.js:1212`.
- **Files modified:** `package.json` (test scripts)
- **Commit:** 05d828f

**2. [Rule 1 - Bug] shares split remainder direction was wrong**
- **Found during:** Task 1 (GREEN phase — 37/38 tests passing)
- **Issue:** Initial implementation gave remainder to the LAST person in shares split, but the spec expected `calculateSplit('shares', 10000, [{u1,2},{u2,1}]) = [6667, 3333]`. With floor + last-gets-remainder: u1=6666, u2=3334. Expected: u1=6667, u2=3333.
- **Fix:** Changed algorithm to floor all amounts then distribute remainder cents to the FIRST people (consistent with equal split behavior).
- **Files modified:** `src/lib/expenseMath.ts` (calculateSplit 'shares' case)
- **Commit:** 05d828f

## Self-Check: PASSED

All created files exist. All commits found in git log.
