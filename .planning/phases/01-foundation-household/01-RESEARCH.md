# Phase 1: Foundation + Household - Research

**Researched:** 2026-03-20
**Domain:** Expo (React Native) + Supabase — Auth, Household Management, Monetization, i18n, Deep Links
**Confidence:** HIGH (Core auth and deep link patterns verified via official Expo and Supabase docs; package versions verified via npm registry)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Email + password sign-up/sign-in | Supabase `signInWithPassword` / `signUp` — direct SDK support |
| AUTH-02 | Google + Apple OAuth sign-in | Supabase OAuth via `expo-auth-session` + `WebBrowser.openAuthSessionAsync`; Apple required if Google is offered on iOS |
| AUTH-03 | Magic link (OTP) sign-in | Supabase `signInWithOtp` with `emailRedirectTo` deep link; requires `expo-linking` to parse session token |
| AUTH-04 | Biometric login (Face ID/Touch ID) + optional 2FA TOTP | `expo-local-authentication` as local gate after session established; Supabase MFA TOTP for 2FA; session stored in `expo-secure-store` + MMKV |
| HOUS-01 | Create a household | `households` table + creator becomes first admin; Supabase RLS restricts access to members |
| HOUS-02 | Invite via deep link + QR code + email | UUID invite token in `household_invites`; `react-native-qrcode-svg` renders QR; `expo-linking.createURL` builds deep link; SECURITY DEFINER function exposes invite to unauthenticated callers |
| HOUS-03 | Web app fallback for invites | Universal links / web fallback URL for non-app recipients |
| HOUS-04 | Join approval flow | `join_approval` flag on household; pending membership state before admin confirms |
| HOUS-05 | Configurable invite expiry + link security | `expires_at` timestamp on invite; UUID token (non-guessable); server-side expiry check in SECURITY DEFINER function |
| HOUS-06 | Multiple admins + role system | `household_members` table with role column (`admin` / `member`); RLS checks membership role |
| HOUS-07 | Free tier: up to 6 members; multi-household = paid | Server-side enforcement via edge function or RLS policy checking RevenueCat entitlement; client-side paywall shown when limit reached |
| HOUS-08 | Sandbox/demo mode with toggleable sample data | `is_sandbox` flag on household; seeded fixture rows tied to sandbox household; toggled per-user in settings |

</phase_requirements>

---

## Summary

This phase establishes the complete foundation for the Jolly Home app: authentication, household creation and membership, invite flow, navigation scaffold, i18n, theming, monetization hooks, and AI credit system architecture. It is deliberately wide — every subsequent phase depends on something built here.

The core stack is **Expo SDK 55 (React Native 0.84)** with **Supabase** as the backend. This combination is the most documented and battle-tested path for mobile-first apps requiring auth, real-time database, and RLS-enforced multi-tenancy. Supabase replaces a custom backend and provides auth, Postgres (with RLS), storage, edge functions, and real-time in a single managed service.

The critical complexity in this phase is the **invite/deep link system**. Supabase's standard `inviteUserByEmail` is designed for single-app scenarios and does not handle the household multi-tenant case correctly. The correct pattern is a custom `household_invites` table with a `SECURITY DEFINER` function to let unauthenticated users look up invite tokens, plus `expo-linking` to handle the deep link. QR codes are generated client-side with `react-native-qrcode-svg` and encode the same invite deep link URL.

Monetization uses **RevenueCat** (`react-native-purchases`), which is the industry standard for Expo subscriptions across iOS and Android. It provides entitlement management, paywall UI components, and cross-platform subscription state that is accessible server-side via webhooks to Supabase.

