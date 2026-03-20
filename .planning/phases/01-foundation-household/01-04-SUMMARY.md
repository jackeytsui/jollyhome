---
phase: 01-foundation-household
plan: 04
subsystem: household
tags: [members, profiles, dietary, settings, 2fa, totp, tab-customization]
dependency_graph:
  requires: [01-01, 01-02, 01-03]
  provides: [member-directory, profile-editing, dietary-preferences, household-settings, account-settings, totp-2fa, tab-customization]
  affects: [_layout.tsx, settings-store]
tech_stack:
  added: []
  patterns:
    - Supabase MFA API for TOTP enrollment (enroll/challenge/verify/unenroll)
    - Zustand persist middleware with MMKV for selectedTabs persistence
    - Dynamic tab rendering from TAB_REGISTRY driven by persisted selectedTabs
    - Modal-based confirmation dialogs with haptic feedback
key_files:
  created:
    - src/hooks/useProfile.ts
    - src/hooks/useMembers.ts
    - src/components/household/MemberListItem.tsx
    - src/components/household/DietaryTag.tsx
    - src/components/household/LeaveHouseholdDialog.tsx
    - src/components/household/RemoveMemberDialog.tsx
    - src/app/(app)/(home)/members.tsx
    - src/app/(app)/settings/profile.tsx
    - src/app/(app)/settings/tab-customization.tsx
    - src/app/(app)/settings/household.tsx
    - src/app/(app)/settings/account.tsx
  modified:
    - src/stores/settings.ts
    - src/app/(app)/_layout.tsx
decisions:
  - "useProfile and useMembers use local useState rather than TanStack React Query — consistent with existing hooks in this phase (useAuth, useHousehold all use local state; React Query not yet wired up)"
  - "expo-notifications not installed — notifications toggle stores state locally without requesting permissions (deferred to later plan)"
  - "account.tsx delete account uses Alert.alert placeholder rather than actual supabase admin delete — requires server-side edge function not yet built"
metrics:
  duration: 7 min
  completed_date: "2026-03-20"
  tasks_completed: 3
  files_changed: 13
---

# Phase 01 Plan 04: Member Directory, Profile, Settings, and Tab Customization Summary

Member directory with admin actions, profile editing with dietary preferences and avatar upload, household and account settings including TOTP 2FA enrollment using the Supabase MFA API, and tab bar customization with MMKV-persisted tab selection.

## What Was Built

### Task 1: Hooks and Household Components
- `useProfile`: profile CRUD + avatar upload to Supabase Storage bucket `avatars`
- `useMembers`: member listing, removal, role changes, leave household, and pending member approval
- `MemberListItem`: member row with avatar, display name, role badge, pending badge, dietary tags (up to 3 shown), and admin "..." action menu (promote/demote/remove)
- `DietaryTag`: tappable chip component with 15 predefined dietary options and selected/unselected visual states
- `LeaveHouseholdDialog`: destructive confirmation with haptic warning feedback, optional outstanding balance warning
- `RemoveMemberDialog`: remove member confirmation with interpolated member name

### Task 2: Member Directory, Profile Settings, Tab Customization, Dynamic Tabs
- `members.tsx`: member directory using SectionList with Active/Pending groups, pull-to-refresh, RemoveMemberDialog integration, and InviteSheet
- `profile.tsx`: profile editor with 96px avatar picker (camera/library/initials via expo-image-picker), display name input, dietary tag grid, free-text notes
- `tab-customization.tsx`: pick exactly 5 features from 11 options with checkbox UI and save to settings store
- `settings.ts`: extended with `selectedTabs` and `setSelectedTabs` using Zustand persist + MMKV (`createJSONStorage`) so tab selection survives app restarts
- `_layout.tsx`: replaced hardcoded 5 Tabs.Screen entries with dynamic rendering from `TAB_REGISTRY` keyed on `selectedTabs`; all inactive screens rendered with `href: null` to remain navigable but hidden

### Task 3: Household Settings and Account Settings with TOTP 2FA
- `household.tsx`: admin settings for household name, join approval toggle, invite expiry chip picker (1/7/30/Never), member count vs limit, and danger zone "Leave Household" button with LeaveHouseholdDialog
- `account.tsx`: theme picker (System/Light/Dark), biometric toggle with `expo-local-authentication` verification, full TOTP 2FA enrollment flow (QR code display + manual secret + 6-digit verification), disable 2FA, language picker with AsyncStorage persistence, tab customization navigation link, notifications toggle, export data (placeholder toast), delete account dialog with 3-button options per UI-SPEC

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Supabase TOTP factor type field mismatch**
- **Found during:** Task 3 TypeScript compilation
- **Issue:** Custom `TotpFactor` interface used `type` but Supabase SDK's `listFactors()` returns `factor_type`
- **Fix:** Renamed field to `factor_type` and used explicit `.map()` to convert the SDK type to local type
- **Files modified:** `src/app/(app)/settings/account.tsx`
- **Commit:** c8b6a7f

**2. [Rule 2 - Missing functionality] expo-notifications not installed**
- **Found during:** Task 3 planning
- **Issue:** `expo-notifications` is not in package.json; the plan called for `expo-notifications` permission request on toggle
- **Fix:** Notifications toggle stores state locally without calling permission API. Real permission request deferred to when expo-notifications is installed.
- **Files modified:** `src/app/(app)/settings/account.tsx`
- **Commit:** c8b6a7f

## Self-Check: PASSED
