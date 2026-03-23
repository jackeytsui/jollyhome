---
phase: 04
slug: shopping-meals-supplies
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-23
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for Shopping + Meals + Supplies execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 30.x |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- --runInBand` |
| **Full suite command** | `npm run test:coverage -- --runInBand` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task-level `<automated>` command from the active plan
- **After every plan wave:** Run `npm test -- --runInBand`
- **Before `$gsd-verify-work`:** Run `npm run test:coverage -- --runInBand`
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SHOP-05, SHOP-06, SHOP-09, MEAL-01, MEAL-04, AIML-04, AIEX-04, SYNC-01, SYNC-03, SYNC-04, SYNC-05, SYNC-07 | scaffold | `npm test -- --runInBand src/__tests__/food-core.test.ts src/__tests__/food-hooks.test.ts src/__tests__/shopping-supplies-ui.test.ts src/__tests__/meals-ui.test.ts src/__tests__/food-ai.test.ts src/__tests__/receipt-food-flow.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | SHOP-05, SHOP-06, MEAL-06, AIML-03, AIML-04 | static | `rg -n "export interface (ShoppingList|FoodCatalogItem|InventoryEvent|Recipe|MealPlanEntry|MealSuggestionFeedback)|catalogItemId|attendanceMemberIds|suggestionRunId|minimumQuantity" src/types/shopping.ts src/types/inventory.ts src/types/recipes.ts src/types/meals.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | SHOP-05, SHOP-06, SHOP-07, SHOP-09, MEAL-04, SYNC-03, SYNC-04, SYNC-05, SYNC-07 | schema | `rg -n "CREATE TABLE public\\.(food_catalog_items|shopping_lists|shopping_list_items|inventory_items|inventory_events|inventory_alerts|recipes|recipe_ingredients|meal_plan_entries|meal_suggestion_runs|meal_suggestion_feedback)|CREATE OR REPLACE FUNCTION public\\.(upsert_inventory_event|generate_meal_plan_shopping_list|mark_meal_cooked)|ENABLE ROW LEVEL SECURITY|REFERENCES public\\.food_catalog_items" supabase/migrations/00005_food_domain.sql` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | AIML-01, AIML-02, AIML-05, AISH-01, AISH-02, SYNC-03, SYNC-04, SYNC-07 | unit | `npm test -- --runInBand src/__tests__/food-core.test.ts src/__tests__/food-ai.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 3 | SHOP-01, SHOP-03, SHOP-06, SHOP-07, SHOP-09, MEAL-02, MEAL-04, MEAL-07, SYNC-03, SYNC-04, SYNC-05 | hook | `npm test -- --runInBand src/__tests__/food-hooks.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 3 | MEAL-06, SYNC-07 | integration | `rg -n "meal_plan_entries|sourceType: 'meal'|attendanceMemberIds|recipeId" src/hooks/useCalendar.ts src/lib/calendarProjection.ts` | ✅ existing files | ⬜ pending |
| 04-04-01 | 04 | 4 | SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05 | component | `npm test -- --runInBand src/__tests__/shopping-supplies-ui.test.ts` | ❌ W0 | ⬜ pending |
| 04-04-02 | 04 | 4 | SHOP-06, SHOP-07, SHOP-08, SYNC-05 | component | `npm test -- --runInBand src/__tests__/shopping-supplies-ui.test.ts` | ❌ W0 | ⬜ pending |
| 04-05-01 | 05 | 4 | MEAL-02, MEAL-03, MEAL-05, MEAL-07 | integration | `npm test -- --runInBand src/__tests__/meals-ui.test.ts` | ❌ W0 | ⬜ pending |
| 04-05-02 | 05 | 4 | SHOP-09, MEAL-01, MEAL-04, MEAL-06, SYNC-03, SYNC-04, SYNC-07 | integration | `npm test -- --runInBand src/__tests__/meals-ui.test.ts` | ❌ W0 | ⬜ pending |
| 04-06-01 | 06 | 5 | AIML-01, AIML-02, AIML-03, AIML-04, AIML-05, SYNC-07 | ai | `npm test -- --runInBand src/__tests__/food-ai.test.ts` | ❌ W0 | ⬜ pending |
| 04-06-02 | 06 | 5 | AISH-01, AISH-02, AISH-03, SYNC-05 | ai | `npm test -- --runInBand src/__tests__/food-ai.test.ts` | ❌ W0 | ⬜ pending |
| 04-07-01 | 07 | 5 | AIEX-04, SYNC-01 | integration | `npm test -- --runInBand src/__tests__/receipt-food-flow.test.ts` | ❌ W0 | ⬜ pending |
| 04-07-02 | 07 | 5 | AIEX-04, SYNC-01 | integration | `npm test -- --runInBand src/__tests__/receipt-food-flow.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/food-core.test.ts` — Wave 1 scaffold suite for normalization, pantry diff, ingredient overlap, and attendance-based serving helpers
- [ ] `src/__tests__/food-hooks.test.ts` — Wave 1 scaffold suite for shared food realtime orchestration and hook contracts
- [ ] `src/__tests__/shopping-supplies-ui.test.ts` — Wave 1 scaffold suite for shopping list, pantry inventory, threshold, barcode, and low-stock surfaces
- [ ] `src/__tests__/meals-ui.test.ts` — Wave 1 scaffold suite for recipe CRUD/import, weekly meal board, meal-plan shopping generation, and cooked-meal flow
- [ ] `src/__tests__/food-ai.test.ts` — Wave 1 scaffold suite for meal-plan AI suggestions, replenishment prediction, and pantry-photo review
- [ ] `src/__tests__/receipt-food-flow.test.ts` — Wave 1 scaffold suite for reviewed grocery receipt sync across expense, pantry, and shopping outputs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Shopping list sync feels truly real-time across two clients | SHOP-03 | Jest cannot prove Supabase realtime latency end-to-end | Open two clients in the same household, add/check/uncheck shopping items on one client, confirm the second updates within about one second and preserves checked-at ordering |
| Barcode scanning works under real device camera permissions and UPC variants | SHOP-08 | Camera and barcode hardware behavior require runtime validation | On device, open the barcode scanner, scan EAN/UPC labels, confirm item metadata is populated when available and manual correction remains possible when lookup is incomplete |
| Drag-and-drop meal planning feels usable on mobile | MEAL-01 | Gesture quality and scroll/drag conflicts are not covered well by Jest | On iOS or Android, drag meals across days and slots, verify reorder persistence, autoscroll behavior, and no stuck gesture states |
| Pantry photo AI review is understandable and safe | AISH-03 | The correctness threshold is part model quality, part UX clarity | Capture or upload a pantry/fridge photo, verify the review sheet lists editable detected items, and confirm no inventory write happens until the review is accepted |
| Grocery receipt tri-workflow is atomic in practice | AIEX-04, SYNC-01 | Local tests can validate the wrapper, not full server rollback behavior | Scan a grocery receipt, confirm reviewed save updates expenses, pantry, and shopping in one action; then force a backend failure and confirm partial writes are not left behind |
| Attendance-driven servings feel correct around timezone/day boundaries | MEAL-06, SYNC-07 | DST and local-date edge cases need device validation | Set `home tonight` and `away tonight` around midnight or timezone changes, then verify meal servings and day assignment remain correct on the meal planner |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verification commands
- [x] Sampling continuity: no three consecutive tasks without automated verification
- [x] Wave 0 covers all missing test files
- [x] No watch-mode flags
- [x] Feedback latency target remains under 30 seconds
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** drafted 2026-03-23
