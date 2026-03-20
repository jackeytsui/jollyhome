# Feature Research

**Domain:** Household management / shared living app ("household operating system")
**Researched:** 2026-03-19
**Confidence:** MEDIUM-HIGH (core features HIGH; AI differentiation MEDIUM; niche features LOW)

---

## Competitive Landscape

Before the feature breakdown, a map of who owns what in the current market:

| App | Primary Strength | What It Lacks |
|-----|-----------------|---------------|
| **Splitwise** | Expense splitting, debt simplification | Chores, calendar, AI, household context; free tier now paywalled |
| **OurHome** | Chore management, gamification for kids | Expense splitting, reliability issues in 2025 reviews |
| **Cozi** | Shared family calendar, meal planning, shopping lists | Expense splitting, chore management, AI |
| **Flatastic** | Broad coverage (chores + groceries + expenses + comms board) | Shallow features in each area; rated 3.76/5, UI feels dated |
| **Homey (chores)** | Chore + allowance gamification | Expenses, calendar, household intelligence |
| **Livo** | Shopping + calendar + expenses in one | Minimal AI, shallow in all areas |
| **Homechart** | Calendars + budgets + shopping + meal planning | Chore management, AI, limited adoption |

**The gap:** No competitor does all five pillars (money, tasks, calendar, supplies, meals) with depth AND intelligence. Every app either goes deep on one pillar or shallow across many.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Household member invite + onboarding | App is useless solo; invite is first activation event | MEDIUM | Deep link invite flow; friction kills adoption |
| Expense tracking (manual entry) | Splitwise created this expectation for all shared living apps | LOW | Equal, custom %, shares, exact amount splits |
| Running balance + settlement summary | Users need to know "who owes who" at a glance | LOW | Debt simplification (A→B + B→C = A→C) |
| Chore list with assignment + due dates | OurHome/Flatastic set this expectation | LOW | Recurring chores, assignee, completion toggle |
| Shared shopping/grocery list | Cozi, OurHome, Flatastic all have this | LOW | Real-time sync across devices is expected |
| Shared household calendar | Cozi set this expectation; basic scheduling needed | MEDIUM | Per-member color coding; recurring events |
| Push notifications | Users won't check app proactively without reminders | LOW | Chore due, expense added, balance change |
| Cross-platform (mobile + web) | Users switch devices; desktop entry is more comfortable for expenses | HIGH | Must be parity across platforms from day one |
| Multi-user data sync (real-time) | Stale data breaks trust (wrong grocery list at store) | MEDIUM | Offline-capable with conflict resolution |
| Profile photos + member identification | Visual identification reduces confusion in multi-member households | LOW | Especially important for 4+ person households |
| Expense categories | Splitwise normalizes this; needed for any spending insight | LOW | Rent, utilities, groceries, dining, etc. |
| Recurring expense support | Rent, utilities repeat monthly; users expect automation | LOW | Set-and-forget bill tracking |
| Notification preferences (per-user) | Notification fatigue kills retention; user must control this | LOW | Per-feature granularity (expenses vs chores vs calendar) |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI receipt OCR + item extraction | Removes manual data entry friction for expenses; Splitwise paywalls this | HIGH | Camera → parsed line items → assign to members |
| AI chore rotation (fairness optimization) | No competitor does this; chore resentment is top shared-living conflict | HIGH | Factor in availability, past load, preferences |
| AI meal planning (dietary preferences + budget) | Integrates three features (calendar + meals + grocery) into one intelligent flow | HIGH | Learns preferences over time; generates weekly plan |
| Grocery → meal plan → shopping list pipeline | Closes the loop: plan meals → auto-populate list → check off at store | MEDIUM | Competitors do each step separately |
| AI spending pattern insights | "Your household spends 30% more on dining when Person X pays" type insight | MEDIUM | Aggregate household finance view |
| AI low-stock prediction for supplies | Predicts when to reorder (toilet paper, dish soap) based on household size + history | HIGH | Requires supply inventory tracking as prerequisite |
| House rules + quiet hours documentation | No major competitor has a structured "household agreement" feature | LOW | Simple document with version history + member acknowledgment |
| Shared space scheduling (bathroom, parking, common areas) | Pain point in large households not solved by competitors | MEDIUM | Lightweight booking calendar for shared resources |
| Guest management (visitor notices) | Airbnb-style "heads up" feature for shared households | LOW | Who's visiting, how long, sleeping arrangements |
| Maintenance request tracking | Renters need to log issues and track landlord response; nobody does this in a shared living app | MEDIUM | Photo + description + status + resolution date |
| Settlement suggestions ("pay X via Venmo") | Reduces friction at settlement time; competitor Splitwise links to Venmo/PayPal externally | MEDIUM | Deep links to Venmo/Cash App with pre-filled amounts |
| Household "health score" or dashboard | At-a-glance view of chore completion rate, balance state, upcoming calendar events | LOW-MEDIUM | Gamification element; motivates completion |
| Household-level spending budget | Cozi has individual meal planning; nobody does household budget tracking in context of shared expenses | MEDIUM | Monthly targets per category (groceries, utilities) |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| In-app payment processing (v1) | Users want to settle debts without leaving the app | PCI compliance, Stripe integration complexity, trust/fraud surface; premature before user validation | Track balances only; deep-link to Venmo/Cash App with pre-filled amounts |
| Real-time "who's home" location tracking | Seems useful for coordination | Privacy violation, trust destruction between housemates; leads to surveillance anxiety | Optional shared calendar "I'll be home at 6pm" events instead |
| Chore "penalties" and late fees | Parents/type-A users want enforcement | Destroys household culture; creates resentment, not accountability | Gentle nudge notifications + streak/score gamification |
| "Rate your roommate" reviews | Airbnb-style accountability | Weaponized against users; destroys trust in shared living context | House rules documentation + direct messaging |
| Full property management interface (v1) | Broad market appeal | Completely different UX, data model, and user psychology from shared living; dilutes focus | Defer to v2 with separate interface |
| Third-party grocery delivery integration (v1) | Convenience; Instacart/Amazon Fresh integration | API costs, maintenance burden, geographic limitations; over-engineered for MVP | Manual shopping list with share-to-clipboard for delivery apps |
| Complex recurring split rules | Edge cases requested by power users | 80% of households have simple splits; complexity kills onboarding | Equal split default + simple custom override |
| "Smart home" IoT integration | Voice assistants, smart locks, etc. | Hardware dependency, setup complexity, far outside core household management | Out of scope; focus on social coordination not automation |

