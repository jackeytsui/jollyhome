---
phase: 01-foundation-household
plan: 03
subsystem: ui
tags: [household, invite, qr-code, deep-link, bottom-sheet, expo-linking, supabase-rpc, expo-image-picker, expo-clipboard]

requires:
  - phase: 01-foundation-household
    plan: 01
    provides: supabase client, auth store, household store, UI primitives (Button, Input, Avatar, Card), migration with households/household_members/household_invites/get_household_invite RPC

provides:
  - useHousehold hook: createHousehold (user becomes admin, active household set in store), loadActiveHousehold, switchHousehold, updateHousehold
  - useInvite hook: createInvite (configurable expiry), getInviteInfo via SECURITY DEFINER RPC, redeemInvite with member limit + approval checks, getInviteUrl, listInvites, deleteInvite
  - CreateHousehold screen at /(app)/create-household with name input + optional photo upload to Supabase Storage
  - HouseholdHeader component: avatar + name + member count + invite button
  - HouseholdHome screen at /(app)/(home)/index with empty states (no household / solo) and feature placeholder cards
  - InviteSheet bottom sheet: QR code (react-native-qrcode-svg) + copy link (expo-clipboard) + system share + email invite (mailto)
  - invite/[token] screen: public route, invite preview, join (auth) or sign-up redirect with returnTo (unauth), error states

affects:
  - plan 01-02 (auth sign-up screen must read returnTo param to complete join flow after auth)
  - future phases that add features to the household home (finances, chores, calendar, etc.)

tech-stack:
  added:
    - expo-image-picker (photo selection + permission)
    - expo-clipboard (copy invite URL)
  patterns:
    - Invite URL built via expo-linking createURL for deep-link compatibility
    - SECURITY DEFINER RPC for unauthenticated invite lookup
    - returnTo param pattern for post-auth redirect on invite join
    - BottomSheetModal ref-based API with forwardRef
    - (home) group route in Expo Router for nested home tab layout

key-files:
  created:
    - src/hooks/useHousehold.ts
    - src/hooks/useInvite.ts
    - src/app/(app)/create-household.tsx
    - src/app/(app)/(home)/_layout.tsx
    - src/app/(app)/(home)/index.tsx
    - src/components/household/HouseholdHeader.tsx
    - src/components/household/InviteSheet.tsx
    - src/app/invite/[token].tsx
  modified:
    - src/app/(app)/_layout.tsx (tab name changed from index to (home), create-household hidden from tab bar)
    - package.json (added expo-image-picker, expo-clipboard)

key-decisions:
  - "Moved home tab from flat index route to (home) group to accommodate future nested screens (members, etc.) under the home tab"
  - "InviteSheet uses forwardRef + BottomSheetModal ref API so parent (home screen) controls presentation imperatively"
  - "redeemInvite does client-side member limit pre-check but server RLS enforces authoritatively — reduces failed inserts"
  - "invite/[token] is outside (auth) and (app) route groups so it is accessible without authentication"
  - "Email invite uses mailto deep link rather than Supabase email — avoids SMTP setup for Phase 1"

patterns-established:
  - "Hook pattern: useState for isLoading/error, supabase operations in try/catch/finally, captureEvent for analytics"
  - "returnTo param pattern: router.push with params.returnTo for post-auth redirect flows"
  - "BottomSheet pattern: forwardRef with BottomSheetModal, onChange callback to lazily create invite on first open"

requirements-completed:
  - HOUS-01
  - HOUS-02
  - HOUS-03

duration: 5min
completed: 2026-03-20
---

# Phase 01 Plan 03: Household Creation, Invite System, and Join Flow Summary

**Household creation with admin bootstrap, UUID invite links with QR code + system share + email via expo-clipboard and react-native-qrcode-svg, and a public invite/[token] join screen with returnTo-based auth redirect for unauthenticated recipients.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T06:37:00Z
- **Completed:** 2026-03-20T06:42:00Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- `useHousehold` hook handles the full household lifecycle: create (insert household + admin member + update profile + Zustand store), load active household from profile, switch, and update
- `useInvite` hook wraps the invite system: create with configurable expiry, fetch via SECURITY DEFINER RPC (works for unauthenticated users), redeem with member limit + approval checks, URL generation, list, and delete
- Full create-household screen (name validation, optional photo upload to Supabase Storage via expo-image-picker), InviteSheet bottom sheet (QR + copy + share + email), household home with empty states and feature placeholders, and public invite/[token] join screen with unauthenticated redirect

## Task Commits

1. **Task 1: Create useHousehold and useInvite hooks** - `4a29410` (feat)
2. **Task 2: Build create-household screen and household home screen** - `28ac210` (feat)
3. **Task 3: Build InviteSheet (QR + share + email) and invite/[token] join screen** - `a0e66be` (feat)

