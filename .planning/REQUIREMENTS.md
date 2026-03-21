# Requirements: HomeOS

**Defined:** 2026-03-19
**Core Value:** Eliminate the friction of shared living by giving every household a single, intelligent hub where money, tasks, supplies, and coordination just work — with each feature being best-in-class, not just "good enough."

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases. Every feature is designed to beat or match the best single-purpose app in its category.

### Household Foundation

- [x] **HOUS-01**: User can create a new household with a name and optional photo
- [x] **HOUS-02**: User can invite members via shareable deep link (no app install required to preview)
- [x] **HOUS-03**: Invited user can join household by tapping the link with zero-friction onboarding (< 30 seconds)
- [x] **HOUS-04**: User can create profile with display name, photo, and dietary preferences
- [x] **HOUS-05**: User can view all household members and their profiles
- [x] **HOUS-06**: User can leave a household (with balance settlement prompt if debts exist)
- [x] **HOUS-07**: Household creator can remove members (with balance settlement prompt)
- [x] **HOUS-08**: App provides solo-first value before other members join (personal expense tracking, personal chore list, meal planning)

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User receives email verification after signup
- [x] **AUTH-03**: User can reset password via email link
- [x] **AUTH-04**: User session persists across app restarts

### Expenses (beats Splitwise)

Target: < 15 seconds to add a standard expense. Unlimited free. No paywalls.

- [x] **EXPN-01**: User can add an expense with amount, description, and category in under 15 seconds
- [x] **EXPN-02**: User can split an expense equally among selected members
- [x] **EXPN-03**: User can split an expense by custom percentages, exact amounts, or shares (e.g., 2x share for larger room)
- [x] **EXPN-04**: User can split by weighted household shares (e.g., rent proportional to room size — set once, reuse)
- [ ] **EXPN-05**: User can view expense history with filters (date, category, member, amount range)
- [x] **EXPN-06**: User can see running balance ("who owes who") with automatic debt simplification (A->B + B->C = A->C)
- [x] **EXPN-07**: User can mark a debt as settled (partial or full)
- [ ] **EXPN-08**: User can create recurring expenses (rent, utilities) that auto-generate on schedule
- [x] **EXPN-09**: User can categorize expenses with smart category suggestions based on description
- [ ] **EXPN-10**: User can edit or delete an expense they created (with change history visible to all members)
- [x] **EXPN-11**: User can view settlement suggestions with pre-filled deep links to Venmo/Cash App/PayPal
- [ ] **EXPN-12**: User can dispute an expense with a note (other members see the dispute and can discuss)
- [x] **EXPN-13**: Tax and tip are auto-distributed proportionally on itemized receipt splits
- [x] **EXPN-14**: User can set privacy tiers per expense (visible to all, visible to involved parties only)

### AI Expenses (free receipt OCR — key acquisition hook)

- [ ] **AIEX-01**: User can scan a receipt with camera and AI extracts store name, date, line items, prices, tax, and total (< 4 seconds, 95%+ accuracy)
- [ ] **AIEX-02**: AI suggests which items are personal vs shared based on item names and household patterns
- [ ] **AIEX-03**: User can review, edit, and confirm AI-extracted data before saving (mandatory confirmation step)
- [ ] **AIEX-04**: Receipt scan simultaneously creates expense split + updates pantry inventory + checks off shopping list items (one photo, three workflows)
- [ ] **AIEX-05**: User can view AI-generated spending pattern insights after 30+ days (trends, anomalies, category breakdown)
- [ ] **AIEX-06**: AI suggests budget optimizations ("You spent 40% more on dining this month — here are meal plans that could save $X")

### Chores (beats OurHome — condition bars from Tody, energy-adaptive from Sweepy)

- [ ] **CHOR-01**: User can create a chore with title, description, estimated duration, and area of the house
- [ ] **CHOR-02**: User can assign a chore to one or more household members
- [ ] **CHOR-03**: User can set a chore as recurring with flexible scheduling (daily, specific weekdays, weekly, biweekly, monthly, custom interval)
- [ ] **CHOR-04**: Chores display condition bars (green->yellow->red) showing time since last done, not pass/fail deadlines
- [ ] **CHOR-05**: Assigned user can mark a chore as complete (with optional photo proof)
- [ ] **CHOR-06**: User can view all chores filtered by assignee, area, status, or urgency (condition level)
- [ ] **CHOR-07**: User can view chore completion history and fairness stats per member (hours contributed, tasks completed)
- [ ] **CHOR-08**: User can indicate daily energy level ("How much energy today?") and get an adapted task list prioritized by urgency and effort
- [ ] **CHOR-09**: Chores distinguish between "responsibilities" (assigned rotation) and "bonus tasks" (anyone can claim for credit)
- [ ] **CHOR-10**: Household can toggle gamification on/off (points, streaks, leaderboard — great for families, optional for adults)