---

## Feature Dependencies

```
[Household / Members]
    └──requires──> [All other features]

[Expense Tracking]
    └──requires──> [Household / Members]
    └──requires──> [Balance Tracking]
              └──enhances──> [Settlement Suggestions]

[AI Receipt OCR]
    └──requires──> [Expense Tracking]
    └──enhances──> [Spending Pattern Insights]

[Chore Management]
    └──requires──> [Household / Members]
    └──enhances──> [Push Notifications]

[AI Chore Rotation]
    └──requires──> [Chore Management]
    └──requires──> [Member Availability / Calendar]

[Shared Calendar]
    └──requires──> [Household / Members]
    └──enhances──> [AI Chore Rotation]

[Shopping List]
    └──requires──> [Household / Members]
    └──enhances──> [Meal Planning]

[Meal Planning]
    └──requires──> [Shared Calendar]
    └──requires──> [Shopping List]
    └──enhances──> [AI Meal Planning]

[AI Meal Planning]
    └──requires──> [Meal Planning]
    └──requires──> [Member dietary preferences]

[Supply Tracking / Inventory]
    └──requires──> [Shopping List] (extends it)
    └──enhances──> [AI Low-Stock Prediction]

[AI Low-Stock Prediction]
    └──requires──> [Supply Tracking]
    └──requires──> [household size + history data]

[Maintenance Requests]
    └──requires──> [Household / Members]
    └──enhances──> [Push Notifications]

[House Rules]
    └──requires──> [Household / Members]

[Guest Management]
    └──requires──> [Shared Calendar]

[Shared Space Scheduling]
    └──requires──> [Shared Calendar]
```

