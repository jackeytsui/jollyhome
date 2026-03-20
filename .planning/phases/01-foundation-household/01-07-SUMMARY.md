---
phase: 01-foundation-household
plan: 07
subsystem: ui
tags: [react-native, dialogs, household, balance, phase2-stub]

# Dependency graph
requires:
  - phase: 01-foundation-household
    provides: LeaveHouseholdDialog with balance prop interface, RemoveMemberDialog, household settings screen, members screen, useMembers hook, useAuthStore
provides:
  - RemoveMemberDialog with hasOutstandingBalance and balanceAmount props and conditional warning rendering
  - LeaveHouseholdDialog receiving actual balance data from caller (household.tsx)
  - getOutstandingBalance stub in household.tsx marked TODO(Phase-2) for Phase 2 wiring
  - getOutstandingBalance stub in members.tsx marked TODO(Phase-2) for Phase 2 wiring
  - Balance fetch-before-show pattern in both leave and remove flows
affects:
  - 02-expenses (Phase 2 expense tracking will replace TODO(Phase-2) stubs with real queries)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "fetch-before-show: query balance data before calling setDialogVisible(true) so dialog opens with correct data"
    - "TODO(Phase-2) stub pattern: async function returning $0.00 with comment marking where real query goes"
    - "conditional balance warning: {hasOutstandingBalance && balanceAmount && <Text>...}} renders only when both truthy"

key-files:
  created: []
  modified:
    - src/components/household/RemoveMemberDialog.tsx
    - src/app/(app)/settings/household.tsx
    - src/app/(app)/(home)/members.tsx

key-decisions:
  - "getOutstandingBalance defined as module-level async function (not a hook) in each caller — consistent with plan spec; Phase 2 can refactor to shared hook when real data exists"
  - "Balance fetched before dialog open (not inside dialog component) so dialog always opens with correct state already set"
  - "Stub returns hasBalance:false so dialogs show generic text in Phase 1 — no false positive balance warnings"

patterns-established:
  - "fetch-before-show: always resolve async data before calling setState to open a dialog"
  - "TODO(Phase-2) annotation: marks stub functions that Phase 2 must replace with real expense table queries"

requirements-completed:
  - HOUS-06
  - HOUS-07
  - HOUS-01
  - HOUS-02
  - HOUS-03
  - HOUS-04
  - HOUS-05

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 01 Plan 07: Balance Settlement Prompt Gap Closure Summary

**RemoveMemberDialog and LeaveHouseholdDialog wired to conditional balance data with Phase 2 stubs returning $0.00 until expense tracking is built**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-20T16:47:18Z
- **Completed:** 2026-03-20T16:50:18Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments

- Added `hasOutstandingBalance` and `balanceAmount` props to `RemoveMemberDialog`, matching the existing interface in `LeaveHouseholdDialog`
- Wired `household.tsx` to fetch balance via `getOutstandingBalance` stub before opening the Leave dialog, then pass the result as props
- Wired `members.tsx` to fetch balance via `getOutstandingBalance` stub before opening the Remove dialog, then pass the result as props
- Updated `RemoveMemberDialog` body text to remove hardcoded balance reference; balance info now shows conditionally in a styled warning block
- Both stubs clearly marked `TODO(Phase-2)` so Phase 2 expense tracking can replace them with real queries

## Task Commits

Each task was committed atomically:

1. **Task 1: Add balance props to RemoveMemberDialog and wire balance queries in callers** - `614f3c4` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/household/RemoveMemberDialog.tsx` - Added `hasOutstandingBalance`/`balanceAmount` props, conditional warning text, `warning` style using `colors.destructive.light`; updated body text
- `src/app/(app)/settings/household.tsx` - Added `useAuthStore` import, `balanceData` state, `getOutstandingBalance` stub, `handleLeavePress` that fetches balance first, passes props to `LeaveHouseholdDialog`
- `src/app/(app)/(home)/members.tsx` - Added `removeBalanceData` state, `getOutstandingBalance` stub, `handleRemovePress` that fetches balance first, passes props to `RemoveMemberDialog`

## Decisions Made

- `getOutstandingBalance` defined as a module-level async function (not a React hook) in each caller — consistent with plan specification. Phase 2 can refactor to a shared hook when real expense data exists.
- Balance fetched before dialog open so dialog always receives correct data on mount (no flicker or race condition where dialog opens before data arrives).
- Stub returns `hasBalance: false` so all Phase 1 users see generic text (no false positive balance warnings before expenses exist).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `RemoveMemberDialog` and `LeaveHouseholdDialog` are now fully wired for balance display
- Phase 2 expense tracking only needs to replace the `getOutstandingBalance` stub bodies with real Supabase queries; the prop interfaces and conditional rendering are already in place
- HOUS-06 and HOUS-07 requirements are satisfied

---
*Phase: 01-foundation-household*
*Completed: 2026-03-20*
