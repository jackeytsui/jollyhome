# Architecture Research

**Domain:** Household management / shared living app (multi-feature, multi-platform)
**Researched:** 2026-03-19
**Confidence:** HIGH (core patterns verified via official docs and multiple authoritative sources)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Mobile (Expo)   │  │  Web (Next.js)   │  │  Future: PropMgmt│   │
│  │  iOS + Android   │  │  Dashboard/Admin │  │  Interface (v2)  │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘   │
└───────────┼────────────────────┼────────────────────-─┼─────────────┘
            │                    │                       │
            └────────────────────┼───────────────────────┘
                                 │  REST + WebSocket (Supabase Realtime)
┌────────────────────────────────┼────────────────────────────────────┐
│                         API / GATEWAY LAYER                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Supabase (PostgREST auto-API)                    │   │
│  │  Auth  │  RLS Policies  │  Realtime Channels  │  Storage      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Edge Functions (Supabase / Deno)                 │   │
│  │  OCR Pipeline  │  AI Suggestions  │  Notification Dispatch    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────┐
│                         DOMAIN MODULE LAYER                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Expenses │ │  Chores  │ │  Meals   │ │ Calendar │ │ Supplies │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────────────────┐ │
│  │Maintenance│ │  Rules   │ │        AI Engine (cross-domain)      │ │
│  └──────────┘ └──────────┘ └──────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────┐
│                         DATA LAYER                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐                 │
│  │  PostgreSQL (primary) │  │  Supabase Storage    │                 │
│  │  + Row Level Security │  │  (receipts, photos)  │                 │
│  └──────────────────────┘  └──────────────────────┘                 │
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Mobile App (Expo) | Primary user interface for housemates, camera for OCR, push notification receipt | Supabase REST + Realtime |
| Web App (Next.js) | Dashboard view, same feature set as mobile but browser-optimized | Supabase REST + Realtime |
| Supabase PostgREST | Auto-generated REST API from database schema; no custom API server needed | PostgreSQL |
| Supabase Auth | JWT-based authentication; custom claims carry household_id for RLS | All components |
| Row Level Security (RLS) | Enforces household data isolation at database level without application code | PostgreSQL |
| Realtime Channels | Pushes Postgres change events to subscribed clients | Mobile + Web clients |
| Edge Functions | Runs async logic: OCR processing, AI calls, notification dispatch | External AI APIs, FCM/APNs |
| Supabase Storage | Stores receipt images, avatars; returns public/signed URLs | Edge Functions, clients |
| Expense Module | Tracks expenses, splits, balances; runs debt-simplification algorithm | Notifications, AI Engine |
| Chore Module | Chore definitions, assignments, rotation rules, completion records | Notifications, AI Engine |
| Meal Module | Meal plans, recipes, preferences, dietary data | Supplies, AI Engine |
| Calendar Module | Household events, chore schedule, guest bookings, quiet hours | Chores, Meals, Notifications |
| Supplies Module | Shopping list, inventory, low-stock thresholds | Meals, Notifications |
| Maintenance Module | Maintenance request lifecycle (open → assigned → resolved) | Notifications, Calendar |
| AI Engine | Cross-domain intelligence: receipt parsing, spending patterns, chore fairness, meal suggestions | All domain modules |
| Notification Dispatch | Manages push token registration; routes domain events to FCM/APNs via Expo Push Service | All domain modules |

---

## Recommended Project Structure

