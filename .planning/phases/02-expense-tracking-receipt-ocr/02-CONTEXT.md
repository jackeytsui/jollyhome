# Phase 2: Expense Tracking + Receipt OCR - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Full expense splitting, balance tracking with debt simplification, and AI receipt scanning -- replacing Splitwise entirely. Users can add expenses (manual, NL via Jolly, or receipt scan), split them multiple ways, view simplified balances, settle debts with payment app deep links, and manage recurring expenses.

Requirements: EXPN-01..14, AIEX-01..03

</domain>

<decisions>
## Implementation Decisions

### Expense Entry Flow
- **Quick-add first**: Default view is minimal (amount, description, split type, members). "More details" expands to category, notes, receipt, date, tax/tip, privacy toggle
- **Jolly NL input**: "Tell Jolly..." text field at the **top of the expenses tab**. User types a sentence (e.g., "Grocery shopping at Costco: 241.85, split between me and Jake, Sarah pays 40%") and Jolly parses it into a pre-filled quick-add card for confirmation
- **NL confirmation**: Jolly pre-fills the standard quick-add form with parsed values. User can edit any field before tapping "Add". Same UI as manual entry, just auto-populated
- **Single expense per NL sentence**: No batch parsing. One sentence = one expense. Simple and predictable
- **Smart default split**: Default to "equal split with all members". Tap to change split type (equal/percentage/exact/shares/weighted)
- **Jolly tone**: Friendly but brief -- "Got it! Costco groceries, $241.85, split with Jake and Sarah." No over-explaining
- **Ambiguous NL handling**: Jolly fills what it can, uses smart defaults for the rest (equal split with all members). Highlights guessed fields with subtle indicator so user knows what to check

### Split Types
- Four split types: equal, custom percentages, exact amounts, shares
- **Weighted household shares via presets**: Household settings page where admin defines named split presets (e.g., "Rent split: A=40%, B=35%, C=25%"). Presets appear in split type dropdown for quick reuse
- **Single currency per household**: Household sets one currency in settings. All expenses in that currency

### Categories
- **Auto-suggest as you type**: Jolly suggests a category chip below description based on text (e.g., "Costco" -> "Groceries"). Tap to change from a picker list
- Household can add custom categories beyond defaults
- AI-powered smart suggestions (EXPN-09)

### Tax & Tip
- Not shown in quick-add by default. Available in "More details" expansion
- Auto-distributed proportionally among split members
- Receipt scans auto-extract tax and tip

### Edit, Delete & Disputes
- **Edit with audit trail**: Creator can edit any field. Each edit creates a version in change history visible to all involved members. Members notified of changes
- **Soft delete**: Delete marks expense as deleted with "Deleted by X" visible in history
- **Disputes**: Flag + comment thread. Tap "Dispute" on any expense, add a note. Opens a comment thread where involved members discuss and resolve. Disputed expenses show a warning badge

### Privacy
- **Default public, toggle private**: Expenses visible to all household members by default. Toggle "Private" to restrict to only members involved in the split. Simple binary

### Balance & Settlement UX
- **Net balance summary**: Top of expenses tab shows each member's net balance (green = owed money, red = owes money). Tap a member for simplified debt details
- **Collapsible header card**: Balance summary in a card that collapses as you scroll down into expenses
- **Debt simplification**: Automatic (A->B + B->C = A->C). Simplification UX details at Claude's discretion
- **Settlement flow**: Tap "Settle up" on a debt, choose full or partial amount. After marking settled, show optional deep links to Venmo/CashApp/PayPal/Zelle pre-filled with amount
- **Payment app preferences**: Each member configures preferred payment app + username in their profile settings. Settlement screens highlight their preferred app first
- **Settlement history**: Tap a member's balance to see log of past settlements (date, amount, method, running balance over time)

### Receipt Scanning (AIEX-01..03)
- **Camera flow**: Tap scan button -> camera with receipt framing guide -> auto-capture when receipt detected (or manual shutter) -> AI extracts in background (<4s) -> review card with store, items, prices, tax, total
- **Gallery upload supported**: User can also pick receipt photo from camera roll
- **Multi-page receipt stitching**: Can scan multiple photos for one long receipt (Costco-length). AI stitches items from all pages
- **Item classification (AIEX-02)**: Color-coded tags per item -- green "Shared" or orange "Personal: [Member name]". AI pre-classifies based on item names and household patterns. Tap any tag to toggle or reassign
- **Mandatory review step (AIEX-03)**: User MUST review and confirm extracted data before saving. Edit any field inline
- **Receipt-to-split summary**: After classification, auto-calculate split showing shared items total per person + personal items per person + tax distributed proportionally. One tap to confirm

### Recurring Expenses
- **Template + auto-create**: User creates a recurring expense template (amount, description, split, schedule). On due date, expense auto-creates and all involved members get notified
- **Flexible scheduling**: Monthly, weekly, biweekly, custom interval. Set specific day (e.g., "1st of month")
- **Skip/pause/edit**: Can skip individual occurrences, pause the recurrence, or edit the template without breaking future occurrences
- **Notification**: All involved members notified when recurring expense auto-creates

### Expense History
- **Timeline with filter bar**: Scrollable list sorted by date (newest first). Filter chips: date range, category, member, amount range. Search by description text
- **Detail view**: Tap expense to see full detail card with tabs for "Details" (amount, split breakdown, category, receipt image) and "History" (change log). Edit/Delete/Dispute buttons

