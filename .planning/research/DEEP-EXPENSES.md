# Deep Competitive Teardown: Expense Splitting & Household Finance

**Researched:** 2026-03-19
**Scope:** Competitive analysis of expense splitting apps to define HomeOS best-in-class expense feature
**Overall Confidence:** HIGH (multiple corroborating sources, including official docs, app stores, and independent reviews)

---

## Part 1: Competitor Teardowns

---

### 1. Splitwise — The Market Leader

**Market Position:** The de facto standard for ongoing shared expense tracking. 14 years old, massive install base. "Your friends probably already have it" is its biggest moat.

#### Exact UX Flow: Adding an Expense

The current Splitwise flow has been independently documented as having **9 discrete steps**:

1. Open app
2. Tap "Add bill" button
3. Type description
4. Enter amount
5. Select currency
6. Choose who paid
7. Select recipients
8. Pick expense category
9. Save

**What's wrong with this flow:** Multiple input fields appear on screen simultaneously with poor visual hierarchy. The amount field is not prioritized. Recurring expense options are buried and labeled confusingly as "repeat" rather than "recurring." No draft-saving — if you switch apps mid-entry, you lose everything.

**Documented UX critique:** The app overwhelms users with scattered text, visual elements, and numeric data simultaneously. Since expenses are added during social gatherings, the multi-step process contradicts the core use case of logging quickly and returning to the group.

#### How Splits Are Displayed and Managed

