---
phase: 04-shopping-meals-supplies
plan: "03"
subsystem: hooks
tags: [supabase, realtime, shopping, inventory, recipes, meals, calendar, testing]
requires:
  - phase: 04-shopping-meals-supplies
    provides: food-domain schema, RPCs, and pure planner helpers from 04-02
  - phase: 03-chores-calendar
    provides: shared calendar projection architecture and household timeline rendering
provides:
  - shared household food realtime orchestration through a single `household:{id}:food` channel
  - household-scoped food hooks for shopping, inventory, recipes, and meal plans
  - meal-plan projection into the existing calendar pipeline without moving meals into `calendar_events`
affects: [04-04-PLAN, 04-05-PLAN, 04-06-PLAN, 04-07-PLAN]
tech-stack:
  added: []
  patterns: [module-level realtime channel registry, local hook state plus reload-after-mutation, projected meal timeline items]
key-files:
  created:
    - src/hooks/useFoodRealtime.ts
    - src/hooks/useShopping.ts
    - src/hooks/useInventory.ts
    - src/hooks/useRecipes.ts
    - src/hooks/useMealPlans.ts
  modified:
    - src/hooks/useCalendar.ts
    - src/lib/calendarProjection.ts
    - src/__tests__/food-hooks.test.ts
    - src/__tests__/calendar-projection.test.ts
    - src/types/inventory.ts
key-decisions:
  - "Shared all food-domain hooks through one module-level realtime registry so shopping, pantry, recipe, and meal refreshes fan out from a single household channel."
  - "Projected `meal_plan_entries` directly into the existing calendar projection layer, keeping meals in their own tables while still rendering in the unified household timeline."
  - "Kept recipe import drafts in hook-managed cache keyed by household so later meal UI can survive remounts without adding a second store."
patterns-established:
  - "Food screens should use the new hooks rather than screen-local Supabase queries."
  - "Shopping checked-state ordering and generated-restock idempotency are normalized in hook helpers before UI consumption."
requirements-completed: [SHOP-01, SHOP-03, SHOP-06, SHOP-07, SHOP-09, MEAL-02, MEAL-04, MEAL-06, MEAL-07, SYNC-03, SYNC-04, SYNC-05, SYNC-07]
duration: 14 min
completed: 2026-03-24
---

# Phase 04 Plan 03: Shared Food Hooks + Calendar Projection Summary

**Added the reusable Phase 4 client layer: one shared food realtime channel, household-scoped hooks for shopping/pantry/recipes/meals, and meal projection into the existing calendar pipeline.**

## Performance

- **Duration:** 14 min
- **Completed:** 2026-03-24T05:55:57Z
- **Files modified:** 10

## Accomplishments

- Added `useFoodRealtime` with a module-level channel registry so multiple food hooks share one `household:{id}:food` subscription.
- Added `useShopping`, `useInventory`, `useRecipes`, and `useMealPlans` with local state, explicit load/error handling, and reload-after-mutation helpers aligned with the existing repo hook style.
- Extended `useCalendar` and `projectCalendarItems` so `meal_plan_entries` render as projected `sourceType: 'meal'` items with servings, attendance, recipe metadata, and icon mapping.
- Replaced the food hook scaffold test with real assertions covering the shared realtime registry, shopping checked/restock behavior, and attendance-derived meal servings.

## Verification

- `npm test -- --runInBand src/__tests__/food-hooks.test.ts`
- `npm test -- --runInBand src/__tests__/calendar-projection.test.ts`
- `npx tsc --noEmit --pretty false 2>&1 | rg "src/hooks/useCalendar.ts|src/hooks/useFoodRealtime.ts|src/hooks/useShopping.ts|src/hooks/useInventory.ts|src/hooks/useRecipes.ts|src/hooks/useMealPlans.ts|src/lib/calendarProjection.ts|src/__tests__/food-hooks.test.ts|src/__tests__/calendar-projection.test.ts"`

## Issues Encountered

- Repo-wide `npx tsc --noEmit` is not clean because of pre-existing unrelated errors in older tests, recurrence typing, Expo layout typing, and Supabase Edge Function typings. The touched Plan 04-03 files no longer appear in the TypeScript error list.

## Next Phase Readiness

- Phase 04 UI plans can now consume stable food-domain hooks instead of issuing raw Supabase queries from screens.
- The shared calendar timeline already understands meal-plan entries, so the upcoming meals and shopping screens can plug into the existing projection pipeline rather than building a second calendar layer.

---
*Phase: 04-shopping-meals-supplies*
*Completed: 2026-03-24*
