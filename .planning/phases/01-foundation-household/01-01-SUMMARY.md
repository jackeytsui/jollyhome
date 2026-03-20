---
phase: 01-foundation-household
plan: 01
subsystem: ui
tags: [expo, react-native, supabase, mmkv, nativewind, zustand, i18next, posthog, tailwind]

# Dependency graph
requires:
  - phase: 01-foundation-household
    provides: Wave 0 test infrastructure, jest harness, supabase stub, gitignore

provides:
  - Expo app scaffold with expo-router, NativeWind, all Phase 1 dependencies
  - Supabase client with MMKV session persistence (AUTH-04)
  - Supabase database schema: 5 tables, 14 RLS policies, SECURITY DEFINER invite function
  - Zustand stores: auth, household, settings
  - Root layout with auth state listener and providers (QueryClient, GestureHandler, BottomSheet)
  - Auth group layout and placeholder screens (sign-in, sign-up, magic-link, onboarding)
  - App group layout with 5-tab navigator (Home, Finances, Chores, Calendar, More)
  - UI primitives: Button, Input, Card, Avatar, Badge with warm palette
  - i18n with expo-localization device locale detection and all Phase 1 English copy
  - PostHog analytics client with conditional init
  - Color token system via constants/theme.ts and tailwind.config.js

affects:
  - All subsequent Phase 1 plans (auth, household, invite flows depend on this foundation)
  - Phase 2 (expenses, receipt OCR depend on Supabase client, stores, UI primitives)

# Tech tracking
tech-stack:
  added:
    - expo 55.0.8
    - expo-router 55.0.7
    - nativewind 4.2.3
    - tailwindcss 3.4.17
    - @supabase/supabase-js 2.99.3
    - react-native-mmkv 4.2.0
    - zustand 5.0.12
    - @tanstack/react-query 5.91.2
    - i18next 25.8.20 + react-i18next 16.5.8
    - posthog-react-native 4.37.4
    - react-native-reanimated 4.2.1
    - @gorhom/bottom-sheet 5.2.8
    - lucide-react-native
    - react-native-mmkv 4.2.0 (createMMKV API)
  patterns:
    - MMKV custom storage adapter for Supabase session (avoids SecureStore 2048-byte limit)
    - Zustand stores with typed state interfaces
    - Expo Router file-based routing with (auth) and (app) group layouts
    - NativeWind Tailwind classes with custom warm palette color tokens
    - i18next initialized synchronously with async storage override for user lang preference
    - PostHog with conditional initialization (disabled when key is empty)

