---
phase: 02-expense-tracking-receipt-ocr
plan: 07
subsystem: ai
tags: [openai, gpt-4o-mini, edge-function, natural-language, supabase-functions, react-native, animation]

# Dependency graph
requires:
  - phase: 02-expense-tracking-receipt-ocr/02-05
    provides: "useExpenses, useBalances, computeBalances, simplifyDebts from expenseMath, QuickAddCard with prefilled/confidenceFlags props"
  - phase: 02-expense-tracking-receipt-ocr/02-01
    provides: "AI credits table (ai_credits) in Supabase, credit meter infrastructure"
  - phase: 02-expense-tracking-receipt-ocr/02-02
    provides: "QuickAddCard component with prefilled and confidenceFlags props"
provides:
  - "supabase/functions/parse-nl-expense/index.ts: Deno Edge Function that parses NL sentences into structured expense fields via GPT-4o-mini; deducts 1 AI credit per parse; returns confidence_flags for guessed fields"
  - "src/components/expenses/JollyNLInput.tsx: Functional NL text field with Sparkles icon, focus ring, parsing indicator, toast feedback, success/error haptics, onParsed callback"
  - "src/components/expenses/JollyParsingIndicator.tsx: Three-dot looping fade animation component with Jolly sparkle icon"
  - "Phase 1 balance stubs fully replaced: both LeaveHouseholdDialog and RemoveMemberDialog callers now show real outstanding balances from expense + settlement queries"
affects: [phase-03, future-ai-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase Edge Function with OpenAI gpt-4o-mini for fast NL text parsing (< 1s, response_format json_object)"
    - "Confidence flags pattern: AI returns array of field names it guessed; UI highlights those fields with accent border"
    - "Toast feedback via Animated.View slide-in/out (no third-party toast library)"
    - "Credit check before AI call, credit deduction after successful parse"

key-files:
  created:
    - supabase/functions/parse-nl-expense/index.ts
    - src/components/expenses/JollyNLInput.tsx
    - src/components/expenses/JollyParsingIndicator.tsx
  modified:
    - src/app/(app)/finances.tsx
    - src/app/(app)/(home)/members.tsx
    - src/app/(app)/settings/household.tsx

key-decisions:
  - "Jolly NL toast uses Animated.View slide-in/fade-out (not a library) to avoid adding dependencies"
  - "Credit deduction uses fetch-then-update pattern (not RPC) to avoid requiring a custom SQL function for this simple operation"
  - "Edge Function maps member names to IDs server-side using household_members input — avoids a second round-trip from client"
  - "getOutstandingBalance uses computeBalances() from expenseMath.ts + settlement adjustment, consistent with balance computation pattern throughout Phase 2"

patterns-established:
  - "Pattern: JollyParsingIndicator uses withDelay + withRepeat + withSequence for staggered dot animation — reuse for other looping animations"
  - "Pattern: NL input onParsed callback pre-fills QuickAddCard and opens bottom sheet — same flow for any AI-assisted entry"

requirements-completed: [EXPN-01, EXPN-09]

# Metrics
duration: 4min
completed: 2026-03-21
---

# Phase 02 Plan 07: Jolly NL Parsing + Balance Stub Replacement Summary

**GPT-4o-mini NL expense parsing Edge Function with JollyNLInput component, animated parsing indicator, and real outstanding balance queries replacing Phase 1 stubs**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-21T13:12:48Z
- **Completed:** 2026-03-21T13:16:52Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Built Jolly's key differentiator: the NL parsing Edge Function uses GPT-4o-mini to convert "Pizza with Jake, $42" into pre-filled expense form fields with confidence flags for guessed values
- JollyNLInput component wired into finances.tsx: typing dots animation while parsing, toast feedback in Jolly's tone, opens QuickAddCard bottom sheet pre-populated with parsed values
- Replaced both Phase 1 TODO(Phase-2) balance stubs with real computeBalances() + settlement queries so LeaveHouseholdDialog and RemoveMemberDialog show actual outstanding balances

## Task Commits

Each task was committed atomically:

1. **Task 1: Jolly NL parsing Edge Function and JollyNLInput component** - `e501475` (feat)
2. **Task 2: Wire Phase 1 balance stubs to real expense data** - `0a33e42` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `supabase/functions/parse-nl-expense/index.ts` - Deno Edge Function: validates auth, checks/deducts AI credits, calls gpt-4o-mini with json_object response format, maps member names to IDs, returns confidence_flags
- `src/components/expenses/JollyNLInput.tsx` - TextInput with Sparkles icon, focus ring, JollyParsingIndicator during parsing, Animated.View toast, haptic feedback, onParsed callback
- `src/components/expenses/JollyParsingIndicator.tsx` - Three-dot fade animation (withRepeat/withSequence/withDelay staggered 133ms) with Sparkles icon
- `src/app/(app)/finances.tsx` - Replaced disabled TextInput with functional JollyNLInput; handleJollyParsed opens QuickAddCard with prefilled + confidenceFlags; QuickAddCard wired with nlPrefilled/nlConfidenceFlags state
- `src/app/(app)/(home)/members.tsx` - getOutstandingBalance replaced: real expenses+expense_splits query, computeBalances(), settlement adjustment; LeaveHouseholdDialog callers show real balance
- `src/app/(app)/settings/household.tsx` - Same getOutstandingBalance replacement; RemoveMemberDialog caller shows real balance; no TODO(Phase-2) markers remain

## Decisions Made

- Jolly toast uses Animated.View slide-in/fade-out (no library) to avoid adding dependencies for a simple transient UI element
- Credit deduction in Edge Function uses fetch-current-then-update pattern rather than a custom Postgres RPC, keeping the function self-contained without requiring a new SQL function migration
- Edge Function maps member names to IDs server-side using the household_members array passed in the request — avoids a client-side mapping pass and a second Supabase round-trip
- getOutstandingBalance reuses computeBalances() from expenseMath.ts (Phase 2 Plan 01) with a settlement adjustment loop — consistent with the rest of the balance computation pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration for the NL parsing Edge Function:**

- Set `OPENAI_API_KEY` as a Supabase Edge Function secret:
  - Via dashboard: Supabase Dashboard -> Project Settings -> Edge Functions -> Secrets
  - Via CLI: `supabase secrets set OPENAI_API_KEY=sk-...`

Without this secret, the Edge Function returns 500 and the JollyNLInput shows an error toast.

## Next Phase Readiness

- Phase 2 is complete. All 7 plans executed across all waves.
- The full expense tracking feature is built: manual entry, NL parsing, receipt OCR, balance computation, settlements, recurring expenses, expense history, disputes.
- Phase 3 (chores + calendar) can begin — no blockers from Phase 2.

---
*Phase: 02-expense-tracking-receipt-ocr*
*Completed: 2026-03-21*
