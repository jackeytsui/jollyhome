# Phase 06 Research: Intelligence + Polish

**Date:** 2026-03-24
**Domain:** Cross-domain notifications, dashboard synthesis, AI assistant orchestration, unified timeline polish, and connected onboarding
**Status:** Ready for planning

## What Already Exists

- Every major household domain now has a screen and hook surface: finances, chores, calendar, shopping, meals, supplies, maintenance, and rules.
- Calendar projection is already the unified timeline backbone, which means Phase 6 should focus on composition and presentation rather than new event persistence.
- There are already several AI or AI-adjacent seams:
  - receipt OCR
  - pantry photo identification
  - AI meal planning
  - natural-language expense parsing
- Several pure helper layers already exist for ranking, aggregation, or workflow staging. That lowers risk for a dashboard and assistant orchestration layer built from existing logic.

## Architectural Recommendation

### 1. Keep Phase 6 hook-first, not service-first

Build the dashboard, notifications, and assistant around existing hooks and pure helper composition where possible. Add a small number of shared “summary” and “assistant action” helpers rather than inventing a heavyweight orchestration backend first.

### 2. Treat notifications as structured household events

Notifications should be generated from existing domain facts and link back into existing screens. The first implementation can focus on:
- preferences model
- digest assembly
- trigger composition
- local or server-safe scheduling seam

without requiring a perfect production push pipeline in the same step.

### 3. Dashboard and insights should share summary logic

The dashboard, fairness view, monthly report, and spending insights all need overlapping aggregates. Build one shared summary layer instead of separate calculations embedded into four different screens.

### 4. Assistant should start with bounded, explicit actions

Best first actions:
- add an item to shopping
- draft or create a calendar event/coordination entry
- surface prefilled expense or maintenance handoff suggestions
- suggest a meal/chore next step

Avoid hidden automation or open-ended writes from natural language in the first pass.

## Recommended Plan Decomposition

### 06-01: Notification preferences and digest/reference wiring

Why first:
- It establishes the cross-feature delivery layer and preference model.
- It can reuse existing entity links immediately.
- It is relatively independent from dashboard rendering.

### 06-02: Dashboard, fairness, reports, and spending insights

Why second:
- It creates the main “household at a glance” surface.
- It consumes existing data without blocking the assistant.
- Its shared summary layer can later feed notifications and onboarding.

### 06-03: AI assistant and safe cross-domain actions

Why third:
- It depends on stable summary/composition helpers.
- It should consume the dashboard/report signals and existing domain hooks.
- It carries the highest correctness risk, so it should build after the data synthesis layer is in place.

### 06-04: Unified timeline polish, context-aware suggestions, and onboarding

Why fourth:
- It ties together the final product story once all other slices exist.
- It is the natural place to land SYNC-06, SYNC-08, SYNC-15, SYNC-16, and SYNC-17 polish work.

## Key Risks

### Feature duplication

If the dashboard or assistant reimplements domain logic separately from the source hooks, Phase 6 will become hard to trust and harder to maintain.

### Notification realism

True production push delivery may require external setup not represented in this repo. The plan should still implement preference models, event composition, and delivery seams in a way that can degrade cleanly.

### Assistant overreach

If the assistant is allowed to mutate too broadly too early, Phase 6 risks unpredictable behavior. Keep write-actions narrow and traceable.

### Insight credibility

AI-generated spending or fairness insights must show evidence from real data. Unsupported summary copy will feel generic and untrustworthy.

## Canonical References

- `.planning/phases/06-intelligence-polish/06-CONTEXT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
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
- `src/lib/receiptWorkflow.ts`