**Primary recommendation:** Scaffold Supabase schema (households, household_members, household_invites) with RLS in the very first wave, before building any UI, because every subsequent feature in this phase depends on it.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | 55.0.8 | App framework (SDK 55, React Native 0.84) | Official Expo SDK; New Architecture enabled by default in SDK 53+ |
| @supabase/supabase-js | 2.99.3 | Backend client (auth, DB, real-time, storage) | Official Supabase JS SDK; all auth methods built-in |
| expo-router | 55.0.7 | File-based navigation + deep links | Official Expo navigation; handles deep links automatically; required for universal links |
| nativewind | 4.2.3 | Tailwind CSS for React Native | Tailwind-compatible styling; works with dark mode via `useColorScheme` |
| react-native-reanimated | 4.2.2 | Animations | Required by bottom tabs, bottom sheet, gesture handler |
| zustand | 5.0.12 | Client state (auth session, household context) | Minimal boilerplate; works with React 19 |
| @tanstack/react-query | 5.91.2 | Server state / data fetching | Handles caching, refetch, stale-while-revalidate for Supabase queries |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-auth-session | 55.0.9 | OAuth session management for Google/Apple | Required for all social auth flows in Expo |
| expo-linking | 55.0.8 | Deep link URL creation + parsing | Create invite URLs; parse magic link tokens |
| expo-secure-store | 55.0.9 | Secure key storage (Keychain/Keystore) | Store MMKV encryption key for Supabase session |
| react-native-mmkv | 4.2.0 | Fast key-value store | Supabase session storage (> 2048 byte limit of SecureStore alone) |
| expo-local-authentication | 55.0.9 | Biometric (Face ID / Touch ID) | Biometric gate after session established |
| react-native-purchases | 9.14.0 | RevenueCat in-app purchases + subscriptions | iOS + Android subscription management; entitlement checking |
| react-native-qrcode-svg | 6.3.21 | QR code generation (SVG-based) | Generate household invite QR codes; requires react-native-svg |
| react-native-svg | 15.15.4 | SVG rendering | Dependency of QR code library; needed for icons too |
| i18next | 25.8.20 | i18n engine | Translation management; locale-aware formatting |
| react-i18next | 16.5.8 | React bindings for i18next | `useTranslation` hook; Trans component |
| expo-localization | (bundled with SDK 55) | Device locale detection | Detect system language for i18n default |
| posthog-react-native | 4.37.4 | Analytics + funnel tracking | Event capture; session identification |
| @gorhom/bottom-sheet | 5.2.8 | Bottom sheet modals | Settings drawer, invite sheet, profile editor |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| RevenueCat (`react-native-purchases`) | `expo-iap`, native StoreKit | RevenueCat abstracts cross-platform entitlements and provides server-side webhook; `expo-iap` is lower-level with no backend; use RevenueCat |
| NativeWind | Gluestack UI, Tamagui | NativeWind is the closest to web Tailwind and has the most active community; Gluestack is good if you want a full component library |
| Zustand | Jotai, Redux, Context | Zustand is smallest; no providers needed; works well with React Query |
| i18next | react-native-localize + manual | i18next has plural rules, interpolation, namespaces; better for growing apps |
| `react-native-mmkv` + `expo-secure-store` | `@react-native-async-storage/async-storage` | AsyncStorage limited to 2048 bytes for SecureStore; Supabase JWT sessions exceed this; MMKV + SecureStore is the documented workaround |

**Installation:**
```bash
npx expo install expo-router @supabase/supabase-js expo-secure-store expo-auth-session expo-linking expo-local-authentication expo-localization react-native-svg react-native-reanimated react-native-gesture-handler react-native-screens react-native-safe-area-context

npm install nativewind zustand @tanstack/react-query react-native-mmkv react-native-purchases react-native-qrcode-svg i18next react-i18next posthog-react-native @gorhom/bottom-sheet
```

