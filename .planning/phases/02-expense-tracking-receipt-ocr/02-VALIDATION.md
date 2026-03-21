---
phase: 2
slug: expense-tracking-receipt-ocr
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 with jest-expo preset |
| **Config file** | `jest.config.ts` (root) |
| **Quick run command** | `npx jest src/__tests__/expenses.test.ts --passWithNoTests` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest src/__tests__/expenses.test.ts --passWithNoTests`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | EXPN-02 | unit | `npx jest src/__tests__/expenses.test.ts -t "equal split"` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | EXPN-03 | unit | `npx jest src/__tests__/expenses.test.ts -t "split validation"` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | EXPN-06 | unit | `npx jest src/__tests__/expenses.test.ts -t "computeBalances"` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | EXPN-06 | unit | `npx jest src/__tests__/expenses.test.ts -t "simplifyDebts"` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | EXPN-13 | unit | `npx jest src/__tests__/expenses.test.ts -t "proportionalTax"` | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 1 | EXPN-11 | unit | `npx jest src/__tests__/expenses.test.ts -t "paymentLink"` | ❌ W0 | ⬜ pending |
| 02-01-07 | 01 | 1 | EXPN-09 | unit | `npx jest src/__tests__/expenses.test.ts -t "suggestCategory"` | ❌ W0 | ⬜ pending |
| 02-xx-xx | xx | x | EXPN-14 | manual | Supabase Studio SQL editor | ❌ | ⬜ pending |
| 02-xx-xx | xx | x | AIEX-01 | manual | Test with real camera in Expo Go | ❌ | ⬜ pending |
| 02-xx-xx | xx | x | AIEX-03 | manual | UI walkthrough in Expo Go | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/expenses.test.ts` — stubs for EXPN-02, EXPN-03, EXPN-06, EXPN-13, EXPN-11, EXPN-09
- [ ] `src/lib/expenseMath.ts` — pure functions that the test file exercises (must exist before tests can pass)

*Existing test infrastructure: jest.config.ts, setup.ts, and 5 passing test files already established in Phase 1. No framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Private expense RLS: non-split member cannot read | EXPN-14 | Requires Supabase RLS policy testing with multiple user contexts | Test via Supabase Studio SQL editor with different user JWTs |
| Receipt OCR returns structured JSON with store/items/tax/total | AIEX-01 | Requires real camera + AI service integration | Test with real camera in Expo Go, scan physical receipt |
| Confirm & Save is the only path to save from receipt flow | AIEX-03 | UI flow verification requiring visual inspection | Walk through receipt scan flow in Expo Go, verify no auto-save |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
