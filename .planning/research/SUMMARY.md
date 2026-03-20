# Project Research Summary

**Project:** HomeOS — Household Operating System
**Domain:** Cross-platform household management app with deep AI integration
**Researched:** 2026-03-19
**Confidence:** MEDIUM-HIGH

## Executive Summary

HomeOS is an all-in-one household management platform targeting the gap in a fragmented market: every competitor (Splitwise, OurHome, Cozi, Flatastic) either goes deep on one pillar or shallow across many, and none integrate AI meaningfully. The recommended approach is a universal Expo app (SDK 53 + Expo Router v5) backed by Supabase, with a tRPC API layer and OpenAI-powered AI features delivered through Supabase Edge Functions. This stack is purpose-fit: Supabase's relational model handles the expense-splitting data correctly, Row-Level Security enforces household data isolation without application code, and Expo Router v5 covers iOS, Android, and web from a single codebase — eliminating the mobile/web split that would double maintenance cost.

The biggest risk is not technical — it is product sequencing. Research identified two existential failure modes: (1) the whole-household adoption blocker, where the app delivers zero value until every housemate installs it, and (2) feature overload, where shipping all five pillars simultaneously produces a wide, shallow product that loses to three simple apps. The correct mitigation is a strict dependency-ordered build: Auth/Household foundation first, then Expenses (the highest-friction shared-living problem), then Chores + Calendar together (they share scheduling dependencies), then Meals + Supplies, then AI as a cross-cutting layer once the data exists to make it useful. Each phase must validate with real users before the next begins.

The secondary risk is data integrity. Financial bugs destroy trust permanently. Currency must be stored as integer cents, expense records must be append-only (never mutated in place), and debt simplification must be deterministic. These decisions must be made in the data model before any expense is written — retrofitting them on live data is extremely costly. RLS must be enabled on every table from day one, not bolted on after the schema is established.

---

## Key Findings

### Recommended Stack

The recommended stack centers on Expo SDK 53 + Supabase + tRPC + OpenAI. Expo SDK 53 ships React Native 0.79 with the New Architecture enabled by default, and Expo Router v5 provides SSR, React Server Components, and file-based routing for iOS, Android, and web from one codebase. Supabase provides Postgres + Auth + Realtime + Storage + Edge Functions + pgvector in a single platform — the relational model is the correct fit for expense splitting, and pgvector covers future AI semantic search. tRPC v11 delivers end-to-end TypeScript type safety without codegen. Zod v4 validates all API inputs and AI structured outputs, at 14x faster parsing than v3. OpenAI GPT-4o handles receipt OCR via vision natively; gpt-4o-mini handles cheaper suggestions. The Vercel AI SDK v4 resolves React Native's streaming limitation using `expo/fetch`.

**Core technologies:**
- Expo SDK 53 + React Native 0.79: Universal app framework — New Architecture default, single codebase for iOS/Android/web
- Expo Router v5: File-based routing with SSR — replaces a separate Next.js web app
- Supabase: Backend-as-a-Service — Postgres + Auth + Realtime + RLS + Storage + Edge Functions in one platform
- tRPC v11: Type-safe API layer — end-to-end TypeScript without schema files or codegen
- OpenAI GPT-4o / gpt-4o-mini: AI features — vision for receipt OCR, structured outputs for chore/meal suggestions
- Vercel AI SDK v4: AI streaming in Expo — uses `expo/fetch` for WinterCG-compliant streaming
- NativeWind v4: Tailwind utility classes across native and web — unified styling mental model
- TanStack Query v5: Server state management — caching, optimistic updates, background refetch
- Zustand v5: Client state (auth, onboarding, UI toggles) — not for server data
- Zod v4: Schema validation — tRPC inputs, AI structured output JSON

**Version compatibility note:** NativeWind v4 requires New Architecture (SDK 53 default). tRPC v11 major versions must match on client and server. Do not mix Expo SDK and React Native versions.

### Expected Features

The market gap is clear: no competitor combines expense splitting, chore management, shared calendar, meal planning, and supply tracking with AI depth. Splitwise users are churning over free-tier restrictions. OurHome has reliability complaints. Flatastic covers the most ground but rates 3.76/5.

