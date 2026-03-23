# Phase 4: Shopping + Meals + Supplies - Research

**Researched:** 2026-03-23
**Domain:** React Native household shopping, pantry inventory, recipe import, meal planning, and receipt-driven food workflows
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

No `04-CONTEXT.md` exists yet.

### Locked Decisions
None.

### Claude's Discretion
All Phase 4 implementation details remain open, constrained by `REQUIREMENTS.md`, `ROADMAP.md`, and existing codebase patterns.

### Deferred Ideas (OUT OF SCOPE)
Only Phase 4 requirements are in scope. Phase 5+ requirements remain out of scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHOP-01 | Multiple shared shopping lists | Dedicated `shopping_lists` + `shopping_list_items` tables, household-scoped realtime hook, tab/screen split |
| SHOP-02 | Add items with quantity, category, notes | Normalized list item model with quantity/unit/category/note fields and client-side editor sheets |
| SHOP-03 | Real-time sync under 1 second | Single household food channel plus Supabase Postgres Changes refresh pattern already used in Phases 2-3 |
| SHOP-04 | Check off items without disappearing | Stable `checked_at` / `checked_by` ordering and “checked moves to bottom” sort, not deletion |
| SHOP-05 | Auto-group by aisle/category | Canonical pantry/shopping taxonomy table or enum map, never free-text grouping only |
| SHOP-06 | Pantry inventory with stock levels | `inventory_items` snapshot plus `inventory_events` movement ledger |
| SHOP-07 | Minimum thresholds auto-add to shopping list | Threshold evaluation on inventory writes plus idempotent shopping-list upsert |
| SHOP-08 | Barcode scan to add inventory/list items | `expo-camera` barcode scanning plus optional Open Food Facts metadata lookup |
| SHOP-09 | Import recipe ingredients with pantry deduction | Recipe normalization, pantry diff service, and shopping-list generation pipeline |
| MEAL-01 | Weekly meal plan with drag-and-drop | Dedicated meal-planner board using `react-native-draggable-flatlist`, then project meals into calendar |
| MEAL-02 | Add recipes with ingredients/instructions/photos | `recipes` + `recipe_ingredients` tables and optional photo URL field |
| MEAL-03 | Import recipes from URL | Prefer Recipe JSON-LD / schema.org extraction, Cheerio HTML fallback, AI cleanup only after structured-data pass |
| MEAL-04 | Meal plan populates shopping list with pantry deduction | Server-side pantry diff and ingredient rollup keyed by week and household |
| MEAL-05 | Dietary preferences and restrictions per member | Reuse Phase 1 profile dietary preferences as meal-planning input, extend only if necessary |
| MEAL-06 | Portion sizing from “home tonight” attendance | Read Phase 3 `member_attendance` as meal-plan serving input |
| MEAL-07 | Save favorite meals and tags | Recipe tags/favorite flags in recipe domain, not calendar metadata hacks |
| AIML-01 | AI weekly meal plans using preferences, pantry, budget, attendance, prep time | Planner input contract built from recipes, pantry snapshot, attendance, and calendar load |
| AIML-02 | AI suggests ingredient-sharing meals | Weekly ingredient overlap scoring from normalized ingredients and recipe tags |
| AIML-03 | Accept, swap, regenerate individual meals | Plan draft model with per-slot accept/swap/regenerate actions |
| AIML-04 | AI learns from accepted/rejected suggestions | Persist meal suggestion feedback events, not just final accepted plans |
| AIML-05 | Time-appropriate meal suggestions from calendar | Calendar-derived prep-time buckets and availability windows |
| AISH-01 | Predict low stock from consumption patterns | Inventory event ledger enables rolling usage-rate calculation |
| AISH-02 | Auto-generate shopping items from low stock + meal plans | Unified replenishment engine combining threshold alerts and planned meal deficits |
| AISH-03 | Pantry/fridge photo identifies items | Multimodal image analysis with manual review, seeded into inventory adjustments |
| AIEX-04 | Receipt scan updates expenses + pantry + shopping | Existing receipt OCR stays step 1; Phase 4 adds reviewed item mapping and atomic server-side commit |
| SYNC-01 | One receipt action creates expense, pantry updates, list checkoffs | Transactional workflow RPC/Edge Function, not three unrelated client writes |
| SYNC-03 | Meal planning creates shopping list with pantry deduction | Pantry diff service plus meal-plan rollup |
| SYNC-04 | Marking meal cooked deducts ingredients from pantry | Cooking action writes `inventory_events` with `source_type='meal_cooked'` |
| SYNC-05 | Low-stock items notify and auto-add to active list | Threshold evaluator emits list entries and notification-ready events |
| SYNC-07 | “Home tonight” feeds portions, chore availability, dinner expense relevance | Meal planner reads attendance directly; no duplicated attendance store |
</phase_requirements>

