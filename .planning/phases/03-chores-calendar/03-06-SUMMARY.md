---
phase: 03-chores-calendar
plan: 06
subsystem: ui
tags: [react-native, expo-router, supabase, chores, fairness, gamification, testing]
requires:
  - phase: 03-02
    provides: core chores list, completion flow, and bonus-claim interactions
provides:
  - dedicated chore detail route with completion history and fairness breakdowns
  - daily energy selector persisted through the chores data layer
  - household gamification toggle with hidden-when-off leaderboard surfaces
affects: [03-04, 03-07, chores, household settings]
tech-stack:
  added: []
  patterns:
    - dedicated detail routes for deeper household stats instead of overloading list cards
    - chores hook loads fairness-adjacent settings and energy entries alongside core chore data
    - gamification uses all-or-nothing household visibility rather than zero-state placeholders
key-files:
  created:
    - src/app/(app)/chores/[id].tsx
    - src/components/chores/FairnessSummaryCard.tsx
    - src/components/chores/MemberFairnessRow.tsx
    - src/components/chores/EnergyLevelCard.tsx
    - src/components/chores/GamificationCard.tsx
    - src/__tests__/chores-stats-energy.test.ts
  modified:
    - src/app/(app)/chores.tsx
    - src/hooks/useChores.ts
key-decisions:
  - "Kept the main chores screen lightweight by surfacing only a fairness snapshot there and routing deeper history to /chores/[id]."
  - "Applied daily energy adaptation only to the personal chores section so household visibility remains stable while individual ordering shifts."
  - "Treated gamification as a single household-wide toggle that hides leaderboard, points, and streak UI entirely when off."
patterns-established:
  - "Chores detail screens derive display state from useChores + useMembers rather than introducing a second specialized fetch layer."
  - "Optional motivational surfaces should disappear when disabled instead of rendering zero-value shells."
requirements-completed: [CHOR-07, CHOR-08, CHOR-10]
duration: 9 min
completed: 2026-03-23
---

# Phase 3 Plan 06: Chores Depth UX Summary

**Chore detail history with fairness breakdowns, daily energy-aware ordering, and household-wide optional gamification controls**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-23T03:55:30Z
- **Completed:** 2026-03-23T04:04:26Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added a dedicated chore detail route that shows `Completion History`, member fairness stats, rolling average durations, and per-member task/minute load.
- Kept the chores list readable by adding a lightweight fairness snapshot on the main screen and routing list cards to the detail surface.
- Persisted daily energy selection and household gamification settings through `useChores`, then used them to reprioritize personal chores and fully hide encouragement UI when disabled.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the dedicated chore detail and fairness surfaces** - `85fe1b1` (feat)
2. **Task 2: Add energy adaptation and optional gamification controls** - `eff7e1a` (feat)

**Plan metadata:** Pending final docs commit

## Files Created/Modified

- `src/app/(app)/chores/[id].tsx` - Dedicated chore detail route with history and fairness breakdowns.
- `src/components/chores/FairnessSummaryCard.tsx` - Main/detail fairness summary wrapper for per-member load.
- `src/components/chores/MemberFairnessRow.tsx` - Count/minute delta row for each household member.
- `src/components/chores/EnergyLevelCard.tsx` - Daily `low`/`medium`/`high` energy selector.
- `src/components/chores/GamificationCard.tsx` - Household gamification toggle plus encouragement-only leaderboard.
- `src/app/(app)/chores.tsx` - Navigation to details, fairness snapshot, energy adaptation, and gamification surface.
- `src/hooks/useChores.ts` - Loading and persistence for member energy entries and household chore settings.
- `src/__tests__/chores-stats-energy.test.ts` - Focused tests for detail history, fairness metrics, energy ordering, and gamification-off behavior.

## Decisions Made

- Used a dedicated detail screen for completion history and fairness depth so the main list stays centered on action-taking.
- Ranked only the personal section by energy level because CHOR-08 is about visible personal ordering, not reshaping the whole household queue.
- Implemented gamification as encouragement-only copy and metrics; no punitive labels, penalties, or shame mechanics are rendered.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created the missing stats/energy test file referenced by the plan**
- **Found during:** Task 1
- **Issue:** `src/__tests__/chores-stats-energy.test.ts` did not exist even though the plan required extending it.
- **Fix:** Created the focused test file and used it as the verification target for both tasks.
- **Files modified:** `src/__tests__/chores-stats-energy.test.ts`
- **Verification:** `npm test -- --runInBand src/__tests__/chores-stats-energy.test.ts`
- **Committed in:** `85fe1b1`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The deviation was required to make the planned verification path executable. No scope creep.

## Issues Encountered

- React Native emits a `SafeAreaView` deprecation warning during the focused test run. It does not fail the suite and was left out of scope for this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Chore detail, fairness, energy, and household settings surfaces are in place for AI rotation and fuller calendar/household integrations.
- `useChores` now exposes the extra settings/state Phase 3 follow-up work can reuse instead of adding parallel hooks.

## Self-Check

PASSED

---
*Phase: 03-chores-calendar*
*Completed: 2026-03-23*