**Version verification:** Versions confirmed against npm registry on 2026-03-20.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/                    # Expo Router file-based routes
│   ├── (auth)/             # Auth screens (unauthenticated layout)
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── magic-link.tsx
│   ├── (app)/              # Authenticated layout
│   │   ├── _layout.tsx     # Tab bar + auth guard
│   │   ├── (home)/         # Tab 1
│   │   ├── (chores)/       # Tab 2
│   │   ├── (finances)/     # Tab 3
│   │   ├── (calendar)/     # Tab 4
│   │   ├── (more)/         # Tab 5
│   │   └── settings/       # Side drawer
│   ├── invite/             # Public deep link handler (unauthenticated)
│   │   └── [token].tsx     # Accepts household invite token from URL
│   └── _layout.tsx         # Root layout (providers, auth redirect)
├── components/
│   ├── ui/                 # Generic UI primitives (Button, Input, Card)
│   ├── auth/               # Auth-specific components
│   ├── household/          # Household creation, member list, invite sheet
│   └── paywall/            # Upgrade prompt, subscription UI
├── lib/
│   ├── supabase.ts         # Supabase client singleton
│   ├── i18n.ts             # i18next init with expo-localization
│   ├── posthog.ts          # PostHog client init
│   └── revenuecat.ts       # RevenueCat init + entitlement helpers
├── stores/
│   ├── auth.ts             # Zustand: user session + profile
│   └── household.ts        # Zustand: active household + members
├── hooks/
│   ├── useHousehold.ts     # React Query: fetch active household
│   ├── useInvite.ts        # Handle invite token resolution
│   └── useSubscription.ts  # RevenueCat entitlement state
├── locales/
│   ├── en/                 # English translations (JSON)
│   └── zh/                 # Chinese translations (JSON)
└── constants/
    ├── theme.ts            # Color tokens (light + dark)
    └── config.ts           # App scheme, Supabase URL, RevenueCat keys
```

### Supabase Schema

```sql
-- Households table
CREATE TABLE households (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  avatar_url  TEXT,
  is_sandbox  BOOLEAN NOT NULL DEFAULT false,
  join_approval_required BOOLEAN NOT NULL DEFAULT false,
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Household members with role
CREATE TABLE household_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending')),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, user_id)
);

-- Invite tokens
CREATE TABLE household_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL REFERENCES auth.users(id),
  token         UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at    TIMESTAMPTZ,
  max_uses      INTEGER,
  use_count     INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles (public extension of auth.users)
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  active_household_id UUID REFERENCES households(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Pattern 1: Supabase Client with Session Persistence

**What:** Initialize Supabase with MMKV + SecureStore to handle sessions larger than SecureStore's 2048-byte limit.

**When to use:** Always — Supabase JWT sessions routinely exceed 2048 bytes.

```typescript
// Source: https://supabase.com/docs/guides/auth/quickstarts/react-native
// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const storage = new MMKV({ id: 'supabase-session' });
const ENCRYPTION_KEY_ID = 'mmkv-supabase-key';

const mmkvStorageAdapter = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
};

// Encrypt MMKV with a key stored in SecureStore
async function getOrCreateEncryptionKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_ID);
  if (!key) {
    key = Math.random().toString(36);
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ID, key);
  }
  return key;
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: mmkvStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### Pattern 2: Auth Flow with Deep Link Handling

**What:** OAuth and magic link flows both require deep link callback handling. Expo Router handles the URL automatically when the app scheme is configured.

**When to use:** All social OAuth and magic link flows.

```typescript
// Source: https://supabase.com/docs/guides/auth/native-mobile-deep-linking
// app.json — register scheme
{ "expo": { "scheme": "jolly-home" } }

// Supabase dashboard: add redirect URL
// jolly-home://**

// Magic link send
await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: Linking.createURL('/'),
  },
});

// Google OAuth
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession(); // required on web

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: AuthSession.makeRedirectUri(),
    skipBrowserRedirect: true,
  },
});
if (data.url) {
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success') {
    const { url } = result;
    await supabase.auth.exchangeCodeForSession(url);
  }
}
```

### Pattern 3: Household Invite Deep Link + QR Code

**What:** Invite tokens are UUID rows in `household_invites`. The deep link encodes the token. A SECURITY DEFINER function lets unauthenticated users look up the invite (RLS cannot access anonymous URL params).

**When to use:** All invite flows — QR, direct link share, email invite.

```typescript
// Source: https://boardshape.com/engineering/how-to-implement-rls-for-a-team-invite-system-with-supabase
// SQL: SECURITY DEFINER bypasses RLS for invite lookup
CREATE OR REPLACE FUNCTION public.get_household_invite(invite_token uuid)
RETURNS SETOF household_invites
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM household_invites
  WHERE token = invite_token
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR use_count < max_uses);
$$;

