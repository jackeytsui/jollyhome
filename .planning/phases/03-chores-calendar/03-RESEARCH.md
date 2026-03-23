# Phase 3: chores-calendar - Research

**Researched:** 2026-03-22
**Domain:** React Native household chores, recurring scheduling, and shared calendar architecture
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Chore List Structure
- **D-01:** The chores screen uses a split layout: a personal section first ("My chores today") followed by a whole-household section below.
- **D-02:** Chores are grouped in mixed sections: urgent chores first, then organized within sections by area and assignee where useful.
- **D-03:** Default chore cards show title, assignee, area, estimated time, and condition state. Last-done details live in the detail view rather than crowding the main list.
- **D-04:** Use medium-density cards rather than ultra-compact rows or oversized tiles. The screen should feel readable and warm without wasting space.

### Condition And Completion
- **D-05:** Each chore shows both a clear condition bar and a simple color label/state so urgency is readable at a glance on mobile and web.
- **D-06:** Tapping complete opens a lightweight confirmation sheet with optional note and optional photo proof, rather than instantly marking complete with no review.
- **D-07:** Photo proof is optional and secondary by default. Households can use it when useful, but the everyday completion flow should stay fast.
- **D-08:** Fairness and completion history surface as light indicators in the main experience, with deeper stats on a dedicated detail/stats screen instead of on every card.

### Rotation And Fairness
- **D-09:** AI rotation should feel assistive, not opaque. The app should present suggested assignments with a short rationale (availability, past load, preferences) and let users adjust before confirming.
- **D-10:** Manual overrides are always allowed. AI suggestions are the default starting point, not a locked system.
- **D-11:** When a chore is missed, the rotation remains stateless and rebalances from current reality instead of cascading failures through future assignments.
- **D-12:** Fairness is measured by both task count and estimated effort/time, with a household-level fairness view per member.

### Calendar View And Density
- **D-13:** Week view is the primary power view, with month and agenda views also supported. Day view can be secondary if needed during planning, but agenda must exist for scanability on mobile.
- **D-14:** The unified calendar should be meaningfully dense but not overloaded: events remain the clearest anchors, while chores and other household activity types appear with lighter visual weight.
- **D-15:** Calendar items use per-member color coding plus event-type cues so users can distinguish who and what without reading every label.
- **D-16:** Chore-related items on the calendar should represent scheduled/assigned chore moments and condition-relevant timing, not every possible chore data point.

### Attendance And RSVP
- **D-17:** "Home tonight" / "away tonight" is a lightweight daily attendance toggle, separate from full event RSVP, because it serves meal planning and chore availability rather than formal scheduling.
- **D-18:** RSVP stays attached to household events, with simple states such as going / maybe / not going.
- **D-19:** Attendance should be editable quickly from calendar surfaces without forcing users into a full event form.

### Gamification Tone
- **D-20:** Gamification is optional and subdued by default. Adults should be able to ignore it entirely, while families can opt in.
- **D-21:** When enabled, use light-touch points/streaks/leaderboards as encouragement, not punitive mechanics.
- **D-22:** Core chore usability, fairness, and condition tracking must work cleanly with gamification fully turned off.