```
apps/
├── mobile/                  # Expo React Native app
│   ├── app/                 # Expo Router file-based routing
│   │   ├── (auth)/          # Login, register, onboarding
│   │   ├── (tabs)/          # Main tab navigator
│   │   │   ├── expenses/
│   │   │   ├── chores/
│   │   │   ├── meals/
│   │   │   ├── calendar/
│   │   │   └── supplies/
│   │   └── maintenance/
│   ├── components/          # Shared UI components
│   ├── hooks/               # Domain hooks (useExpenses, useChores, etc.)
│   └── lib/                 # Supabase client, utils
│
├── web/                     # Next.js web app (App Router)
│   ├── app/
│   │   ├── (auth)/
│   │   └── (dashboard)/     # Same domain features, browser layout
│   ├── components/
│   └── lib/
│
packages/
├── db/                      # Shared: Supabase types, schema migrations
│   ├── migrations/          # Ordered SQL migration files
│   ├── seed/                # Dev seed data
│   └── types.ts             # Generated TypeScript types from schema
│
├── shared/                  # Shared business logic across apps
│   ├── expenses/            # Balance calculation, debt simplification
│   ├── chores/              # Rotation algorithm
│   └── utils/               # Date helpers, formatters
│
supabase/
├── functions/               # Edge Functions (Deno)
│   ├── process-receipt/     # OCR + AI extraction pipeline
│   ├── ai-suggestions/      # Cross-domain AI recommendations
│   └── push-notifications/  # Notification dispatch handler
└── config.toml
```

### Structure Rationale

- **apps/mobile + apps/web:** Separate deployable apps sharing the same backend; Expo handles iOS/Android, Next.js handles web. Avoids "universal app" complexity while enabling code sharing at the package level.
- **packages/db:** Single source of truth for schema and generated types prevents type drift between apps.
- **packages/shared:** Business logic (balance calculation, debt simplification) lives here — not in UI components and not in Edge Functions — so both apps and server-side code can use it.
- **supabase/functions:** Edge Functions are small, purpose-specific Deno scripts. Keeping them near the database config prevents them from growing into a hidden microservice.

---

## Architectural Patterns

### Pattern 1: Household-as-Tenant (RLS Multi-Tenancy)

**What:** Every table has a `household_id` column. Supabase RLS policies automatically filter all queries to only return rows where `household_id` matches the authenticated user's household claim in their JWT. No application code needed for tenant isolation.

**When to use:** All domain tables (expenses, chores, meals, calendar events, supplies, maintenance requests).

**Trade-offs:** Simple to implement; security enforced at DB layer. Future property management interface (v2) can use the same pattern with a different tenant identifier (property_id → household_id stays as a sub-tenant).

**Example:**
```sql
-- In JWT custom claims (set at auth time)
-- { "household_id": "uuid-of-household" }

-- RLS policy on expenses table
CREATE POLICY "household members only" ON expenses
  USING (household_id = (auth.jwt() -> 'household_id')::uuid);
```

### Pattern 2: Event-Driven Notifications via Database Webhooks

**What:** Instead of calling notification APIs directly from client code, domain events (new expense added, chore completed, maintenance opened) insert rows into a `notifications_queue` table. A database webhook triggers an Edge Function that reads the queue and dispatches to FCM/APNs via Expo Push Service.

**When to use:** Any action that should notify other household members.

**Trade-offs:** Decouples notification logic from domain logic. Notifications are durable (not lost if function fails — queue persists). Adds ~1-2s latency vs. direct dispatch, acceptable for household use.

**Example:**
```
New expense saved
       ↓
INSERT into notifications_queue (type: 'expense_added', payload: {...})
       ↓
Database webhook fires → Edge Function: push-notifications
       ↓
Expo Push Service → FCM/APNs → Device
```

### Pattern 3: Async OCR Pipeline with Optimistic UI

**What:** Receipt image is uploaded immediately to Supabase Storage. The UI shows the expense form in a "processing" state while an Edge Function runs OCR + AI extraction in the background. When extraction completes, it updates the expense record and the client receives the update via Realtime subscription.

**When to use:** Receipt scanning flow specifically. Any AI-powered extraction that takes >500ms.

**Trade-offs:** Better UX than blocking on AI response. Requires handling partial/failed extraction states in the UI. The optimistic UI must handle "fill in later" gracefully.

