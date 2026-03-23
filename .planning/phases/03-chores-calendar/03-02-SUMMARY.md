---
phase: 03-chores-calendar
plan: 02
subsystem: ui
tags: [react-native, chores, modal, recurrence, supabase, testing]
requires:
  - phase: 03-01
    provides: chores/calendar contracts and scaffold tests
  - phase: 03-05
    provides: chores schema, recurrence helpers, condition logic, and household hooks
provides:
  - personal-first chores screen backed by household chore data
  - chore cards, filters, editor flow, bonus claim action, and completion confirmation sheet
  - focused chores UI coverage for layout, filters, create flow, bonus claim, and no-photo completion
affects: [chores, calendar, fairness, home, phase-03-followups]
tech-stack:
  added: []
  patterns:
    - modal sheet flows for chores create/edit/complete actions
    - household chore view models derived from templates, instances, assignments, and completions
    - focused react-test-renderer screen tests with mocked hooks for RN UI flows
key-files:
  created:
    - src/components/chores/ChoreCard.tsx
    - src/components/chores/ChoreSection.tsx
    - src/components/chores/ChoreFiltersBar.tsx
    - src/components/chores/ChoreEditorSheet.tsx
    - src/components/chores/CompleteChoreSheet.tsx
    - src/__tests__/chores-ui.test.ts
  modified:
    - src/app/(app)/chores.tsx
    - src/hooks/useChores.ts
key-decisions:
  - "Persist assignee selections in useChores by creating/updating chore_assignments alongside template and instance writes so the editor flow stays household-backed."
  - "Use lightweight modal sheets for chore create/edit/complete flows to match the existing repo patterns and keep the chores screen focused."
  - "Require a claim action before completion for bonus chores while keeping the standard completion path photo-optional."
patterns-established:
  - "Chores screen composes household-facing view models from raw hook records rather than pushing UI grouping/sorting into the hook."
  - "Hidden chore sheets return null instead of rendering inactive trees, which keeps local form state stable and testable."
requirements-completed: [CHOR-01, CHOR-02, CHOR-03, CHOR-04, CHOR-05, CHOR-06, CHOR-09]
duration: 14 min
completed: 2026-03-23
---

# Phase 03 Plan 02: Core Chores UX Summary

**Shared household chores UI with personal-first sections, recurring create/edit flows, condition-aware cards, bonus claiming, and photo-optional completion confirmation**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-23T03:40:00Z
- **Completed:** 2026-03-23T03:53:55Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Replaced the Phase 1 chores stub with a household-backed chores screen that opens on `My chores today` and keeps the household queue below it.
- Added reusable chores UI pieces for cards, sections, filters, recurring chore create/edit, and completion confirmation with optional proof.
- Covered the main chores UX with a focused screen test file validating layout order, filters, create flow, bonus claim behavior, and a no-photo completion path.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace the chores stub with the shared household list and create/edit flow** - `0ab9b0d` (feat)
2. **Task 2: Add the completion confirmation and bonus-chore claim flow** - `ca1337b` (feat)

**Plan metadata:** pending

## Files Created/Modified

- `src/app/(app)/chores.tsx` - main chores screen, personal/household split, claim/complete actions, and sheet wiring
- `src/components/chores/ChoreCard.tsx` - medium-density chore card with assignees, area, minutes, condition bar, and condition label
- `src/components/chores/ChoreSection.tsx` - reusable section wrapper for the personal-first chores layout
- `src/components/chores/ChoreFiltersBar.tsx` - assignee, area, status, and urgency filters
- `src/components/chores/ChoreEditorSheet.tsx` - create/edit flow with recurring responsibility or bonus configuration
- `src/components/chores/CompleteChoreSheet.tsx` - completion confirmation sheet with optional note, actual minutes, and photo proof
- `src/hooks/useChores.ts` - chore assignment persistence added to create/edit flows
- `src/__tests__/chores-ui.test.ts` - focused UI tests for chores screen behavior

## Decisions Made

- Used derived view-model logic in the screen to sort urgent chores first, then settle by area and assignee without changing the existing hook contract shape.
- Kept completion proof optional by default and stored photo metadata only when the user explicitly picks a photo.
- Treated bonus chores as claim-first actions so completion cannot bypass the CHOR-09 claim step.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added assignee persistence behind the editor flow**
- **Found during:** Task 1 (Replace the chores stub with the shared household list and create/edit flow)
- **Issue:** `useChores` could create/update templates but had no way to persist member assignments, which would make the create/edit flow incomplete.
- **Fix:** Extended `useChores` to create a matching chore instance, sync `chore_assignments`, and update assignments during edits.
- **Files modified:** `src/hooks/useChores.ts`
- **Verification:** `npm test -- --runInBand src/__tests__/chores-ui.test.ts`
- **Committed in:** `0ab9b0d` (part of Task 1 commit)

**2. [Rule 1 - Bug] Prevented chore editor state from resetting during rerenders**
- **Found during:** Task 1 (Replace the chores stub with the shared household list and create/edit flow)
- **Issue:** The editor anchor timestamp changed on each screen rerender, which reset local form state and caused empty submissions in the create flow.
- **Fix:** Stabilized the default anchor in the screen and made hidden chore sheets return `null` instead of rendering inactive trees.
- **Files modified:** `src/app/(app)/chores.tsx`, `src/components/chores/ChoreEditorSheet.tsx`
- **Verification:** `npm test -- --runInBand src/__tests__/chores-ui.test.ts`
- **Committed in:** `0ab9b0d` (part of Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both fixes were required for the planned chores UX to work correctly. No scope expansion beyond the specified screen flows.

## Issues Encountered

- The focused screen test hit native worklets initialization through the shared animated `Button` and `Card` primitives; the test file mocks those wrappers so chores behavior stays isolated.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 now has a usable chores screen for downstream history, fairness, and home/calendar surfacing work.
- The chores UI test is in place for future plan changes touching the chores screen.

## Self-Check

PASSED

- Found `.planning/phases/03-chores-calendar/03-02-SUMMARY.md`
- Found commit `0ab9b0d`
- Found commit `ca1337b`

---
*Phase: 03-chores-calendar*
*Completed: 2026-03-23*