### Claude's Discretion
- Exact visual styling of condition bars, cards, and calendar chips within the established warm and friendly design direction
- Whether day view ships in the first plan set or a later plan within this phase, as long as week/month/agenda requirements are met
- Exact phrasing of AI rationale copy for rotation suggestions
- Detailed empty/error/loading states for chores and calendar

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHOR-01 | Create chores with title, description, duration, area | Chore template schema, bottom-sheet editor pattern, typed form fields |
| CHOR-02 | Assign chores to one or more members | `chore_assignments` table plus member-aware filters and fairness rollups |
| CHOR-03 | Flexible recurring chores | `rrule` recurrence strings plus denormalized next-occurrence fields |
| CHOR-04 | Condition bars by time elapsed | Condition computed from last completion plus recurrence target interval, not hard deadlines |
| CHOR-05 | Complete chore with optional photo proof | Completion confirmation sheet, storage bucket, signed/private URLs |
| CHOR-06 | Filter chores by assignee/area/status/urgency | Materialized list query shape, indexed household filters, sectioned UI |
| CHOR-07 | Completion history and fairness stats | Completion log table, fairness aggregates, per-member stats screen |
| CHOR-08 | Daily energy level and adapted list | `member_energy_entries` table and urgency x effort scoring layer |
| CHOR-09 | Responsibilities vs bonus tasks | `chore_kind` enum and claim/unclaim flow distinct from assigned rotation |
| CHOR-10 | Optional gamification | Feature flag/settings row and separate points/streak ledger so core flow stays clean when off |
| AICH-01 | AI fair rotation using availability, load, preferences, effort | Server-side scoring engine using calendar availability, history, preference weights |
| AICH-02 | Stateless rotation | Recompute from open chores plus current inputs; never persist brittle queue position |
| AICH-03 | Accept or adjust suggestions | Suggested assignment draft state and manual override UX |
| AICH-04 | Rebalance on unavailability/composition change | Rotation regeneration keyed off attendance/calendar/member changes |
| AICH-05 | Learn per-person task durations | Completion history stores actual minutes; fairness engine reads rolling averages |
| CALD-01 | Create household events | `calendar_events` table with title/date/time/location/description |
| CALD-02 | Flexible recurring events | Shared recurrence engine for events and chores |
| CALD-03 | Shared calendar with colors/icons | `react-native-big-calendar` plus member color metadata and event-type styling |
| CALD-04 | Unified activity timeline | Common calendar projection model over events, chores, attendance, and future feature types |
| CALD-05 | RSVP | `event_rsvps` table keyed by event/member with simple status enum |
| CALD-06 | Home tonight / away tonight | Dedicated attendance table, not a fake event or RSVP reuse |
| CALD-07 | Day/week/month/agenda | `react-native-big-calendar` stable mode set plus mobile agenda/schedule fallback |
</phase_requirements>

## Summary

This phase should be planned as two tightly-coupled domains sharing one scheduling core: a chore system built around recurring templates, generated/open work items, and completion history; and a calendar system built around real household events plus projected household activity. The biggest planning mistake would be to model chores as single rows with mutable due dates. That breaks condition bars, fairness history, AI rotation, and future rebalancing. Use template data for intent, generated instances for current/open work, and immutable completion rows for history.

For UI and client architecture, the repo already establishes the right base: Expo Router screens, local hook state, `@gorhom/bottom-sheet` for focused editors, Supabase tables/RPCs for writes, and household-scoped realtime channels for refresh. The missing pieces are a recurrence engine, DST-safe date handling, and a calendar renderer that supports the required view set. The current ecosystem fit is `react-native-big-calendar` for week/day/month/schedule rendering, `rrule` for recurrence rules, and `date-fns` with `@date-fns/tz` for calendar-safe date math.

The AI rotation should not be planned as a fragile persistent rotation queue. Plan it as a stateless scoring pass that recomputes suggestions from current open chores, household availability, recent effort, and preference weights every time relevant inputs change. That satisfies AICH-02, makes missed chores non-catastrophic, and keeps the UX aligned with the user decision that AI is assistive and adjustable.