### AI Chores (no competitor has this)

- [ ] **AICH-01**: AI generates fair chore rotation based on member availability (from calendar), past load, preferences, and estimated effort
- [ ] **AICH-02**: Rotation algorithm is stateless — never breaks when someone misses a task (fixes OurHome's #1 bug)
- [ ] **AICH-03**: User can accept or adjust AI-suggested chore assignments
- [ ] **AICH-04**: AI rebalances rotation when a member marks unavailability or household composition changes
- [ ] **AICH-05**: AI learns per-person task durations over time to improve effort estimation and fairness scoring

### Calendar (beats Cozi — unified household timeline)

- [ ] **CALD-01**: User can create household events with title, date/time, location, and description
- [ ] **CALD-02**: User can set events as recurring with flexible patterns (daily, weekly, monthly, custom)
- [ ] **CALD-03**: User can view shared calendar with per-member color coding and event-type icons
- [ ] **CALD-04**: Calendar displays all household activity types in one view: events, chore due dates, meal plans, maintenance, guest visits, quiet hours, shared space bookings
- [ ] **CALD-05**: User can RSVP to household events
- [ ] **CALD-06**: User can indicate "home tonight" / "away tonight" for dinner planning (lightweight attendance)
- [ ] **CALD-07**: Calendar supports day, week, and month views with agenda list option

### Shopping & Supplies (AnyList's polish + Grocy's intelligence)

- [ ] **SHOP-01**: User can create and manage multiple shared shopping lists (e.g., grocery, hardware store, Costco)
- [ ] **SHOP-02**: User can add items with quantity, category, and optional notes
- [ ] **SHOP-03**: Shopping list syncs in real-time across all household members (< 1 second)
- [ ] **SHOP-04**: User can check off items while shopping (checked items move to bottom, not disappear)
- [ ] **SHOP-05**: Shopping list auto-groups items by store aisle/category for efficient shopping
- [ ] **SHOP-06**: User can track household supply inventory with current stock levels
- [ ] **SHOP-07**: User can set minimum-stock thresholds per item that auto-add to shopping list when reached
- [ ] **SHOP-08**: User can scan product barcodes to add items to inventory or shopping list
- [ ] **SHOP-09**: User can import recipe ingredients directly to shopping list (with pantry deduction — only add what's missing)

### AI Shopping & Supplies

- [ ] **AISH-01**: AI predicts when supplies will run low based on household consumption patterns and auto-suggests restocking
- [ ] **AISH-02**: AI auto-generates shopping list items from low-stock predictions and upcoming meal plans
- [ ] **AISH-03**: User can photograph fridge/pantry and AI identifies items present (onboarding shortcut for initial inventory setup)

### Meal Planning (Plan to Eat's pipeline + Paprika's recipes + AI intelligence)

- [ ] **MEAL-01**: User can plan meals on a weekly calendar view with drag-and-drop
- [ ] **MEAL-02**: User can add recipes with ingredients, instructions, and photos
- [ ] **MEAL-03**: User can import recipes from URL (web clipper extracts ingredients and steps automatically)
- [ ] **MEAL-04**: Meal plan auto-populates shopping list with needed ingredients, deducting what's already in pantry
- [ ] **MEAL-05**: User can set dietary preferences and restrictions per member (allergies, vegetarian, cultural, etc.)
- [ ] **MEAL-06**: Meal portions auto-adjust based on "who's home tonight" calendar attendance
- [ ] **MEAL-07**: User can save favorite meals and tag them (quick, batch-cook, guest-worthy, budget, etc.)

### AI Meal Planning (the differentiator — no competitor does this well)

- [ ] **AIML-01**: AI generates weekly meal plans factoring in: member preferences, dietary needs, budget, what's in the pantry, who's home which nights, and prep time available (from calendar)
- [ ] **AIML-02**: AI suggests meals that share ingredients across the week to reduce waste and cost
- [ ] **AIML-03**: User can accept, swap, or regenerate individual AI-suggested meals
- [ ] **AIML-04**: AI learns from accepted/rejected suggestions and household cooking history to improve over time
- [ ] **AIML-05**: AI suggests time-appropriate meals based on calendar (slow cooker on late nights, quick meals on busy days)

### Maintenance (full lifecycle — no consumer app does this)

- [ ] **MANT-01**: User can create a maintenance request with photo, description, priority, and affected area
- [ ] **MANT-02**: User can track maintenance request status (open -> claimed -> in progress -> resolved)
- [ ] **MANT-03**: Household member can claim a maintenance request to work on it
- [ ] **MANT-04**: User can add notes, photos, and cost tracking to a maintenance request
- [ ] **MANT-05**: User can view maintenance history for the household with search and filters
- [ ] **MANT-06**: Resolved maintenance items log cost and can auto-create an expense split

### House Rules & Coordination

- [ ] **RULE-01**: Household can create and maintain house rules document with version history
- [ ] **RULE-02**: Members acknowledge house rules on joining (tracked who accepted which version)
- [ ] **RULE-03**: User can set quiet hours that display on the household calendar
- [ ] **RULE-04**: User can schedule shared space usage (bathroom, parking, laundry, common areas) via calendar booking
- [ ] **RULE-05**: User can post guest notices (who's visiting, duration, sleeping arrangements) that appear on the calendar

### Notifications (smart, not spammy)

- [ ] **NOTF-01**: User receives push notifications for expense additions and balance changes
- [ ] **NOTF-02**: User receives push notifications for chore assignments and condition-bar alerts (yellow/red)
- [ ] **NOTF-03**: User receives push notifications for calendar events and reminders
- [ ] **NOTF-04**: User receives push notifications for low-stock supply alerts and AI restocking suggestions
- [ ] **NOTF-05**: User can configure notification preferences per category with granular control (expenses, chores, calendar, supplies, maintenance)
- [ ] **NOTF-06**: Notifications are batched intelligently (daily digest option vs. real-time per category)

### Dashboard & Household Intelligence

- [ ] **DASH-01**: User can view a household dashboard with at-a-glance summary: balances, upcoming chores (condition bars), today's calendar, low supplies, active maintenance
- [ ] **DASH-02**: User can view household fairness dashboard: chore hours per member, expense contribution ratios, engagement stats
- [ ] **DASH-03**: User can view monthly household report: spending trends, chore completion rates, meal plan adherence

### Household AI Assistant

- [ ] **ASST-01**: User can ask the household AI natural language questions ("What should we cook tonight with what we have?", "Who owes the most?", "When was the bathroom last cleaned?")
- [ ] **ASST-02**: AI answers draw from all household data: pantry, expenses, chores, calendar, preferences
- [ ] **ASST-03**: AI can take actions from conversation ("Add milk to the shopping list", "Assign dishes to Jake for Tuesday")

### Cross-Feature Synergies (the all-in-one magic)

These requirements define how features connect to create a coherent product experience — the reason to use one app instead of five.

**Receipt -> Everything Pipeline**
- [ ] **SYNC-01**: Scanning a grocery receipt simultaneously: (a) creates an expense split, (b) adds purchased items to pantry inventory, (c) checks off matching shopping list items — one action, three updates
- [ ] **SYNC-02**: Scanning a home repair receipt auto-creates an expense split AND links it to the related maintenance request

**Meals <-> Shopping <-> Pantry Pipeline**
- [ ] **SYNC-03**: Planning meals for the week auto-generates a shopping list that deducts what's already in the pantry (only buy what you need)
- [ ] **SYNC-04**: Checking off a recipe as "cooked" auto-deducts used ingredients from pantry inventory
- [ ] **SYNC-05**: When pantry items hit low-stock threshold, they appear both as a notification AND auto-add to the active shopping list

**Calendar <-> Everything Integration**
- [ ] **SYNC-06**: Calendar is the unified timeline — one view shows events, chore condition bars, meal plans, maintenance appointments, guest visits, quiet hours, and shared space bookings
- [ ] **SYNC-07**: "Home tonight" attendance on the calendar feeds into: meal portion sizing, chore availability for AI rotation, and expense relevance ("only split dinner among people who were home")
- [ ] **SYNC-08**: AI reads the calendar to suggest context-appropriate actions: slow cooker meals on busy evenings, deep clean suggestions on free weekends, grocery runs before guests arrive

**Expenses <-> Chores Fairness**
- [ ] **SYNC-09**: Fairness dashboard shows combined view: who's contributing financially (expense ratio) AND who's contributing labor (chore hours) — the full picture of household equity
- [ ] **SYNC-10**: When one member consistently pays more, AI can suggest they do fewer chores (and vice versa) to balance overall household contribution

**Maintenance <-> Expenses <-> Calendar**
- [ ] **SYNC-11**: Completing a maintenance request with a cost auto-prompts "Split this expense?" and pre-fills the amount
- [ ] **SYNC-12**: Scheduling a maintenance appointment auto-creates a calendar event visible to the whole household

**Chores <-> Supplies**
- [ ] **SYNC-13**: Completing a cleaning chore can prompt "Running low on any supplies used?" to keep inventory current
- [ ] **SYNC-14**: When cleaning supplies are low-stock, related chores show a warning ("Low on dish soap — restock before washing dishes")

**Notifications as Connective Tissue**
- [ ] **SYNC-15**: Notifications reference related features: "Jake added a $45 grocery expense — view the receipt / check the shopping list / see pantry updates"
- [ ] **SYNC-16**: Daily household digest combines all features: today's chores + tonight's meal + balance reminders + low-stock alerts + calendar events — one notification, full picture

**Onboarding Synergy**
- [ ] **SYNC-17**: New member onboarding flow introduces all features as one connected system, not separate modules: "Here's your household at a glance" dashboard first, then naturally discover features from there

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Property Management Interface

- **PROP-01**: Property manager can manage multiple properties/units
- **PROP-02**: Property manager can view tenant household activity summaries
- **PROP-03**: Property manager can receive and respond to maintenance requests across properties

### Payments

- **PYMT-01**: User can settle debts in-app via integrated payment processing (Cino-style virtual shared card as stretch goal)
- **PYMT-02**: User can link bank account or payment method

### Integrations

- **INTG-01**: User can sync household calendar with Google Calendar / Apple Calendar
- **INTG-02**: User can import expenses from Splitwise (migration path for defecting users)
- **INTG-03**: User can share shopping list to clipboard for use with delivery apps

### Advanced AI

- **AIADV-01**: AI learns optimal notification timing per person (when they're most likely to act)
- **AIADV-02**: AI detects household conflict patterns and suggests proactive solutions
- **AIADV-03**: Computer vision pantry scanning as ongoing feature (not just onboarding)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time location tracking ("who's home") | Privacy violation; use voluntary "home tonight" toggle instead |
| Chore penalties / late fees | Creates resentment; use condition bars + nudges instead |
| "Rate your roommate" reviews | Weaponized in shared living context; use fairness dashboard instead |
| Smart home / IoT integration | Hardware dependency, far outside core product |
| Third-party grocery delivery API (v1) | API costs, maintenance burden, geographic limits; share-to-clipboard instead |
| In-app payment processing (v1) | PCI compliance cost; deep-link to Venmo/Cash App instead |
| Complex per-item recurring split formulas | 80% of households have simple splits; weighted shares cover the rest |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| HOUS-01 | Phase 1 | Complete |
| HOUS-02 | Phase 1 | Complete |
| HOUS-03 | Phase 1 | Complete |
| HOUS-04 | Phase 1 | Complete |
| HOUS-05 | Phase 1 | Complete |
| HOUS-06 | Phase 1 | Complete |
| HOUS-07 | Phase 1 | Complete |
| HOUS-08 | Phase 1 | Complete |
| EXPN-01 | Phase 2 | Complete |
| EXPN-02 | Phase 2 | Complete |
| EXPN-03 | Phase 2 | Complete |
| EXPN-04 | Phase 2 | Complete |
| EXPN-05 | Phase 2 | Pending |
| EXPN-06 | Phase 2 | Complete |
| EXPN-07 | Phase 2 | Complete |
| EXPN-08 | Phase 2 | Pending |
| EXPN-09 | Phase 2 | Complete |
| EXPN-10 | Phase 2 | Pending |
| EXPN-11 | Phase 2 | Complete |
| EXPN-12 | Phase 2 | Pending |
| EXPN-13 | Phase 2 | Complete |
| EXPN-14 | Phase 2 | Complete |
| AIEX-01 | Phase 2 | Pending |
| AIEX-02 | Phase 2 | Pending |
| AIEX-03 | Phase 2 | Pending |
| AIEX-04 | Phase 4 | Pending |
| AIEX-05 | Phase 6 | Pending |
| AIEX-06 | Phase 6 | Pending |
| CHOR-01 | Phase 3 | Pending |
| CHOR-02 | Phase 3 | Pending |
| CHOR-03 | Phase 3 | Pending |
| CHOR-04 | Phase 3 | Pending |
| CHOR-05 | Phase 3 | Pending |
| CHOR-06 | Phase 3 | Pending |
| CHOR-07 | Phase 3 | Pending |
| CHOR-08 | Phase 3 | Pending |
| CHOR-09 | Phase 3 | Pending |
| CHOR-10 | Phase 3 | Pending |
| AICH-01 | Phase 3 | Pending |
| AICH-02 | Phase 3 | Pending |
| AICH-03 | Phase 3 | Pending |
| AICH-04 | Phase 3 | Pending |
| AICH-05 | Phase 3 | Pending |
| CALD-01 | Phase 3 | Pending |
| CALD-02 | Phase 3 | Pending |
| CALD-03 | Phase 3 | Pending |
| CALD-04 | Phase 3 | Pending |
| CALD-05 | Phase 3 | Pending |
| CALD-06 | Phase 3 | Pending |
| CALD-07 | Phase 3 | Pending |
| SHOP-01 | Phase 4 | Pending |
| SHOP-02 | Phase 4 | Pending |
| SHOP-03 | Phase 4 | Pending |
| SHOP-04 | Phase 4 | Pending |
| SHOP-05 | Phase 4 | Pending |
| SHOP-06 | Phase 4 | Pending |
| SHOP-07 | Phase 4 | Pending |
| SHOP-08 | Phase 4 | Pending |
| SHOP-09 | Phase 4 | Pending |
| AISH-01 | Phase 4 | Pending |
| AISH-02 | Phase 4 | Pending |
| AISH-03 | Phase 4 | Pending |
| MEAL-01 | Phase 4 | Pending |
| MEAL-02 | Phase 4 | Pending |
| MEAL-03 | Phase 4 | Pending |
| MEAL-04 | Phase 4 | Pending |
| MEAL-05 | Phase 4 | Pending |
| MEAL-06 | Phase 4 | Pending |
| MEAL-07 | Phase 4 | Pending |
| AIML-01 | Phase 4 | Pending |
| AIML-02 | Phase 4 | Pending |
| AIML-03 | Phase 4 | Pending |
| AIML-04 | Phase 4 | Pending |
| AIML-05 | Phase 4 | Pending |
| MANT-01 | Phase 5 | Pending |
| MANT-02 | Phase 5 | Pending |
| MANT-03 | Phase 5 | Pending |
| MANT-04 | Phase 5 | Pending |
| MANT-05 | Phase 5 | Pending |
| MANT-06 | Phase 5 | Pending |
| RULE-01 | Phase 5 | Pending |
| RULE-02 | Phase 5 | Pending |
| RULE-03 | Phase 5 | Pending |
| RULE-04 | Phase 5 | Pending |
| RULE-05 | Phase 5 | Pending |
| NOTF-01 | Phase 6 | Pending |
| NOTF-02 | Phase 6 | Pending |
| NOTF-03 | Phase 6 | Pending |
| NOTF-04 | Phase 6 | Pending |
| NOTF-05 | Phase 6 | Pending |
| NOTF-06 | Phase 6 | Pending |
| DASH-01 | Phase 6 | Pending |
| DASH-02 | Phase 6 | Pending |
| DASH-03 | Phase 6 | Pending |
| ASST-01 | Phase 6 | Pending |
| ASST-02 | Phase 6 | Pending |
| ASST-03 | Phase 6 | Pending |
| SYNC-01 | Phase 4 | Pending |
| SYNC-02 | Phase 5 | Pending |
| SYNC-03 | Phase 4 | Pending |
| SYNC-04 | Phase 4 | Pending |
| SYNC-05 | Phase 4 | Pending |
| SYNC-06 | Phase 6 | Pending |
| SYNC-07 | Phase 4 | Pending |
| SYNC-08 | Phase 6 | Pending |
| SYNC-09 | Phase 6 | Pending |
| SYNC-10 | Phase 6 | Pending |
| SYNC-11 | Phase 5 | Pending |
| SYNC-12 | Phase 5 | Pending |
| SYNC-13 | Phase 5 | Pending |
| SYNC-14 | Phase 5 | Pending |
| SYNC-15 | Phase 6 | Pending |
| SYNC-16 | Phase 6 | Pending |
| SYNC-17 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 118 total (corrected from initial count of 89 -- NOTF, DASH, ASST, SYNC categories were added after initial count)
- Mapped to phases: 118
- Unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after roadmap creation (traceability populated)*
