# Roadmap: HomeOS

## Overview

HomeOS delivers a unified household management platform in six phases, ordered by dependency and validation priority. Foundation and auth come first because every feature requires household isolation (RLS) and user identity. Expenses follow immediately as the highest-friction shared-living problem and the primary "replace Splitwise" validation target -- receipt OCR ships here as the acquisition hook. Chores and Calendar ship together because they share scheduling dependencies. Shopping, Meals, and Supplies form the food pipeline where the "one photo, three workflows" magic moment lives. Maintenance and House Rules fill the remaining household coordination gaps. Finally, the Intelligence layer wires everything together with notifications, dashboards, the AI assistant, and cross-feature synergies that only work when all underlying data exists.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation + Household** - Auth, household creation, member invites, profiles, and solo-first value (completed 2026-03-20)
- [x] **Phase 2: Expense Tracking + Receipt OCR** - Full expense splitting, balances, debt simplification, and AI receipt scanning (completed 2026-03-21)
- [x] **Phase 3: Chores + Calendar** - Condition-based chore management, AI rotation, and unified household calendar (completed 2026-03-23)
- [ ] **Phase 4: Shopping + Meals + Supplies** - Real-time shopping lists, pantry tracking, meal planning, AI meal suggestions, and the receipt-to-everything pipeline
- [ ] **Phase 5: Maintenance + House Rules** - Maintenance request lifecycle, house rules, shared space scheduling, and maintenance-expense-calendar synergies
- [ ] **Phase 6: Intelligence + Polish** - Notifications, dashboards, AI assistant, spending insights, cross-feature synergies, and onboarding flow

## Phase Details

### Phase 1: Foundation + Household
**Goal**: Users can create households, invite members, and experience solo value before anyone else joins
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, HOUS-01, HOUS-02, HOUS-03, HOUS-04, HOUS-05, HOUS-06, HOUS-07, HOUS-08
**Success Criteria** (what must be TRUE):
  1. User can sign up, verify email, log in, and stay logged in across app restarts
  2. User can create a household with name and photo, then invite others via a shareable deep link
  3. Invited user can join the household in under 30 seconds with zero-friction onboarding
  4. User can view household members, create a profile with dietary preferences, and leave or remove members
  5. App provides meaningful solo value (personal expense tracking, personal chore list, meal planning) before other members join
**Plans**: 8 plans

Plans:
- [x] 01-00-PLAN.md — Wave 0: Test infrastructure (Jest config, mocks, test stubs)
- [x] 01-01-PLAN.md — Project scaffold, Supabase schema, design system, core providers
- [x] 01-02-PLAN.md — Auth screens (signup, signin, OAuth, magic link) + onboarding tour
- [x] 01-03-PLAN.md — Household creation, invite system (QR + deep link + share), join flow
- [x] 01-04-PLAN.md — Member directory, profiles with dietary prefs, household settings, leave/remove, TOTP 2FA
- [x] 01-05-PLAN.md — Solo-first sandbox demo mode, RevenueCat monetization, AI credit meter
- [x] 01-06-PLAN.md — Gap closure: solo-first personal screens (finances + chores), dark mode wiring, home screen navigation
- [x] 01-07-PLAN.md — Gap closure: balance settlement prompts for leave/remove member dialogs

### Phase 2: Expense Tracking + Receipt OCR
**Goal**: Users can track shared expenses, view balances with debt simplification, and scan receipts with AI -- replacing Splitwise entirely
**Depends on**: Phase 1
**Requirements**: EXPN-01, EXPN-02, EXPN-03, EXPN-04, EXPN-05, EXPN-06, EXPN-07, EXPN-08, EXPN-09, EXPN-10, EXPN-11, EXPN-12, EXPN-13, EXPN-14, AIEX-01, AIEX-02, AIEX-03
**Success Criteria** (what must be TRUE):
  1. User can add an expense with amount, description, and category in under 15 seconds, and split it equally, by custom amounts, percentages, shares, or weighted household shares
  2. User can view a running "who owes who" balance with automatic debt simplification, mark debts as settled, and see settlement suggestions with deep links to Venmo/Cash App/PayPal
  3. User can scan a receipt with their camera and AI extracts store name, line items, prices, tax, and total in under 4 seconds at 95%+ accuracy -- with a mandatory review step before saving
  4. User can create recurring expenses, view expense history with filters, edit/delete expenses with visible change history, dispute expenses, and set privacy tiers per expense
  5. AI suggests which scanned items are personal vs shared, and tax/tip are auto-distributed proportionally on itemized splits
