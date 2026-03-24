# Phase 05 Research: Maintenance + House Rules

**Date:** 2026-03-24
**Domain:** Household maintenance lifecycle, rules acknowledgements, quiet-hours and booking calendar projection, repair-expense sync, and chore-to-supply coordination
**Status:** Ready for planning

## What Already Exists

- The tab registry already reserves `maintenance` and `rules` entries in [src/app/(app)/_layout.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/_layout.tsx), but the screens do not exist yet.
- The calendar model already supports `maintenance`, `guest`, `quiet_hours`, and `booking` activity types in [src/types/calendar.ts](/Users/jackeytsui/Downloads/HomeOS/src/types/calendar.ts) and maps them through [src/lib/calendarProjection.ts](/Users/jackeytsui/Downloads/HomeOS/src/lib/calendarProjection.ts).
- The current calendar hook in [src/hooks/useCalendar.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useCalendar.ts) reads projected chores, attendance, meals, and `calendar_events`. That means guest notices, quiet hours, bookings, and maintenance appointments can reuse `calendar_events` with new `activity_type` values instead of introducing a second scheduling store.
- The receipt review path already exists in [src/hooks/useReceipt.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useReceipt.ts), [src/components/receipt/ReceiptReviewCard.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/receipt/ReceiptReviewCard.tsx), and [src/app/(app)/finances.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/finances.tsx). Phase 04 also added an atomic grocery receipt pattern, which is the right template for a repair-receipt-to-maintenance flow.
- The chores/inventory warning seam already exists across [src/hooks/useChores.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useChores.ts), [src/hooks/useInventory.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useInventory.ts), [src/app/(app)/chores.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/chores.tsx), and [src/app/(app)/supplies.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/supplies.tsx).

## Architectural Recommendation

### 1. Maintenance is its own domain table set, but not its own receipt or calendar system

Use dedicated maintenance tables for requests, timeline updates, attachments, and optional appointment metadata. Reuse:
- `calendar_events` for visible appointments
- `expenses` and the receipt review pipeline for costs
- the existing hook + bottom-sheet screen architecture for CRUD

This keeps request history queryable without forcing calendar semantics onto every maintenance note.

### 2. Rules and coordination objects should stay lightweight

House rules should be versioned content plus acknowledgment rows, not a wiki subsystem. Quiet hours, guest notices, and shared-space bookings should be modeled as calendar-backed coordination records with enough metadata to render specialized cards and editors, but still persist into the shared calendar stream.

### 3. Cross-feature sync should remain review-first

Phase 05 should follow the same interaction rule established in Phases 02 and 04:
- scan/import first
- review/edit second
- persist with one explicit confirmation

That applies to repair receipts and cost-to-expense prefills. Avoid silent multi-write automation.

## Recommended Plan Decomposition

### 05-01: Maintenance lifecycle, history, and appointment projection

Why first:
- It unlocks the main new tab and covers the largest unbuilt domain.
- It establishes the schema and hook contracts that repair receipts and expense prefills will attach to later.
- Maintenance appointments can ship early by writing `calendar_events` with `activity_type = maintenance`.

### 05-02: Rules, acknowledgements, quiet hours, guest notices, bookings

Why second:
- These all share one calendar-backed coordination pattern.
- They fit naturally on the `rules` surface and reuse the existing calendar editor/sheet idiom.
- This isolates the rules/history model from maintenance workflow complexity.

### 05-03: Cross-feature sync and household warnings

Why third:
- It depends on maintenance records existing first.
- It ties together finances, receipts, chores, and inventory without blocking Phase 05’s core CRUD surfaces.
- It is the right place for the repair receipt linkage and low-supply chore prompts.

## Key Risks

### Schema spread

If maintenance notes, photos, appointments, and costs all live on one row without a timeline model, the history surface will become hard to query and brittle to extend. Prefer a request row plus append-only updates/attachments where needed.

### Calendar duplication

Do not create separate booking or quiet-hours tables that bypass `calendar_events` unless a thin companion table is strictly needed for metadata. The visible timeline should still project from one calendar event source.

### Silent expense writes

SYNC-11 and SYNC-02 call for auto-prompted or linked expense behavior, not invisible inserts. The plan should keep a prefilled review sheet between maintenance resolution and expense persistence.

### Chore warning fatigue

Supply prompts should target cleaning-related chores only and appear at meaningful points:
- before starting if related inventory is already low
- after completion when the chore plausibly consumed supplies

Avoid generic prompts on every chore completion.

## Plan Validation Notes

- The phase can stay within the roadmap’s three-plan shape without under-scoping requirements.
- Existing calendar typing already reduces risk for rules/booking/guest projection.
- The main unknown is exact maintenance schema granularity, but that can be resolved cleanly in 05-01 without spilling into other plans.

## Canonical References

- `.planning/phases/05-maintenance-house-rules/05-CONTEXT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `src/app/(app)/_layout.tsx`
- `src/hooks/useCalendar.ts`
- `src/lib/calendarProjection.ts`
- `src/hooks/useReceipt.ts`
- `src/app/(app)/finances.tsx`
- `src/hooks/useChores.ts`
- `src/hooks/useInventory.ts`