## Summary

Phase 4 should be planned as one food domain with three user-facing surfaces: shopping lists, pantry inventory, and meal planning. The planning mistake to avoid is treating them as separate features. The requirements only close cleanly if they share one normalized ingredient model, one inventory ledger, and one orchestration path for cross-feature writes. Shopping items, pantry stock, recipe ingredients, attendance, and receipt items all need to resolve to the same canonical concepts.

The current codebase gives you the right implementation shape already. Phases 2 and 3 use household-scoped Supabase tables, local hook state, shared realtime channels, client-side projection layers, and focused sheet-based editors. Phase 4 should continue that pattern. Do not introduce a second client data architecture. Add a new food-domain hook set, a shared `household:{id}:food` realtime channel, and projection utilities that feed both dedicated food screens and the existing unified calendar.

The highest-risk requirement is the “one photo, three workflows” pipeline. The current receipt flow stops after OCR review and expense creation. Phase 4 should keep OCR/review as step 1, then move the final commit to one server-side workflow that creates the expense, records inventory purchases, and resolves shopping-list matches atomically. Without that boundary, partial failure will leave household state inconsistent.

**Primary recommendation:** Plan Phase 4 around four core patterns: canonical food items, an inventory movement ledger, dedicated meal-plan tables projected into the calendar, and a single server-side receipt commit workflow that owns all cross-feature writes.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | `2.99.3` in repo (`2.100.0` current registry) | Household data, RPCs, storage, and realtime | Already the project backend client and the established hook pattern |
| `expo-camera` | `55.0.10` | Barcode scanning and pantry photo capture | Official Expo camera stack supports barcode detection and fits Expo 55 |
| `react-native-big-calendar` | `4.19.0` | Unified household calendar rendering | Already shipped in Phase 3 and already includes `meal` activity affordances in local types |
| `react-native-draggable-flatlist` | `4.0.3` | Weekly meal-plan drag-and-drop board | Fits React Native gesture stack already present in the app |
| `cheerio` | `1.2.0` | Server-side recipe page parsing | Standard HTML parsing fallback after JSON-LD/schema.org extraction |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@gorhom/bottom-sheet` | `5.2.8` | Item editors, meal swap sheets, inventory adjustments | Reuse existing sheet pattern instead of routing every action to a new screen |
| `react-native-reanimated` | `4.2.1` in repo | Gesture/animation dependency | Already required for sheets and draggable interactions |
| `react-native-gesture-handler` | `2.30.0` | Drag and gesture support | Already installed and required by the draggable list stack |
| Open Food Facts API v2 | current docs | Barcode metadata lookup | Use for best-effort product naming/categories; keep manual entry fallback |
| Schema.org Recipe / Google Recipe structured data | current docs | Recipe import contract | Prefer structured recipe extraction before HTML heuristics or AI cleanup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated weekly meal board with `react-native-draggable-flatlist` | Force drag-and-drop into `react-native-big-calendar` | The current calendar renderer is already good for projection, not for authoring drag-heavy meal planning |
| `cheerio` + JSON-LD extraction | Pure AI webpage parsing | AI-only parsing is costlier, slower, and less deterministic for common recipe sites |
| Open Food Facts lookup + manual review | Home-grown barcode product catalog | Product metadata coverage is hard to build and maintain; don’t hand-roll it in Phase 4 |
| Inventory ledger + snapshot | Single mutable `stock_level` column only | Direct mutation loses the consumption history required for AI predictions and cooked-meal deductions |

**Installation:**
```bash
npx expo install expo-camera
npm install react-native-draggable-flatlist cheerio
```

`react-native-big-calendar`, `@gorhom/bottom-sheet`, `react-native-reanimated`, `react-native-gesture-handler`, and `@supabase/supabase-js` are already present.

**Version verification:** Verified on 2026-03-23 via `npm view`.
- `expo-camera` `55.0.10` modified 2026-03-17
- `react-native-draggable-flatlist` `4.0.3` modified 2025-05-06
- `cheerio` `1.2.0` modified 2026-02-21
- `react-native-big-calendar` `4.19.0` modified 2026-01-28
- `@supabase/supabase-js` current registry version `2.100.0` modified 2026-03-23; repo currently pins `2.99.3`

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/(app)/
│   ├── shopping.tsx              # Shared shopping lists, active trip UX
│   ├── supplies.tsx              # Pantry/inventory and low-stock management
│   ├── meals.tsx                 # Weekly meal board, recipe picker, AI planning
│   └── calendar.tsx              # Existing unified timeline projected from meal entries
├── components/
│   ├── shopping/                 # List rows, aisle groups, barcode/pantry editors
│   ├── supplies/                 # Inventory cards, threshold controls, pantry scan review
│   ├── meals/                    # Weekly columns, recipe cards, AI suggestion sheets
│   └── food/                     # Shared ingredient chips, quantity renderers, source badges
├── hooks/
│   ├── useShopping.ts
│   ├── useInventory.ts
│   ├── useRecipes.ts
│   ├── useMealPlans.ts
│   └── useFoodRealtime.ts        # Shared household food channel + refresh orchestrator
├── lib/
│   ├── foodNormalization.ts      # Canonical names, units, category grouping
│   ├── pantryDiff.ts             # Needed vs on-hand calculations
│   ├── mealPlanning.ts           # AI input/output contracts and scoring helpers
│   └── receiptWorkflow.ts        # Client wrapper for atomic grocery receipt commit
└── types/
    ├── shopping.ts
    ├── inventory.ts
    ├── recipes.ts
    └── meals.ts
```

