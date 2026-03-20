---
phase: 1
slug: foundation-household
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + Expo Testing Library (unit); Detox or Maestro (E2E) |
| **Config file** | `jest.config.ts` — Wave 0 installs |
| **Quick run command** | `npx jest --testPathPattern=src/__tests__ --passWithNoTests` |
| **Full suite command** | `npx jest --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=src/__tests__ --passWithNoTests`
- **After every plan wave:** Run `npx jest --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01 | unit | `npx jest src/__tests__/auth.test.ts -t "email sign-in"` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | AUTH-02 | unit | `npx jest src/__tests__/auth.test.ts -t "oauth"` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | AUTH-03 | unit | `npx jest src/__tests__/auth.test.ts -t "magic link"` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | AUTH-04 | unit | `npx jest src/__tests__/biometric.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | HOUS-01 | integration | `npx jest src/__tests__/household.test.ts -t "create"` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | HOUS-02 | unit | `npx jest src/__tests__/invite.test.ts -t "generate"` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | HOUS-04 | unit | `npx jest src/__tests__/invite.test.ts -t "approval"` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | HOUS-05 | integration | `npx jest src/__tests__/invite.test.ts -t "expiry"` | ❌ W0 | ⬜ pending |
| 01-02-05 | 02 | 1 | HOUS-06 | integration | `npx jest src/__tests__/household.test.ts -t "roles"` | ❌ W0 | ⬜ pending |
| 01-02-06 | 02 | 1 | HOUS-07 | unit | `npx jest src/__tests__/limits.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `jest.config.ts` — Jest configuration for Expo project
- [ ] `src/__tests__/setup.ts` — Supabase mock, RevenueCat mock, expo-local-authentication mock
- [ ] `src/__tests__/auth.test.ts` — stubs for AUTH-01, AUTH-02, AUTH-03
- [ ] `src/__tests__/biometric.test.ts` — stubs for AUTH-04
- [ ] `src/__tests__/household.test.ts` — stubs for HOUS-01, HOUS-06
- [ ] `src/__tests__/invite.test.ts` — stubs for HOUS-02, HOUS-04, HOUS-05
- [ ] `src/__tests__/limits.test.ts` — stubs for HOUS-07

*Wave 0 must be completed before any other plan tasks begin.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Biometric prompt displays on device | AUTH-04 | Requires real Face ID / Touch ID hardware | Enable biometric in settings, background app, reopen — verify prompt appears |
| Deep link opens app from SMS/email | HOUS-02 | Requires real device with scheme registration | Send invite link via iMessage, tap link — verify app opens to invite screen |
| RevenueCat paywall renders | HOUS-07 | Requires RevenueCat sandbox + real device | Navigate to upgrade screen — verify paywall shows with correct products |
| QR code scans correctly | HOUS-02 | Requires camera + second device | Generate QR, scan with second device camera — verify invite URL opens |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