**Must have (table stakes):**
- Household creation + member invite — nothing works solo; must be frictionless deep-link flow
- Expense tracking (manual entry, equal/custom split, balance view) — money is the #1 shared-living friction
- Running balance + debt simplification — users need "who owes who" at a glance
- Chore management (assign, recurring, completion, notifications) — second-biggest friction point
- Shared shopping list with real-time sync — used daily; low complexity
- Shared household calendar (per-member color coding, recurring events) — prerequisite for AI chore rotation
- Push notifications (chore due, expense added, balance change) — retention dependency
- AI receipt OCR — first AI moment; demonstrates differentiation thesis at first expense entry

**Should have (competitive, add post-validation):**
- Meal planning + grocery list integration — activate when shopping list engagement is high
- AI chore rotation (fairness optimization) — activate when chore completion rates show fairness complaints
- Spending pattern insights — meaningful only after 30 days of data
- Settlement deep-links (Venmo/Cash App with pre-filled amounts) — add when settlement friction appears in support
- House rules documentation — add when "how do I communicate rules" appears in feedback
- Maintenance request tracking — photo + status + resolution date for renters

**Defer (v2+):**
- AI meal planning (personalized, learns preferences) — requires meal + preference data history
- AI low-stock prediction — requires months of supply tracking history
- Shared space scheduling — valuable for 4+ person households; niche enough to defer
- Household health score / gamification dashboard — polish layer, not core value
- In-app payment processing — high compliance cost; validate balance tracking demand first
- Property management interface — completely separate product and UX

**Anti-features to explicitly avoid:**
- Real-time location tracking ("who's home") — surveillance anxiety, trust destruction
- Chore penalties and late fees — creates resentment, not accountability
- "Rate your roommate" reviews — weaponized in shared living context
- IoT/smart home integration — hardware dependency, far outside core scope

### Architecture Approach

The architecture uses a layered monorepo: Expo mobile app and Next.js web app as separate deployables in `apps/`, sharing backend types and business logic via `packages/db` and `packages/shared`. Supabase serves as the entire backend layer — PostgREST auto-generates the REST API, RLS enforces household isolation at the database engine level, Realtime channels push Postgres change events to clients, and Edge Functions handle async AI processing and notification dispatch. Business logic (balance calculation, debt simplification, chore rotation algorithms) lives in `packages/shared` — not in UI components and not in Edge Functions — so it is unit-testable and reusable across mobile and web. The notification system is event-driven via a `notifications_queue` table, decoupling notification logic from domain logic.

**Major components:**
1. Mobile App (Expo) — primary housemate interface; camera for OCR; push notification receipt
2. Supabase (PostgREST + RLS + Realtime + Storage + Edge Functions) — entire backend layer; Auth with custom JWT claims carries `household_id` for automatic tenant isolation
3. Edge Functions (Deno) — async I/O only: call AI APIs, write results to DB, dispatch notifications; business logic stays in `packages/shared`
4. AI Engine (cross-domain) — receipt parsing, spending pattern analysis, chore fairness optimization, meal suggestions; consumes domain data, writes suggestions to a dedicated `ai_suggestions` table
5. Notification Dispatch — event-driven queue pattern; push tokens stored in Supabase; routes via Expo Push Service to FCM/APNs
6. Domain Modules (Expenses, Chores, Meals, Calendar, Supplies, Maintenance) — bounded by `household_id`; communicate through DB relationships, not API calls to each other

**Key patterns:**
- Household-as-Tenant via RLS: every table has `household_id`; policies filter automatically — no application WHERE clauses needed for isolation
- Event-driven notifications via `notifications_queue` table: domain events insert queue records; DB webhook fires Edge Function; decoupled and durable
- Async OCR pipeline with optimistic UI: image uploads immediately; form shows "extracting..."; Realtime delivers AI results to fill fields; user always in control
- Append-only expense ledger: never UPDATE expense records; balance computed on read from raw log; debt simplification graph computed on-demand, never stored

### Critical Pitfalls

1. **Whole-household adoption blocker** — Design every feature to provide solo value first. Expense tracking must work for one person before an invite is sent. Guest/non-app-user participation via share links enables passive adoption before commitment. Address in Phase 1, before any feature is built.

2. **Financial calculation bugs** — Store all currency as integer cents, never floats. Use an append-only ledger — never UPDATE expense records in place. Debt simplification algorithm must be deterministic (fixed traversal order). Write property-based tests: sum of all splits must equal original expense. This cannot be fixed after data is in production without a painful migration.