**Plans**: 7 plans

Plans:
- [ ] 02-01-PLAN.md — Database schema + RLS, TypeScript types, pure math functions (TDD), Zustand store
- [ ] 02-02-PLAN.md — Expense entry UI (quick-add form, split types, category suggestions), balance display, expenses tab layout
- [ ] 02-03-PLAN.md — Settlement flow (debt detail, payment app deep links, settlement history)
- [ ] 02-04-PLAN.md — Expense history with filters, expense detail with edit/delete/dispute, change history audit trail
- [ ] 02-05-PLAN.md — Recurring expense templates (create/skip/pause/edit), payment preferences settings
- [ ] 02-06-PLAN.md — Receipt OCR pipeline (camera, Edge Function, GPT-4o Vision, review card, item classification)
- [ ] 02-07-PLAN.md — Jolly NL expense parsing (Edge Function, JollyNLInput), Phase 1 balance stub wiring

### Phase 3: Chores + Calendar
**Goal**: Users can manage household chores with condition-based tracking, AI-powered fair rotation, and a unified shared calendar -- replacing OurHome and Cozi
**Depends on**: Phase 1
**Requirements**: CHOR-01, CHOR-02, CHOR-03, CHOR-04, CHOR-05, CHOR-06, CHOR-07, CHOR-08, CHOR-09, CHOR-10, AICH-01, AICH-02, AICH-03, AICH-04, AICH-05, CALD-01, CALD-02, CALD-03, CALD-04, CALD-05, CALD-06, CALD-07
**Success Criteria** (what must be TRUE):
  1. User can create chores with title, description, duration estimate, house area, and flexible recurring schedules -- chores display condition bars (green/yellow/red) showing urgency by time elapsed, not pass/fail deadlines
  2. User can assign chores to members, mark them complete with optional photo proof, view chore history and per-member fairness stats, and toggle gamification on/off
  3. AI generates fair chore rotation based on calendar availability, past load, and preferences -- rotation never breaks when someone misses a task, and AI rebalances when availability changes
  4. User can create household calendar events with recurring patterns, per-member color coding, and RSVP -- calendar displays all activity types (events, chores, meals, maintenance, guests, quiet hours, bookings) in day/week/month/agenda views
  5. User can indicate "home tonight" / "away tonight" for lightweight dinner attendance tracking
**Plans**: 9 plans

Plans:
- [x] 03-01-PLAN.md — Phase 3 contracts and passing scaffold tests: dependencies, type interfaces, and executable placeholders
- [x] 03-05-PLAN.md — Shared scheduling foundation: Supabase schema, recurrence/condition/fairness/projection libs, and base hooks
- [x] 03-02-PLAN.md — Core chores UX: personal-first list, create/edit/complete flows, filters, and bonus claim behavior
- [x] 03-03-PLAN.md — Calendar controls UX: event editor, RSVP, attendance toggles, and event-type icon/color cues
- [x] 03-06-PLAN.md — Chores depth UX: history, fairness, energy adaptation, and optional gamification surfaces
- [x] 03-07-PLAN.md — Full calendar rendering: day/week/month/agenda views and projected household timeline UI
- [x] 03-04-PLAN.md — AI rotation and integration: stateless suggestion engine, review/apply flow, and home/calendar synchronization
- [x] 03-08-PLAN.md — Gap closure: persisted member chore preferences wired into AI rotation scoring and rationale
- [x] 03-09-PLAN.md — Gap closure: recurring event UI with daily/weekly/monthly/custom controls and RRULE translation

### Phase 4: Shopping + Meals + Supplies
**Goal**: Users can manage shared shopping lists, track pantry inventory, plan meals with AI, and experience the "one receipt photo, three workflows" magic moment -- the food pipeline that no competitor has
**Depends on**: Phase 2, Phase 3
**Requirements**: SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05, SHOP-06, SHOP-07, SHOP-08, SHOP-09, MEAL-01, MEAL-02, MEAL-03, MEAL-04, MEAL-05, MEAL-06, MEAL-07, AIML-01, AIML-02, AIML-03, AIML-04, AIML-05, AISH-01, AISH-02, AISH-03, AIEX-04, SYNC-01, SYNC-03, SYNC-04, SYNC-05, SYNC-07
**Success Criteria** (what must be TRUE):
  1. User can create multiple shared shopping lists that sync in real-time (under 1 second), check off items while shopping, and lists auto-group items by store aisle/category
  2. User can track household supply inventory with stock levels, set minimum-stock thresholds that auto-add to shopping list, and scan product barcodes to add items
  3. User can plan meals on a weekly calendar with drag-and-drop, add/import recipes from URL, and meal plans auto-populate shopping lists with pantry deduction (only buy what is missing)
  4. AI generates weekly meal plans factoring in member preferences, dietary needs, budget, pantry contents, who is home which nights, and prep time -- user can accept, swap, or regenerate individual meals
  5. Scanning a grocery receipt simultaneously creates an expense split, adds purchased items to pantry inventory, and checks off matching shopping list items -- one photo, three workflows
