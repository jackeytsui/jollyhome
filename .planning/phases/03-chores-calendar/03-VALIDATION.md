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
| 03-01-01 | 01 | 1 | CHOR-03, CHOR-04, CHOR-07, CHOR-08, AICH-05, CALD-02, CALD-04, CALD-06 | unit | `npm test -- --runInBand src/__tests__/chores-core.test.ts src/__tests__/calendar-core.test.ts src/__tests__/fairness-condition.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | CALD-04 | static | `rg -n "export interface (ChoreTemplate|ChoreFairnessStats|HouseholdCalendarItem|AttendanceStatus)|sourceType: 'event' \\| 'chore' \\| 'attendance' \\| 'meal' \\| 'maintenance' \\| 'guest' \\| 'quiet-hours' \\| 'booking'|iconKey|visualWeight" src/types/chores.ts src/types/calendar.ts` | ❌ W0 | ⬜ pending |
| 03-05-01 | 05 | 2 | CHOR-01, CHOR-02, CHOR-05, CHOR-07, CHOR-08, CHOR-09, CALD-01, CALD-02, CALD-05, CALD-06 | schema | `rg -n "CREATE TABLE public\\.(chore_templates|chore_instances|chore_completions|calendar_events|event_rsvps|member_attendance)|CHECK \\(kind IN \\('responsibility', 'bonus'\\)\\)|CHECK \\(status IN \\('home_tonight', 'away_tonight'\\)\\)|CHECK \\(status IN \\('going', 'maybe', 'not_going'\\)\\)|CREATE OR REPLACE FUNCTION public\\.(complete_chore_instance|claim_bonus_chore|upsert_attendance_status)|ENABLE ROW LEVEL SECURITY" supabase/migrations/00004_chores_calendar.sql` | ❌ W0 | ⬜ pending |
| 03-05-02 | 05 | 2 | CHOR-03, CHOR-04, CHOR-07, CHOR-08, AICH-05, CALD-02, CALD-04, CALD-06 | unit | `npm test -- --runInBand src/__tests__/chores-core.test.ts src/__tests__/calendar-core.test.ts src/__tests__/fairness-condition.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 3 | CHOR-01, CHOR-02, CHOR-03, CHOR-04, CHOR-05, CHOR-06, CHOR-09 | component | `npm test -- --runInBand src/__tests__/chores-ui.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 3 | CHOR-05, CHOR-09 | component | `npm test -- --runInBand src/__tests__/chores-ui.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | CALD-01, CALD-02, CALD-03, CALD-05, CALD-06 | component | `npm test -- --runInBand src/__tests__/calendar-ui.test.ts` | ❌ W0 | ⬜ pending |
| 03-06-01 | 06 | 4 | CHOR-07 | component | `npm test -- --runInBand src/__tests__/chores-stats-energy.test.ts` | ❌ W0 | ⬜ pending |
| 03-06-02 | 06 | 4 | CHOR-08, CHOR-10 | component | `npm test -- --runInBand src/__tests__/chores-stats-energy.test.ts` | ❌ W0 | ⬜ pending |
| 03-07-01 | 07 | 4 | CALD-03, CALD-04, CALD-07 | integration | `npm test -- --runInBand src/__tests__/calendar-ui.test.ts src/__tests__/calendar-projection.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 5 | AICH-01, AICH-02, AICH-04, AICH-05 | unit | `npm test -- --runInBand src/__tests__/chore-rotation.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-02 | 04 | 5 | AICH-03, CHOR-05, CHOR-06, CALD-05, CALD-06, SYNC-07 | integration | `npm test -- --runInBand src/__tests__/chore-rotation.test.ts src/__tests__/phase3-flows.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/chores-core.test.ts` — Wave 1 scaffold suite for recurrence, condition-bar, and chore contract coverage used by Plan `03-01` then converted by `03-05`
- [ ] `src/__tests__/calendar-core.test.ts` — Wave 1 scaffold suite for recurrence, attendance day-boundary, and calendar contract coverage used by Plan `03-01` then converted by `03-05`
- [ ] `src/__tests__/fairness-condition.test.ts` — Wave 1 scaffold suite for fairness rollups, energy scoring, and learned-duration coverage used by Plans `03-01` and `03-05`
- [ ] `src/__tests__/chores-ui.test.ts` — Wave 3 chores screen coverage for list layout, filters, editor flow, claim flow, and completion sheet
- [ ] `src/__tests__/calendar-ui.test.ts` — Wave 3 and Wave 4 calendar control/render coverage for event editor, RSVP, attendance, icon cues, and day/week/month/agenda controls
- [ ] `src/__tests__/chores-stats-energy.test.ts` — Wave 4 detail/fairness/energy/gamification coverage including non-punitive gamification behavior
- [ ] `src/__tests__/calendar-projection.test.ts` — Wave 4 unified household timeline projection and agenda rendering coverage
- [ ] `src/__tests__/chore-rotation.test.ts` — Wave 5 stateless rotation scoring and rebalance coverage including household roster changes
- [ ] `src/__tests__/phase3-flows.test.ts` — Wave 5 end-to-end phase flows for apply-rotation UX and home/calendar sync

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