### Pattern 1: Canonical Food Item + Context-Specific Records
**What:** Keep one canonical food-item identity layer, then reference it from shopping items, pantry items, recipe ingredients, and receipt matches.
**When to use:** Everywhere items can move between list, pantry, meal, and receipt flows.
**Why:** The phase depends on matching the same concept across features. Free-text item names will break SYNC-01, SYNC-03, and AISH-02.
**Example:**
```typescript
type FoodCatalogItem = {
  id: string;
  householdId: string | null; // null = shared/global seed, value = household alias
  canonicalName: string;
  categoryKey: 'produce' | 'dairy' | 'protein' | 'frozen' | 'snacks' | 'supplies' | 'other';
  defaultUnit: 'count' | 'g' | 'kg' | 'ml' | 'l' | 'oz' | 'lb' | 'package';
  barcode: string | null;
  aliases: string[];
};
```

### Pattern 2: Inventory Snapshot + Immutable Movement Ledger
**What:** Model pantry stock with a current-state row and append-only inventory events for purchase, cook, manual adjust, pantry-photo seed, and threshold-triggered restock.
**When to use:** SHOP-06, SHOP-07, AISH-01, AISH-02, SYNC-04, and receipt-driven pantry updates.
**Why:** Predictions, audits, and cross-feature deductions require history. A mutable stock number alone is not enough.
**Example:**
```typescript
type InventoryItem = {
  id: string;
  householdId: string;
  catalogItemId: string;
  quantityOnHand: number;
  unit: string;
  minimumQuantity: number | null;
  updatedAt: string;
};

type InventoryEvent = {
  id: string;
  householdId: string;
  inventoryItemId: string;
  deltaQuantity: number;
  unit: string;
  sourceType: 'receipt_purchase' | 'meal_cooked' | 'manual_adjustment' | 'pantry_scan_seed' | 'restock_correction';
  sourceId: string | null;
  createdBy: string;
  createdAt: string;
};
```

