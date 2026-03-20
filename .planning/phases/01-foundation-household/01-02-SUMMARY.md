---
phase: 01-foundation-household
plan: 02
subsystem: auth
tags: [expo, react-native, supabase, expo-auth-session, expo-web-browser, haptics, i18n, posthog, mmkv]

# Dependency graph
requires:
  - phase: 01-foundation-household
    plan: 01
    provides: Supabase client, auth store, UI primitives (Button, Input), i18n, PostHog, color tokens

provides:
  - useAuth hook with all auth operations (email, Google OAuth, Apple OAuth, magic link, password reset)
  - Sign-up screen with email + social + magic link + returnTo redirect for invite flow
  - Sign-in screen with email + social + magic link + returnTo redirect support
  - Magic link screen with confirmation state and resend
  - Forgot password screen with confirmation state
  - 3-card swipeable onboarding tour with skip, progress dots, MMKV completion flag
  - SocialAuthButtons component (platform-ordered)
  - EmailVerificationBanner with 60-second resend cooldown
  - OnboardingCard component

affects:
  - invite/[token].tsx (Plan 01-04) — returnTo param flows from sign-up/sign-in back to invite after auth
  - (app)/create-household — onboarding navigates here on completion
  - All subsequent auth integrations

# Tech tracking
tech-stack:
  added:
    - expo-web-browser (WebBrowser.openAuthSessionAsync for OAuth)
    - expo-auth-session (AuthSession.makeRedirectUri for OAuth redirect)
    - expo-linking (Linking.createURL for magic link and password reset deep links)
  patterns:
    - Pattern: OAuth via WebBrowser.openAuthSessionAsync + exchangeCodeForSession (Pattern 2 from RESEARCH.md)
    - Pattern: Platform-ordered social auth (Apple first on iOS per Apple HIG)
    - Pattern: returnTo search param for post-auth redirect (invite join flow)
    - Pattern: MMKV flag for onboarding completion (avoids Supabase round-trip)
    - Pattern: FlatList horizontal + pagingEnabled for swipeable card tour

key-files:
  created:
    - src/hooks/useAuth.ts
    - src/components/auth/SocialAuthButtons.tsx
    - src/components/auth/EmailVerificationBanner.tsx
    - src/components/auth/OnboardingCard.tsx
    - src/app/(auth)/forgot-password.tsx
  modified:
    - src/app/(auth)/sign-up.tsx
    - src/app/(auth)/sign-in.tsx
    - src/app/(auth)/magic-link.tsx
    - src/app/(auth)/onboarding.tsx
    - src/locales/en/common.json

key-decisions:
  - "WebBrowser.maybeCompleteAuthSession() called at module level in useAuth — required for OAuth session completion on web"
  - "useAuth uses per-call isLoading/error state rather than global store — simpler, avoids race conditions between concurrent auth attempts"
  - "resendVerification requires email param rather than reading from auth state — safer at call site, avoids stale state"
  - "Onboarding uses FlatList (not ScrollView) for horizontal paging — easier viewability tracking for dot progress"

requirements-completed:
  - AUTH-01
  - AUTH-02
  - AUTH-03

# Metrics
duration: 5min
completed: 2026-03-20
---

# Phase 1 Plan 02: Auth Screens Summary

**Complete auth flow with email/password signup, Google/Apple OAuth, magic link, password reset, email verification banner, and 3-card onboarding tour**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T06:35:56Z
- **Completed:** 2026-03-20T06:40:25Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- `useAuth` hook providing all Supabase auth operations: email signup, email signin, Google OAuth, Apple OAuth, magic link, password reset, resend verification, sign out
- Error messages mapped to user-friendly i18n strings (`authFailure`, `network` keys)
- `SocialAuthButtons` component with Apple-first ordering on iOS (Apple HIG compliance)
- `EmailVerificationBanner` with 60-second resend cooldown timer
- Four auth screens: sign-up, sign-in, magic-link, forgot-password — all with i18n, haptics, KeyboardAvoidingView
- `returnTo` param handling on sign-up and sign-in for invite join flow (HOUS-03 support)
- 3-card onboarding tour with skip on every card, animated progress dots, MMKV completion flag
- PostHog analytics on sign-in, sign-up, magic-link, and onboarding events

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useAuth hook and SocialAuthButtons component** - `431981e` (feat)
2. **Task 2: Build sign-up, sign-in, magic-link, forgot-password screens** - `214c9cf` (feat)
3. **Task 3: Build 3-card swipeable onboarding tour** - `85f59ae` (feat)

## Files Created/Modified

- `src/hooks/useAuth.ts` — Complete auth operations wrapper for Supabase
- `src/components/auth/SocialAuthButtons.tsx` — Platform-ordered Google/Apple buttons
- `src/components/auth/EmailVerificationBanner.tsx` — Verification prompt with countdown resend
- `src/components/auth/OnboardingCard.tsx` — Single card with heading, body, illustration placeholder
- `src/app/(auth)/sign-up.tsx` — Full sign-up UI with email + social + magic link + returnTo
- `src/app/(auth)/sign-in.tsx` — Full sign-in UI with all methods + returnTo
- `src/app/(auth)/magic-link.tsx` — Magic link send with confirmation state
- `src/app/(auth)/forgot-password.tsx` — Password reset with confirmation state
- `src/app/(auth)/onboarding.tsx` — 3-card FlatList tour with skip + dots
- `src/locales/en/common.json` — Added auth, social, common.or i18n keys

## Decisions Made

- `WebBrowser.maybeCompleteAuthSession()` at module level in useAuth — required for web OAuth session completion
- Per-call `isLoading`/`error` state in hook (not global Zustand) — avoids race conditions
- `resendVerification` takes explicit email param — avoids stale auth state bugs
- FlatList over ScrollView for onboarding — easier viewability callback for progress dots

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

### Out-of-Scope Issues Noted

Pre-existing TypeScript error in `src/app/(app)/(home)/index.tsx` (missing `@/components/household/InviteSheet` module from Plan 01-01 stubs). This is a known forward-reference from Plan 01-01 and will be resolved in Plan 01-03 or 01-04 when the InviteSheet component is created.

## Next Phase Readiness

- All auth screens fully implemented — Plan 01-03 (household creation) can navigate to `/(auth)/sign-up` and `/(auth)/sign-in`
- `returnTo` param plumbing ready — Plan 01-04 (invite flow) just needs to pass `returnTo` when redirecting unauthenticated users to sign-up/sign-in
- Onboarding navigates to `/(app)/create-household` — Plan 01-03 needs to implement that route

---
*Phase: 01-foundation-household*
*Completed: 2026-03-20*

## Self-Check: PASSED

All 9 created/modified files confirmed on disk. All 3 task commits (431981e, 214c9cf, 85f59ae) confirmed in git log.
