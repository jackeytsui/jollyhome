# Phase 5: Maintenance + House Rules - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning
**Source:** discuss-phase auto mode

<domain>
## Phase Boundary

Phase 5 delivers the household coordination layer that sits on top of the existing expenses, chores, calendar, and food systems: maintenance request lifecycle, repair-cost linkage, rules with acknowledgment history, quiet hours, shared-space bookings, guest notices, and the two supply-awareness cross-feature warnings called out in the roadmap. This phase should not invent a second scheduling or receipt system. It should extend the existing calendar, expense, receipt, and inventory patterns already established in Phases 2 to 4.

</domain>

<decisions>
## Implementation Decisions

### Maintenance lifecycle
- **D-01:** Maintenance requests should use a clear household workflow: `open -> claimed -> in_progress -> resolved`, with claiming visible to the whole household and resolution preserving history rather than removing the item.
- **D-02:** Maintenance details should support photos, notes, affected area, priority, and cost tracking on the same record instead of splitting “request” and “work log” into separate user-facing systems.
- **D-03:** Maintenance history should be searchable/filterable from a dedicated maintenance surface, but the active request state should also be visible from the main household workflow without requiring deep navigation.

### Expense and receipt linkage
- **D-04:** Maintenance costs should reuse the existing expense and receipt pipeline rather than creating a parallel “maintenance payment” model.
- **D-05:** When a maintenance item is resolved with a cost, the user should get a prefilled split-expense path, not a silent auto-write.
- **D-06:** Repair receipt sync should link into the Phase 2/4 receipt architecture so the same review-first behavior applies before any expense is persisted.

### Calendar integration
- **D-07:** Maintenance appointments, guest notices, quiet hours, and shared-space bookings should all project into the existing household calendar timeline instead of building a second scheduling UI.
- **D-08:** Shared-space scheduling should behave like household bookings with conflict-aware calendar visibility, not free-text notes.
- **D-09:** Quiet hours should be modeled as household rule-backed calendar-visible time windows, with clear display in the same event stream as other household activity.

### House rules and acknowledgements
- **D-10:** House rules should be maintained as versioned household policy content with explicit acknowledgment tracking per version.
- **D-11:** Joining members should acknowledge the current rules version, but rule review and historical versions should remain visible after join so households can see what changed over time.
- **D-12:** Rules should focus on operational household guidance and coordination, not become a generic wiki or document-management subsystem.

### Cross-feature household coordination
- **D-13:** Cleaning-supply warnings should piggyback on the existing chore and inventory systems: completing relevant chores can prompt for low supplies, and low-stock supplies should visibly warn on related chores before work starts.
- **D-14:** Guest notices and bookings should feel like lightweight household coordination objects rather than heavy planning flows; they should be quick to create and immediately visible to everyone.

### Interaction style
- **D-15:** Reuse the existing app pattern of hook-driven screens plus focused sheet/modals for create/edit/review flows instead of introducing a new navigation paradigm for Phase 5.

### the agent's Discretion
- Exact field-level schema for maintenance notes/photos/history entries
- Whether rules editing uses rich text, structured sections, or plain formatted text
- The exact conflict and overlap UI for bookings
- Visual treatment of maintenance urgency and low-supply warnings within existing design language

</decisions>

<specifics>
## Specific Ideas

- Auto mode selected the recommended path of extending the current expense, receipt, calendar, chores, and inventory systems instead of inventing parallel ones.
- Phase 5 should feel like “household operations wiring,” not a separate app hidden inside HomeOS.
- The strongest product value in this phase is cross-feature coordination:
  maintenance cost -> expense split,
  maintenance appointment -> calendar event,
  chore completion -> supply awareness,
  low cleaning supplies -> chore warning.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and requirements
- `.planning/ROADMAP.md` — Phase 5 scope, success criteria, and dependency boundary
- `.planning/REQUIREMENTS.md` — `MANT-*`, `RULE-*`, `SYNC-02`, `SYNC-11`, `SYNC-12`, `SYNC-13`, and `SYNC-14` requirement definitions
- `.planning/PROJECT.md` — product-level household-operations framing and core value

