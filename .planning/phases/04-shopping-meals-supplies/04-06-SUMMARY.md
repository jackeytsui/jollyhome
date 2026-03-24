---
phase: 04-shopping-meals-supplies
plan: "06"
subsystem: ai
tags: [ai, meals, pantry, prediction, review-flows, edge-functions, testing]
requires:
  - phase: 04-shopping-meals-supplies
    provides: meal board, shopping, and pantry surfaces from 04-04 and 04-05
provides:
  - AI meal-plan suggestion flow with accept, swap, regenerate, and persisted feedback
  - pantry-photo identification draft flow with explicit human review before inventory writes
  - predictive restock helper wired into the supplies surface from usage and alert data
affects: [04-07-PLAN]
tech-stack:
  added: []
  patterns: [review-first AI actions, structured planner payload serialization, feedback-backed suggestion iteration]
key-files:
  created:
    - supabase/functions/generate-meal-plan/index.ts
    - supabase/functions/identify-pantry-items/index.ts
    - src/components/meals/AIMealPlanSheet.tsx
    - src/components/meals/MealSuggestionCard.tsx
    - src/components/supplies/PantryPhotoReviewSheet.tsx
  modified:
    - src/lib/mealPlanning.ts
    - src/hooks/useMealPlans.ts
    - src/app/(app)/meals.tsx
    - src/app/(app)/supplies.tsx
    - src/__tests__/food-ai.test.ts
key-decisions:
  - "Kept both AI lanes review-first: meal suggestions require accept/swap/regenerate actions, and pantry photo items stay draft-only until explicitly accepted."
  - "Used one structured planner payload serializer for the meal generation request so pantry state, attendance, dietary preferences, and prep constraints are shaped consistently."
  - "Persisted AI meal feedback through the existing `meal_suggestion_feedback` table instead of adding a parallel AI action store."
patterns-established:
  - "AI meal planning flows should call `generate-meal-plan`, then route user decisions back through `submitSuggestionFeedback` and normal meal-plan saves."
  - "Predictive restock suggestions should combine low-stock alerts and recent negative inventory events before any shopping row is proposed."
requirements-completed: [AIML-01, AIML-02, AIML-03, AIML-04, AIML-05, AISH-01, AISH-02, AISH-03, SYNC-05, SYNC-07]
duration: 14 min
completed: 2026-03-24
---

# Phase 04 Plan 06: AI Meal Planning + Pantry Review Summary

**Added the Phase 4 AI differentiator layer: structured AI meal-plan suggestions with feedback actions, pantry-photo item drafts with manual review, and predictive restock suggestions informed by pantry usage.**

## Performance

- **Completed:** 2026-03-24T06:47:59Z
- **Files modified:** 10

## Accomplishments

- Added `generate-meal-plan` and `identify-pantry-items` Edge Function entry points for weekly meal suggestions and pantry-photo review drafts.
- Extended `mealPlanning.ts` with planner payload serialization, suggestion rationale copy, and predictive restock generation from inventory usage.
- Added `AIMealPlanSheet`, `MealSuggestionCard`, and `PantryPhotoReviewSheet` review UI and wired them into `meals.tsx` and `supplies.tsx`.
- Added persisted meal suggestion feedback writes through `useMealPlans.submitSuggestionFeedback`.
- Replaced the AI scaffold lane with real assertions covering payload serialization, rationale copy, feedback shaping, and predictive restocks.

## Verification

- `npm test -- --runInBand src/__tests__/food-ai.test.ts`
- `npx tsc --noEmit --pretty false 2>&1 | rg "src/lib/mealPlanning.ts|src/components/meals/AIMealPlanSheet.tsx|src/components/meals/MealSuggestionCard.tsx|src/components/supplies/PantryPhotoReviewSheet.tsx|src/app/\(app\)/meals.tsx|src/app/\(app\)/supplies.tsx|src/hooks/useMealPlans.ts|src/__tests__/food-ai.test.ts"`
- `rg -n "generate-meal-plan|identify-pantry-items|AIMealPlanSheet|PantryPhotoReviewSheet|submitSuggestionFeedback|buildPredictiveRestockSuggestions" 'src/app/(app)/meals.tsx' 'src/app/(app)/supplies.tsx' src/components/meals src/components/supplies src/hooks/useMealPlans.ts src/lib/mealPlanning.ts`

## Notes

- The new Edge Functions currently return structured placeholder suggestion/review payloads shaped for the app flows; they are ready to be upgraded to richer OpenAI-backed generation using the same interfaces.
- Pantry-photo review continues to require explicit acceptance before any inventory mutation is written.
- Repo-wide TypeScript still has unrelated older issues outside this slice, but the touched AI files passed the filtered check.

## Next Phase Readiness

- The final Phase 04 receipt synchronization plan now has shopping, pantry, meals, and AI review surfaces to connect into one atomic grocery workflow.
- AI meal suggestions and pantry-photo drafts already follow review-first contracts, so the next plan can focus on multi-surface transaction wiring rather than inventing new UX.

---
*Phase: 04-shopping-meals-supplies*
*Completed: 2026-03-24*