**Primary recommendation:** Plan this phase around a shared recurrence + scheduling core: `rrule` for recurrence, `date-fns` + `@date-fns/tz` for time math, `react-native-big-calendar` for rendering, and Supabase-backed template/instance/history tables with stateless server-side rotation scoring.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | `2.99.3` | Household-scoped data, RPCs, storage, realtime | Already the project backend client; current registry version matches the repo and existing hooks |
| `react-native-big-calendar` | `4.19.0` | Shared calendar rendering for day/week/month/schedule | Stable release covers the required view set better than newer day/week-only kits |
| `rrule` | `2.8.1` | RFC 5545 recurrence parsing/serialization | Prevents custom recurrence logic from diverging across chores and events |
| `date-fns` | `4.1.0` | Date calculations, formatting, interval logic | Current date-fns release now supports timezone context integration with `@date-fns/tz` |
| `@date-fns/tz` | `1.4.1` | Timezone-safe scheduling and DST handling | Required to keep recurrence generation and calendar rendering stable across DST/Hermes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@react-native-community/datetimepicker` | `9.1.0` | Native date/time selection for event and recurrence editors | Use for event start/end, monthly anchors, and attendance day selection |
| `expo-image-picker` | `55.0.13` | Optional photo proof capture for chore completion | Use only in completion confirmation flow, never as a required step |
| `@gorhom/bottom-sheet` | `5.2.8` | Editors and confirmation sheets | Reuse existing project pattern for create/edit/complete flows |
| `react-native-gesture-handler` | `2.30.0` | Required interaction layer for bottom sheets/calendar gestures | Already in project and current stable |
| `react-native-reanimated` | `4.2.3` | Animation/gesture dependency for bottom sheet and calendar interactions | Already in project and current stable |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `react-native-big-calendar` | `@howljs/calendar-kit` | Calendar Kit is stronger for drag-heavy day/week scheduling, but its official README only advertises day/3-day/week views, not month or agenda |
| `rrule` | Custom frequency columns only | Faster to start, but chores and events will drift into duplicated recurrence logic and brittle exception handling |
| `date-fns` + `@date-fns/tz` | Native `Date` only | Simpler initially, but DST and timezone bugs will leak into recurrence, availability, and calendar grouping |

**Installation:**
```bash
npm install react-native-big-calendar rrule date-fns @date-fns/tz
npx expo install @react-native-community/datetimepicker
```

`expo-image-picker`, `@gorhom/bottom-sheet`, `react-native-gesture-handler`, `react-native-reanimated`, and `@supabase/supabase-js` are already present.

**Version verification:** Verified via `npm view` on 2026-03-22.
- `@supabase/supabase-js` `2.99.3` published 2026-03-19
- `react-native-big-calendar` `4.19.0` published 2025-11-01
- `rrule` `2.8.1` published 2023-11-10
- `date-fns` `4.1.0` published 2024-09-17
- `@date-fns/tz` `1.4.1` published 2025-08-12
- `@react-native-community/datetimepicker` `9.1.0` published 2026-03-17
- `expo-image-picker` `55.0.13` published 2026-03-17
- `@gorhom/bottom-sheet` `5.2.8` published 2025-12-04

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/(app)/
│   ├── chores.tsx                  # Household chores entry, split list, filters
│   ├── calendar.tsx                # Shared calendar shell, view switcher
│   └── chores/[id].tsx             # Chore detail/history/stats if routed separately
├── components/
│   ├── chores/                     # Cards, filters, completion sheet, fairness widgets
│   └── calendar/                   # Calendar shell, chips, attendance strip, event sheet
├── hooks/
│   ├── useChores.ts                # Query/mutate chore templates, instances, completions
│   ├── useCalendar.ts              # Query/project calendar data
│   ├── useAttendance.ts            # Home-tonight toggles
│   └── useChoreRotation.ts         # Suggested assignments + accept/override actions
├── lib/
│   ├── recurrence.ts               # RRULE serialize/parse helpers
│   ├── condition.ts                # Condition bar thresholds and urgency score
│   ├── fairness.ts                 # Shared scoring helpers
│   └── calendarProjection.ts       # Map DB rows to calendar events
└── types/
    ├── chores.ts
    └── calendar.ts
```

### Pattern 1: Template -> Instance -> Completion
**What:** Model recurring chores as durable templates, create/open chore instances for actionable work, and append immutable completion rows with notes/photo metadata/actual duration.
**When to use:** Every recurring or assignable chore. This is the default model for CHOR-01..09 and AICH-01..05.
**Why:** It separates intent, current state, and history. That keeps condition bars honest and fairness stats queryable.
**Example:**
```typescript
type ChoreTemplate = {
  id: string;
  householdId: string;
  title: string;
  estimatedMinutes: number;
  area: string;
  recurrenceRule: string | null;
  cadenceDays: number | null;
  kind: 'responsibility' | 'bonus';
};

type ChoreInstance = {
  id: string;
  templateId: string;
  scheduledFor: string | null;
  status: 'open' | 'claimed' | 'completed' | 'skipped';
};

type ChoreCompletion = {
  id: string;
  instanceId: string;
  completedBy: string;
  completedAt: string;
  actualMinutes: number | null;
  note: string | null;
  photoPath: string | null;
};
```