3. **Multi-household data isolation failure** — Enable RLS on every table from day one with `household_id` as the policy key. Application code never filters by household — Postgres enforces it. Test explicitly: create two households, verify no API endpoint returns cross-household data. One missed WHERE clause without RLS = data breach.

4. **AI as a gimmick** — Test OCR with crumpled, low-light, handwritten, and non-itemized receipts, not just clean demos. Implement confidence scoring with user confirmation for low-confidence extractions. Ground AI suggestions in household-specific data. Set a cost ceiling per user per month before any LLM feature reaches production.

5. **Push notification overload** — Define a notification taxonomy before building any notification: urgent/financial (always on), actionable (on by default), informational (off by default). Make all categories user-configurable. Notification architecture is cheapest to design upfront and expensive to redesign after features depend on it.

---

## Implications for Roadmap

Based on combined research, the natural dependency order of domain modules dictates a 5-phase structure. This is not arbitrary — Phase 1 pitfalls (currency data model, RLS, append-only ledger) cannot be fixed after data exists. AI features in Phase 4 need real data from Phases 2-3 to be useful. Notifications in Phase 3 are easier to wire when all event sources exist.

### Phase 1: Foundation + Expense Core

**Rationale:** Auth, household creation, and RLS must exist before any data can be written securely. Expenses is the highest-friction shared-living problem and the primary validation target for the "one app replaces Splitwise" thesis. The data model decisions made here (integer cents, append-only ledger, RLS) cannot be changed after production data exists.

**Delivers:** Working household creation + invite flow, end-to-end expense tracking with balance view and debt simplification, solo-value UX that works before housemates join, notification taxonomy and preference system scaffolded.

**Addresses:** Household + member invite, expense tracking (manual), running balance + debt simplification (P1 features from FEATURES.md)

**Avoids:** Whole-household adoption blocker (solo-first design), financial calculation bugs (integer cents + append-only ledger + property-based tests), multi-household data isolation failure (RLS from schema day one), real-time sync without conflict resolution (append-only pattern), payment schema inflexibility (nullable `external_payment_id` field added now).

**Research flag:** Well-documented patterns for Supabase RLS and expense splitting. Debt simplification algorithm implementation may benefit from phase-level research.

---

### Phase 2: Chores + Calendar + Real-Time Sync

**Rationale:** Chores and Calendar are the second-biggest shared-living friction and share a scheduling dependency — chore due dates live on the calendar. Building them together avoids having to retrofit calendar integration later. Supabase Realtime must be fully operational here because the shopping list (Phase 3) requires it at launch.

**Delivers:** Chore assignment and recurring task management, shared household calendar with per-member color coding, real-time sync across devices for all data written so far, push notifications for chore due and expense added events.

**Addresses:** Chore management, shared calendar, push notifications (P1 features); notification preferences system completed here.

**Avoids:** Push notification overload (taxonomy and per-user preferences must be live before first notification ships), feature overload (validate Phase 1 with real users first before building Phase 2).

**Research flag:** Standard patterns for Expo push notifications + Supabase Realtime. Single `household:{household_id}` broadcast channel pattern prevents connection limit issues — document this pattern before implementation.

---

### Phase 3: Supplies + Meals + Shopping List Pipeline

**Rationale:** Shopping list is a high-frequency daily-use feature and table stakes for the "Cozi replacement" thesis. Meals and Supplies are built together because the grocery-to-meal-plan-to-shopping-list pipeline is the core differentiator — building them separately and integrating later is more costly. Calendar must exist (Phase 2) before Meals can use it for scheduling.

**Delivers:** Shared real-time shopping list, meal planning with calendar integration, automatic ingredient sync from meal plans to shopping list, supply inventory with basic low-stock thresholds.

**Addresses:** Shared shopping list (P1), meal planning + grocery list integration, supply inventory (P2 features).

**Avoids:** Feature overload (each module must clear a "better than best single-purpose app" bar; validate Phase 2 engagement before building Phase 3).

**Research flag:** Meal planning + shopping list pipeline is a relatively well-trodden UX pattern. The meal-to-shopping-list sync via shared DB relationship (not API calls between modules) follows the established internal boundary pattern.

---

### Phase 4: AI Integration Layer

**Rationale:** AI features need real data to be useful — receipt OCR needs the expense module, chore rotation needs chore history and calendar availability, spending insights need 30+ days of expenses, meal suggestions need dietary preferences collected from real users. Building AI before data exists produces a gimmick. Delivered as a layer on top of existing modules, not new modules.

