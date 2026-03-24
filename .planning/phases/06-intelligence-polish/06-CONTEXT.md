# Phase 6: Intelligence + Polish - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning
**Source:** discuss-phase auto mode

<domain>
## Phase Boundary

Phase 6 is the system-integration layer that should make HomeOS feel like one household operating system instead of a bundle of adjacent features. It covers smart notifications, an at-a-glance dashboard, AI insights and assistant flows, unified-timeline polish, and onboarding that introduces the product as one connected system. This phase should prefer reusing the data models and screens already built in Phases 2 through 5 rather than rebuilding domain-specific UI under a “smart” wrapper.

</domain>

<decisions>
## Implementation Decisions

### Notifications
- **D-01:** Notification preferences should be category-based with per-category real-time vs digest behavior, not a global on/off toggle.
- **D-02:** Notifications should reference related features when the source data already exists, such as expense + receipt + pantry/shopping links, rather than sending isolated dead-end alerts.
- **D-03:** Daily digest should be assembled from existing household data snapshots and delivered as one “household picture” notification rather than separate category summaries.

### Dashboard and reporting
- **D-04:** The dashboard should be a true cross-domain landing surface: balances, chores, calendar, supplies, maintenance, and household equity signals in one view.
- **D-05:** Fairness should combine money and labor instead of exposing chore equity and expense equity as unrelated charts.
- **D-06:** Spending insights and monthly reporting should stay reviewable and transparent, with concrete metrics and evidence visible alongside AI summaries.

### Assistant behavior
- **D-07:** The household AI assistant should answer from existing structured household data rather than hallucinating generic advice.
- **D-08:** Assistant actions should start with safe, explicit, high-confidence operations that map onto existing hooks and workflows, such as adding shopping items, drafting calendar events, or suggesting meal/chore actions for review.
- **D-09:** Calendar-aware suggestions should be contextual and household-specific, not broad lifestyle coaching.

### Product polish
- **D-10:** The unified timeline should stay centered on the existing calendar architecture; polish means better synthesis and downstream references, not a new timeline store.
- **D-11:** New-member onboarding should begin with a dashboard-style “household at a glance” orientation and branch into linked features, instead of walking module by module.
- **D-12:** Phase 6 should tighten the connective tissue between features without destabilizing the proven Phase 2 to 5 workflows.

### Interaction style
- **D-13:** Reuse the repo’s current pattern of hook-driven screens plus focused sheets/modals/cards. The intelligence layer should feel native to the product, not like a separate chat app bolted on.

### the agent's Discretion
- Which notification delivery layer is implemented now versus stubbed behind local scheduling or server placeholders
- Exact dashboard card order, chart types, and copy
- Whether the assistant launches from home/dashboard, more tab, or a dedicated route
- How aggressively Phase 6 should expose write-actions from the assistant in the first pass

</decisions>

<specifics>
## Specific Ideas

- The most important quality bar for Phase 6 is synthesis: the user should see one system that understands household state across money, chores, supplies, meals, maintenance, and coordination.
- Good examples of desired synergy:
  expense notification -> receipt link -> pantry/shopping state,
  dashboard -> upcoming chores + tonight’s meal + low stock + active maintenance,
  assistant -> “What should we cook tonight?” answered with pantry + calendar + attendance,
  fairness -> money + labor tradeoff in one view.
- This phase should avoid fragile magic. “Smart” features should remain inspectable, reversible, and grounded in existing data.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and requirements
- `.planning/ROADMAP.md` — Phase 6 scope, success criteria, and four-plan shape
- `.planning/REQUIREMENTS.md` — `NOTF-*`, `DASH-*`, `ASST-*`, `AIEX-05`, `AIEX-06`, `SYNC-06`, `SYNC-08`, `SYNC-09`, `SYNC-10`, `SYNC-15`, `SYNC-16`, and `SYNC-17`
- `.planning/PROJECT.md` — product framing for “single intelligent household hub”

### Existing domain surfaces
- `src/app/(app)/finances.tsx` — current expense, receipt, and balance user flow
- `src/app/(app)/chores.tsx` — current chore workflow and fairness-ready data
- `src/app/(app)/calendar.tsx` — shared household timeline and projection surface
- `src/app/(app)/shopping.tsx` — shopping workflow for assistant/notification actions
- `src/app/(app)/meals.tsx` — meal board and AI meal suggestion entry points
- `src/app/(app)/supplies.tsx` — inventory, thresholds, and low-stock alert surface
- `src/app/(app)/maintenance.tsx` — maintenance lifecycle and expense handoff surface
- `src/app/(app)/rules.tsx` — rules and coordination event surface

### Existing hooks and cross-feature logic
- `src/hooks/useExpenses.ts`
- `src/hooks/useBalances.ts`
- `src/hooks/useChores.ts`
- `src/hooks/useCalendar.ts`
- `src/hooks/useShopping.ts`
- `src/hooks/useMealPlans.ts`
- `src/hooks/useInventory.ts`
- `src/hooks/useMaintenance.ts`
- `src/hooks/useHouseRules.ts`
- `src/lib/calendarProjection.ts`
- `src/lib/mealPlanning.ts`
- `src/lib/receiptWorkflow.ts`

### Existing AI and edge-function seams
- `supabase/functions/process-receipt/index.ts`
- `supabase/functions/generate-meal-plan/index.ts`
- `supabase/functions/identify-pantry-items/index.ts`
- `supabase/functions/import-recipe/index.ts`
- `supabase/functions/commit-grocery-receipt/index.ts`
- `supabase/functions/commit-repair-receipt/index.ts`

### Existing shell and navigation patterns
- `src/app/(app)/_layout.tsx` — existing tab structure and likely insertion points for dashboard/assistant exposure

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets
- The calendar already acts as the unified timeline backbone.
- The expense and receipt review flows already support AI-assisted but review-first writes.
- The meal and pantry layers already include history-aware AI recommendation seams.
- Maintenance and rules now provide the final missing household-operation domains that dashboard and assistant views can synthesize.

### Established patterns
- Household data is currently loaded via hooks with direct Supabase queries or RPCs, then projected into screen-friendly structures.
- AI features use edge functions and structured payloads, not unbounded client-side prompting.
- Major create/edit flows prefer sheets and modals over route-heavy CRUD.

### Integration points
- Notification references can piggyback on existing entity IDs and screens.
- Dashboard cards can reuse hook-derived summary slices instead of adding parallel caches.
- Assistant answers can compose existing hook outputs and pure helper functions before any write action is attempted.

</code_context>

<deferred>
## Deferred Ideas

None yet. Phase 6 already contains the project’s intended polish and synthesis layer, so scope should stay within the roadmap rather than expanding sideways into new product areas.

</deferred>

---

*Phase: 06-intelligence-polish*
*Context gathered: 2026-03-24*