**Plans**: 7 plans

Plans:
- [x] 04-01-PLAN.md — Contracts, dependencies, and scaffold validation for the unified food domain
- [ ] 04-02-PLAN.md — Food schema, normalization, pantry-diff, and meal-planning core helpers
- [ ] 04-03-PLAN.md — Shared food hooks, realtime orchestration, and meal projection into the calendar pipeline
- [ ] 04-04-PLAN.md — Shopping lists, pantry inventory, thresholds, barcode scanning, and low-stock UX
- [ ] 04-05-PLAN.md — Recipe CRUD/import plus weekly meal board, shopping generation, and cooked-meal flow
- [ ] 04-06-PLAN.md — AI meal planning, replenishment prediction, and pantry-photo review flows
- [ ] 04-07-PLAN.md — Atomic grocery receipt commit for expense + pantry + shopping synchronization

### Phase 5: Maintenance + House Rules
**Goal**: Users can track the full maintenance request lifecycle and coordinate shared living through house rules, quiet hours, shared space scheduling, and guest management
**Depends on**: Phase 2, Phase 3
**Requirements**: MANT-01, MANT-02, MANT-03, MANT-04, MANT-05, MANT-06, RULE-01, RULE-02, RULE-03, RULE-04, RULE-05, SYNC-02, SYNC-11, SYNC-12, SYNC-13, SYNC-14
**Success Criteria** (what must be TRUE):
  1. User can create maintenance requests with photo, description, priority, and area -- requests flow through open/claimed/in-progress/resolved status with notes, photos, and cost tracking
  2. Resolved maintenance items can auto-create an expense split, and scanning a repair receipt links to the related maintenance request
  3. Household can create and maintain house rules with version history, members acknowledge rules on joining, and quiet hours display on the calendar
  4. User can schedule shared space usage via calendar booking and post guest notices that appear on the calendar
  5. Completing a cleaning chore prompts about low supplies, and low cleaning supplies show a warning on related chores
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

### Phase 6: Intelligence + Polish
**Goal**: Users experience HomeOS as a single intelligent system -- smart notifications, at-a-glance dashboards, a conversational AI assistant, and cross-feature synergies that make the whole greater than the sum of parts
**Depends on**: Phase 2, Phase 3, Phase 4, Phase 5
**Requirements**: NOTF-01, NOTF-02, NOTF-03, NOTF-04, NOTF-05, NOTF-06, DASH-01, DASH-02, DASH-03, ASST-01, ASST-02, ASST-03, AIEX-05, AIEX-06, SYNC-06, SYNC-08, SYNC-09, SYNC-10, SYNC-15, SYNC-16, SYNC-17
**Success Criteria** (what must be TRUE):
  1. User receives smart push notifications for expenses, chores, calendar events, and low-stock alerts -- with per-category granular control and intelligent batching (daily digest vs real-time)
  2. User can view a household dashboard showing at-a-glance balances, upcoming chores with condition bars, today's calendar, low supplies, and active maintenance
  3. User can ask the AI assistant natural language questions about any household data ("What should we cook tonight?", "Who owes the most?", "When was the bathroom last cleaned?") and the AI can take actions from conversation
  4. AI generates spending pattern insights after 30+ days and suggests budget optimizations based on trends
  5. Calendar shows the true unified timeline with all event types, notifications reference related features across domains, and new member onboarding introduces all features as one connected system
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD
- [ ] 06-04: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Household | 8/8 | Complete | 2026-03-20 |
| 2. Expense Tracking + Receipt OCR | 7/7 | Complete   | 2026-03-21 |
| 3. Chores + Calendar | 9/9 | Complete | 2026-03-23 |
| 4. Shopping + Meals + Supplies | 0/7 | Not started | - |
| 5. Maintenance + House Rules | 0/3 | Not started | - |
| 6. Intelligence + Polish | 0/4 | Not started | - |

---
*Roadmap created: 2026-03-19*

## Backlog

### Phase 999.1: Jolly natural-language event creation box for calendar (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with $gsd-review-backlog when ready)
