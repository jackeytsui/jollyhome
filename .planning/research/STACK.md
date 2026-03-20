# Stack Research

**Domain:** Cross-platform household management app with deep AI integration
**Researched:** 2026-03-19
**Confidence:** MEDIUM-HIGH (most claims verified via official docs or multiple sources; AI model selection is MEDIUM due to fast-moving landscape)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo (SDK 53) | 53.x | Universal app framework | SDK 53 enables New Architecture by default, includes React Native 0.79, Expo Router v5 with SSR and React Server Components. Single codebase targets iOS, Android, and web. EAS handles builds and OTA updates. |
| React Native | 0.79.x | Mobile runtime | New Architecture (Fabric + JSI) is now default and stable as of 0.79. Direct bridge elimination = faster serialization for real-time household data. Legacy arch is maintenance-only. |
| Expo Router | v5.x | Universal file-based routing | Ships with SDK 53. Provides iOS/Android/web navigation from one file tree. SSR, React Server Components, API Routes, and data loaders are now stable. Replaces need for separate Next.js web app. |
| TypeScript | 5.x | Type safety across full stack | Mandatory for tRPC end-to-end safety. Catches shape mismatches between Supabase queries and UI components at compile time, not runtime. |
| Supabase | latest | Backend-as-a-Service | Postgres + Auth + Realtime + Storage + Edge Functions + pgvector in one platform. Relational model is correct for expense splitting (not NoSQL). Row-Level Security enforces household data isolation at DB layer. pgvector covers AI semantic search. Predictable pricing vs Firebase's per-op charges. |
| tRPC | v11.x | Type-safe API layer | End-to-end TypeScript from Supabase Edge Functions to React Native components without schema files or codegen. Perfectly suited when client and server share a TypeScript monorepo. Eliminates entire class of API shape bugs. |
| OpenAI API | gpt-4o / gpt-4o-mini | AI features | GPT-4o vision handles receipt OCR natively (no Tesseract pipeline needed). gpt-4o-mini for cheaper suggestions, meal planning, chore optimization. Structured outputs enforce JSON schemas. |
| Vercel AI SDK | 4.x (ai package) | AI streaming in Expo | Official Expo integration guide available. Uses `expo/fetch` (WinterCG-compliant) for streaming — solves React Native's native fetch streaming limitation. Works with SDK 52+. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| NativeWind | v4.x | Tailwind CSS utility classes in React Native | Use for all styling. Tailwind mental model works universally across Expo Router's web and native targets. Smaller learning surface than Tamagui. Choose Tamagui only if you need its optimizing compiler for extreme render performance. |
| TanStack Query | v5.x | Server state (async data, caching, refetch) | All Supabase data fetching goes through TanStack Query. Handles loading/error/stale states, automatic background refetch, and optimistic updates for chore completion, expense edits. |
| Zustand | v5.x | Client state (UI state, user preferences) | Auth state, onboarding flow, local UI toggles. Do NOT use for server data — that is TanStack Query's job. |
| Zod | v4.x | Schema validation | Validate all tRPC inputs and AI structured output JSON. v4 is 14x faster parsing than v3, 57% smaller bundle. Use `@zod/mini` for mobile bundle size where tree-shaking matters. |
| React Hook Form | v7.x | Form management | Expense entry, meal planning forms, chore creation. Pairs with Zod for schema-based validation. Uncontrolled inputs = better React Native performance. |
| expo-notifications | SDK 53 | Push notifications (FCM + APNs) | Expo wraps both FCM and APNs. Stores push tokens in Supabase. Required for chore reminders, expense settlement alerts, supply low-stock pings. Real device required for testing. |
| expo-camera | SDK 53 | Camera access for receipt scanning | Capture receipt images in-app. Pair with OpenAI vision API for OCR. Use `expo/fetch` for streaming the image to your Edge Function. |
| expo-image-picker | SDK 53 | Photo library access | Alternate receipt source. Users can pick existing photos instead of live scan. |
| react-native-reanimated | v3.x | Animations | Swipe-to-complete chores, expense swipe actions, transition animations. Runs on UI thread via Worklets — no JS bridge jitter. Required for fluid gesture-driven interactions. |
| react-native-gesture-handler | v2.x | Native gestures | Required peer dependency for Reanimated. Handles swipe, drag, pinch natively. |
| date-fns | v3.x | Date manipulation | Chore rotation schedules, calendar views, expense date grouping. Tree-shakable, works identically on native and web. Do NOT use moment.js. |
| @supabase/supabase-js | v2.x | Supabase client | Official JS client. Use with AsyncStorage for session persistence on React Native. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| EAS Build | Cloud-hosted native builds | Replaces local Xcode/Android Studio for CI. Produces .ipa and .apk. Required for push notification credentials. |
| EAS Update | OTA JavaScript updates | Push bug fixes and feature updates without App Store review. JS/assets only — native code changes still require full build. Use staged rollouts (5% → 100%). |
| ESLint + Prettier | Code quality | Use `eslint-config-expo` as base. Enforce consistent patterns across mobile and web code. |
| TypeScript strict mode | Type safety | `"strict": true` in tsconfig. Non-negotiable for a tRPC stack — strict mode is what makes inference reliable. |
| Turborepo | Monorepo build system | If splitting mobile app and web dashboard into separate packages with shared types. Caches builds intelligently. |

