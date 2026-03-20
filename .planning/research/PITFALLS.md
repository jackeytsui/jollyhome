# Pitfalls Research

**Domain:** Household management / shared living app (all-in-one, AI-first, cross-platform)
**Researched:** 2026-03-19
**Confidence:** MEDIUM-HIGH (web search + domain analysis; specific to this app's ambition level)

---

## Critical Pitfalls

### Pitfall 1: The Whole-Household Adoption Blocker

**What goes wrong:**
The app delivers zero value to a user who joins alone. Expense splitting, chore rotation, shared calendars — none of these work until every housemate is on the platform. The founding member installs it, invites housemates via text, and then waits. One housemate never creates an account. The app sits unused. The household never reaches critical mass and churns.

**Why it happens:**
Building the app as a closed system where all features require a complete household forces a collective action problem. Every new feature added to the "requires all members" category increases the barrier. Developers focus on what the product does when fully adopted, not on the path to full adoption.

**How to avoid:**
Design every feature to provide value to a solo user first, then compound value when others join. Expense tracking should work solo (log expenses, see what you're owed). Shopping lists should work solo (personal list that becomes shared). Make each feature a "one person finds it useful → invites others organically" funnel, not a "must invite first" gate. Support guest/non-app-user participation via share links or email summaries so non-adopters can participate passively before committing.

**Warning signs:**
- Features require 2+ active members to function at all
- Onboarding flow starts with "invite your housemates" before showing any value
- Demo or prototype only works with a full test household
- First-time user experience is empty screens with placeholder text

**Phase to address:**
Phase 1 (MVP/Foundation) — the solo-to-group adoption path must be designed in before any feature is built, not retrofitted later.

---

### Pitfall 2: Financial Calculation Bugs That Destroy Trust

**What goes wrong:**
Rounding errors, floating point arithmetic, or inconsistent debt simplification algorithms produce situations where the app shows $0.01 discrepancies in balances that never resolve. Users notice. Money apps live and die on trust. A single "the app is wrong" moment causes permanent abandonment and — in a shared household — social friction ("why does it say I owe $0.03?").

**Why it happens:**
Developers use floating point (JavaScript `number`, Python `float`) for currency, then layer multiple splits and conversions on top. Each operation accumulates rounding error. When simplifying a debt graph with 4+ people, naive algorithms produce different results depending on traversal order, creating non-deterministic balances.

**How to avoid:**
- Store all currency as integer cents (or smallest currency unit), never floats
- Use a deterministic debt graph simplification algorithm (minimum-edge cover, not greedy) with a fixed traversal order
- Assign rounding remainders explicitly: when $10.00 splits 3 ways, assign the extra $0.01 to the first person alphabetically — document this rule and display it in the UI
- Use banker's rounding (round-half-to-even) for intermediate calculations
- Audit trail: every balance must be reconstructable from the raw expense log
- Write property-based tests for splitting: the sum of all splits must always equal the original expense

**Warning signs:**
- Any currency stored as a decimal/float type
- Balance doesn't reconcile when you sum all expenses from scratch
- "Settle up" amounts don't clear balances to exactly $0.00
- Different calculation paths yield different totals for the same scenario

**Phase to address:**
Phase 1 (expense core data model). This cannot be fixed after data is in production without a migration.

---

### Pitfall 3: Multi-Household Data Isolation Failure

**What goes wrong:**
A bug in a query returns data from Household A to a user in Household B. This is catastrophic: it exposes private financial data, breaks trust, and creates legal liability. It happens more often than expected in apps that store all households in shared tables.

**Why it happens:**
Early development uses a shared schema with a `household_id` column for isolation. Every query must include `WHERE household_id = ?`. A single missed WHERE clause — in a complex JOIN, an admin endpoint, or a background job — becomes a data leak. As complexity grows, more queries are written, and developer attention drifts.

**How to avoid:**
Use PostgreSQL Row-Level Security (RLS) to enforce household isolation at the database engine level, not application code. Set `household_id` as the RLS policy key so every query automatically filters by the authenticated household — a missed WHERE clause cannot produce cross-household results. Test explicitly: create two households with similar data, verify no query returns cross-household results. Beware connection pool contamination and shared cache poisoning — RLS can fail silently in pooled connections if the session context is not reset correctly.

**Warning signs:**
- Household isolation enforced only in application WHERE clauses
- Any endpoint that doesn't validate `household_id` against the authenticated user's household membership
- Background jobs or data export functions without household scoping
- Admin tools that bypass standard query paths

**Phase to address:**
Phase 1 (authentication and data model). RLS policies must be established with the schema — they cannot be bolted on later without auditing every existing query.

---

### Pitfall 4: AI as a Gimmick, Not a Workhorse

**What goes wrong:**
AI features ship as demos that impress in controlled conditions but fail in production. Receipt OCR reads clearly-lit, well-cropped receipts at 95%+ accuracy — but fails on crumpled paper, low light, handwritten totals, and non-English receipts. AI meal planning suggestions are generic. Chore optimization feels arbitrary to users who don't understand how it works. Users stop using AI features after the first failure and never return.

**Why it happens:**
Teams prototype AI features with best-case inputs and never test edge cases. They integrate an AI API, see it work on demo data, and ship. Production inputs are messier. Worse, AI features are often bolted on to existing flows rather than redesigned around AI capabilities. The positioning as "AI-first" then feels hollow.

**How to avoid:**
- For receipt OCR: implement confidence scoring. If confidence < threshold, show the extracted fields with edit UI rather than silently accepting wrong data. Use a human-in-the-loop fallback. Test with: crumpled receipts, low-contrast lighting, handwritten tip lines, non-itemized receipts, multi-currency receipts.
- For AI suggestions: ground suggestions in household-specific data (their actual spending, their actual chore history) not generic patterns. An AI that says "Based on last month, you're overspending on groceries by $80" is useful. An AI that says "Try cooking more at home!" is annoying.
- For all AI features: show the reasoning. "I'm suggesting Thai food because 3 of 4 housemates liked it and it's within budget" is trusted. Unexplained suggestions are ignored.
- Budget token costs before shipping: unoptimized LLM calls can cost 10x more than necessary. Set a cost ceiling per user per month and design features to stay within it.

**Warning signs:**
- AI features only tested with clean/ideal inputs
- No confidence score or fallback for AI-extracted data
- AI suggestions have no visible reasoning
- No cost monitoring on LLM API calls
- AI feature uses generic prompts with no household-specific context

**Phase to address:**
Phase 2 (AI integration milestone). Each AI feature needs an explicit "failure mode" design before implementation.

---

### Pitfall 5: Feature Overload Kills the Core Value Proposition

**What goes wrong:**
The app ships expense splitting, chores, calendar, meal planning, shopping lists, maintenance requests, guest management, and house rules simultaneously. The first-time experience is overwhelming. Users can't find the one thing they opened the app to do. App stores reviews say "too complicated." The core value — replacing multiple apps — is undermined because using one complicated app is worse than using three simple ones.

**Why it happens:**
This is an "all-in-one" app, so the roadmap naturally wants to build everything. Each feature feels essential because competitors own each one. Stakeholders argue that shipping without feature X makes the app incomplete. The result is a wide, shallow product instead of a deep, compelling one.

**How to avoid:**
Ship one feature at a time to real users, in dependency order. Expense splitting is feature #1 because money is the #1 friction point in shared living. Make it so good that users actively recruit their housemates. Only add the next feature (chores) once expense splitting has proved its value with real users. Never ship a feature so early that it's half-baked — a bad chore tracker is worse than no chore tracker because it trains users to ignore that part of the app. Treat each feature module as a product within the product: it must clear a "better than the best single-purpose app" bar before shipping.

**Warning signs:**
- MVP includes more than 2-3 features
- Any feature described as "basic version we'll improve later" before user validation
- Onboarding requires users to configure 5+ feature areas before they see value
- Features that work in isolation but don't integrate with each other

**Phase to address:**
Phase 1 planning and every subsequent phase gate. Each phase should ship one feature module to production, validate it, then proceed.

---

### Pitfall 6: Real-Time Sync Without Conflict Resolution

**What goes wrong:**
Two housemates edit the chore list at the same time on separate devices. One adds a task, the other completes a task. The app's sync resolves the conflict by using last-write-wins — one edit is silently discarded. Or worse: both versions persist, creating duplicates. For financial data, this is more serious: concurrent expense edits can result in incorrect balances.

**Why it happens:**
Real-time sync is treated as a "we'll add WebSockets" problem, not an "how do we handle conflicting state" problem. Last-write-wins is the default because it's simple to implement. Conflict resolution is assumed to be rare ("they won't edit at the same time") and not designed for.

**How to avoid:**
For financial data (expenses, balances): treat the expense log as an append-only ledger. Never update an expense in-place — mark it as deleted and create a corrected version. This makes the balance always reconstructable and eliminates write conflicts on individual records.

For non-financial collaborative data (chore lists, shopping lists): use optimistic updates with server reconciliation. Implement either CRDTs (for true conflict-free merging) or an event-sourced model where operations (add item, check item) are appended and replayed rather than overwriting state.

**Warning signs:**
- Shared mutable records (expenses, tasks) have no version/sequence identifier
- Sync logic uses simple "GET then PUT" without optimistic locking
- No test scenario for two devices editing the same record simultaneously
- Settling a debt deletes or modifies expense records rather than creating a settlement record

**Phase to address:**
Phase 1 (data model and API design). The append-only ledger pattern for financial data must be the foundation — migrating a mutable model to immutable later is extremely painful.

---

### Pitfall 7: Push Notification Overload Destroys Retention

**What goes wrong:**
The app sends a notification every time a housemate completes a chore, adds an expense, adds a shopping list item, or changes the calendar. Each event feels notification-worthy to the developer who built it. Within a week, a 4-person household generates dozens of notifications per day. Users disable all notifications. Now they miss the ones that actually matter (you owe $120, rent is due tomorrow). Retention collapses.

**Why it happens:**
Every feature team adds "notify all members" without a notification strategy. 64% of users will delete an app if they receive 5+ notifications per week they didn't want. The notifications feel important from the sender's perspective but are interruptions from the receiver's perspective.

**How to avoid:**
Define a notification taxonomy before any notifications are built: (1) urgent/financial (you owe money, bill due) — always on by default, (2) actionable (chore assigned to you, shopping item assigned to you) — on by default, (3) informational (housemate completed a chore, item added to list) — off by default. Make all categories user-configurable with sane defaults. Batch non-urgent notifications into a daily digest option. Never send a notification that doesn't require action from the specific recipient.

**Warning signs:**
- Notification code added per-feature without a central notification system
- All notifications have the same priority level
- No per-user notification preference settings at launch
- "Notify all members" is the default in the data model

**Phase to address:**
Before the first notification is implemented (Phase 1 or Phase 2). Notification architecture is cheapest to design upfront and expensive to redesign after features rely on it.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Float/decimal for currency amounts | Simpler code | Rounding errors in balances; requires full data migration to fix | Never |
| household_id WHERE clause only (no RLS) | Faster to implement | One missed clause = data breach across households | Only if single-household beta with no sensitive data |
| Mutable expense records (UPDATE in place) | Simpler data model | No audit trail; concurrent edits cause data loss; impossible to reconstruct balance history | Never for financial data |
| Last-write-wins for sync | Simple to implement | Silent data loss in concurrent edits; user trust issues | Only for non-critical preferences (not tasks, not expenses) |
| Monolithic notifications (all-or-nothing) | Fast to build | Users disable all or are overwhelmed; no recovery path | Never |
| AI features without fallback UI | Simpler flow | Silent failures in production; data loss when AI extracts wrong values | Never for data-entry flows |
| Bake in household size assumptions (e.g., max 6 members) | Simplifies queries | Property management v2 requires groups of 20+; hard to remove limits | Only if explicitly documented and scheduled for removal |
| Single LLM prompt for all AI features | Fast prototype | Cost uncontrolled at scale; no A/B improvement path; hard to tune | Only in prototype; never in production |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Receipt OCR (Vision API / Veryfi) | Treat extracted data as ground truth; auto-fill without user review | Show extracted fields with confidence indicators; require user confirmation for low-confidence fields; handwritten totals and tips are weak spots — always editable |
| Push notifications (FCM/APNs) | Send directly from app server without a notification service layer | Use a notification service (Expo notifications, OneSignal, or custom queue) with delivery receipts, retry logic, and per-user preference filtering before delivery |
| LLM API (OpenAI/Anthropic) | Unbounded token usage per request; no cost tracking | Set max_tokens per call; track cost per user per month; implement graceful degradation if monthly budget exceeded |
| Payment tracking (no Stripe yet) | Schema designed only for tracking — adding payment processing later requires redesign | Design payment schema now to accommodate real payments later: `amount`, `currency`, `status`, `external_payment_id` (nullable) — nullable fields allow v1 tracking, v2 payment processing |
| Calendar sync (Google/Apple calendar) | Two-way sync without conflict resolution strategy | Start with one-way export (share link / .ics export) before building two-way sync; two-way sync is a separate feature milestone, not a default |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recalculating all balances on every page load | Slow household dashboard as expense history grows | Maintain a running balance table updated incrementally; recalculate only when explicitly requested | ~200 expenses per household |
| N+1 queries on household activity feed | Feed load time increases linearly with member count | Eager-load member data; use aggregate queries for activity feed | 4+ members, 50+ events |
| Loading all household data on app open | Slow initial load; large bundle on mobile | Paginate activity feeds; lazy-load non-primary feature data; critical path is expenses/balances only | 6+ months of household history |
| AI call per user interaction | Latency spikes; cost spikes | Cache AI suggestions; batch requests; use cheaper models for low-stakes suggestions (meal ideas) vs. expensive models for high-stakes analysis (spending patterns) | Day 1 if not designed for |
| Push notification fan-out on large households | Notification delivery lags; rate limit errors | Queue notifications asynchronously; use notification service with delivery batching | 10+ member households (property management use case) |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Household invite links that don't expire | Anyone who finds an old link can join a household permanently | Expire invite links after 72 hours; support revocable single-use links; require existing member approval for join requests |
| Expense data visible to former members | Ex-housemate can see financial history after leaving | Implement membership end dates; past-member access to shared data must be explicitly scoped (can see expenses they were part of, not new expenses) |
| Receipt images stored with predictable URLs | Anyone with the URL can view a household's receipts | Store receipt images with signed URLs (expire after access window); never use sequential IDs or guessable paths |
| LLM prompt injection via household data | Malicious user enters expense description designed to manipulate AI suggestions | Sanitize all user-generated text before including in LLM prompts; treat household data as untrusted input, not trusted context |
| No rate limiting on expense creation | Malicious or buggy client creates thousands of expenses | Rate limit all write operations per user per household; alert on anomalous creation rates |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Requiring full account creation before showing value | High drop-off in onboarding; users never reach the "aha moment" | Allow solo expense logging with account creation deferred; show value first, require commitment second |
| Chore completion requiring a photo or proof | Friction causes chore tracking to be abandoned entirely | Make completion one tap; make photo optional/bonus feature; avoid gamification that feels punitive |
| Debt settlement that requires both parties to confirm | Settlements stall; balances never clear; frustration with the app | Allow one-party settlement recording with notification to the other party; "dispute" is the exception, not the default flow |
| Showing gross totals instead of net balances | Users feel overwhelmed by large numbers ("you owe $847 total") | Always show net balance; show gross totals only in a drill-down history view |
| Equal split as the only visible default | Causes friction for households with unequal income or expenses | Show equal split as default but make percentage, exact amount, and share-based splitting equally accessible in the same UI |
| Feature tabs for every module visible immediately | Navigation overwhelm; users can't find core features | Progressive disclosure: show only active features; activate meal planning, maintenance, etc. as the household opts in |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Expense splitting:** The split math works in unit tests — verify it works with real floating-point inputs in all supported split modes (equal, by percent, by exact amount, by shares) AND that the sum of all splits equals the original amount to the cent
- [ ] **Balance display:** Shows current balance — verify it matches a from-scratch recalculation from the raw expense log; verify it handles settlement records correctly
- [ ] **Receipt OCR:** Extracts line items from a clean receipt — verify with crumpled, low-light, sideways, handwritten-tip, and non-itemized receipts; verify user can override any extracted field
- [ ] **Household invite:** User can invite a housemate — verify invite link expires; verify invite can be revoked; verify existing member is notified when someone joins
- [ ] **Push notifications:** Notification sends successfully — verify it respects per-user preferences; verify it doesn't send to members who have disabled that notification category; verify it handles iOS permission denial gracefully
- [ ] **Member departure:** Housemate can leave a household — verify their past expenses are preserved and attributed correctly; verify their future access is revoked; verify remaining members can still settle debts involving them
- [ ] **AI receipt scan:** AI extracts data — verify the user confirmation step exists and is not skippable; verify wrong extractions don't silently corrupt data
- [ ] **Debt simplification:** App shows simplified settlement path — verify the algorithm is deterministic (same inputs always produce same outputs); verify simplified path settles all balances to $0.00

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Float currency discovered in production | HIGH | Audit all currency calculations; write migration to convert to integer cents; recalculate all balances from raw expenses; notify users of any balance corrections |
| Cross-household data leak discovered | CRITICAL | Immediate: rotate all session tokens, audit logs for scope of leak; notify affected users per jurisdiction requirements (GDPR/CCPA); add RLS as emergency patch; forensic review of all API endpoints |
| Mutable expense records (no audit trail) | HIGH | Freeze current state as a snapshot; redesign to append-only going forward; historical data is irrecoverable — document limitations to users |
| Notification overload causing mass opt-out | MEDIUM | Launch notification preference center immediately; do not re-enable notifications for users who have opted out; send one re-permission campaign maximum |
| AI feature trust collapse (bad extractions) | MEDIUM | Temporarily disable AI auto-fill; revert to manual entry; ship improved confidence UI; communicate changes to users; trust recovery takes multiple positive experiences |
| Feature overload causing abandonment | MEDIUM | Remove or hide non-core features behind an "opt in" toggle; simplify primary navigation to 2-3 items; run user interviews to identify what the household actually uses |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Whole-household adoption blocker | Phase 1 — before any feature is built | Solo user can use expense tracking end-to-end without inviting anyone |
| Financial calculation bugs | Phase 1 — data model definition | Property-based tests prove sum of splits = original; balance reconstructable from log |
| Multi-household data isolation failure | Phase 1 — schema and auth setup | Two test households cannot see each other's data via any API endpoint |
| Real-time sync without conflict resolution | Phase 1 — API design | Append-only ledger for expenses verified; concurrent edit test passes without data loss |
| Push notification overload | Phase 1/2 — before first notification shipped | Notification taxonomy documented; per-user preferences exist before first notification type |
| AI as gimmick | Phase 2 — AI feature milestone | Each AI feature has a defined failure mode and fallback UI before implementation begins |
| Feature overload | Every phase gate | Each phase ships one feature module; no feature ships without passing a "better than best single-purpose app" bar |
| LLM cost overrun | Phase 2 — AI integration | Cost-per-user ceiling defined and enforced before LLM features reach production |
| Payment schema inflexibility | Phase 1 — data model | Payment schema supports nullable `external_payment_id` for v2 upgrade path |
| Former member data access | Phase 1 — membership model | Membership has start/end dates; access control tests for ex-members pass |

---

## Sources

- [Developing Multi-Tenant Applications: Challenges and Best Practices](https://medium.com/@sohail_saifi/developing-multi-tenant-applications-challenges-and-best-practices-2cec1fc22e1f) — MEDIUM confidence
- [Multi-Tenant Leakage: When "Row-Level Security" Fails in SaaS](https://medium.com/@instatunnel/multi-tenant-leakage-when-row-level-security-fails-in-saas-da25f40c788c) — MEDIUM confidence (Jan 2026)
- [Multi-Tenant Data Isolation with PostgreSQL Row Level Security](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/) — HIGH confidence (AWS official)
- [Bound to Round: 8 Tips for Dealing with Hanging Pennies](https://shopify.engineering/eight-tips-for-hanging-pennies) — HIGH confidence (Shopify Engineering)
- [Building Production-Ready LLM Apps: Architecture, Pitfalls, and Best Practices](https://dev.to/eva_clari_289d85ecc68da48/building-production-ready-llm-apps-architecture-pitfalls-and-best-practices-cpo) — MEDIUM confidence
- [The Last Mile of LLMs: Why Most AI Applications Fail After the Demo](https://medium.com/@howtodoml/the-last-mile-of-llms-why-most-ai-applications-fail-after-the-demo-fa718e8570a0) — MEDIUM confidence (Dec 2025)
- [App Push Notification Best Practices for 2026](https://appbot.co/blog/app-push-notifications-2026-best-practices/) — MEDIUM confidence
- [Design Guidelines For Better Notifications UX](https://www.smashingmagazine.com/2025/07/design-guidelines-better-notifications-ux/) — HIGH confidence (Smashing Magazine, July 2025)
- [Invoice OCR Benchmark 2025: Veryfi vs. Google Cloud Vision vs. Mindee](https://www.veryfi.com/ai-insights/invoice-ocr-competitors-veryfi/) — MEDIUM confidence (vendor-published)
- [Offline-First Done Right: Sync Patterns for Real-World Mobile Networks](https://developersvoice.com/blog/mobile/offline-first-sync-patterns/) — MEDIUM confidence
- [Feature Creep: Why Your Product Keeps Getting Worse](https://userjot.com/blog/feature-creep) — MEDIUM confidence
- [UX Case Study: CoHabit (A Roommate Mobile App)](https://medium.com/@touxlor7/ux-case-study-cohabit-a-roommate-mobile-app-498367258d41) — MEDIUM confidence (May 2025)
- SplitPro open-source codebase (expense-as-source-of-truth pattern) — HIGH confidence (verifiable in code)

---
*Pitfalls research for: Household management / shared living app (HomeOS)*
*Researched: 2026-03-19*