### Expenses Tab Layout
- **Single scroll with sections**: Jolly NL input at top -> balance summary card -> quick add button -> recent expenses list ("See all history" link) -> recurring section
- **No sub-tabs**: One cohesive screen, not segmented into sub-navigation

### Empty States
- **Guided first-expense prompt**: Friendly illustration + "Track your first expense!" with three entry points: quick add, scan receipt, and Jolly NL field. Different messaging for solo ("Track your spending") vs household ("Split expenses fairly")

### Notification Triggers (Phase 2 defines events, Phase 6 builds notification system)
- New expense involving you (shows amount and your share)
- Settlement received (someone marked a debt to you as settled)
- Dispute opened on your expense
- Recurring expense auto-created (all involved members)
- NOT included: balance threshold alerts (decided against)

### Data & Connectivity
- **Online-first with graceful degradation**: Supabase is source of truth. If offline: show cached data read-only, queue new expenses locally, sync when back online. No offline editing/deleting
- **Supabase Realtime subscriptions**: New expenses from housemates appear instantly. Balances update in real-time

### Claude's Discretion
- Debt simplification UX (how to show simplified vs original breakdown)
- Loading states and skeleton designs
- Exact color-coding for balance amounts
- Category default list and icons
- Receipt framing guide design
- Expense card visual design within warm & friendly direction
- Error state handling

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` -- Project vision, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` -- Full requirements EXPN-01..14 and AIEX-01..03 for this phase
- `.planning/ROADMAP.md` -- Phase 2 goal, success criteria, requirement mapping

### Prior phase context
- `.planning/phases/01-foundation-household/01-CONTEXT.md` -- Phase 1 decisions (app identity "Jolly Home", AI personality "Jolly", warm & friendly visual tone, navigation structure, monetization tiers, AI credit system)

### Research
- `.planning/research/STACK.md` -- Tech stack (Expo SDK 53, Supabase, tRPC)
- `.planning/research/ARCHITECTURE.md` -- Component boundaries, RLS multi-tenancy, data flow
- `.planning/research/DEEP-EXPENSES.md` -- Expense UX benchmarks, Splitwise analysis, debt simplification algorithms

### Existing code (Phase 1 foundation)
- `src/app/(app)/finances.tsx` -- Phase 1 solo expense stub (to be replaced)
- `src/components/ui/Card.tsx` -- Reusable Card component
- `src/components/ui/Button.tsx` -- Reusable Button component
- `src/constants/theme.ts` -- Color system and theme constants
- `src/components/household/LeaveHouseholdDialog.tsx` -- Contains `getOutstandingBalance` stub with TODO(Phase-2)
- `src/components/household/RemoveMemberDialog.tsx` -- Also references balance settlement
- `supabase/migrations/00001_foundation.sql` -- Foundation schema to extend

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card` component (`src/components/ui/Card.tsx`): Existing card with shadow/rounded variants -- reuse for expense cards, balance cards, receipt review
- `Button` component (`src/components/ui/Button.tsx`): Primary/secondary variants -- reuse for action buttons
- `colors` theme constants (`src/constants/theme.ts`): Established color system with light/dark variants
- Zustand stores pattern (`src/stores/`): auth.ts, household.ts, settings.ts -- follow same pattern for expense store
- Custom hooks pattern (`src/hooks/`): useAuth, useHousehold, useMembers, etc. -- follow same pattern for useExpenses, useBalances, useReceipt

### Established Patterns
- StyleSheet.create for all styling (no NativeWind/Tailwind)
- Local useState for component state, Zustand for global state
- SafeAreaView + ScrollView layout pattern
- Supabase client in `src/lib/supabase.ts`
- i18n architecture in `src/lib/i18n.ts`

### Integration Points
- `src/app/(app)/finances.tsx` -- Replace Phase 1 stub with full expense tab
- `src/app/(app)/_layout.tsx` -- Tab navigation (expenses tab already exists)
- `supabase/migrations/` -- Add expense, split, balance tables
- `src/stores/settings.ts` -- Tab customization (expenses already in default tabs)
- Supabase RLS -- Household-scoped expense access
- Supabase Realtime -- Live expense updates
- Camera/image picker -- For receipt scanning (new integration)
- AI API (Claude/OpenAI) -- For receipt OCR and NL parsing (new integration, uses AI credit system from Phase 1)

</code_context>

<specifics>
## Specific Ideas

- Jolly NL expense input is a key differentiator -- "Tell Jolly: Costco groceries $241.85, split with Jake, Sarah pays 40%" should feel magical and fast
- Receipt scanning with item-level personal vs shared classification is the "free OCR" acquisition hook -- must feel premium despite being free tier
- The expenses tab layout (NL input -> balance card -> quick add -> recent -> recurring) creates a clear information hierarchy
- Settlement deep links are convenience, not required -- gracefully handle missing apps
- "Beat Splitwise" positioning means: faster entry (<15s), smarter splitting (NL + presets), better receipt handling (item-level splits with classification), and simpler debt simplification

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope. The receipt-to-everything pipeline (AIEX-04/SYNC-01: one photo creates expense + pantry update + shopping list check-off) is already scoped to Phase 4 where pantry/shopping exist.

</deferred>

---

*Phase: 02-expense-tracking-receipt-ocr*
*Context gathered: 2026-03-21*