### Pattern 2: Shared Recurrence Engine For Chores And Events
**What:** Store recurrence as RRULE strings plus a few denormalized fields for sorting/filtering (`next_occurrence_at`, `anchor_date`, `timezone`).
**When to use:** CHOR-03 and CALD-02. Also use it anywhere future phases project timeline data into the shared calendar.
**Why:** One recurrence engine avoids separate chore/event schedule bugs.
**Example:**
```typescript
import { datetime, RRule } from 'rrule';

export function buildWeeklyWeekdayRule(start: Date, weekdays: number[]) {
  return new RRule({
    freq: RRule.WEEKLY,
    byweekday: weekdays,
    dtstart: datetime(
      start.getUTCFullYear(),
      start.getUTCMonth() + 1,
      start.getUTCDate(),
      start.getUTCHours(),
      start.getUTCMinutes()
    ),
  }).toString();
}
```
Source: https://github.com/jkbrzt/rrule

### Pattern 3: Timezone-Safe Calendar Math At The Boundary
**What:** Normalize recurrence generation and date grouping through `date-fns` + `@date-fns/tz` helpers rather than mixing `new Date()` math through screens and hooks.
**When to use:** Calendar grouping, next-occurrence calculation, attendance day boundaries, and AI availability windows.
**Why:** DST bugs are hard to notice until production and will silently corrupt fairness and recurrence.
**Example:**
```typescript
import { TZDate } from '@date-fns/tz';
import { addHours } from 'date-fns';

const base = new TZDate(2026, 2, 8, 18, 0, 'America/Toronto');
const end = addHours(base, 2);
```
Source: https://github.com/date-fns/tz

### Pattern 4: Stateless Rotation Suggestions
**What:** Compute suggested assignments from current open chores and current member signals instead of mutating a long-lived queue.
**When to use:** Every AI suggestion/rebalance pass.
**Why:** This is the cleanest way to satisfy AICH-02 and AICH-04.
**Recommended scoring inputs:**
- availability weight from calendar overlaps + `home tonight`
- rolling effort contributed over trailing 14/30 days
- rolling task count contributed over trailing 14/30 days
- chore preference weight
- energy level multiplier for today
- missed/open task penalty cap so one user is not endlessly deprioritized

### Pattern 5: Unified Calendar Projection Layer
**What:** Create one client projection type that maps raw events, chore moments, attendance states, and future household activity types into the calendar component.
**When to use:** CALD-03, CALD-04, CALD-06, CALD-07.
**Why:** The calendar renderer should not know Supabase table specifics.
**Example shape:**
```typescript
type HouseholdCalendarItem = {
  id: string;
  sourceType: 'event' | 'chore' | 'attendance' | 'meal' | 'maintenance' | 'guest' | 'quiet-hours' | 'booking';
  title: string;
  startsAt: string;
  endsAt: string;
  primaryMemberId: string | null;
  visualWeight: 'primary' | 'secondary';
  iconKey: string;
};
```

### Anti-Patterns to Avoid
- **Single-row recurring chores:** Updating one chore row forever destroys history and makes fairness impossible to audit.
- **Deadline semantics for condition bars:** Condition is elapsed-time urgency, not missed-deadline status.
- **Separate recurrence logic for events and chores:** Duplicated date math guarantees divergence.
- **Persistent AI queue position:** Missing one task should not poison future rotations.
- **Treating attendance as RSVP reuse:** `home tonight` has different semantics and downstream consumers than event RSVP.
- **Using every activity type at equal visual weight in calendar cells:** Events must stay visually dominant per locked decision D-14.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Flexible recurring schedules | Custom columns plus ad hoc date loops | `rrule` | RFC 5545 edge cases, weekday math, and serialization are already solved |
| Timezone/DST-safe recurrence expansion | Native `Date` arithmetic scattered across hooks | `date-fns` + `@date-fns/tz` | DST shifts and day-boundary bugs will break both chores and calendar |
| Calendar layout/overlap rendering | Custom week/month grid engine | `react-native-big-calendar` | Overlap, scroll sync, and multiple view modes are expensive to build well |
| Native date/time inputs | Custom text-based datetime forms | `@react-native-community/datetimepicker` | Platform-native affordances are more reliable and accessible |
| Photo capture flow | Custom camera/storage permission stack for proof photos | `expo-image-picker` + Supabase Storage | The project already has Expo; reuse the maintained capture path |