**Delivers:** AI receipt OCR with confidence scoring and user confirmation flow, AI chore rotation with fairness optimization, AI spending pattern insights (activated at 30-day data threshold), LLM cost monitoring and per-user ceiling enforcement.

**Addresses:** AI receipt OCR (P1 — this is the first AI differentiation moment), AI chore rotation, spending insights (P2 features).

**Avoids:** AI as a gimmick (each AI feature must have a defined failure mode and fallback UI before implementation; test with bad inputs before clean ones), LLM cost overrun (cost ceiling enforced before production), AI prompt injection (all user-generated text sanitized before inclusion in prompts).

**Research flag:** HIGH need for phase-level research. OCR edge cases (crumpled receipts, non-English, handwritten), structured output JSON schemas, Vercel AI SDK streaming with Expo, and token cost budgeting all require specific implementation research.

---

### Phase 5: Polish + V2 Preparation

**Rationale:** With five pillars validated, this phase addresses the engagement and retention layer: settlement suggestions reduce payment friction, house rules fill a gap no competitor covers, maintenance request tracking surfaces a renter need. Also establishes the architecture for property management (v2) by hardening the multi-tenant model.

**Delivers:** Settlement deep-links to Venmo/Cash App with pre-filled amounts, house rules documentation with version history + acknowledgment, maintenance request tracking, performance tuning (indexed queries, paginated feeds, cached AI suggestions), and property management schema groundwork.

**Addresses:** Settlement suggestions, house rules, maintenance request tracking (P2 features); performance traps remediated before scale.

**Avoids:** N+1 query performance traps (eager-load member data, paginate activity feeds), balance recalculation performance trap (incremental running balance table added here), baked-in household size assumptions (remove any limits before property management work begins).

**Research flag:** Property management interface is a completely different UX and product — if pursued, it warrants a dedicated research cycle before any implementation begins.

---

### Phase Ordering Rationale

- RLS and the integer-cent data model are irreversible decisions that must precede any data being written to production. This is why Phase 1 cannot be rushed.
- Calendar is a shared dependency for both Chores (Phase 2) and Meals (Phase 3). Building it in Phase 2 prevents a costly retrofit in Phase 3.
- AI features are intentionally last among the core phases because they are consumers of domain data, not producers. An AI that has 60 days of household expense data is genuinely useful. An AI launched on day one produces generic suggestions users ignore.
- Each phase should be validated with real users before the next phase begins. This directly counters the feature overload pitfall, which research identifies as an existential risk for an all-in-one product.

### Research Flags

Phases needing deeper research during planning:

- **Phase 1:** Debt simplification algorithm implementation (minimum-edge cover, deterministic traversal) — verify specific algorithm before coding the balance engine.
- **Phase 2:** Single broadcast channel pattern for Realtime — verify Supabase channel limits and the `household:{id}` broadcast pattern before implementation to avoid the 60-connections-per-client anti-pattern.
- **Phase 4 (HIGH):** AI integration needs dedicated research before each sub-feature: OCR edge cases and confidence thresholds, Vercel AI SDK streaming with Expo, structured output JSON schemas, token cost modeling per user per month, and chore rotation fairness algorithm design.

Phases with standard, well-documented patterns (skip research-phase):

- **Phase 3:** Shopping list real-time sync and meal planning are well-documented patterns in the Supabase + TanStack Query ecosystem.
- **Phase 5:** Settlement deep-links, house rules, and maintenance tracking are straightforward CRUD features on top of the established stack.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core stack (Expo, Supabase, tRPC, OpenAI) verified via official docs and multiple sources. AI model selection is MEDIUM due to fast-moving landscape — re-evaluate Claude vs. OpenAI at Phase 4 implementation. |
| Features | MEDIUM-HIGH | Core features (expenses, chores, calendar, shopping) HIGH confidence from competitor analysis. AI differentiation features are MEDIUM — niche features (guest management, space scheduling) are LOW. |
| Architecture | HIGH | Core patterns (RLS multi-tenancy, event-driven notifications, async OCR pipeline, append-only ledger) verified via official Supabase docs and authoritative system design sources. |
| Pitfalls | MEDIUM-HIGH | Financial calculation and RLS pitfalls HIGH confidence from authoritative sources (Shopify Engineering, AWS). AI failure modes and notification overload MEDIUM confidence from community sources. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **AI model selection at Phase 4:** OpenAI GPT-4o is recommended but Anthropic Claude may be stronger for complex reasoning tasks (spending pattern analysis, chore optimization). Evaluate at Phase 4 planning time — do not lock in at architecture design.
- **LLM cost ceiling:** No specific cost-per-user figure is established in research. This must be modeled against expected household size and feature usage before any AI feature reaches production. Budget research is required in Phase 4.
- **Web app strategy:** Architecture research suggests Expo Router v5 SSR covers 90% of web needs without a separate Next.js app, but the project structure shows `apps/web` as a Next.js app. Decide at Phase 1 whether to use Expo Router universal or a separate Next.js deployment — do not defer this decision.
- **Offline support:** TanStack Query's `staleTime`/`gcTime` provides basic optimistic caching for v1. True offline sync (WatermelonDB) is explicitly deferred to v2. This must be documented as a known limitation to users before launch.
- **Property management v2:** Research flags this as a fundamentally different product (different UX, data model, user psychology). If pursued, it requires a dedicated research cycle — treat it as a new project, not a feature extension.