- Equal split is the default (each person's share shown as dollar amounts below the total)
- Split options available: equally, by percentage, by exact amounts, by shares/ratios
- Itemized splitting (assign individual receipt items to people) is Pro-only
- Group balances shown as net amounts owed per person — not a transaction-by-transaction ledger visible by default

#### Balance and Settlement Display

- Dashboard shows net balances: "You owe X" or "X owes you"
- Debt simplification ("Simplify Debts") reduces multi-person payment chains into the minimum number of transactions
- Algorithm: calculates net position of each participant, categorizes as Giver (positive) or Receiver (negative), then uses a network flow algorithm to route the minimum number of payments. This is NP-Complete so Splitwise uses heuristics for near-instant results
- Visually: balances are displayed as a list with red (owe) / green (owed) color coding
- Settlement: tapping "Settle up" prompts amount + payment method (external — links to Venmo, PayPal, etc.)

#### Receipt Scanning Experience

- **Pro feature only** — not available on free tier
- Take a photo → Splitwise OCR detects individual line items
- Items appear as a list → tap to assign each item to a person
- Taxes and tips are prorated automatically
- Known limitation: must take a live photo; cannot scan from camera roll (long-standing feature request that remained unfulfilled as of 2026)
- Cloud storage for high-res receipt images (10GB with Pro)

#### Notifications

- Push notification when someone adds, edits, or deletes an expense
- Reminder feature exists but sends to email only — "not everybody checks their email, high chance reminders go unread"
- No smart notification timing (e.g., no "you haven't settled in 30 days" alerts)

#### What Users Love

- Largest user base — social network effect is the #1 praise
- Cross-platform (iOS, Android, web) with consistent sync
- Debt simplification reduces awkward payment chains
- 14 years of stability — "just works"
- Clear running balance display
- 150+ currency support with real-time conversion

#### What Users Hate (Post-2024 Paywall Era)

This is Splitwise's critical vulnerability. After introducing monetization restrictions:

- **3-5 expense daily limit on free tier** — the most-hated change. Described as "renders the app useless for casual users"
- **10-second mandatory countdown** before adding each expense on free tier — described as "infuriating" and "insulting"
- **Constant upsell modals** — interrupts the primary use case
- **Receipt scanning locked behind Pro** — $40/year or $5/month
- **Recurring expenses locked behind Pro**
- **Old, clunky UI** — "looks and feels like it was designed in 2011"
- **No search or filtering** — cannot filter expenses by category or date range
- **No draft saving** — lose entry if you switch apps
- **Reminder emails** — ineffective, often missed
- **Expense deletion** — if one person deletes a shared expense, it disappears for everyone
- **No individual payout visibility** — cannot see who has paid what in detail
- Reddit user sentiment in 2024: "rip splitwise" threads, users actively seeking alternatives

#### Pricing Model

| Tier | Price | What's Included |
|------|-------|----------------|
| Free | $0 | 3-5 expenses/day, 10s delay, ads, basic splitting |
| Pro | $5/month or $40/year | Receipt scanning, itemized splits, recurring expenses, no ads/delays, currency charts, bank integrations |

**Confidence:** HIGH — sourced from Splitwise's own website, Trustpilot, Reddit, multiple independent review sites.

---

### 2. Tricount — The European Challenger

**Market Position:** Popular in Europe and Asia. Positioned as "simple, free, and unlimited" — a direct reaction to Splitwise's paywall strategy.

#### Philosophy

Tricount's core design principle is frictionless onboarding. No account required to join a group. Participants join via a shared link. This is a fundamentally different trust model from Splitwise.

#### Exact UX Flow: Adding an Expense

1. Open group (no login required if joining via link)
2. Tap "+" to add expense
3. Enter amount
4. Enter description
5. Select who paid
6. Select who's included
7. Save

**What's different from Splitwise:** Fewer steps. No currency selection required per-expense (set at group level). No category required.

#### Key Differentiators vs. Splitwise

| Feature | Tricount | Splitwise |
|---------|----------|-----------|
| Account required | No (optional) | Yes |
| Free tier limits | None | 3-5 expenses/day |
| Ads on free tier | None | Yes |
| Offline mode | Yes (sync when reconnected) | Limited |
| Receipt scanning | No | Pro only |
| Recurring expenses | No | Pro only |
| Analytics/charts | Basic | Detailed (Pro) |
| Bank integration | No | Yes (Pro) |
| Multi-currency | Limited | 150+ (Pro) |
| Payment integrations | None | Yes |

#### What Tricount Does Better

- **Zero-friction joining** — share a link, participants don't need accounts. This is the killer feature for group travel and one-time events
- **Always offline-capable** — works on treks, in areas with no signal, abroad with data roaming off
- **Completely free, no ads** — no monetization friction at all. This is increasingly a differentiator as Splitwise has degraded the free experience
- **Clean, uncluttered UI** — designed for people who "just want to track shared expenses without friction"
- **Tab-based navigation** — simpler mental model than Splitwise's sidebar

#### What Tricount Lacks

- No AI or smart features of any kind
- No receipt scanning
- No recurring expenses
- No payment integrations (no way to settle within the app)
- No advanced currency handling for international trips
- Limited to one-time events — not designed for ongoing household tracking
- No spending analytics

#### Pricing

- Free tier: Fully unlimited, no ads
- Premium (€2.99/month): Additional themes, advanced settings

**Confidence:** HIGH — sourced from Tricount's own website, getcino.com comparison, multiple review sites.

---

### 3. Settle Up — The Feature-Complete Alternative

**Market Position:** Positioned as a technically strong all-rounder. Less brand recognition than Splitwise but stronger feature set on free tier.

#### Unique Features

**Weighted contributions:** A married couple can be assigned weight "2" while singles get weight "1," so an equal split automatically accounts for this. No other major app does this.

**Voice assistant integration:** Works with Google Assistant, Alexa, and Cortana — hands-free expense logging. Unique in the category.

**Ultrasound device sharing:** Groups can be shared to nearby devices using ultrasound. Novel approach to the "getting everyone on the same app" problem.

**Default shares per group:** Groups can set default split weights so every new expense doesn't require re-configuring the split.

**AI-powered category prediction (added March 2025):** Type the expense description and Settle Up attempts to predict the category based on your previous expenses. Learning gets better over time.

**Offline-first:** Works completely offline, syncs when connected.

#### Exact UX Flow: Adding an Expense

The app is documented as having "the fastest expense adding framework" because it starts with the payer selection (tap the person's name/avatar) rather than a generic "add expense" screen. This contextual starting point reduces cognitive load.

Flow:
1. Tap payer's name/avatar from group screen
2. Enter amount
3. Description (optional — category auto-suggested)
4. Adjust split (or accept defaults)
5. Save

**What's different:** Starting from the payer — not a blank form — makes the most common case (one person paid) one tap faster.

#### Settle Up vs. Splitwise Free Tier Comparison

| Feature | Settle Up Free | Splitwise Free |
|---------|---------------|----------------|
| Expense limits | Unlimited | 3-5/day |
| Ads | Yes | Yes |
| Export transactions | Yes (unlocked) | No |
| Recurring transactions | Premium | Premium |
| Receipt photos | Premium | Pro |
| Offline mode | Yes | No |
| Voice control | Yes | No |

#### Premium Features

- Ad-free experience
- Receipt photo storage
- Pre-selected or custom expense categories
- Recurring transactions
- Advanced reporting

#### Pricing

- Free: Unlimited expenses, unlimited exports, ads
- Premium: Ad-free, receipt photos, recurring, custom categories

**Confidence:** MEDIUM-HIGH — sourced from App Store, slashdot, splittyapp.com, multiple review sites.

---

### 4. Cino — The Payment-Native Innovator

**Market Position:** European startup (raised €3.5M seed in March 2025). Fundamentally different architecture — not a debt tracker, but a real-time shared payment instrument.

#### The Core Innovation

Every other app in this category is a **post-purchase debt tracker**: one person pays, others log what they owe, eventually someone settles. Cino eliminates this model entirely.

**Cino's approach:** A virtual Mastercard linked to a group. When paying at a restaurant, you tap your Cino card via Apple Pay or Google Pay, and each person's bank account is charged their share in real-time. No "I'll pay and you Venmo me" — everyone pays simultaneously.

#### Feature Details

- **Virtual card** that acts as Apple Pay / Google Pay compatible Mastercard
- Fully adjustable split ratios (50/50, 70/30, custom percentages)
- Shared group feed showing all payments transparently
- Automatic expense categorization per transaction
- Groups are flexible — join or leave anytime

#### Why This Matters for HomeOS

Cino proves there's a market for eliminating the debt-collection awkwardness entirely. For HomeOS v2 payment integration, this architecture is worth studying — the "shared household payment card" model could be native to a household app.

**Current limitation:** Requires all participants to have Cino accounts linked to bank accounts. This reduces friction at settlement but increases friction at onboarding. Also EU-centric currently.

**Confidence:** HIGH — sourced from TechCrunch article (March 2025) and Cino's own site.

---

### 5. splitty — Receipt-First for Restaurants

**Market Position:** iOS-only, purpose-built for the restaurant bill splitting use case. Small niche but near-perfect at its specific job.

#### Why It's Worth Studying

splitty's entire UX is built around the receipt photo as the primary input — not a form. This is the opposite of Splitwise's form-first model.

**Flow:**
1. Open app → immediately prompts to take/upload receipt photo
2. OCR reads every line item (30 seconds average reported)
3. Assign items to people by tapping
4. Tax and tip are distributed proportionally based on each person's items
5. App generates individual payment requests — recipients receive a payment link via iMessage (no app install required)

**What's exceptional:**
- No signup required for recipients — they receive a payment link
- Proportional tax/tip (not equal) — fairer for mixed-price items
- Works offline after scanning
- Cites academic research (Gneezy et al.) that equal splitting causes 37% more over-ordering — their itemized-by-default approach is deliberately designed to create fairer splits

**Pricing:** $9.99/year or $24.99 lifetime. 3 free scans.

**Confidence:** HIGH — sourced from splittyapp.com's own detailed comparison.

---

### 6. Honeydue — Couples Finance (Adjacent Category)

**Market Position:** Free couples budgeting app. Not expense-splitting focused but relevant for the household context.

#### Relevant Features for HomeOS

- **Bank account linking** — both partners see real-time balances from linked accounts (20,000+ financial institutions in 5 countries)
- **Granular privacy controls** — each account can be set to "share balance only," "share balance and transactions," or "hide entirely." This privacy model is unique and valuable for household apps
- **Transaction comments** — tap any transaction, leave a comment visible to your partner. Social layer on top of financial data
- **Spending category limits** — set monthly caps per category, notifications when approaching limits
- **Bill reminders** — tracks upcoming bills, sends reminders

**Why Honeydue is relevant:** It proves there's demand for a privacy-first household finance model. Not everyone wants 100% financial transparency with housemates. HomeOS should adopt Honeydue's privacy tiers.

**What Honeydue lacks:** No expense splitting, no receipt scanning, no chores/tasks integration, no group support (couples only), mobile-only.

**Confidence:** HIGH — sourced from NerdWallet, CNBC, Experian reviews.

---

## Part 2: Best-in-Class Synthesis

### What to Steal From Each App

| App | What to Take |
|-----|-------------|
| **Splitwise** | Debt simplification algorithm, running balance display, multi-currency support, group expense ledger model |
| **Tricount** | Zero-friction joining (link-based, no account required), unlimited free tier, offline-first architecture |
| **Settle Up** | Weighted contributions, payer-first UX flow, AI category prediction from description, voice logging concept |
| **Cino** | Real-time shared payment model (for v2), group transaction feed concept |
| **splitty** | Receipt-first UX flow, proportional tax/tip on itemized splits, recipient payment links without app install |
| **Honeydue** | Privacy tiers per account, transaction commenting, bank account linking, spending category limits |

### The Fatal Flaw Every Competitor Has

**None of them are household apps.** They are all event/trip/friend expense trackers that get repurposed for household use. The implications:

- No integration with chores ("I paid for groceries so someone else should do the dishes")
- No integration with shared supplies ("we need milk" → buy it → expense automatically logged)
- No integration with household calendar ("rent due on the 1st" shown in calendar context)
- No integration with maintenance ("I paid the plumber $200" should create both a maintenance record and an expense)
- No household spending analytics ("we spend 23% more on food in December" across all categories)
- No recurring household bill management tied to the actual bills

---

## Part 3: Innovation Opportunities

### What Nobody Does Yet

**1. Expense-to-Chore Parity**
Current apps treat money and tasks as completely separate domains. There's a household economy beyond dollars: if one person always cooks and one person always pays for groceries, the financial balance may show a debt that doesn't reflect actual fairness. HomeOS can model "contribution equity" that includes both financial and labor contributions — a first for the category.

**2. Smart Recurring Bill Detection**
No app automatically detects when a new recurring expense was added (Netflix subscription, gym membership, utilities) and prompts "This looks like a recurring bill — set up monthly tracking?" AI can detect this from receipt description + merchant + amount patterns.

**3. Cross-Feature Triggers**
Expense logged as "Grocery run" → automatically creates or updates the shared shopping list as "recently purchased." Expense logged as "Plumber" → auto-creates a maintenance record. This contextual intelligence is not possible in any single-purpose expense app.

**4. Predictive Monthly Summary**
By mid-month, the app knows spending patterns well enough to predict: "Based on current spending, your household will spend ~$2,340 this month. Utilities are running 15% over last month." No expense splitting app does this.

**5. Proportional Sharing Based on Room Size / Income**
For renters with different-sized rooms, splitting rent equally is often unfair. HomeOS can offer a "proportional share" model where each person's split percentage is set at the household level and applied automatically to all shared expenses.

**6. Receipts From Multiple Sources**
Current apps require a camera photo. HomeOS should accept: camera photo, camera roll image, email forwarded receipt (parsed via server-side processing), or manually emailed PDF. Many digital receipts arrive by email — no app captures these automatically.

**7. Settlement Timing Intelligence**
Smart suggestion: "You and Alex have a combined unsettled balance of $340. You're both online now and you haven't settled in 23 days. Would you like to settle up?" Context-aware nudges, not generic reminders.

**8. Expense Dispute Resolution**
When someone disagrees with an expense ("I wasn't at that dinner"), current apps have no mechanism — you just argue in iMessage. HomeOS can add a lightweight dispute flow: flag expense → add note → other party responds → resolve. This models real household conflict resolution.

**9. Household Financial Health Score**
A single number (updated monthly) representing: settlement frequency, spending fairness, budget adherence, recurring bill health. Gamification hook without being trivial.

**10. Natural Language Expense Entry**
"Log $45 for groceries, split equally" — conversational entry as an alternative to the form. Settle Up has voice integration but it's primitive. A proper NLP layer trained on household expense vocabulary would be genuinely useful.

### AI Capabilities Beyond OCR

**Smart Categorization (MEDIUM difficulty):**
ML models trained on expense descriptions + merchant names achieve 95-99% categorization accuracy. The model improves per-household over time as it learns your household's naming conventions ("WF" = Whole Foods, not a person named Wendy Frances).

**Anomaly Detection (MEDIUM difficulty):**
Flag unusual expenses: "This grocery receipt is 3x your average — want to note what was special about this trip?" or "You've added 3 utility bills this month, usually it's 1." Catches errors before they become disputes.

**Predictive Cash Flow (HIGH difficulty):**
Based on recurring bills, historical patterns, and upcoming events on the shared calendar, project the household's financial position 30-90 days forward. "Based on your patterns, you'll need to settle ~$450 by end of month."

**Receipt Fraud Detection (LOW-MEDIUM difficulty):**
Cross-check amounts, dates, and merchants against prior patterns. Flag: "This receipt date is 2 weeks before the expense was logged" or "This merchant name doesn't match your usual grocery stores."

**Fairness Analysis (MEDIUM difficulty):**
Monthly report: "Over the last 3 months, Alex has paid 67% of shared expenses. Your household average is supposed to be 50/50. This month Alex is owed $234 more than the current balance shows." This surfaces systematic imbalances that short-term settlement cycles hide.

**Smart Split Suggestions (LOW difficulty):**
If Alex always pays for Netflix and it always gets split 50/50 → auto-suggest "Set this as a recurring 50/50 expense?" If groceries always get split 3-ways → remember this. Learn and automate the repetitive decisions.

---

## Part 4: Recommended HomeOS Expense Feature Spec

### Design Principles

1. **Zero-step joining** — household members join via link, no account required to view expenses (account needed to add or settle)
2. **Amount-first UX** — the number is always the primary input, not a form label
3. **Unlimited free tier** — no daily limits, no artificial delays, no friction on core functionality. Monetize on premium AI features, not basic logging
4. **Offline-first** — expenses queue locally and sync when connected
5. **Context-aware** — expenses connect to the household context (chores, supplies, maintenance), not just a ledger

### Expense Entry Flow (Target: Under 15 Seconds)

**Standard flow:**
1. Tap "+" anywhere in the app (persistent FAB)
2. Camera opens immediately (receipt-first) — OR tap "Manual" to enter amount
3. If camera: OCR processes in ~2 seconds, shows detected items/total
4. Confirm or edit amount → auto-suggests description from OCR merchant name
5. Split method appears (default: equal among all household members)
6. Adjust split if needed (drag sliders for custom amounts)
7. One-tap save

**AI enhancements on entry:**
- Category auto-detected from merchant name + description (with confidence shown)
- If recurring pattern detected: "Add as monthly recurring?" prompt
- If amount unusually high: soft flag with note field pre-focused

### Split Types

| Type | Description |
|------|-------------|
| Equal | Default. Split evenly among selected people |
| Weighted | Each person has a household share % (set once, applied always) — for rent-by-room scenarios |
| Custom | Enter exact amounts per person |
| By item | Receipt scanning → assign individual items |
| Proportional | Assign percentages that sum to 100% |

### Balance Display

- Dashboard: Net position summary ("You're owed $234" or "You owe $89")
- Tap to expand: per-person breakdown with transaction history
- Debt simplification: always on by default, toggle off if desired
- Color coding: green = you're owed, red = you owe
- Settlement suggestion: contextual "Settle now" with smart timing

### Receipt Scanning (Free Feature — Not Paywalled)

This is HomeOS's first competitive moat over Splitwise. Receipt scanning must be free.

**Implementation spec:**
- Accept: live camera, camera roll, email forwarded receipt (future)
- OCR engine: Mindee or Veryfi API (both achieve 95-99% item-level accuracy)
- Output: list of line items with prices, detected total, tax, tip
- Item assignment: tap item → tap person's avatar to assign
- Unassigned items: default to equal split among all
- Tax/tip: distributed proportionally by assigned item totals (not equally)
- Confidence scoring: low-confidence extractions highlighted for manual review
- Result: saveable as expense with photo attached

### Settlement Flow

1. "Settle up" button visible on any balance view
2. Shows suggested settlement: amount + who to pay
3. Records settlement within HomeOS (balance resets)
4. Payment happens externally — app shows deep links to Venmo, PayPal, bank transfer
5. Both parties notified when settlement is marked

### Recurring Bills

- Create recurring expense: amount + description + frequency + split
- Bills shown on household calendar (integration with calendar module)
- Reminder: push notification 2 days before expected due date
- Auto-detect from patterns: "You've added this exact expense 3 months in a row — set it as recurring?"

### Notifications Strategy

Replace Splitwise's email-only reminders with:

- **Push on add:** Instant notification when someone adds an expense including you
- **Push on settle:** Confirmation when balance is cleared
- **Smart settlement nudge:** "You and [name] have $[amount] unsettled for [X] days"
- **Monthly summary:** Household spending summary on the 1st of each month
- **Anomaly alert:** "This expense is 3x your average for this category"
- **Recurring bill reminder:** 2 days before expected recurring expense

All notifications are configurable. Default opt-in for expenses involving the user, opt-out for summaries.

### Dispute Flow

1. Long-press any expense → "I have a question about this"
2. Add a note visible to all expense participants
3. Other participant(s) see the flag and can respond
4. Mark as "Resolved" when settled
5. Unresolved flags shown on expense with visual indicator

### Privacy Model (Honeydue-inspired)

At the household level, set visibility per expense type:
- **Public:** All household members see amount and description
- **Amount-only:** Members see "paid $[X]" without description
- **Private:** Only payer and split participants see the expense

Default: Public. This is a differentiator over Splitwise which has no privacy model for household contexts.

### Cross-Feature Integration (HomeOS Unique)

- Expense tagged "Groceries" → prompts to mark shopping list items as purchased
- Expense tagged "Maintenance" → prompts to create or update a maintenance record
- Recurring expense due date → appears on shared household calendar
- Chores completed → optionally log time/effort alongside financial contributions for equity score

### Pricing for Expense Features

**Free (unlimited):**
- Unlimited expense logging
- Receipt scanning (basic OCR)
- Debt simplification
- All split types
- Settlement tracking
- Push notifications
- Offline mode
- Export to CSV

**HomeOS Pro (paid tier):**
- Advanced AI: anomaly detection, predictive spending
- Item-level receipt scanning with AI correction
- Email receipt ingestion
- Spending analytics and charts
- Household financial health score
- Fairness analysis reports
- Multi-currency real-time conversion

The strategic decision is deliberate: **basic expense splitting must be free and unlimited** because this is the feature that acquires users. Splitwise has vacated this position. HomeOS should own it.

---

## Sources

- [Splitwise Reviews 2026 - Product Hunt](https://www.producthunt.com/products/splitwise/reviews)
- [Best Bill Splitting Apps 2026 - splitty](https://splittyapp.com/learn/best-bill-splitting-apps/)
- [Splitwise Free Limits - splitty](https://splittyapp.com/learn/splitwise-free-limits/)
- [Settler vs Splitwise vs Tricount 2025 - getsettler.com](https://getsettler.com/blog/settler-vs-splitwise-vs-tricount)
- [Is Splitwise Pro Worth It - SplitterUp](https://www.splitterup.app/blog/splitwise-pro-worth-it)
- [Splitwise Trustpilot Reviews](https://www.trustpilot.com/review/splitwise.com)
- [Algorithm Behind Splitwise Debt Simplification - Medium](https://medium.com/@mithunmk93/algorithm-behind-splitwises-debt-simplification-feature-8ac485e97688)
- [Splitwise Debt Simplification Official FAQ](https://feedback.splitwise.com/knowledgebase/articles/107220-what-does-the-simplify-debts-setting-do)
- [Tricount vs Splitwise - getcino.com](https://www.getcino.com/post/tricount-vs-splitwise)
- [Splitwise vs Tricount - tricount.com](https://tricount.com/splitwise-vs-tricount)
- [Tricount Offline Tracking Feature](https://tricount.com/expense-tracker-features/offline-expense-tracking)
- [Settle Up App Store](https://apps.apple.com/us/app/settle-up-group-expenses/id737534985)
- [Settle Up - settleup.io](https://settleup.io/)
- [Cino TechCrunch Seed Round - March 2025](https://techcrunch.com/2025/03/04/cino-has-cracked-bill-splitting-at-the-moment-of-payment-raises-seed/)
- [Cino - The Next Web](https://thenextweb.com/news/cino-app-splits-bills-at-payment-raises-funding)
- [Splitwise UX Critique - Aubergine Solutions](https://www.aubergine.co/insights/the-art-of-spending-helping-splitwise-split-right)
- [Honeydue App Review - NerdWallet](https://www.nerdwallet.com/finance/learn/honeydue-app-review)
- [Honeydue App Review - CNBC](https://www.cnbc.com/select/honeydue-budgeting-app-review/)
- [AI Expense Categorization Tools 2025 - lucid.now](https://www.lucid.now/blog/top-7-ai-tools-for-expense-categorization-2025/)
- [Best Receipt Parser APIs 2025 - Eden AI](https://www.edenai.co/post/best-receipt-parser-apis)
- [Splitwise paywall backlash - Twitter/X](https://x.com/ArtemR/status/1740150704268849568)
- [Top Splitwise Alternatives 2026 - SquadTrip](https://squadtrip.com/guides/top-splitwise-alternatives-for-group-travel-expenses/)
- [7 Best Expense Splitting Apps 2026 - SplitterUp](https://www.splitterup.app/blog/best-expense-splitting-apps)