key-files:
  created:
    - app.json
    - tailwind.config.js
    - babel.config.js
    - metro.config.js
    - global.css
    - .env.example
    - src/constants/theme.ts
    - src/constants/config.ts
    - src/lib/supabase.ts
    - src/lib/i18n.ts
    - src/lib/posthog.ts
    - src/stores/auth.ts
    - src/stores/household.ts
    - src/stores/settings.ts
    - src/app/_layout.tsx
    - src/app/(auth)/_layout.tsx
    - src/app/(app)/_layout.tsx
    - src/components/ui/Button.tsx
    - src/components/ui/Input.tsx
    - src/components/ui/Card.tsx
    - src/components/ui/Avatar.tsx
    - src/components/ui/Badge.tsx
    - src/locales/en/common.json
    - src/locales/zh/common.json
    - supabase/migrations/00001_foundation.sql
  modified:
    - package.json (added all Phase 1 dependencies)
    - tsconfig.json (added baseUrl and @/* path alias)

key-decisions:
  - "Used createMMKV() factory (not MMKV class constructor) — react-native-mmkv 4.x changed from class to factory API"
  - "Used @posthog/core PostHogEventProperties type for posthog.ts — posthog-react-native re-exports from @posthog/core"
  - "Supabase MMKV adapter uses remove() not delete() — API changed in react-native-mmkv 4.x"
  - "Root _layout.tsx uses conditional Redirect (not router.replace) — Expo Router v3 pattern"

patterns-established:
  - "Pattern 1: MMKV session storage — createMMKV({ id: 'supabase-session' }) with getString/set/remove adapter"
  - "Pattern 2: Auth routing — onAuthStateChange listener in root _layout, Redirect in render based on session"
  - "Pattern 3: Zustand stores — create<State> with typed interface, actions in same store"
  - "Pattern 4: UI primitives — StyleSheet.create for base styles, inline overrides for dynamic colors"

requirements-completed:
  - AUTH-04

# Metrics
duration: 13min
completed: 2026-03-20
---

# Phase 1 Plan 01: Foundation Scaffold Summary

**Expo app with expo-router, MMKV-backed Supabase session, NativeWind warm palette, 5-table RLS schema, Zustand stores, and 5 UI primitives**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-20T06:18:48Z
- **Completed:** 2026-03-20T06:32:00Z
- **Tasks:** 4
- **Files modified:** 25

## Accomplishments
- Expo SDK 55 project scaffolded with expo-router, NativeWind, and all Phase 1 dependencies installed
- Supabase client with MMKV session persistence (AUTH-04) — avoids SecureStore 2048-byte limit
- Supabase migration SQL with 5 tables, 14 RLS policies, SECURITY DEFINER invite lookup, and auto-profile trigger
- Auth-state-driven routing: root layout listens to onAuthStateChange and redirects between (auth) and (app)
- Zustand stores for auth session, household context, and theme settings
- 5 UI primitives (Button, Input, Card, Avatar, Badge) with warm palette and reanimated press feedback
- i18n with all Phase 1 English copy from UI-SPEC Copywriting Contract

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Expo project, NativeWind, i18n, theme** - `b17635c` (feat)
2. **Task 2: Supabase schema with RLS** - `8e82490` (feat)
3. **Task 3: Supabase client, Zustand stores, layouts** - `1534ac3` (feat)
4. **Task 4: UI primitive components** - `adfb06f` (feat)

## Files Created/Modified
- `src/lib/supabase.ts` - Supabase client with MMKV storage adapter
- `src/stores/auth.ts` - Auth session state (session, user, isLoading, setSession)
- `src/stores/household.ts` - Active household state (id, name, role, memberCount)
- `src/stores/settings.ts` - Theme override (light/dark/system)
- `src/app/_layout.tsx` - Root layout with providers and auth state listener
- `src/app/(auth)/_layout.tsx` - Auth stack navigator
- `src/app/(app)/_layout.tsx` - Tabs navigator with 5 tabs and accent active color
- `src/components/ui/Button.tsx` - 4 variants, 3 sizes, reanimated + haptics
- `src/components/ui/Input.tsx` - Focused and error states
- `src/components/ui/Card.tsx` - Pressable with scale animation
- `src/components/ui/Avatar.tsx` - Photo and initials modes, 3 sizes
- `src/components/ui/Badge.tsx` - Role, status, and tier variants
- `supabase/migrations/00001_foundation.sql` - Full 295-line schema

## Decisions Made
- `createMMKV()` factory API (react-native-mmkv 4.x changed from class constructor)
- `remove()` not `delete()` for MMKV key removal in v4 API
- `@posthog/core` type import for PostHogEventProperties — posthog-react-native re-exports it
- Expo Router conditional Redirect pattern in root layout (not router.replace) for auth routing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed MMKV instantiation for react-native-mmkv v4 API**
- **Found during:** Task 3 (Supabase client implementation)
- **Issue:** Plan specified `new MMKV({ id: ... })` but react-native-mmkv 4.x only exports `MMKV` as a type, not a class
- **Fix:** Used `createMMKV({ id: 'supabase-session' })` factory function instead
- **Files modified:** src/lib/supabase.ts
- **Verification:** `npx tsc --noEmit` passes cleanly
- **Committed in:** 1534ac3 (Task 3 commit)

**2. [Rule 1 - Bug] Fixed MMKV remove method name**
- **Found during:** Task 3 (Supabase client storage adapter)
- **Issue:** Plan referenced `.delete(key)` but react-native-mmkv 4.x uses `.remove(key)`
- **Fix:** Changed `storage.delete(key)` to `storage.remove(key)` in mmkvStorageAdapter
- **Files modified:** src/lib/supabase.ts
- **Verification:** TypeScript compiles without error
- **Committed in:** 1534ac3 (Task 3 commit)

**3. [Rule 1 - Bug] Fixed PostHog type imports**
- **Found during:** Task 1 (PostHog lib creation)
- **Issue:** `posthog-react-native` does not export `PostHogEventProperties` directly; it re-exports from `@posthog/core`
- **Fix:** Import from `@posthog/core` instead
- **Files modified:** src/lib/posthog.ts
- **Verification:** TypeScript compiles without error
- **Committed in:** b17635c (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (3 Rule 1 API version bugs)
**Impact on plan:** All fixes required for TypeScript correctness with installed package versions. No scope creep.

## Issues Encountered
- `npx create-expo-app` cannot scaffold into existing directory with files. Used temp dir scaffold then moved files. Previous plan (01-00) had already scaffolded most files — Task 1 primarily updated configs and overwrote with correct values.

## User Setup Required
None - no external service configuration required. Supabase and PostHog credentials go in `.env.local` (see `.env.example`).

## Next Phase Readiness
- Foundation complete — all subsequent Phase 1 plans (auth screens, household creation, invite flow) can build on this
- Supabase credentials needed in `.env.local` before running app against real backend
- TypeScript passes clean, jest tests pass (43 todo stubs from Wave 0)
- Expo app ready to launch: `npx expo start`

---
*Phase: 01-foundation-household*
*Completed: 2026-03-20*