### Dependency Notes

- **Household / Members requires everything:** The invite + household creation flow is the non-negotiable foundation. Nothing works without it.
- **AI Chore Rotation requires Calendar:** Optimization needs availability data; build calendar before AI chore logic.
- **AI Meal Planning requires member preferences:** Collect dietary preferences at onboarding or prompt on first meal plan.
- **AI Low-Stock Prediction requires history:** Cannot do meaningful prediction until 3–4 weeks of supply tracking data exists; show simple thresholds first, upgrade to AI prediction later.
- **Spending Pattern Insights requires history:** Minimum 30 days of expense data needed before insights are meaningful; suppress until threshold met.

---

## MVP Definition

### Launch With (v1)

Minimum viable to validate the "one app to replace Splitwise + OurHome + Cozi" thesis.

- [ ] **Household creation + member invite** — Nothing else works without this; must be frictionless deep link
- [ ] **Expense tracking** (manual entry, equal/custom split, balance view) — Money is #1 shared living friction; primary validation target
- [ ] **Chore management** (assign, recurring, complete, notify) — Second biggest friction; validates multi-pillar thesis
- [ ] **Shared shopping list** (real-time sync) — Low complexity, immediately valuable, used daily
- [ ] **Shared calendar** (events, recurring, per-member color) — Required for AI chore rotation in v1.x; also table stakes
- [ ] **Push notifications** (chore due, expense added, balance change) — Passive engagement; retention dependency
- [ ] **AI receipt OCR** — First AI moment; demonstrates the differentiation thesis at first expense entry

### Add After Validation (v1.x)

Add once core multi-pillar usage is confirmed (users actually using 3+ features regularly).

- [ ] **Meal planning + grocery list integration** — Add when shopping list engagement is high
- [ ] **AI chore rotation** — Add when chore completion rates show fairness complaints in feedback
- [ ] **Spending pattern insights** — Add at 30-day mark when data density supports it
- [ ] **Settlement suggestions** (deep links to Venmo/Cash App) — Add when balance settlement friction appears in support requests
- [ ] **House rules documentation** — Add when "how do I communicate rules" appears in feedback
- [ ] **Maintenance request tracking** — Add when user feedback surfaces landlord/repair tracking need

### Future Consideration (v2+)

Defer until product-market fit is established with core household use case.