### Pattern 3: Meal Plans Are Their Own Domain, Then Project Into Calendar
**What:** Store meal-plan entries separately from generic `calendar_events`, then project them into the calendar the same way Phase 3 projects chores and attendance.
**When to use:** All meal planning requirements and AI meal suggestions.
**Why:** Meals need recipe IDs, servings, status, AI provenance, and cooking-side effects. Overloading `calendar_events` would make meal-specific logic brittle and hard to query.
**Example:**
```typescript
type MealPlanEntry = {
  id: string;
  householdId: string;
  recipeId: string | null;
  slotDate: string; // YYYY-MM-DD
  slotKey: 'breakfast' | 'lunch' | 'dinner';
  servingsPlanned: number;
  status: 'planned' | 'cooked' | 'skipped';
  aiSuggestionRunId: string | null;
  createdBy: string;
};
```

### Pattern 4: Weekly Meal Authoring Uses A Dedicated Board, Not The Calendar Renderer
**What:** Build a seven-day meal board for authoring and drag-and-drop, then sync resulting meal entries into the existing household calendar.
**When to use:** MEAL-01 and AIML-03.
**Why:** `react-native-big-calendar` is already a good projection surface, but its official docs do not advertise drag-and-drop authoring. A dedicated board is simpler, faster, and more controllable on mobile.
**Example:**
```typescript
import DraggableFlatList from 'react-native-draggable-flatlist';

// One list per day/slot column; persist reordering on drag end.
<DraggableFlatList
  data={meals}
  keyExtractor={(item) => item.id}
  onDragEnd={({ data }) => persistColumnOrder(dayKey, data)}
  renderItem={({ item, drag }) => (
    <MealCard meal={item} onLongPress={drag} />
  )}
/>;
```
Source: https://github.com/computerjazz/react-native-draggable-flatlist

### Pattern 5: Atomic Grocery Receipt Commit
**What:** Keep OCR and user review separate from final persistence, then use one server-side workflow to commit expense + pantry + shopping updates together.
**When to use:** AIEX-04, SYNC-01, and grocery receipt confirmation.
**Why:** Sequential client writes will produce partial success states. This flow must be transactional from the planner’s perspective.
**Example:**
```typescript
type GroceryReceiptCommitInput = {
  householdId: string;
  expense: CreateExpenseInput;
  purchasedItems: Array<{
    receiptName: string;
    catalogItemId: string | null;
    quantity: number;
    unit: string;
    inventoryAction: 'add' | 'skip';
    shoppingListMatchIds: string[];
  }>;
};
```

### Anti-Patterns to Avoid
- **Using `calendar_events` as meal-plan source of truth:** keep calendar as a projection surface, not the only storage for meal-specific state.
- **Directly mutating pantry counts without event history:** this blocks low-stock prediction and breaks auditability.
- **Free-text matching only across receipt items, recipes, and shopping rows:** normalization is mandatory for reliable cross-feature sync.
- **Committing the receipt workflow from the client with three separate writes:** partial failures will be common and hard to reconcile.
- **Building custom barcode/product metadata infrastructure:** use scanner hardware + a best-effort external dataset + manual correction.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Barcode scanning | Native camera barcode stack from scratch | `expo-camera` barcode support | Already supported in Expo 55 and integrated with app config/plugin flow |
| Barcode product metadata | Proprietary UPC lookup catalog | Open Food Facts API + manual fallback | Coverage already exists; maintaining your own catalog is not Phase 4 work |
| Recipe web import | Ad hoc regex scraper per site | Recipe JSON-LD/schema.org extraction first, `cheerio` fallback second | Recipe sites commonly expose structured data; use it |
| Meal drag-and-drop authoring | Custom gesture engine inside calendar | `react-native-draggable-flatlist` | Existing gesture stack already supports it cleanly |
| Consumption prediction data | Heuristics over current stock only | Inventory event ledger | AI low-stock prediction needs history, not just latest value |
| Receipt three-way sync | Client-managed multi-write sequence | Single RPC/Edge workflow | Cross-feature state must commit atomically |

**Key insight:** The expensive complexity in this phase is not UI polish. It is identity resolution and write orchestration. Reuse proven libraries for scanning, dragging, and parsing so planning can focus on the domain model and transaction boundaries.

## Common Pitfalls

### Pitfall 1: Treating Item Names As Canonical IDs
**What goes wrong:** “Whole milk”, “milk 2%”, and “organic milk” fragment into different shopping, pantry, recipe, and receipt records.
**Why it happens:** Free-text entry is easy early on and matching feels deferrable.
**How to avoid:** Introduce a canonical catalog/alias layer in Wave 1. Support display labels separately from canonical IDs.
**Warning signs:** Frequent duplicate shopping rows, pantry mismatches, and receipt imports that cannot resolve items.