## Files Created/Modified

- `src/hooks/useHousehold.ts` - Household CRUD: createHousehold, loadActiveHousehold, switchHousehold, updateHousehold
- `src/hooks/useInvite.ts` - Invite lifecycle: createInvite, getInviteInfo (RPC), redeemInvite, getInviteUrl, listInvites, deleteInvite
- `src/app/(app)/create-household.tsx` - Name input + optional photo upload + keyboard-aware scroll view
- `src/app/(app)/(home)/_layout.tsx` - Stack layout for home tab group
- `src/app/(app)/(home)/index.tsx` - Household home: empty/solo states, HouseholdHeader, feature placeholders, InviteSheet integration
- `src/components/household/HouseholdHeader.tsx` - Horizontal header: avatar + name + member count + invite button
- `src/components/household/InviteSheet.tsx` - Bottom sheet: QR code, copy link, share, email invite, expiry note
- `src/app/invite/[token].tsx` - Public join screen: invite preview, join (auth), sign-up redirect with returnTo (unauth), error states
- `src/app/(app)/_layout.tsx` - Tab name updated to (home), create-household hidden from tab bar
- `package.json` - Added expo-image-picker and expo-clipboard

## Decisions Made

- Moved home tab from flat `index` to `(home)` group to allow nested screens (members, settings) under the home tab without breaking the tab bar structure
- `InviteSheet` uses `forwardRef` + `BottomSheetModal` ref API so the home screen can call `present()` imperatively from the header invite button
- Email invite uses a `mailto:` deep link rather than Supabase's `inviteUserByEmail` — avoids SMTP configuration in Phase 1 and the Supabase invite API is for single-app scenarios
- `invite/[token]` route placed outside `(auth)` and `(app)` route groups to ensure it's publicly accessible for invite previewing
- `redeemInvite` pre-checks member count client-side to surface the paywall error before the DB insert, but RLS is the authoritative enforcement

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing expo-image-picker and expo-clipboard**
- **Found during:** Task 2 (create-household screen) and Task 3 (InviteSheet copy link)
- **Issue:** Both packages referenced in the plan but absent from package.json and node_modules
- **Fix:** `npm install expo-image-picker expo-clipboard --legacy-peer-deps`
- **Files modified:** package.json, package-lock.json
- **Verification:** TypeScript compiled cleanly with both imports
- **Committed in:** a0e66be (Task 3 commit)

**2. [Rule 2 - Missing Critical] Added InviteSheet stub in Task 2 to unblock TypeScript compilation**
- **Found during:** Task 2 (home screen imports InviteSheet which is built in Task 3)
- **Issue:** Forward-reference between tasks causes TS2307 compile error
- **Fix:** Created a minimal stub (forwardRef returning null) so Task 2 could compile cleanly before Task 3 replaced it
- **Files modified:** src/components/household/InviteSheet.tsx
- **Verification:** `npx tsc --noEmit` passed after stub; full implementation replaced stub in Task 3 commit
- **Committed in:** 28ac210 (Task 2 commit), replaced by a0e66be (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking dependency install, 1 missing critical stub)
**Impact on plan:** Both fixes necessary for compilation and functionality. No scope creep.

## Issues Encountered

- `expo install` failed due to spawn error in the npm integration layer; resolved by running `npm install --legacy-peer-deps` directly
- TypeScript surfaced `expiryDays` possibly undefined in useInvite — fixed with a `resolvedExpiryDays` fallback before setDate

## User Setup Required

None — no external service configuration required beyond what was set up in Plan 01.

## Next Phase Readiness

- Household creation, invite generation, and invite redemption are fully wired end-to-end
- Plan 01-02 (auth screens) must implement `returnTo` param handling in sign-up/sign-in so invited users are redirected back to `/invite/[token]` after authentication
- Supabase Storage bucket `household-avatars` must exist and be public-readable for avatar uploads from create-household screen
- Feature placeholder cards in the home screen are ready to be replaced by real feature screens as subsequent phases ship

---
*Phase: 01-foundation-household*
*Completed: 2026-03-20*

## Self-Check: PASSED

All files verified present. All 3 task commits verified in git log.

| Check | Result |
|-------|--------|
| src/hooks/useHousehold.ts | FOUND |
| src/hooks/useInvite.ts | FOUND |
| src/app/(app)/create-household.tsx | FOUND |
| src/app/(app)/(home)/index.tsx | FOUND |
| src/components/household/HouseholdHeader.tsx | FOUND |
| src/components/household/InviteSheet.tsx | FOUND |
| src/app/invite/[token].tsx | FOUND |
| Commit 4a29410 | FOUND |
| Commit 28ac210 | FOUND |
| Commit a0e66be | FOUND |