**Example:**
```
User photographs receipt
       ↓
Upload image → Supabase Storage (immediate)
       ↓ (parallel)
Show expense form (blank, "extracting...")
       ↓
Edge Function: process-receipt
  → Calls OCR API (e.g., Google Vision or GPT-4 Vision)
  → Parses line items, total, merchant, date
  → Updates expense record in DB
       ↓
Supabase Realtime pushes update to client
       ↓
Form auto-fills with extracted data
User reviews and confirms
```

### Pattern 4: Debt Simplification Graph

**What:** Raw expense splits create a web of pairwise debts. A heap-based graph algorithm collapses these into the minimum number of payments needed to settle all balances. Run on-demand (not stored as persistent state) to avoid consistency issues.

**When to use:** "Settle up" calculations in the Expense module.

**Trade-offs:** Compute is cheap for household scale (5-15 people). Do NOT store the simplified graph — always recompute from the canonical ledger. Simplification is presentation-layer logic, not the source of truth.

---

## Data Flow

### Request Flow (Standard Domain Action)

```
User Action (e.g., mark chore complete)
    ↓
Client calls Supabase PostgREST endpoint
    ↓
RLS policy validates: does user belong to this household?
    ↓ (yes)
Database write succeeds
    ↓ (trigger)
Postgres change event emitted
    ↓ (two paths in parallel)
Path A: Realtime channel pushes update to all subscribed household clients
Path B: notifications_queue INSERT → webhook → Edge Function → push notification
```

### OCR / AI Receipt Flow

```
User captures photo
    ↓
Upload to Supabase Storage bucket
    ↓ (returns storage URL, async processing begins)
Edge Function: process-receipt
    ├── Calls Vision AI (OpenAI GPT-4o or Google Vision)
    ├── Extracts: merchant, date, line items, total, currency
    └── Updates expenses table with extracted fields
    ↓
Realtime: client receives DB update
    ↓
UI populates form fields; user confirms or edits
    ↓
Expense finalized → split calculated → balances updated
```

### Notification Flow

```
Domain Event (any module)
    ↓
INSERT into household_notifications (type, payload, target_user_ids)
    ↓
DB Webhook → Supabase Edge Function (push-notifications)
    ↓
Fetch Expo push tokens for target_user_ids
    ↓
POST to Expo Push Service
    ↓ (Expo routes to platform)
    ├── iOS: APNs
    └── Android: FCM
```

### State Management (Client)

```
Supabase Realtime subscription
    ↓ (change events)
React Query cache invalidation
    ↓
Components re-render with fresh data
```

React Query (TanStack Query) is the recommended client-side state manager. It handles caching, background refresh, and optimistic updates. Pair with Supabase Realtime for push-invalidation: when a Realtime event arrives, invalidate the relevant query key. Avoid Redux or Zustand for server state — that's React Query's job.

### Key Data Flows Summary

1. **Expense creation:** Client → PostgREST → DB → Realtime → all household members' UIs update
2. **Receipt OCR:** Client → Storage upload → Edge Function → AI API → DB update → Realtime → client UI fills
3. **Chore completion:** Client → PostgREST → DB → Notifications queue → Edge Function → push to assigner
4. **Meal to shopping list:** Meal plan saved → Supplies module reads ingredients → merges with existing supply list
5. **Balance settlement:** Recomputed client-side from ledger on every view; no stored balance snapshot

---

## Build Order (Phase Dependencies)

The domain modules have natural dependencies that dictate a safe build order:

```
Phase 1: Foundation
  └── Auth + Household creation/joining + RLS setup
       (Every other module depends on this)

Phase 2: Core Domain Modules (can be built in parallel)
  ├── Expenses (highest user value, most complex — build first)
  ├── Chores
  └── Calendar (shared dependency for chores + maintenance scheduling)

Phase 3: Supporting Modules
  ├── Supplies (depends on Meals for ingredient sync)
  ├── Meals (can start standalone)
  └── Maintenance (depends on Calendar for scheduling)

Phase 4: AI + Notifications
  ├── Push notifications (depends on all domain modules for triggers)
  ├── OCR receipt pipeline (depends on Expenses module)
  └── AI suggestions (depends on data from Expenses, Chores, Meals)

Phase 5: Polish + Property Management Prep
  └── Property management interface (reuses all backend, new client UI)
```

**Why this order:**
- Auth/RLS must exist before any data can be created securely.
- Expenses is highest-friction shared living problem — validating it early de-risks the whole project.
- Calendar is a shared dependency; Chores and Maintenance both need it for scheduling.
- AI features need real data to be useful; build them after the modules that generate that data.
- Push notifications are a cross-cutting concern — easier to wire up once all event sources exist.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Single Supabase project, monolith approach is fine. Free tier handles it. |
| 1k-10k users | Upgrade Supabase plan for connection pooling (PgBouncer). Add indexes on `household_id` + common filter columns. Cache AI responses to avoid redundant API calls. |
| 10k-100k users | Edge Function concurrency limits may require queue-based processing for OCR. Consider dedicated AI gateway (OpenRouter) to pool rate limits. Realtime connection limits → add Supabase Realtime broadcast channels instead of postgres_changes for high-frequency events. |
| 100k+ users | Multi-region Supabase or migrate Postgres to dedicated Neon/PlanetScale. Read replicas for analytics. OCR at this scale → dedicated processing service (not Edge Functions). |

### Scaling Priorities

1. **First bottleneck:** Database connection count. PostgreSQL has hard connection limits. PgBouncer (built into Supabase Pro tier) is the fix. Add this at ~500 concurrent users.
2. **Second bottleneck:** Edge Function cold starts for OCR pipeline. Heavy AI calls in Edge Functions get slow under load. Mitigate by caching OCR results by image hash and using async queue pattern from day one.
3. **Third bottleneck:** Realtime connections. Each open tab/app holds a WebSocket. At household scale this is fine. At 10k+ households, filter subscriptions tightly by household channel.

---

## Anti-Patterns

### Anti-Pattern 1: Storing Computed Balances

**What people do:** Save a `balance` field on user records and update it with every expense change.

**Why it's wrong:** Creates consistency bugs when expenses are edited or deleted. Race conditions under concurrent updates. Audit trail becomes unclear.

**Do this instead:** Store only the immutable ledger (each expense + its splits). Compute balances on read. For a household of 10 people, this is trivially fast. The debt-simplification graph is also computed on read, never stored.

### Anti-Pattern 2: Application-Level Tenant Filtering

**What people do:** Add `WHERE household_id = $userId` in every service function. Rely on application code for data isolation.

**Why it's wrong:** One missed WHERE clause leaks all households' data. Hard to audit. Breaks when adding new query paths.

**Do this instead:** Enable RLS on every table from day one. Let Postgres enforce isolation. Application code never needs to think about household filtering — it's invisible.

### Anti-Pattern 3: Blocking UI on AI Processing

**What people do:** Show a loading spinner while waiting for OCR/AI to finish, blocking the user from doing anything.

**Why it's wrong:** Vision AI calls take 2-8 seconds. Users abandon flows. Feels slow compared to competitors.

**Do this instead:** Upload image immediately, show the form with empty fields and a subtle "extracting..." indicator. Let the user start entering data manually while AI processes. AI results arrive via Realtime and fill in remaining empty fields. User is in control at all times.

### Anti-Pattern 4: Fat Edge Functions

**What people do:** Put all business logic inside Edge Functions because they can "do anything."

**Why it's wrong:** Edge Functions are hard to test locally, have cold start latency, and are limited in execution time. Cramming expense splitting logic, notification logic, and AI calls into one function creates an untestable mess.