**Key insight:** Hand-rolled recurrence and time math are the highest-risk traps in this phase. They will look simple during implementation and become extremely expensive once real households cross DST, monthly schedules, or partial attendance changes.

## Common Pitfalls

### Pitfall 1: Modeling Condition As A Due Date
**What goes wrong:** Chores become binary overdue/not-overdue tasks instead of gradual urgency.
**Why it happens:** Teams reuse task/deadline mental models instead of Tody-style elapsed-time condition.
**How to avoid:** Store last completion, target cadence, and compute a normalized urgency ratio that feeds both bar fill and green/yellow/red state.
**Warning signs:** Users see “late” chores that were actually optional until the bar drifted red.

### Pitfall 2: Infinite Row Generation For Recurrence
**What goes wrong:** Future rows explode in volume and edits require backfilling many generated records.
**Why it happens:** Recurrence is treated as pre-expanded data instead of rules plus generated/open instances.
**How to avoid:** Keep RRULE on templates, materialize only the actionable window, and regenerate suggestions on demand.
**Warning signs:** Backfills, cron jobs, or migration scripts start touching thousands of future event rows.

### Pitfall 3: DST Bugs In Recurrence
**What goes wrong:** Weekly chores/events shift by an hour or land on the wrong local day.
**Why it happens:** JS `Date` constructors and local offsets are mixed with UTC recurrence strings.
**How to avoid:** Use UTC-safe RRULE construction and timezone-aware boundary math with `@date-fns/tz`.
**Warning signs:** A recurring Sunday item moves after DST or differs between web/mobile time zones.

### Pitfall 4: AI Rotation As A Stateful Queue
**What goes wrong:** One missed chore cascades into unfair or broken future assignments.
**Why it happens:** The system stores “whose turn is next” as durable state.
**How to avoid:** Persist signals and history, not turn order. Recompute suggestions from current open chores plus current availability.
**Warning signs:** “Repair” buttons, manual queue resets, or users asking why everything shifted after one miss.

### Pitfall 5: Overweight Calendar Projection
**What goes wrong:** Calendar becomes unreadable because chores, attendance, and events all compete equally.
**Why it happens:** Every source item is rendered as a full event with identical prominence.
**How to avoid:** Project into a unified type with explicit visual weight and source-specific styling.
**Warning signs:** Month view becomes text soup and users cannot spot actual events.

### Pitfall 6: Attendance Modeled As A Fake Event
**What goes wrong:** `home tonight` becomes hard to edit quickly and awkward to consume for AI rotation.
**Why it happens:** It seems cheaper to store attendance as a calendar event row.
**How to avoid:** Use a dedicated attendance table keyed by household/member/date with a simple status enum.
**Warning signs:** RSVP logic starts leaking into attendance or meal/chore consumers need event-specific parsing.

## Code Examples

Verified patterns from official sources:

### RRULE Serialization
```typescript
import { datetime, RRule } from 'rrule';

const rule = new RRule({
  freq: RRule.WEEKLY,
  byweekday: [RRule.MO, RRule.FR],
  dtstart: datetime(2026, 3, 22, 10, 0),
});

const storedRule = rule.toString();
```
Source: https://github.com/jkbrzt/rrule

### Timezone-Safe Date Context
```typescript
import { isSameDay } from 'date-fns';
import { tz } from '@date-fns/tz';

const sameCalendarDay = isSameDay(
  '2026-03-22T23:00:00-04:00',
  '2026-03-23T10:00:00+08:00',
  { in: tz('America/Toronto') }
);
```
Source: https://github.com/date-fns/tz

