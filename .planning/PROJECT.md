# HomeOS — Household Operating System

## What This Is

An all-in-one household management app for people who live together — housemates, families, or any shared living arrangement. It unifies expense splitting, chore management, meal planning, shared calendars, supply tracking, maintenance requests, and house rules into a single AI-powered platform. Think "Slack for your home" — one app that replaces the patchwork of Splitwise, OurHome, Cozi, and group chats.

Two interfaces planned: housemates/family first, property management (Airbnb hosts, condo management teams) later.

## Core Value

Eliminate the friction of shared living by giving every household a single, intelligent hub where money, tasks, supplies, and coordination just work — so housemates can focus on living together, not managing logistics.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Expense tracking and smart splitting (receipt OCR, manual entry, equal/custom splits)
- [ ] Balance tracking with settlement history
- [ ] Chore assignment, rotation, and completion tracking
- [ ] Shared household calendar
- [ ] Meal planning and coordination
- [ ] Shared shopping/supply lists with low-stock alerts
- [ ] Home maintenance request tracking
- [ ] Guest management and shared space scheduling
- [ ] House rules and quiet hours
- [ ] Push notifications to household members
- [ ] AI-powered receipt scanning and item extraction
- [ ] AI smart suggestions (predictive reminders, spending patterns)
- [ ] AI meal planning (preferences, budget, dietary needs)
- [ ] AI chore optimization (fair rotation based on availability)
- [ ] Cross-platform: mobile app (iOS/Android) + web app
- [ ] In-app payment integration (v1: tracking only, later: Stripe/payment processing)

### Out of Scope

- Property management interface — deferred to v2 (focus on housemates/family first)
- In-app payment processing — v1 tracks balances only, people settle externally
- Native mobile apps — start with cross-platform approach (React Native or Flutter)

## Context

- User has not used competing apps (Splitwise, OurHome, Cozi, Roommate) — building from gut instinct that a unified solution should exist
- Market research needed to validate assumptions and identify actual product gaps
- Competitors each own one slice (Splitwise = money, OurHome = chores, Cozi = calendar) — nobody owns the full household experience
- AI integration is meant to be a first-class differentiator, not a bolt-on feature
- The "household operating system" positioning is the key thesis: one app to replace many

## Constraints

- **Platform**: Cross-platform (mobile + web) from day one
- **AI**: Must be deeply integrated, not superficial — receipt OCR, predictive suggestions, meal planning, chore optimization
- **Two audiences**: Architecture must support future property management interface without rewrite
- **Payments**: Start with balance tracking, payment integration comes later

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Housemates/family first, property management later | Simpler use case, faster to validate core value | — Pending |
| Two separate interfaces, shared backend | Serves both audiences without compromising either UX | — Pending |
| Expense splitting as primary feature | Money is the #1 friction point in shared living | — Pending |
| AI as first-class citizen | Differentiator vs. competitors who treat AI as afterthought | — Pending |
| Cross-platform from day one | Users need mobile + web access | — Pending |

---
*Last updated: 2026-03-19 after initialization*