// Client: generate invite link + QR
import { Linking } from 'expo-linking';
import QRCode from 'react-native-qrcode-svg';

const inviteUrl = Linking.createURL(`/invite/${invite.token}`);

// Render QR
<QRCode value={inviteUrl} size={200} />

// Share link
import { Share } from 'react-native';
await Share.share({ url: inviteUrl, message: `Join my household: ${inviteUrl}` });
```

### Pattern 4: RevenueCat Entitlement Gating

**What:** Check entitlements from RevenueCat to gate paid features. Server-side enforcement via Supabase edge function for the member limit check.

**When to use:** Free tier limits (6 members, single household), Plus/Pro feature gating.

```typescript
// Source: https://www.revenuecat.com/docs/getting-started/installation/expo
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

// Init (call once on app start)
Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
if (Platform.OS === 'ios') {
  Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_APPLE_KEY! });
} else {
  Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_GOOGLE_KEY! });
}

// Check entitlement
export async function hasPlusEntitlement(): Promise<boolean> {
  const { entitlements } = await Purchases.getCustomerInfo();
  return entitlements.active['plus'] !== undefined;
}

// Present paywall (RevenueCat native UI)
import { presentPaywallIfNeeded } from 'react-native-purchases-ui';
await presentPaywallIfNeeded({ requiredEntitlementIdentifier: 'plus' });
```

### Pattern 5: i18n Architecture with expo-localization

**What:** Initialize i18next with device locale from expo-localization; store user override in AsyncStorage; lazy-load translation namespaces.

**When to use:** All user-visible strings from day one.

```typescript
// Source: https://docs.expo.dev/guides/localization/
// src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const deviceLocale = getLocales()[0]?.languageCode ?? 'en';

const STORED_LANG_KEY = '@language';
const storedLang = await AsyncStorage.getItem(STORED_LANG_KEY);

i18n.use(initReactI18next).init({
  resources: {
    en: { common: require('../locales/en/common.json') },
    zh: { common: require('../locales/zh/common.json') },
  },
  lng: storedLang ?? deviceLocale,
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;
```

### Pattern 6: Biometric Gate (Local, Not Remote Auth)

**What:** Biometrics unlock the already-stored Supabase session. They do NOT replace passwords — they are a local convenience gate.

**When to use:** After app comes to foreground; as an alternative to re-entering password.

```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/local-authentication/
import * as LocalAuthentication from 'expo-local-authentication';

export async function promptBiometric(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!hasHardware || !isEnrolled) return true; // fall through

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access Jolly Home',
    cancelLabel: 'Use Password',
  });
  return result.success;
}
```

### Anti-Patterns to Avoid

- **Using `AsyncStorage` directly for Supabase session:** Session JWTs exceed AsyncStorage's 2048-byte limit on SecureStore. Use MMKV for storage, SecureStore for the MMKV encryption key.
- **Using Supabase `inviteUserByEmail` for household invites:** This is designed for single-app admin invitations, not multi-tenant household invitations. Use a custom `household_invites` table.
- **Calling RevenueCat during render:** `getCustomerInfo()` is async. Call it in a `useEffect` or React Query hook, not synchronously in component body.
- **Biometrics as the only auth:** Apple App Store requires that apps with biometric auth also have a password fallback. Always offer "Use Password" as an escape hatch.
- **Universal links without AASA file hosting:** Supabase does not serve the Apple App Site Association file. If using universal links (https://), you must host the AASA file on your own domain. Use custom scheme (`jolly-home://`) for initial launch and add universal links later.
- **Building tab customization before foundation:** The customizable bottom tab bar depends on navigation scaffold being established first. Build auth + routing first, customize navigation second.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| iOS + Android subscriptions | Custom StoreKit/BillingClient integration | `react-native-purchases` (RevenueCat) | Receipt validation, restore purchases, webhook events, entitlement management across platforms — each platform requires server-side receipt validation; RevenueCat does this |
| Session storage > 2048 bytes | Custom encrypted storage | MMKV + `expo-secure-store` (encryption key only) | SecureStore has documented 2048-byte hard limit; Supabase tokens exceed this routinely |
| Multi-tenant RLS for invite lookup | Direct table access for anonymous users | `SECURITY DEFINER` SQL function | RLS cannot access request query params; anonymous users cannot have policies that read invite tables directly |
| QR code generation | Canvas drawing / bitmap manipulation | `react-native-qrcode-svg` | SVG-based; crisp at any resolution; encodes arbitrary URLs; well-maintained (Expensify fork) |
| Device locale detection | Custom locale parsing | `expo-localization` | Returns ICU-standard locale strings; handles edge cases (right-to-left, script subtags) |
| Biometric prompt | Native module bridging | `expo-local-authentication` | Unified API for Face ID, Touch ID, fingerprint; handles permission requests |

