---
phase: 03-chores-calendar
plan: 05
subsystem: database
tags: [supabase, postgres, rrule, date-fns, hooks, realtime, calendar, chores]
requires:
  - phase: 03-01
    provides: stable Phase 3 chore and calendar type contracts plus scaffold tests
provides:
  - household-scoped chore, calendar, RSVP, and attendance schema with RPC helpers
  - shared recurrence, condition, fairness, and timeline projection utilities
  - reusable chores, calendar, and attendance hooks on one household realtime channel
affects: [03-02, 03-03, 03-04, 03-06, 03-07, calendar, chores, ai-rotation]
tech-stack:
  added: []
  patterns: [top-level Supabase DDL with household RLS, shared scheduling helpers, household:{id}:chores-calendar realtime channel]
key-files:
  created:
    - supabase/migrations/00004_chores_calendar.sql
    - src/lib/recurrence.ts
    - src/lib/condition.ts
    - src/lib/fairness.ts
    - src/lib/calendarProjection.ts
    - src/hooks/useChores.ts
    - src/hooks/useCalendar.ts
    - src/hooks/useAttendance.ts
  modified:
    - src/types/calendar.ts
    - src/__tests__/chores-core.test.ts
    - src/__tests__/calendar-core.test.ts
    - src/__tests__/fairness-condition.test.ts
key-decisions:
  - "All Phase 3 base hooks share the channel name household:{activeHouseholdId}:chores-calendar so downstream screens can subscribe consistently."
  - "Non-event calendar projections use visualWeight secondary and explicit activityType/sourceType mappings to keep events visually dominant without changing contracts later."
patterns-established:
  - "Template/instance/completion chore data is exposed through dedicated hooks and mutation helpers rather than screen-local Supabase calls."
  - "Calendar rendering flows through projectCalendarItems and groupAgendaItemsByDay so screens consume a stable timeline model instead of raw table rows."
requirements-completed: [CHOR-01, CHOR-02, CHOR-03, CHOR-04, CHOR-05, CHOR-07, CHOR-08, CHOR-09, AICH-05, CALD-01, CALD-02, CALD-04, CALD-05, CALD-06]
duration: 60 min
completed: 2026-03-23
---

# Phase 3 Plan 05: Shared Scheduling Foundation Summary

**Supabase chores/calendar persistence with shared recurrence, fairness, condition, and unified household timeline hooks**

## Performance

- **Duration:** 60 min
- **Started:** 2026-03-23T02:37:40Z
- **Completed:** 2026-03-23T03:37:43Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Added the Phase 3 migration for chores, chore completions, fairness inputs, calendar events, RSVP, attendance, storage policies, and the `complete_chore_instance`, `claim_bonus_chore`, and `upsert_attendance_status` RPCs.
- Replaced the scaffold tests with real coverage for recurrence expansion, elapsed-time condition scoring, fairness rollups, unified calendar projection, and hook export contracts.
- Implemented the shared scheduling libs and the household-scoped `useChores`, `useCalendar`, and `useAttendance` hooks on the shared realtime channel.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the Phase 3 schema, RLS, storage, and RPC helpers** - `978e5fa` (feat)
2. **Task 2 RED: Add failing shared-core tests** - `4cda410` (test)
3. **Task 2 GREEN: Implement the shared libs and household hooks behind the contracts** - `57f52da` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `supabase/migrations/00004_chores_calendar.sql` - Phase 3 schema, household RLS, photo storage policies, and RPC helpers.
- `src/lib/recurrence.ts` - RRULE build/parse/next-occurrence/range expansion helpers.
- `src/lib/condition.ts` - Elapsed-time condition state, progress, and energy-adaptive ranking logic.
- `src/lib/fairness.ts` - Fairness rollups, rolling averages, and household load summaries.
- `src/lib/calendarProjection.ts` - Unified event/chore/attendance/activity projection and agenda grouping.
- `src/hooks/useChores.ts` - Household chores loading and mutation helpers with realtime refresh.
- `src/hooks/useCalendar.ts` - Household event/activity/RSVP loading plus projected timeline items.
- `src/hooks/useAttendance.ts` - Household attendance loading and upsert helper.
- `src/types/calendar.ts` - Extended calendar contract with `activityType` and `secondary` visual weight support.

## Decisions Made

- Used a single channel name, `household:{activeHouseholdId}:chores-calendar`, across all three base hooks so later screens can share the same realtime convention.
- Added `activityType` to `CalendarEvent` and `secondary` to `CalendarVisualWeight` because the projection contract requires lighter-weight non-event items; keeping that out of the shared type would have forced later contract churn.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Extended the calendar contract for projected non-event items**
- **Found during:** Task 2 (Implement the shared libs and household hooks behind the contracts)
- **Issue:** The Phase 3 scaffold type allowed only `light | medium | strong` visual weights and did not include `activityType` on events, which blocked the required `secondary` weighting and source mapping for meal/maintenance/guest/quiet-hours/booking projections.
- **Fix:** Added `activityType` to `CalendarEvent` and extended `CalendarVisualWeight` with `secondary`, then wired projection code and tests against the corrected contract.
- **Files modified:** `src/types/calendar.ts`, `src/lib/calendarProjection.ts`, `src/__tests__/calendar-core.test.ts`
- **Verification:** `npm test -- --runInBand src/__tests__/chores-core.test.ts src/__tests__/calendar-core.test.ts src/__tests__/fairness-condition.test.ts`
- **Committed in:** `57f52da` (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required for correctness of the shared timeline contract. No scope creep beyond the planned Phase 3 foundation.

## Issues Encountered

- Initial green run exposed an edge-case threshold mismatch in condition scoring and raw timestamp ordering for attendance projection. Both were corrected in-place and the full verification suite passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 now has a real persistence layer and shared scheduling core for the chores and calendar UI plans.
- Later screens can build against stable hooks and RPCs instead of duplicating query, recurrence, or projection logic.

## Self-Check: PASSED

- Verified summary file exists at `.planning/phases/03-chores-calendar/03-05-SUMMARY.md`.
- Verified task commits `978e5fa`, `4cda410`, and `57f52da` exist in git history.

---
*Phase: 03-chores-calendar*
*Completed: 2026-03-23*