### Calendar Component Shell
```tsx
import { Calendar } from 'react-native-big-calendar';

export function HouseholdCalendar({ events }) {
  return (
    <Calendar
      events={events}
      mode="week"
      height={640}
    />
  );
}
```
Source: https://github.com/acro5piano/react-native-big-calendar

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Local-time date math only | `date-fns` v4 timezone context with `@date-fns/tz` | `date-fns` `4.0.0` on 2024-09-16 | Timezone-safe comparisons and recurrence grouping are easier to implement correctly |
| Basic frequency columns without standards | RFC 5545 RRULE strings plus parser/serializer | Long-standing standard; use current `rrule` `2.8.1` | Better recurrence portability and less custom logic |
| Drag-first day/week calendar kits | Stable calendar renderers selected by required view coverage | As of 2026-03-22 | For this app, month + schedule support matters more than drag-heavy interactions |

**Deprecated/outdated:**
- Ad hoc “next due date only” recurrence for chores: insufficient for weekday patterns, monthly anchors, and future exception support.
- Persistent rotation queues: directly conflicts with AICH-02 stateless behavior.

## Open Questions

1. **How much of CALD-04 should Phase 3 render now for future activity types not yet implemented?**
   - What we know: The requirement says the calendar is the unified activity timeline, but meals, maintenance, guests, quiet hours, and bookings ship later.
   - What's unclear: Whether Phase 3 must ship placeholder projections for future types or just an extensible projection model.
   - Recommendation: Plan Phase 3 to ship the extensible projection model now and render the activity types that actually exist in this phase: events, chores, attendance. Reserve future source types in enums/types to avoid schema churn.

2. **Should day view be a Phase 3 must-have in the first implementation wave?**
   - What we know: CALD-07 requires day/week/month with agenda, but discretion explicitly allows day view to ship later within the phase if week/month/agenda are met.
   - What's unclear: Whether product validation needs day view immediately or only before phase completion.
   - Recommendation: Plan week + month + agenda first, then add day view in a later plan unless implementation effort is trivial once `react-native-big-calendar` is in place.

3. **How should AI rotation be implemented relative to OpenAI usage?**
   - What we know: Existing AI features already use Supabase Edge Functions. Rotation must be explainable, adjustable, and stateless.
   - What's unclear: Whether the household needs an LLM to generate assignments or only to explain deterministic scoring.
   - Recommendation: Plan deterministic server-side scoring as the source of truth. Use LLM only for optional rationale text if needed after the rule engine works.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | App/test/scripts | ✓ | `v25.6.1` | — |
| npm | Package install/test | ✓ | `11.9.0` | — |
| Expo CLI | App run / package compatibility via `npx expo` | ✓ | `55.0.18` | — |
| Supabase CLI | Migrations / Edge Functions | ✓ via `npx` | `2.83.0` | Use `npx supabase ...` instead of global install |
| Git | Phase commits | ✓ | `2.39.5` | — |
| Deno | Direct Edge Function local execution | ✗ | — | Use Supabase CLI wrapper instead |
| Supabase env vars in current shell | Local app/function execution | ✗ | — | Load from shell or env file before execution |
| OpenAI API key in current shell | AI rotation/rationale Edge Function testing | ✗ | — | Set explicitly before local Edge Function testing |

**Missing dependencies with no fallback:**
- None identified for planning. Execution will need Supabase/OpenAI env configuration before AI flows can be tested locally.