**Key insight:** The Supabase + RevenueCat + Expo combo is a proven production architecture. The complexity is in the glue code (deep links, session persistence, invite RLS), not in the fundamental libraries.

---

## Common Pitfalls

### Pitfall 1: Supabase Session Exceeds SecureStore Limit
**What goes wrong:** App stores Supabase session in `expo-secure-store` directly. On first sign-in it works because the token is small. After Supabase adds claims (roles, metadata), the token exceeds 2048 bytes. The app silently fails to persist the session — users are logged out on next launch.

**Why it happens:** `expo-secure-store` has a hard 2048-byte limit, documented but easy to miss. The failure is silent (no error thrown — the value is just not saved).

**How to avoid:** Use MMKV as the session storage adapter. Store only the MMKV encryption key in SecureStore. The Supabase docs for React Native now recommend this pattern explicitly.

**Warning signs:** Users report being logged out on app relaunch. Session works in Expo Go (shorter tokens) but fails in production builds with longer JWTs.

---

### Pitfall 2: Apple Requires Sign in with Apple if Google OAuth Is Offered
**What goes wrong:** App ships with "Sign in with Google" but no "Sign in with Apple." App Store review rejects the app citing Apple's guideline 4.8.

**Why it happens:** Apple requires that if any third-party sign-in is offered, Sign in with Apple must also be offered. This is a hard rule for App Store distribution.

**How to avoid:** Implement both Google and Apple OAuth before App Store submission. Supabase supports both. The implementation pattern is identical — only the provider string differs.

**Warning signs:** App Store Connect review rejects the build with a specific guideline reference.

---

### Pitfall 3: Deep Link Scheme Not Registered Causes OAuth to Hang
**What goes wrong:** Google OAuth flow opens a browser, user authenticates, but the redirect back to the app never happens. The app waits indefinitely. This happens because `app.json` is missing the `scheme` field, or the Supabase dashboard doesn't have the redirect URL in its allowlist.

**Why it happens:** Two-part configuration required: (1) `app.json` scheme registration so iOS/Android route the URL to the app, and (2) Supabase dashboard redirect URL allowlist so Supabase accepts the redirect.

**How to avoid:** Set `"scheme": "jolly-home"` in `app.json`. Add `jolly-home://**` to Supabase Auth > URL Configuration > Additional Redirect URLs. Test with a real device build (not Expo Go) because Expo Go uses its own scheme.

**Warning signs:** OAuth browser opens but never redirects. `WebBrowser.openAuthSessionAsync` returns `{ type: 'dismiss' }` instead of `{ type: 'success' }`.

---

### Pitfall 4: RevenueCat Not Initialized Before Purchase Calls
**What goes wrong:** User opens the app and immediately navigates to a paywall screen. The `presentPaywallIfNeeded` call fails because RevenueCat SDK was not yet initialized (async init not awaited in root layout).

**Why it happens:** `Purchases.configure()` is synchronous but the underlying native SDK setup is asynchronous. Calling purchase APIs immediately after configure can fail.

**How to avoid:** Call `Purchases.configure()` in the root `_layout.tsx` before rendering children. Wrap the app in a RevenueCat provider or wait for `Purchases.getCustomerInfo()` to resolve before showing paywall screens.

**Warning signs:** Paywall shows but "Subscribe" button fails silently. RevenueCat debug logs show "SDK not configured."