### Existing expense and receipt flows
- `.planning/phases/02-expense-tracking-receipt-ocr/02-06-SUMMARY.md` — current receipt review and OCR save path
- [finances.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/finances.tsx) — current expense/receipt user flow
- [useReceipt.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useReceipt.ts) — reviewed receipt processing flow
- [ReceiptReviewCard.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/receipt/ReceiptReviewCard.tsx) — review-first receipt UX
- [00003_expenses.sql](/Users/jackeytsui/Downloads/HomeOS/supabase/migrations/00003_expenses.sql) — expense RPC and persistence model

### Existing calendar and scheduling flows
- `.planning/phases/03-chores-calendar/03-VERIFICATION.md` — verified calendar projection and activity-type architecture
- [useCalendar.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useCalendar.ts) — household calendar data layer
- [calendarProjection.ts](/Users/jackeytsui/Downloads/HomeOS/src/lib/calendarProjection.ts) — projected activity timeline model
- [calendar.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/calendar.tsx) — shared timeline rendering
- [EventEditorSheet.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/calendar/EventEditorSheet.tsx) — existing calendar editor patterns
- [00004_chores_calendar.sql](/Users/jackeytsui/Downloads/HomeOS/supabase/migrations/00004_chores_calendar.sql) — calendar, attendance, and chore schema/RPC baseline

### Existing supplies and food coordination flows
- `.planning/phases/04-shopping-meals-supplies/04-04-SUMMARY.md` — pantry, threshold, and low-stock UX
- `.planning/phases/04-shopping-meals-supplies/04-07-SUMMARY.md` — atomic receipt synchronization pattern
- [supplies.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/supplies.tsx) — inventory surface and warning patterns
- [useInventory.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useInventory.ts) — inventory and alert data layer
- [00005_food_domain.sql](/Users/jackeytsui/Downloads/HomeOS/supabase/migrations/00005_food_domain.sql) — inventory alert/event persistence model

### Existing chores and tab architecture
- [chores.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/chores.tsx) — chore UX and warning integration target
- [useChores.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useChores.ts) — chore data layer and completion hooks
- [_layout.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/_layout.tsx) — existing `maintenance` and `rules` tab placeholders already reserved

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/(app)/finances.tsx` + receipt hook/components: reusable review-first receipt flow for repair-cost linkage
- `src/hooks/useCalendar.ts` + `src/lib/calendarProjection.ts`: reusable projected timeline architecture for maintenance, guest, booking, and quiet-hours activity types already accounted for in calendar contracts
- `src/hooks/useInventory.ts` + `src/app/(app)/supplies.tsx`: reusable low-stock alert and threshold patterns for cleaning-supply warnings
- `src/hooks/useChores.ts` + `src/app/(app)/chores.tsx`: reusable completion flow where supply prompts can be attached
- `@gorhom/bottom-sheet` / modal-sheet CRUD patterns across chores, calendar, shopping, and meals: consistent user interaction model to preserve

### Established Patterns
- Household features use Supabase tables/RPCs plus hook-level local state and reload-after-mutation, not React Query or screen-local direct orchestration everywhere
- Cross-feature timeline items are projected into the calendar rather than duplicating event stores per domain
- Review-first AI/receipt flows are preferred over silent multi-write automation
- New household surfaces should align with the existing screen + sheet composition style

### Integration Points
- New maintenance and rules screens should plug into the existing `(app)` tab structure where `maintenance` and `rules` are already defined
- Maintenance appointments, guest notices, bookings, and quiet hours should feed the shared calendar projection layer
- Repair cost and receipt flows should integrate at the finances/receipt boundary, not bypass it
- Chore supply prompts and low-stock warnings should integrate at chore completion and chore-card display layers using inventory alert state

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within the Phase 5 scope boundary.

</deferred>

---

*Phase: 05-maintenance-house-rules*
*Context gathered: 2026-03-24*
