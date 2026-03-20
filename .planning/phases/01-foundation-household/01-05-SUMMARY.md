---
phase: 01-foundation-household
plan: 05
subsystem: sandbox-monetization
tags: [sandbox, demo-mode, revenuecat, ai-credits, subscription, paywall]
dependency_graph:
  requires: ["01-01", "01-03"]
  provides: ["sandbox-demo-mode", "revenuecat-init", "ai-credit-meter", "subscription-screen"]
  affects: ["home-screen", "settings"]
tech_stack:
  added: ["react-native-purchases (RevenueCat)"]
  patterns: ["SECURITY DEFINER SQL seed function", "Zustand + hook composition", "NativeWind color tokens for condition states"]
key_files:
  created:
    - supabase/migrations/00002_sandbox_seed.sql
    - src/hooks/useSandbox.ts
    - src/components/household/SandboxBanner.tsx
    - src/lib/revenuecat.ts
    - src/hooks/useSubscription.ts
    - src/components/paywall/CreditMeter.tsx
    - src/app/(app)/settings/subscription.tsx
  modified:
    - src/app/(app)/(home)/index.tsx
decisions:
  - "DDL (CREATE TABLE, RLS, policies) kept top-level in migration; only DML (INSERT/UPDATE) goes inside plpgsql function bodies"
  - "react-native-purchases-ui not yet installed — showPaywall() falls back to Linking.openURL for App Store/Play Store; will be replaced when package is added"
  - "useSandbox tracks isSandboxActive in local state; checkSandboxStatus() must be called on mount to sync with DB"
  - "CreditMeter color: accent (#F97316) at 0-89%, sandbox (#CA8A04) at 90-99%, destructive (#DC2626) at 100%"
metrics:
  duration: "5 min"
  completed: "2026-03-20"
  tasks: 2
  files: 8
---

# Phase 01 Plan 05: Sandbox Demo Mode and Monetization Foundation Summary

Solo-first sandbox/demo mode with toggleable sample data, RevenueCat monetization integration, and AI credit meter enabling users to experience Jolly Home "alive" before inviting anyone.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Sandbox table DDL, seed SQL, useSandbox hook, SandboxBanner | 35436ad | 00002_sandbox_seed.sql, useSandbox.ts, SandboxBanner.tsx, index.tsx |
| 2 | RevenueCat integration, AI credit meter, subscription screen | 0085d7b | revenuecat.ts, useSubscription.ts, CreditMeter.tsx, subscription.tsx |

## What Was Built

### Task 1: Sandbox Demo Mode

**`supabase/migrations/00002_sandbox_seed.sql`**
- `sandbox_data` table with RLS policies (DDL is top-level, not inside function body)
- `create_sandbox_data(p_user_id UUID)` — creates a sandbox household, adds user as admin, seeds demo members/expenses/chores/meals/calendar events, sets as active household
- `clear_sandbox_data(p_user_id UUID)` — deletes sandbox households (CASCADE clears all related data), restores active household to a real household or NULL

**`src/hooks/useSandbox.ts`**
- `isSandboxActive` — tracks demo mode state
- `activateSandbox()` — calls `create_sandbox_data` RPC
- `deactivateSandbox()` — calls `clear_sandbox_data` RPC
- `loadSandboxData()` — fetches `sandbox_data` grouped by type into `{ members, expenses, chores, meals, events }`
- `checkSandboxStatus()` — queries households table for `is_sandbox` flag on active household

**`src/components/household/SandboxBanner.tsx`**
- Fixed banner (yellow #FEF9C3 / sandbox color accent) shown when demo mode is active
- "Clear Demo Data" button triggers `onClear` callback
- Dismissable with X button (reappears on next visit until cleared)

**`src/app/(app)/(home)/index.tsx` (updated)**
- Shows `SandboxBanner` when demo mode active
- Renders 4 demo content cards (Recent Expenses, Chores Due, This Week's Meals, Upcoming) when sandbox data loaded
- Condition dots for chores: green/yellow/red matching design tokens
- Solo empty state gains "Explore with Demo Data" secondary button calling `activateSandbox()`

### Task 2: RevenueCat Integration and Subscription Screen

**`src/lib/revenuecat.ts`**
- `initRevenueCat(userId)` — platform-specific initialization (iOS/Android only; graceful no-op on web)
- `getEntitlements()` — wraps `Purchases.getCustomerInfo()` with try/catch fallback; returns `{ isPlus, isPro, isTrial, trialDaysRemaining }`
- `hasPlusEntitlement()` — convenience boolean check
- `calculateTrialDays()` — computes days remaining from `expirationDate`

**`src/hooks/useSubscription.ts`**
- `tier` ('free' | 'plus' | 'pro') — derived from RevenueCat entitlements
- `loadAiCredits()` — queries `ai_credits` table for current period; defaults to 0/50 if no row exists
- `showPaywall()` — falls back to Linking.openURL until `react-native-purchases-ui` is installed

**`src/components/paywall/CreditMeter.tsx`**
- Horizontal progress bar (8px height, rounded)
- Fill color: accent → sandbox (#CA8A04) at 90% → destructive (#DC2626) at 100%
- Usage label: "{used} / {total} credits used this month"
- Warning text at 90% and 100% from i18n keys

**`src/app/(app)/settings/subscription.tsx`**
- "Subscription & AI Credits" heading
- Current Plan card: tier Badge, trial status in accent color, current tier feature list
- AI Credits card: CreditMeter with live usage + "Buy More Credits" ghost button (placeholder)
- Upgrade card (shown for free tier): tier comparison table (Free/Plus/Pro), "Upgrade to Plus" primary button
- Manage Subscription card (shown for paid tiers)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] react-native-purchases-ui not installed**
- **Found during:** Task 2 (showPaywall implementation)
- **Issue:** Plan calls `presentPaywallIfNeeded` from `react-native-purchases-ui`, which is not in package.json
- **Fix:** `showPaywall()` uses `Alert` + `Linking.openURL` to route to App Store/Play Store subscription management. Comment in code documents the swap needed when the package is added.
- **Files modified:** src/hooks/useSubscription.ts
- **Commit:** 0085d7b

## Self-Check

All files created/modified as planned. Commits verified.