---

## Sources

### Primary (HIGH confidence)

- [Expo SDK 53 Changelog](https://expo.dev/changelog/sdk-53) — SDK 53 features, RN 0.79, New Architecture default
- [Expo Router v5 Announcement](https://expo.dev/blog/expo-router-v5) — SSR, React Server Components, API Routes stable
- [Vercel AI SDK Expo Getting Started](https://ai-sdk.dev/docs/getting-started/expo) — Official integration guide, expo/fetch streaming
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — Official RLS documentation
- [Supabase Push Notifications with Edge Functions](https://supabase.com/docs/guides/functions/examples/push-notifications) — Official notification dispatch pattern
- [Expo Push Notifications Overview](https://docs.expo.dev/push-notifications/overview/) — FCM/APNs via Expo Push Service
- [Zod v4 Release Notes](https://zod.dev/v4) — 14x faster parsing, 57% smaller core
- [Multi-Tenant Data Isolation with PostgreSQL RLS](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/) — AWS official RLS multi-tenancy guidance
- [Bound to Round: Tips for Handling Pennies](https://shopify.engineering/eight-tips-for-hanging-pennies) — Shopify Engineering, currency rounding best practices
- [System Design of Splitwise Backend](https://www.geeksforgeeks.org/system-design/system-design-of-backend-for-expense-sharing-apps-like-splitwise/) — Expense splitting system design patterns
- [Bounded Context — Martin Fowler](https://martinfowler.com/bliki/BoundedContext.html) — DDD module boundary principles
- SplitPro open-source codebase — Expense-as-source-of-truth pattern (verifiable in code)

### Secondary (MEDIUM confidence)

- [Splitwise Pro features](https://www.splitwise.com/pro) — Competitor feature analysis
- [Cozi feature overview](https://www.cozi.com/feature-overview/) — Competitor feature analysis
- [NativeWind v4 Docs](https://www.nativewind.dev/) — New Architecture requirement verified via multiple sources
- [Design Guidelines for Better Notifications UX](https://www.smashingmagazine.com/2025/07/design-guidelines-better-notifications-ux/) — Smashing Magazine, notification taxonomy
- [The Last Mile of LLMs](https://medium.com/@howtodoml/the-last-mile-of-llms-why-most-ai-applications-fail-after-the-demo-fa718e8570a0) — AI production failure modes
- [Building Production-Ready LLM Apps](https://dev.to/eva_clari_289d85ecc68da48/building-production-ready-llm-apps-architecture-pitfalls-and-best-practices-cpo) — LLM architecture pitfalls
- [App Push Notification Best Practices 2026](https://appbot.co/blog/app-push-notifications-2026-best-practices/) — Notification overload statistics
- [Offline-First Sync Patterns](https://developersvoice.com/blog/mobile/offline-first-sync-patterns/) — Mobile sync conflict resolution

### Tertiary (LOW confidence, needs validation)

- [AI household assistant features 2025](https://www.ohai.ai/blog/how-can-ai-help-with-a-domestic-chores-list/) — Marketing source; AI chore features directionally useful but unverified
- [Invoice OCR Benchmark 2025](https://www.veryfi.com/ai-insights/invoice-ocr-competitors-veryfi/) — Vendor-published benchmark; verify independently at Phase 4

---
*Research completed: 2026-03-19*
*Ready for roadmap: yes*