---

## Installation

```bash
# Create Expo app with TypeScript template
npx create-expo-app HomeOS --template tabs

# Core runtime
npx expo install expo-router react-native-reanimated react-native-gesture-handler

# Backend
npm install @supabase/supabase-js @react-native-async-storage/async-storage

# API layer
npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query

# Validation
npm install zod

# AI
npm install ai @ai-sdk/openai

# Forms
npm install react-hook-form @hookform/resolvers

# Styling
npm install nativewind
npm install -D tailwindcss

# Utilities
npm install date-fns zustand

# Expo modules
npx expo install expo-notifications expo-camera expo-image-picker expo-image

# Dev dependencies
npm install -D typescript @types/react prettier eslint eslint-config-expo
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Expo + Expo Router (universal) | Separate React Native app + Next.js web | Use if web and mobile UX diverges dramatically (different information architectures). Expo Router v5 SSR now covers 90% of web needs, separate apps add significant maintenance cost. |
| Supabase | Firebase | Use Firebase if your team already has deep Firebase expertise or if you need Google Cloud ecosystem integration. For a greenfield app with relational data (expense splits, household memberships), Postgres is a better fit. |
| tRPC | REST with OpenAPI | Use REST when you need a public API (third-party integrations, partner apps). tRPC is internal-only. For HomeOS v1, internal-only is correct; revisit at v2 for property management API. |
| NativeWind | Tamagui | Use Tamagui if render performance becomes measurable bottleneck and you want compiler-optimized styles. Tamagui has steeper setup and more opinionated component API. |
| TanStack Query v5 | SWR | TanStack Query has more features (pagination, infinite queries, mutations, devtools) and official React Native docs. SWR is fine for simple cases but HomeOS needs mutation management for expense splits and chore completions. |
| OpenAI gpt-4o-mini | Anthropic Claude | Use Claude if you want stronger reasoning for complex meal planning or spending analysis. OpenAI has better structured output support and the Vercel AI SDK integration is more mature. Evaluate at implementation time. |
| Zod v4 | Yup, Valibot | Zod v4 is now faster than Valibot in most benchmarks and has much better tRPC integration. Yup is legacy. |
| React Hook Form | Formik | Formik uses controlled inputs — causes re-render on every keystroke in React Native, degrading performance. React Hook Form uses uncontrolled inputs, dramatically better on mobile. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Redux Toolkit | Extreme boilerplate for simple shared state. Household app state is not complex enough to justify the overhead. | Zustand for client state + TanStack Query for server state |
| Moment.js | 300KB bundle, mutable API, deprecated by maintainers. | date-fns v3 (tree-shakable, immutable, same API surface) |
| expo-av for video/audio | Deprecated in favor of expo-video and expo-audio in SDK 52+. | expo-video, expo-audio |
| React Navigation (standalone) | Expo Router wraps React Navigation and adds file-based routing, deep linking, and web SSR. Using React Navigation directly loses all that. | Expo Router v5 |
| Firebase Firestore | NoSQL document model fights against relational expense splitting data. Household member queries require joins that Firestore handles poorly. Pricing spikes at scale. | Supabase (Postgres) |
| Tesseract OCR | Complex setup, poor accuracy on crumpled receipts, requires on-device model management. | GPT-4o vision endpoint — better accuracy, handles glare/angles, returns structured JSON |
| axios | Fetch API is native in React Native + Node 18+. axios adds bundle weight with no benefit. | Native fetch (or `expo/fetch` for streaming AI responses) |
| StyleSheet.create (only) | Pure React Native stylesheets work but create a styling bifurcation — different code for web vs mobile. | NativeWind for unified Tailwind classes across platforms |

---

## Stack Patterns by Variant

**If using Supabase Edge Functions for AI calls:**
- Route all OpenAI API calls through Supabase Edge Functions (Deno runtime)
- Keep OpenAI API key server-side only — never in app bundle
- Use tRPC procedures backed by Edge Functions for type safety to client

**If web dashboard needs richer SSR (SEO, marketing pages):**
- Expo Router v5 SSR covers app screens well
- For a separate marketing/landing page, use Next.js 15 (App Router) deployed separately
- Share types via a `packages/types` monorepo package

**If AI costs need optimization:**
- Use gpt-4o-mini for suggestions and chore optimization (smaller, cheaper)
- Reserve gpt-4o for receipt OCR (vision capability, higher accuracy required)
- Cache meal plan suggestions in Supabase + pgvector — reuse similar past results

**If offline support is needed (v2):**
- Add WatermelonDB for local-first SQLite sync
- Supabase does not have built-in offline sync — plan this as an explicit phase
- TanStack Query's `staleTime` and `gcTime` provide basic optimistic caching for v1

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| expo@53 | react-native@0.79.x | SDK 53 ships RN 0.79. Do not mix SDK and RN versions. |
| expo-router@5 | expo@53 | Router v5 is bundled with SDK 53. Do not install separately. |
| nativewind@4 | expo@52+ | v4 requires New Architecture. SDK 53 enables New Architecture by default — compatible. |
| @trpc/server@11 | @trpc/client@11 | Must match major versions. v11 introduces React Server Component support. |
| react-native-reanimated@3 | react-native@0.79 | v3 fully supports New Architecture. v2 is legacy, avoid. |
| zod@4 | tRPC v11 | tRPC v11 supports Zod v4 natively. Zod v3 also works but misses performance gains. |
| @supabase/supabase-js@2 | @react-native-async-storage@1+ | Must install AsyncStorage separately for session persistence on React Native. |
| ai (Vercel AI SDK) | expo@52+ | Requires `expo/fetch` for streaming support. Available in SDK 52+. |

---

## Sources

- [Expo SDK 53 Changelog](https://expo.dev/changelog/sdk-53) — SDK 53 includes RN 0.79, New Architecture default, Expo Router v5 (HIGH confidence)
- [Expo Router v5 Announcement](https://expo.dev/blog/expo-router-v5) — SSR, React Server Components, API Routes stable (HIGH confidence)
- [Vercel AI SDK Expo Getting Started](https://ai-sdk.dev/docs/getting-started/expo) — Official integration guide, requires expo/fetch for streaming (HIGH confidence)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime) — Broadcast, Presence, Postgres Changes features (HIGH confidence)
- [Supabase pgvector Docs](https://supabase.com/docs/guides/database/extensions/pgvector) — Vector embeddings for AI semantic search (HIGH confidence)
- [Zod v4 Release Notes](https://zod.dev/v4) — 14x faster parsing, 57% smaller core, @zod/mini package (HIGH confidence)
- [React Native New Architecture](https://expo.dev/changelog/react-native-78) — New Architecture stable in RN 0.76+, default in SDK 53 (HIGH confidence)
- [NativeWind v4 Docs](https://www.nativewind.dev/) — v4 requires New Architecture, fully supports Expo Router web (MEDIUM confidence — verified via multiple sources)
- [tRPC + React Native talk](https://gitnation.com/contents/full-stack-and-typesafe-react-native-apps-with-trpcio) — tRPC works in React Native/Expo context (MEDIUM confidence)
- WebSearch: Flutter vs React Native 2025 — React Native recommended for JS teams, Expo ecosystem maturity (MEDIUM confidence, multiple sources)
- WebSearch: Supabase vs Firebase 2025 — Supabase preferred for relational data, predictable pricing (MEDIUM confidence, multiple sources)

---

*Stack research for: HomeOS — cross-platform household management app with AI*
*Researched: 2026-03-19*
