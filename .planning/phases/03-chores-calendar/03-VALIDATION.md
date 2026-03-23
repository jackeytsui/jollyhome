---
phase: 03
slug: chores-calendar
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-22
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 30.x |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- --runInBand` |
| **Full suite command** | `npm run test:coverage -- --runInBand` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --runInBand`
- **After every plan wave:** Run `npm run test:coverage -- --runInBand`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | CHOR-01, CHOR-02, CHOR-03, CHOR-04, CHOR-09 | unit | `npm test -- --runInBand src/__tests__/chores-core.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 0 | CALD-01, CALD-02, CALD-04, CALD-06 | unit | `npm test -- --runInBand src/__tests__/calendar-core.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 0 | CHOR-04, CHOR-07, CHOR-08, AICH-05 | unit | `npm test -- --runInBand src/__tests__/fairness-condition.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | CHOR-01, CHOR-02, CHOR-05, CHOR-06, CHOR-09, CHOR-10 | component | `npm test -- --runInBand src/__tests__/chores-ui.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | CHOR-07, CHOR-08, CHOR-10 | component | `npm test -- --runInBand src/__tests__/chores-stats-energy.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 1 | CALD-01, CALD-03, CALD-05, CALD-06, CALD-07 | component | `npm test -- --runInBand src/__tests__/calendar-ui.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 1 | CALD-02, CALD-04, SYNC-07 | unit | `npm test -- --runInBand src/__tests__/calendar-projection.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 2 | AICH-01, AICH-02, AICH-03, AICH-04, AICH-05, SYNC-07 | unit | `npm test -- --runInBand src/__tests__/chore-rotation.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-02 | 04 | 2 | CHOR-05, CHOR-06, CALD-05, CALD-06 | integration | `npm test -- --runInBand src/__tests__/phase3-flows.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/chores-core.test.ts` — recurrence, condition-bar, and chore template/instance coverage stubs
- [ ] `src/__tests__/calendar-core.test.ts` — event recurrence, attendance day-boundary, and projection coverage stubs
- [ ] `src/__tests__/fairness-condition.test.ts` — fairness rollup, energy scoring, and actual-duration learning stubs
- [ ] `src/__tests__/chores-ui.test.ts` — chores list, filters, completion sheet, and gamification toggle coverage
- [ ] `src/__tests__/chores-stats-energy.test.ts` — stats surface and energy-adapted list coverage
- [ ] `src/__tests__/calendar-ui.test.ts` — week/month/agenda rendering and RSVP/attendance surface coverage
- [ ] `src/__tests__/calendar-projection.test.ts` — unified activity timeline projection coverage
- [ ] `src/__tests__/chore-rotation.test.ts` — stateless AI rotation scoring and rebalance coverage
- [ ] `src/__tests__/phase3-flows.test.ts` — high-value phase flows with mocked hooks/store state

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Calendar week/month/agenda interaction feels usable on device | CALD-03, CALD-07 | Jest can verify render branches, not gesture quality or density | Launch Expo on iOS or Android, switch between week/month/agenda, confirm events stay readable, no clipped headers, and agenda remains scannable on narrow screens |
| Optional photo proof from completion sheet works with native picker permissions | CHOR-05 | Expo image picker and device permission flows require runtime/device validation | Mark a chore complete, attach and remove a photo, deny then allow permission, confirm completion still works without photo |
| Realtime household updates propagate across two active clients | CHOR-02, CHOR-05, CALD-01, CALD-05, CALD-06 | Local unit tests cannot prove Supabase realtime behavior end-to-end | Open two sessions in the same household, create or complete a chore and update RSVP/attendance in one client, confirm the second client refreshes within expected realtime latency |
| AI rotation suggestions remain explainable and adjustable | AICH-01, AICH-03, AICH-04 | Quality of rationale copy and override UX is partly behavioral | Trigger rotation suggestions with different availability states, verify rationale mentions availability/load/preferences, then manually override and confirm the accepted assignments persist |
| Condition bars match elapsed-time reality around timezone/day-boundary edges | CHOR-04, CALD-06, SYNC-07 | DST/day-boundary regressions are hard to capture exhaustively in component tests | Seed chores with last-completed timestamps around midnight and DST changes, verify displayed urgency and attendance day grouping on device for `America/Toronto` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-22