- [ ] **AI meal planning** (personalized, learns preferences) — Requires meal planning data + preference profiles; v2 differentiator
- [ ] **AI low-stock prediction** — Requires months of supply tracking history; v2 intelligence feature
- [ ] **Shared space scheduling** — Valuable for 4+ person households; niche enough to defer
- [ ] **Guest management** — Nice-to-have; low urgency
- [ ] **Household health score / gamification dashboard** — Polish layer; adds engagement but not core value
- [ ] **Property management interface** — Completely separate product; separate team/phase
- [ ] **In-app payment processing** — High compliance cost; validate balance tracking demand first

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Household + member invite | HIGH | MEDIUM | P1 |
| Expense tracking (manual) | HIGH | LOW | P1 |
| Balance view + debt simplification | HIGH | LOW | P1 |
| Chore management | HIGH | LOW | P1 |
| Shared shopping list (real-time) | HIGH | MEDIUM | P1 |
| Shared calendar | HIGH | MEDIUM | P1 |
| Push notifications | HIGH | LOW | P1 |
| AI receipt OCR | HIGH | HIGH | P1 |
| Meal planning | MEDIUM | MEDIUM | P2 |
| AI chore rotation | HIGH | HIGH | P2 |
| Spending insights | MEDIUM | MEDIUM | P2 |
| Settlement deep-links | MEDIUM | LOW | P2 |
| House rules | MEDIUM | LOW | P2 |
| Maintenance request tracking | MEDIUM | MEDIUM | P2 |
| Supply inventory tracking | MEDIUM | MEDIUM | P2 |
| AI meal planning | HIGH | HIGH | P3 |
| AI low-stock prediction | MEDIUM | HIGH | P3 |
| Shared space scheduling | MEDIUM | MEDIUM | P3 |
| Guest management | LOW | LOW | P3 |
| Household health score | MEDIUM | MEDIUM | P3 |
| Property management interface | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Splitwise | OurHome | Cozi | Flatastic | HomeOS (planned) |
|---------|-----------|---------|------|-----------|-----------------|
| Expense splitting | Deep (debt simplification, receipt scan Pro) | None | None | Shallow | Deep + AI receipt OCR |
| Chore management | None | Deep (gamification) | Basic (to-do lists) | Moderate | Deep + AI rotation |
| Shared calendar | None | Basic | Deep | None | Deep |
| Shopping list | None | Basic | Deep (real-time) | Basic | Deep + meal link |
| Meal planning | None | None | Basic recipe box | None | AI-powered |
| Supply tracking | None | None | None | None | + AI prediction |
| House rules | None | None | None | None | Structured doc |
| Maintenance tracking | None | None | None | None | Full request flow |
| Guest management | None | None | None | None | Calendar-linked |
| AI integration | Receipt OCR (Pro only) | None | None | None | First-class across all features |
| Free tier | Limited (5 exp/day cap) | Free | Free | Free | TBD |
| Platform | iOS/Android/Web | iOS/Android/Web | iOS/Android/Web | iOS/Android | iOS/Android/Web |
| Reliability | Good | Complaints in 2025 | Good | Moderate | — |

**Key insight from competitor analysis:**

1. Splitwise users are leaving over free tier restrictions — there is a captive audience ready to switch if a better product exists.
2. OurHome has reliability problems — an opening for a chore feature that just works.
3. No competitor combines finance + tasks + calendar with AI at any depth.
4. Flatastic is the closest "all-in-one" but is rated 3.76/5 and UI is reported as dated — low bar to clear.

---

## Sources

- [Splitwise Pro features](https://www.splitwise.com/pro) — Official, HIGH confidence
- [Best Bill Splitting Apps 2026](https://splittyapp.com/learn/best-bill-splitting-apps/) — MEDIUM confidence
- [Why users switch from Splitwise 2025](https://partytab.app/blog/best-splitwise-alternatives) — MEDIUM confidence
- [OurHome Google Play listing](https://play.google.com/store/apps/details?id=com.elusios.ourhome&hl=en_US) — HIGH confidence
- [OurHome chore management review](https://noobie.com/ourhome-app-review/) — MEDIUM confidence
- [Cozi feature overview](https://www.cozi.com/feature-overview/) — Official, HIGH confidence
- [Cozi 2026 review](https://www.usecalendara.com/blog/cozi-review-2026) — MEDIUM confidence
- [Flatastic Google Play](https://play.google.com/store/apps/details?id=com.flatastic.app&hl=en_IN) — HIGH confidence
- [Home management apps ranked](https://doityourselves.com/home-management-apps-ranked-from-worst-to-best/) — MEDIUM confidence
- [Chore apps best of 2025](https://thetoday.app/blog/chore-apps-the-best-5-house-chore-apps-reviewed/) — MEDIUM confidence
- [Best meal planning apps 2026](https://ollie.ai/2025/10/29/best-meal-planning-apps-2025/) — MEDIUM confidence
- [AI meal planning grocery integration](https://www.mealflow.ai/blog/meal-planning-app-with-grocery-list) — MEDIUM confidence
- [Best home maintenance apps 2025](https://www.homeledger.app/resources/best-home-maintenance-tracking-apps-for-2025-and-what-makes-ours-different) — MEDIUM confidence
- [AI household assistant features 2025](https://www.ohai.ai/blog/how-can-ai-help-with-a-domestic-chores-list/) — LOW confidence (marketing)
- [Homechart household app](https://homechart.app/) — MEDIUM confidence

---

*Feature research for: HomeOS — Household Operating System*
*Researched: 2026-03-19*