---

### Pitfall 5: Invite Token Exposed in Plain RLS Policy Leaks Household Data
**What goes wrong:** Developer writes a Supabase RLS policy like `allow select if id = request.query('token'::text)` — but RLS cannot access HTTP query parameters. The policy either fails silently (no rows returned) or, worse, if written as `allow select for all` to work around the issue, it exposes all invites.

**Why it happens:** Supabase RLS runs inside Postgres and has no access to HTTP layer parameters. The only way to pass data to an RLS policy is via JWT claims or via function parameters.

**How to avoid:** Use a `SECURITY DEFINER` function that accepts the token as a parameter and performs the lookup internally. Call it via `supabase.rpc('get_household_invite', { invite_token: token })`.

**Warning signs:** Invite lookup returns empty results even with valid token. Or all invites are visible to anyone if policy was over-broadened as a workaround.

---

### Pitfall 6: Sandbox Data Leaks Into Real Household via Missing RLS Filter
**What goes wrong:** Sandbox demo mode seeds sample household data. The user creates a real household. Queries that don't filter by `is_sandbox = false` or by `household_id` return mixed real + sandbox data. The user sees someone else's chores or finances.

**Why it happens:** Sandbox data is stored in the same tables as real data, differentiated only by the `is_sandbox` flag on the household. Any query that joins household data without the is_sandbox check will mix results.