### Pitfall 2: Overloading Calendar Events For Meals
**What goes wrong:** Meal plans become hard to diff, reorder, mark cooked, or connect to recipes and pantry deductions.
**Why it happens:** Phase 3 already added `meal` as a calendar activity type, so it is tempting to store everything there.
**How to avoid:** Keep `meal_plan_entries` as source of truth and project them into the calendar.
**Warning signs:** Meal logic starts depending on `title` parsing or ad hoc metadata blobs on generic events.

### Pitfall 3: Inventory Without A Ledger
**What goes wrong:** You can show current stock, but you cannot explain why stock changed, predict usage, or safely undo errors.
**Why it happens:** A single `quantity_on_hand` column looks sufficient for the first screen.
**How to avoid:** Store both current stock and append-only inventory events from day one.
**Warning signs:** AI restock work needs “average usage” but no historical usage data exists.

### Pitfall 4: Client-Side Multi-Step Receipt Commits
**What goes wrong:** Expense saves but pantry does not, or shopping items check off without inventory updates.
**Why it happens:** The Phase 2 receipt flow currently ends in a normal client `createExpense` call.
**How to avoid:** Add a reviewed grocery receipt commit RPC/Edge workflow and treat it as one logical save.
**Warning signs:** Retry flows need to ask “which of the three writes already happened?”

### Pitfall 5: Trusting External Recipe Or Barcode Data Too Much
**What goes wrong:** Imported recipes have missing ingredients or weird units; barcode lookups return incomplete or wrong metadata.
**Why it happens:** Structured data and open datasets are helpful but not authoritative.
**How to avoid:** Always provide a manual review/edit step before the imported data becomes canonical household data.
**Warning signs:** Users cannot fix imported ingredient quantities or product names during onboarding/import.

### Pitfall 6: Realtime Refetch Storms Across Separate Food Hooks
**What goes wrong:** Shopping, inventory, recipes, and meals each subscribe independently and all refetch on every food write.
**Why it happens:** Copy-pasting the per-hook realtime pattern without coordinating the food domain.
**How to avoid:** Use one household food channel and central refresh orchestration per screen/domain.
**Warning signs:** One checkbox action triggers several near-identical network reloads and visible UI churn.

## Code Examples

Verified patterns from official sources:

### Barcode Scanning With Expo Camera
```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';

<CameraView
  barcodeScannerSettings={{
    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
  }}
  style={{ flex: 1 }}
/>;
```
Source: https://docs.expo.dev/versions/latest/sdk/camera/

### Supabase Realtime Channel Listening To Multiple Tables
```typescript
const channel = supabase
  .channel(`household:${householdId}:food`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list_items', filter: `household_id=eq.${householdId}` }, refreshFood)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items', filter: `household_id=eq.${householdId}` }, refreshFood)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plan_entries', filter: `household_id=eq.${householdId}` }, refreshFood)
  .subscribe();
```
Source: https://supabase.com/docs/guides/realtime/postgres-changes

### Recipe Import Fallback With Cheerio
```typescript
import * as cheerio from 'cheerio';

const $ = cheerio.load(html);
const jsonLdBlocks = $('script[type="application/ld+json"]')
  .map((_, el) => $(el).text())
  .get();
```
Source: https://cheerio.js.org/docs/intro

### Schema.org Recipe Fields To Prefer
```json
{
  "@type": "Recipe",
  "name": "Example Recipe",
  "recipeIngredient": ["1 egg", "200 g flour"],
  "recipeInstructions": "Mix and bake."
}
```
Source: https://schema.org/Recipe

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Store meal plans as generic calendar events only | Keep meal plans in dedicated tables, then project into the calendar | Current ecosystem pattern; Phase 3 already established projection as the right UI boundary | Makes cooking status, recipe linkage, and pantry deductions tractable |
| Scrape recipe pages heuristically first | Prefer Recipe JSON-LD / schema.org structured data, then HTML parse, then AI cleanup | Structured-data-first is the current standard on recipe sites and Google recipe docs | Higher import accuracy and lower AI cost |
| Mutable stock number as the pantry model | Snapshot + movement ledger | Inventory/consumption features increasingly assume event history | Enables low-stock prediction, audit, and reversible deductions |
| Client-side optimistic multi-write workflows | Transactional server-side orchestration with reviewed inputs | Cross-feature sync requirements force this architecture | Prevents partial failure across expense/list/pantry state |