**Missing dependencies with fallback:**
- Global `supabase` binary missing. `npx supabase` works and should be used in plans.
- `deno` binary missing. Supabase CLI is sufficient for normal Edge Function workflows.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest `30.3.0` with `jest-expo` `55.0.11` |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- chores` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHOR-01 | Chore create validation + persistence mapping | unit | `npm test -- chores.test.ts` | ❌ Wave 0 |
| CHOR-02 | Multi-member assignment persistence | unit | `npm test -- chore-rotation.test.ts` | ❌ Wave 0 |
| CHOR-03 | Recurrence rule build/parse | unit | `npm test -- recurrence.test.ts` | ❌ Wave 0 |
| CHOR-04 | Condition bar state thresholds | unit | `npm test -- condition.test.ts` | ❌ Wave 0 |
| CHOR-05 | Completion flow with optional photo metadata | unit | `npm test -- chore-completion.test.ts` | ❌ Wave 0 |
| CHOR-06 | Filter combinations | unit | `npm test -- chores-filters.test.ts` | ❌ Wave 0 |
| CHOR-07 | Fairness aggregate calculations | unit | `npm test -- fairness.test.ts` | ❌ Wave 0 |
| CHOR-08 | Energy-adapted prioritization | unit | `npm test -- energy-priority.test.ts` | ❌ Wave 0 |
| CHOR-09 | Responsibility vs bonus-task rules | unit | `npm test -- chores-kind.test.ts` | ❌ Wave 0 |
| CHOR-10 | Gamification off/on behavior boundaries | unit | `npm test -- gamification.test.ts` | ❌ Wave 0 |
| AICH-01 | Rotation suggestions combine availability/load/preferences | unit | `npm test -- chore-rotation.test.ts` | ❌ Wave 0 |
| AICH-02 | Missed task does not corrupt future suggestions | unit | `npm test -- chore-rotation.test.ts` | ❌ Wave 0 |
| AICH-03 | Manual override path preserves accepted edits | integration | `npm test -- chores-screen.test.tsx` | ❌ Wave 0 |
| AICH-04 | Rebalance after unavailability change | unit | `npm test -- chore-rotation.test.ts` | ❌ Wave 0 |
| AICH-05 | Actual durations update fairness/effort estimation | unit | `npm test -- fairness.test.ts` | ❌ Wave 0 |
| CALD-01 | Event create/edit validation | unit | `npm test -- calendar-events.test.ts` | ❌ Wave 0 |
| CALD-02 | Event recurrence projection | unit | `npm test -- recurrence.test.ts` | ❌ Wave 0 |
| CALD-03 | Member colors and type cues projection | unit | `npm test -- calendar-projection.test.ts` | ❌ Wave 0 |
| CALD-04 | Unified activity projection order/weighting | unit | `npm test -- calendar-projection.test.ts` | ❌ Wave 0 |
| CALD-05 | RSVP state transitions | unit | `npm test -- rsvp.test.ts` | ❌ Wave 0 |
| CALD-06 | Home-tonight attendance toggle and storage mapping | unit | `npm test -- attendance.test.ts` | ❌ Wave 0 |
| CALD-07 | View-mode selector and agenda fallback | integration | `npm test -- calendar-screen.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- <target>`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/recurrence.test.ts` — recurrence generation, parsing, timezone safety
- [ ] `src/__tests__/condition.test.ts` — condition threshold math
- [ ] `src/__tests__/fairness.test.ts` — effort/task fairness calculations
- [ ] `src/__tests__/chore-rotation.test.ts` — stateless rotation scoring and rebalance logic
- [ ] `src/__tests__/calendar-projection.test.ts` — unified calendar projection mapping
- [ ] `src/__tests__/attendance.test.ts` — `home tonight` state behavior
- [ ] `src/__tests__/chores-screen.test.tsx` — create/complete/filter UX shell
- [ ] `src/__tests__/calendar-screen.test.tsx` — week/month/agenda mode shell

## Sources

### Primary (HIGH confidence)
- https://github.com/jkbrzt/rrule - RRULE support, timezone notes, serialization examples
- https://github.com/date-fns/tz - timezone-safe date handling, Hermes polyfill requirement, `tz()` context examples
- https://docs.expo.dev/versions/latest/sdk/date-time-picker/ - Expo-supported datetime picker package and install flow
- https://supabase.com/docs/guides/database/postgres/row-level-security - RLS requirements and `auth.uid()` policy pattern
- https://supabase.com/docs/guides/storage/serving/downloads - public vs private bucket access model

### Secondary (MEDIUM confidence)
- https://github.com/acro5piano/react-native-big-calendar - supported calendar modes and React Native usage pattern
- https://github.com/howljs/react-native-calendar-kit - alternative calendar kit feature set used for comparison
- https://developers.google.com/optimization/flow/assignment_min_cost_flow - assignment-problem framing for fairness optimization; useful conceptually but not a direct TypeScript/Edge runtime fit

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package versions verified from npm on 2026-03-22 and capabilities checked against official docs/READMEs
- Architecture: MEDIUM - local repo patterns are clear, but the AI rotation implementation recommendation is partly inferred from requirements rather than a single official source
- Pitfalls: HIGH - recurrence/timezone/state pitfalls are strongly supported by official library docs and existing project history

**Research date:** 2026-03-22
**Valid until:** 2026-04-21