**How to avoid:** Sandbox households belong to a dedicated system user or have `is_sandbox = true` scoped per profile. RLS policies on all household-related tables must filter by `household_id` (which the member table constrains to the user's memberships). Do not filter by `is_sandbox` in RLS — filter by household membership instead. The household's `is_sandbox` flag is only used for seeding and UI display.

---

## Code Examples

Verified patterns from official sources:

### Auth State Listener (Root Layout)
```typescript
// Source: https://supabase.com/docs/guides/auth/quickstarts/react-native
// app/_layout.tsx
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  // ... route to (auth) or (app) based on session
}
```

### Household Membership Check (RLS Policy)
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
-- Members can read their own household
CREATE POLICY "household members can read household"
  ON households FOR SELECT
  USING (
    id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Only admins can update household settings
CREATE POLICY "admins can update household"
  ON households FOR UPDATE
  USING (
    id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );
```

### Member Count Enforcement (Edge Function)
```typescript
// Source: supabase.com/docs/guides/functions
// supabase/functions/join-household/index.ts
// Called when user accepts invite; checks member limit before adding
const memberCount = await supabase
  .from('household_members')
  .select('id', { count: 'exact', head: true })
  .eq('household_id', householdId)
  .eq('status', 'active');

const isPaid = await checkRevenueCatEntitlement(userId, 'plus');
if (!isPaid && (memberCount.count ?? 0) >= 6) {
  return new Response(JSON.stringify({ error: 'member_limit_reached' }), {
    status: 403,
  });
}
```

### AI Credit Meter Schema
```sql
-- AI credits are tracked per user per billing period
CREATE TABLE ai_credits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  credits_used  INTEGER NOT NULL DEFAULT 0,
  credits_total INTEGER NOT NULL DEFAULT 50, -- Free tier default
  period_start  TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()),
  period_end    TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `AsyncStorage` for Supabase session | MMKV + SecureStore (encryption key only) | 2024 | Prevents silent session loss from 2048-byte limit |
| `expo-av` for audio | `expo-audio` (stable in SDK 53) | SDK 53 (2025) | expo-av deprecated; use expo-audio for new projects |
| Custom OAuth handling | `expo-auth-session` + `WebBrowser.openAuthSessionAsync` | 2024 | Required pattern for Expo managed workflow OAuth |
| `next-pwa` / manual SW | Serwist (for web); EAS for native | 2024-2025 | next-pwa unmaintained; Serwist is official successor |
| JavaScript-only tabs | Native bottom tabs (Expo Router `(tabs)`) | SDK 52 (2024) | Native tabs render with platform-native feel |
| `react-beautiful-dnd` | `@dnd-kit` / no drag-and-drop needed for mobile | 2023 | react-beautiful-dnd deprecated |
| Expo Go for testing purchases | EAS Dev Client | 2023 | In-app purchases cannot run in Expo Go |

**Deprecated/outdated:**
- `expo-av` (Audio): replaced by `expo-audio` (stable in SDK 53)
- `expo-background-fetch`: replaced by `expo-background-task` in SDK 53
- `@react-native-async-storage/async-storage` as Supabase session storage: use MMKV instead
- Testing in Expo Go for any native module: use EAS Dev Client
- `JavaScriptCore` engine: deprecated in React Native core; will be community package

---

## Open Questions

1. **Web app fallback for invites (HOUS-03)**
   - What we know: Expo Router supports universal links with `expo-linking`; AASA file required for iOS
   - What's unclear: Does the project need a web companion app, or just a "download the app" landing page when the invite link is opened in a browser?
   - Recommendation: Build the mobile deep link first; add a web landing page at `jollyhome.app/invite/[token]` as a separate task; use custom scheme (`jolly-home://`) for initial launch to avoid AASA hosting requirement

2. **Multi-household user experience**
   - What we know: Multi-household is paid (Plus/Pro tier); user can be a member of multiple households
   - What's unclear: Does the bottom tab bar change context when switching households, or does the app keep one active household at a time?
   - Recommendation: Implement single active household with a "switch household" affordance; store `active_household_id` on the `profiles` table

3. **AI Credit System Architecture**
   - What we know: Credits are per-user; a meter must be always visible; architecture must be in place this phase
   - What's unclear: Are credits shared within a household (pooled) or per individual member?
   - Recommendation: Design schema to support both (credits on household with per-user allocation); start with per-user simplicity; schema column `credits_total` can be overridden per tier via RevenueCat webhook

4. **30-day trial implementation**
   - What we know: RevenueCat supports free trials natively in product configuration (App Store Connect / Google Play Console)
   - What's unclear: Whether the trial applies to Plus or Pro (or both)
   - Recommendation: Configure trial in both App Store Connect and RevenueCat dashboard; no special code needed — RevenueCat surfaces trial status via `customerInfo.activeSubscriptions`

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + Expo Testing Library (unit); Detox or Maestro (E2E) |
| Config file | `jest.config.ts` — see Wave 0 |
| Quick run command | `npx jest --testPathPattern=src/__tests__` |
| Full suite command | `npx jest --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Email sign-in creates session | unit (Supabase mock) | `npx jest src/__tests__/auth.test.ts -t "email sign-in"` | ❌ Wave 0 |
| AUTH-02 | OAuth providers trigger correct Supabase call | unit (mock) | `npx jest src/__tests__/auth.test.ts -t "oauth"` | ❌ Wave 0 |
| AUTH-03 | Magic link OTP sends email + deep link parsed | unit (mock) | `npx jest src/__tests__/auth.test.ts -t "magic link"` | ❌ Wave 0 |
| AUTH-04 | Biometric prompt shown when hardware available | unit | `npx jest src/__tests__/biometric.test.ts` | ❌ Wave 0 |
| HOUS-01 | Create household inserts row + creates admin membership | integration (Supabase local) | `npx jest src/__tests__/household.test.ts -t "create"` | ❌ Wave 0 |
| HOUS-02 | Invite token generates valid deep link URL | unit | `npx jest src/__tests__/invite.test.ts -t "generate"` | ❌ Wave 0 |
| HOUS-04 | Pending join state set when approval required | unit | `npx jest src/__tests__/invite.test.ts -t "approval"` | ❌ Wave 0 |
| HOUS-05 | Expired invite token rejected by RPC | integration | `npx jest src/__tests__/invite.test.ts -t "expiry"` | ❌ Wave 0 |
| HOUS-06 | Admin role change persisted and enforced | integration | `npx jest src/__tests__/household.test.ts -t "roles"` | ❌ Wave 0 |
| HOUS-07 | 7th member addition blocked for free tier | unit (RevenueCat mock) | `npx jest src/__tests__/limits.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern=src/__tests__ --passWithNoTests`
- **Per wave merge:** `npx jest --coverage`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- [ ] `src/__tests__/auth.test.ts` — covers AUTH-01, AUTH-02, AUTH-03
- [ ] `src/__tests__/biometric.test.ts` — covers AUTH-04
- [ ] `src/__tests__/household.test.ts` — covers HOUS-01, HOUS-06
- [ ] `src/__tests__/invite.test.ts` — covers HOUS-02, HOUS-04, HOUS-05
- [ ] `src/__tests__/limits.test.ts` — covers HOUS-07
- [ ] `jest.config.ts` — test framework configuration
- [ ] `src/__tests__/setup.ts` — Supabase mock, RevenueCat mock

---

## Sources

### Primary (HIGH confidence)
- [Supabase Expo React Native quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) — auth setup, MMKV storage adapter
- [Supabase React Native auth](https://supabase.com/docs/guides/auth/quickstarts/react-native) — signInWithPassword, signInWithOtp, OAuth
- [Supabase native mobile deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking) — scheme registration, makeRedirectUri, exchangeCodeForSession
- [Supabase MFA TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp) — 2FA implementation
- [Supabase RLS best practices (makerkit.dev)](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) — multi-tenant RLS patterns
- [Supabase SECURITY DEFINER for team invites](https://boardshape.com/engineering/how-to-implement-rls-for-a-team-invite-system-with-supabase) — invite RLS workaround
- [Supabase supa_audit](https://supabase.com/blog/postgres-audit) — audit trail via record_version table
- [Expo SDK 53 changelog](https://expo.dev/changelog/sdk-53) — New Architecture default, React Native 0.79, breaking changes
- [Expo using Supabase guide](https://docs.expo.dev/guides/using-supabase/) — expo-sqlite localStorage adapter
- [RevenueCat Expo integration](https://expo.dev/blog/expo-revenuecat-in-app-purchase-tutorial) — official tutorial
- [RevenueCat Expo docs](https://www.revenuecat.com/docs/getting-started/installation/expo) — installation, entitlement checking
- [Expo localization guide](https://docs.expo.dev/guides/localization/) — expo-localization + i18next pattern
- [NativeWind dark mode](https://www.nativewind.dev/docs/core-concepts/dark-mode) — colorScheme API
- [PostHog React Native docs](https://posthog.com/docs/libraries/react-native) — installation, event capture
- [react-native-qrcode-svg npm](https://www.npmjs.com/package/react-native-qrcode-svg) — version 6.3.21, React Native 0.75+ support
- npm registry: all package versions verified 2026-03-20

### Secondary (MEDIUM confidence)
- [i18next + expo-localization (Feb 2026)](https://medium.com/@kgkrool/implementing-internationalization-in-expo-react-native-i18next-expo-localization-8ed810ad4455) — current i18n pattern
- [NativeWind + React Native Reusables dark mode](https://medium.com/@rachelcantor/system-theme-support-with-nativewind-v4-and-react-native-reusables-08fed7ff4070) — theming system
- [Expo Router navigation guide 2026](https://www.codesofphoenix.com/articles/expo/expo-router-nav) — stack, tabs, drawer patterns

### Tertiary (LOW confidence — validate during implementation)
- Sandbox demo data approach: common pattern but no official reference; validate that RLS membership scoping is sufficient without explicit `is_sandbox` filter in policies
- AI credit pooling vs per-user: architectural decision not yet made; schema recommendation is an educated guess pending product decision

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified against npm registry; official docs confirm compatibility
- Architecture patterns: HIGH — Supabase + Expo deep link and session patterns verified via official docs; SECURITY DEFINER invite pattern verified via community implementation
- Pitfalls: HIGH — SecureStore limit is documented; Apple guideline 4.8 is documented; deep link configuration is verified via official Supabase docs
- Monetization: HIGH — RevenueCat is the documented standard for Expo subscriptions; verified via official integration guide
- i18n: HIGH — expo-localization + i18next is documented official pattern
- Validation architecture: MEDIUM — test tooling choices reasonable but specific to new project setup; exact commands depend on final project scaffold

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable ecosystem; Expo SDK 55 just released)