**Deprecated/outdated:**
- AI-only recipe import as the first pass: use structured recipe data first.
- Per-feature disconnected item taxonomies: the food pipeline requires one shared normalization layer.

## Open Questions

1. **How much canonicalization should be household-specific versus global?**
   - What we know: Cross-feature sync needs canonical IDs, but pantry and shopping language will vary by household.
   - What's unclear: Whether to seed a global catalog with household aliases, or keep everything household-local in v1.
   - Recommendation: Start with household-local canonical items plus optional barcode-backed seeds. Do not build a global shared ontology in Phase 4.

2. **What is the exact AI meal-planning cost envelope?**
   - What we know: The app already uses AI credits and an OCR Edge Function. Meal planning and pantry-image seeding add new recurring AI costs.
   - What's unclear: The exact model/API choice and per-action credit burn.
   - Recommendation: Keep the Phase 4 plan model-agnostic but require explicit credit accounting tasks before shipping AIML/AISH flows.

3. **How deep should barcode metadata go in v1?**
   - What we know: Barcode scanning is required, and Open Food Facts provides best-effort product data with accuracy caveats.
   - What's unclear: Whether nutrition/brand/image fields are worth storing now or should be ignored.
   - Recommendation: Limit v1 to name, barcode, category hints, and unit/size hints. Defer richer nutrition/product enrichment.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Expo app, Jest, tooling | ✓ | `v25.6.1` | — |
| npm | Package install/test scripts | ✓ | `11.9.0` | — |
| Expo CLI | Running and validating app flows | ✓ | `55.0.18` via `npx expo` | — |
| Supabase CLI | Local migration/function workflows | ✓ | `2.83.0` via `npx supabase` | Use `npx supabase`; global binary missing |
| Hosted Supabase project | Database, Auth, Realtime, Edge Functions | Unknown | — | None |
| OpenAI API credentials | Meal AI, pantry photo analysis, OCR extension | Unknown | — | Manual-only fallback for non-AI flows |
| Open Food Facts API | Barcode metadata enrichment | External | API v2 docs | Manual item naming/category entry |

**Missing dependencies with no fallback:**
- Hosted Supabase project access and valid credentials are not locally verifiable from the repo; AI and realtime flows cannot be executed end-to-end without them.

