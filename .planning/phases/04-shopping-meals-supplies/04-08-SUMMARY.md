## 04-08 Summary

Closed the Phase 04 UAT gap around generic meal recommendations by making AI meal suggestions rank against pantry fit, household meal history, favorites, and manual-dish rotation signals.

### What changed

- Extended [mealPlanning.ts](/Users/jackeytsui/Downloads/HomeOS/src/lib/mealPlanning.ts) with:
  - recommendation scoring
  - pantry-match counting
  - repeat cooldown logic
  - structured `whyThisFits` explanation generation
- Extended [useMealPlans.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useMealPlans.ts) to derive reusable recipe recommendation signals from accepted suggestion feedback and cooked-meal history
- Updated [meals.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/meals.tsx) to send pantry inventory and recommendation history into the planner request
- Updated [AIMealPlanSheet.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/meals/AIMealPlanSheet.tsx) and [MealSuggestionCard.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/meals/MealSuggestionCard.tsx) so the AI review UI now shows “Why this fits” with pantry/history/favorite/rotation reasons
- Tightened [meals.ts](/Users/jackeytsui/Downloads/HomeOS/src/types/meals.ts) and [recipes.ts](/Users/jackeytsui/Downloads/HomeOS/src/types/recipes.ts) for structured recommendation payloads
- Replaced the index-based suggestion ranking in [generate-meal-plan/index.ts](/Users/jackeytsui/Downloads/HomeOS/supabase/functions/generate-meal-plan/index.ts) with real ranking inputs and recommendation metadata
- Expanded [food-ai.test.ts](/Users/jackeytsui/Downloads/HomeOS/src/__tests__/food-ai.test.ts) and [meals-ui.test.ts](/Users/jackeytsui/Downloads/HomeOS/src/__tests__/meals-ui.test.ts) with history-aware ranking and manual-rotation coverage

### Verification

- `npm test -- --runInBand src/__tests__/food-ai.test.ts src/__tests__/meals-ui.test.ts`
- `npx tsc --noEmit --pretty false 2>&1 | rg "src/lib/mealPlanning.ts|src/hooks/useMealPlans.ts|src/components/meals/AIMealPlanSheet.tsx|src/components/meals/MealSuggestionCard.tsx|src/app/\(app\)/meals.tsx|src/types/meals.ts|src/types/recipes.ts|src/__tests__/food-ai.test.ts|src/__tests__/meals-ui.test.ts|supabase/functions/generate-meal-plan/index.ts"`

### Outcome

Manual dishes and favorites can now resurface as justified recommendations instead of feeling random, and the AI review flow exposes the pantry/history signals behind each suggestion.