**Do this instead:** Edge Functions handle only I/O: call the AI API, write to DB, dispatch notification. Business logic (split calculation, debt simplification, chore rotation) lives in `packages/shared` where it can be unit tested.

### Anti-Pattern 5: One Realtime Subscription Per Feature

**What people do:** Subscribe to changes on expenses, chores, meals, calendar, supplies all separately per screen.

**Why it's wrong:** Each subscription is a WebSocket channel. 6 features × 10 screens = 60 open connections per client. Supabase has connection limits.

**Do this instead:** Subscribe to a single `household:{household_id}` broadcast channel. Domain modules publish named events to this channel. Client routes events to the correct React Query invalidation by event type.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI (GPT-4o) | REST API call from Edge Function | Used for receipt extraction and AI suggestions. Call from server only — never expose API key to client. Cache responses by input hash to avoid duplicate charges. |
| Google Vision API | REST API call from Edge Function | Alternative to OpenAI for OCR if cost matters. Lower per-call cost, less capable for structured extraction. |
| Expo Push Service | REST POST from Edge Function | Abstracts FCM/APNs. Send ExpoPushToken + notification payload. Handles iOS/Android routing. Do not call FCM/APNs directly unless you need fine-grained control. |
| FCM / APNs | Routed via Expo Push Service | Configure FCM credentials and APNs certificates in Expo EAS. |
| Supabase Storage | SDK from client for upload; Edge Function reads via service role | Receipts uploaded client-side. Processing reads via service role key (bypasses RLS for Edge Functions). |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Expense module ↔ Notifications | DB: insert into notifications_queue | Expense module writes an event record; notification system reads it. No direct function calls. |
| Meal module ↔ Supplies module | DB: shared ingredients table with meal_plan_id FK | Meal plan creation can auto-populate supplies list. Keep as DB relationship, not API call. |
| Calendar module ↔ Chores module | DB: chore_assignments.due_date references calendar slot | Calendar is the source of truth for scheduling. Chores read from it, not the reverse. |
| AI Engine ↔ Domain Modules | Edge Function reads domain tables via service role; writes suggestions back | AI is a consumer of domain data, not a peer module. One-way data flow into AI; suggestions written back to dedicated `ai_suggestions` table. |
| Mobile App ↔ Web App | No direct communication — both read/write same Supabase backend | Realtime keeps them in sync automatically. |

---

## Sources

- [System Design of Splitwise Backend — GeeksforGeeks](https://www.geeksforgeeks.org/system-design/system-design-of-backend-for-expense-sharing-apps-like-splitwise/) — HIGH confidence, authoritative system design breakdown
- [Supabase Row Level Security — Official Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH confidence
- [Multi-Tenant Applications with RLS on Supabase — AntStack](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) — MEDIUM confidence
- [Supabase Push Notifications with Edge Functions — Official Docs](https://supabase.com/docs/guides/functions/examples/push-notifications) — HIGH confidence
- [Expo Push Notifications Overview — Official Docs](https://docs.expo.dev/push-notifications/overview/) — HIGH confidence
- [Real-Time Push Notifications with Supabase Edge Functions and Firebase — Medium](https://medium.com/@vignarajj/real-time-push-notifications-with-supabase-edge-functions-and-firebase-581c691c610e) — MEDIUM confidence
- [Building a Receipt Scanner App With OCR, OpenAI, PostgreSQL — DZone](https://dzone.com/articles/building-a-receipt-scanner-app-with-ocr-openai-postgresql) — MEDIUM confidence
- [Bounded Context — Martin Fowler](https://martinfowler.com/bliki/BoundedContext.html) — HIGH confidence, DDD module boundary principles
- [Expo + Supabase Integration Guide — Official Expo Docs](https://docs.expo.dev/guides/using-supabase/) — HIGH confidence

---
*Architecture research for: HomeOS — Household Operating System*
*Researched: 2026-03-19*