**Missing dependencies with fallback:**
- Global `supabase` CLI binary is absent, but `npx supabase` works.
- OpenAI credentials are not verified locally, but shopping, pantry, and non-AI meal planning can still ship with manual flows.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `jest` `30.3.0` + `jest-expo` `55.0.11` |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --runInBand src/__tests__/phase4-food-core.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHOP-01 | Create/switch multiple shopping lists | unit/integration | `npm test -- --runInBand src/__tests__/shopping-core.test.ts` | ❌ Wave 0 |
| SHOP-02 | Add/edit items with quantity/category/note | unit/integration | `npm test -- --runInBand src/__tests__/shopping-core.test.ts` | ❌ Wave 0 |
| SHOP-03 | Food list realtime sync refreshes state | integration | `npm test -- --runInBand src/__tests__/food-realtime.test.ts` | ❌ Wave 0 |
| SHOP-04 | Checked items sort to bottom instead of vanishing | unit | `npm test -- --runInBand src/__tests__/shopping-core.test.ts` | ❌ Wave 0 |
| SHOP-05 | Auto-group by aisle/category | unit | `npm test -- --runInBand src/__tests__/food-normalization.test.ts` | ❌ Wave 0 |
| SHOP-06 | Track stock levels in pantry | unit/integration | `npm test -- --runInBand src/__tests__/inventory-core.test.ts` | ❌ Wave 0 |
| SHOP-07 | Threshold hits auto-add restock item | unit/integration | `npm test -- --runInBand src/__tests__/inventory-thresholds.test.ts` | ❌ Wave 0 |
| SHOP-08 | Barcode scan populates add-item flow | integration | `npm test -- --runInBand src/__tests__/barcode-scan.test.ts` | ❌ Wave 0 |
| SHOP-09 | Recipe import adds only missing ingredients | unit/integration | `npm test -- --runInBand src/__tests__/pantry-diff.test.ts` | ❌ Wave 0 |
| MEAL-01 | Weekly planner drag-and-drop persists meal slot/order | integration | `npm test -- --runInBand src/__tests__/meal-planner-ui.test.ts` | ❌ Wave 0 |
| MEAL-02 | Manual recipe create/edit works | unit/integration | `npm test -- --runInBand src/__tests__/recipes-core.test.ts` | ❌ Wave 0 |
| MEAL-03 | URL recipe import normalizes ingredients/instructions | unit | `npm test -- --runInBand src/__tests__/recipe-import.test.ts` | ❌ Wave 0 |
| MEAL-04 | Meal plan generates shopping list with pantry deduction | unit/integration | `npm test -- --runInBand src/__tests__/pantry-diff.test.ts` | ❌ Wave 0 |
| MEAL-05 | Member dietary preferences constrain meal options | unit | `npm test -- --runInBand src/__tests__/meal-ai-contracts.test.ts` | ❌ Wave 0 |
| MEAL-06 | Attendance changes servings for planned meals | unit/integration | `npm test -- --runInBand src/__tests__/meal-attendance.test.ts` | ❌ Wave 0 |
| MEAL-07 | Favorite/tagged meals can be saved and reused | unit | `npm test -- --runInBand src/__tests__/recipes-core.test.ts` | ❌ Wave 0 |
| AIML-01 | AI planner input includes pantry/budget/preferences/attendance/calendar load | unit | `npm test -- --runInBand src/__tests__/meal-ai-contracts.test.ts` | ❌ Wave 0 |
| AIML-02 | AI suggestions optimize ingredient overlap | unit | `npm test -- --runInBand src/__tests__/meal-ai-contracts.test.ts` | ❌ Wave 0 |
| AIML-03 | Accept/swap/regenerate individual meal slots | integration | `npm test -- --runInBand src/__tests__/meal-planner-ui.test.ts` | ❌ Wave 0 |
| AIML-04 | AI feedback events persist accepted/rejected outcomes | unit | `npm test -- --runInBand src/__tests__/meal-ai-feedback.test.ts` | ❌ Wave 0 |
| AIML-05 | Calendar context changes meal suitability scoring | unit | `npm test -- --runInBand src/__tests__/meal-ai-contracts.test.ts` | ❌ Wave 0 |
| AISH-01 | Low-stock prediction uses usage history | unit | `npm test -- --runInBand src/__tests__/inventory-prediction.test.ts` | ❌ Wave 0 |
| AISH-02 | Low-stock + meal plans auto-generate restock list | integration | `npm test -- --runInBand src/__tests__/inventory-thresholds.test.ts` | ❌ Wave 0 |
| AISH-03 | Pantry photo flow produces reviewable inventory suggestions | integration | `npm test -- --runInBand src/__tests__/pantry-photo-flow.test.ts` | ❌ Wave 0 |
| AIEX-04 | Grocery receipt review can drive food workflow commit | integration | `npm test -- --runInBand src/__tests__/receipt-food-pipeline.test.ts` | ❌ Wave 0 |
| SYNC-01 | Single receipt commit updates expense, pantry, and shopping state | integration | `npm test -- --runInBand src/__tests__/receipt-food-pipeline.test.ts` | ❌ Wave 0 |
| SYNC-03 | Planned meals generate shopping with pantry deduction | integration | `npm test -- --runInBand src/__tests__/pantry-diff.test.ts` | ❌ Wave 0 |
| SYNC-04 | Marking meal cooked deducts pantry inventory | integration | `npm test -- --runInBand src/__tests__/meal-cooking-flow.test.ts` | ❌ Wave 0 |
| SYNC-05 | Low stock both notifies and auto-adds to active list | integration | `npm test -- --runInBand src/__tests__/inventory-thresholds.test.ts` | ❌ Wave 0 |
| SYNC-07 | Attendance feeds meal portions and related logic | integration | `npm test -- --runInBand src/__tests__/meal-attendance.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --runInBand src/__tests__/phase4-food-core.test.ts`
- **Per wave merge:** `npm test -- --runInBand src/__tests__/shopping-core.test.ts src/__tests__/inventory-core.test.ts src/__tests__/meal-planner-ui.test.ts src/__tests__/receipt-food-pipeline.test.ts`
- **Phase gate:** `npm test`

### Wave 0 Gaps
- [ ] `src/__tests__/shopping-core.test.ts` — covers SHOP-01..05 and base list behaviors
- [ ] `src/__tests__/inventory-core.test.ts` — covers SHOP-06 and ledger/snapshot invariants
- [ ] `src/__tests__/inventory-thresholds.test.ts` — covers SHOP-07, AISH-02, SYNC-05
- [ ] `src/__tests__/barcode-scan.test.ts` — covers SHOP-08 scanner integration contract
- [ ] `src/__tests__/recipes-core.test.ts` — covers MEAL-02 and MEAL-07
- [ ] `src/__tests__/recipe-import.test.ts` — covers MEAL-03 import normalization
- [ ] `src/__tests__/pantry-diff.test.ts` — covers SHOP-09, MEAL-04, SYNC-03
- [ ] `src/__tests__/meal-planner-ui.test.ts` — covers MEAL-01 and AIML-03
- [ ] `src/__tests__/meal-attendance.test.ts` — covers MEAL-06 and SYNC-07
- [ ] `src/__tests__/meal-ai-contracts.test.ts` — covers AIML-01, AIML-02, AIML-05
- [ ] `src/__tests__/meal-ai-feedback.test.ts` — covers AIML-04
- [ ] `src/__tests__/inventory-prediction.test.ts` — covers AISH-01
- [ ] `src/__tests__/pantry-photo-flow.test.ts` — covers AISH-03
- [ ] `src/__tests__/receipt-food-pipeline.test.ts` — covers AIEX-04 and SYNC-01
- [ ] `src/__tests__/meal-cooking-flow.test.ts` — covers SYNC-04
- [ ] `src/__tests__/food-realtime.test.ts` — covers SHOP-03 shared channel refresh behavior

## Sources

### Primary (HIGH confidence)
- Local codebase inspection:
  - `src/hooks/useExpenses.ts`, `src/hooks/useReceipt.ts`, `supabase/functions/process-receipt/index.ts` — existing receipt and expense patterns
  - `src/hooks/useCalendar.ts`, `src/hooks/useChores.ts`, `src/hooks/useAttendance.ts`, `src/lib/calendarProjection.ts` — existing projection and realtime patterns
  - `src/app/(app)/_layout.tsx` — existing tab registry already reserves `shopping`, `meals`, and `supplies`
- Expo Camera docs — barcode scanning support, bundled version, config plugin, and camera usage: https://docs.expo.dev/versions/latest/sdk/camera/
- Supabase Realtime Postgres Changes docs — multi-table channel pattern and performance caveats: https://supabase.com/docs/guides/realtime/postgres-changes
- Supabase Realtime Broadcast docs — low-latency message transport and re-stream option: https://supabase.com/docs/guides/realtime/broadcast
- Cheerio docs — HTML parsing/load model: https://cheerio.js.org/docs/intro
- Schema.org Recipe — canonical structured recipe fields: https://schema.org/Recipe
- Open Food Facts API docs — API v2, rate limits, user-agent requirements, and reliability caveat: https://openfoodfacts.github.io/openfoodfacts-server/api/
- `react-native-draggable-flatlist` official README — drag-and-drop list API and installation: https://github.com/computerjazz/react-native-draggable-flatlist

### Secondary (MEDIUM confidence)
- `npm view` package registry metadata checked on 2026-03-23 for `expo-camera`, `react-native-draggable-flatlist`, `cheerio`, `react-native-big-calendar`, and `@supabase/supabase-js`

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified against official docs and npm registry, and aligned with the current repo
- Architecture: MEDIUM - strongly supported by the existing codebase and official docs, but exact table splits still need planner decisions
- Pitfalls: MEDIUM - driven by concrete integration seams in current code plus official service constraints

**Research date:** 2026-03-23
**Valid until:** 2026-04-22
