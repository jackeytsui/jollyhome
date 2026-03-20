# Phase 1: Foundation + Household - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Auth, household creation, member invites, profiles, and solo-first value. Users can sign up (email, social, magic link), create a household, invite members via deep link/QR/email, and experience a sandbox demo mode before others join. This phase also establishes the app identity (Jolly Home), navigation structure, monetization foundation, and AI credit system architecture.

Requirements: AUTH-01..04, HOUS-01..08

</domain>

<decisions>
## Implementation Decisions

### Onboarding Flow
- After signup, user sees a **swipeable guided tour** (3-4 full-screen cards showing key features) with a **skip button** on every card
- First tour completion leads to household creation (name only — fast setup)
- **Sandbox/demo mode**: toggleable demo data pre-populated so solo users can see the app "alive" before inviting anyone. User clears demo data when ready to go real.
- Solo-first value = full feature preview with sample data, not limited functionality

### Authentication
- **All sign-up methods available**: email + password, Google sign-in, Apple sign-in, AND magic link (passwordless email)
- Supabase Auth handles all methods natively
- **Biometric login** (Face ID / fingerprint) available from launch — user enables in settings
- Sessions **never expire** — stay logged in until explicit logout
- **2FA available but not required** — users can enable TOTP or SMS in settings
- Email verification required after signup
- Password reset via email link

### Invite & Join UX
- **All invite methods**: shareable deep link (send via any app), in-app email invite, AND QR code for in-person invites
- When someone taps an invite without the app: **web app fallback** — they can join AND use the web app immediately without installing. Persistent "Get the app" banner with App Store / Google Play buttons always visible.
- **Invite link expiry: configurable** by admin (1 day, 7 days, 30 days, never)
- **Join approval: configurable** — household admin sets open join or approval-required
- **Invite link security: configurable** — admin sets single-use, multi-use, or password-protected links

### Household Structure
- **Multiple admins** — creator is admin, can promote others to admin
- **Free tier: up to 6 members** per household. Larger households require paid plan.
- **Multi-household = paid feature**. Creating more than one household = paid feature.
- When a member leaves with outstanding debts: **warn but allow** — shows balance warning, lets them leave, debt stays on record
- **Rejoin policy: admin decides** — admin can re-invite or block from rejoining
- **Last member scenario**: household persists — solo mode with invite prompts, personal features still work

### Member Profiles
- **Minimal signup**: name + email only. Everything else (photo, dietary prefs) collected later in settings.
- **Avatars**: upload photo OR choose from illustrated avatars/emoji. Playful, low friction.
- **Dietary preferences**: predefined tags (vegetarian, vegan, gluten-free, halal, kosher, etc.) + AI-enhanced natural language parsing ("I don't eat pork or anything too spicy" -> structured preferences)
- **Profile visibility**: fully visible to all household members — they live together, transparency helps
- Member list design: Claude's discretion

### App Identity & Brand
- **App name: Jolly Home** — warm, friendly, memorable, starts with J (founder Jackey)
- **AI personality named "Jolly"** — the household helper character. "Jolly suggests tacos tonight!"
- **Visual tone: warm & friendly** — rounded shapes, warm palette, playful illustrations, approachable
- **Color palette**: Claude's discretion within warm & friendly direction
- **Animations: minimal** — fast and functional, animations only where they aid understanding (loading, transitions)
- **Dark mode from launch** — follows system setting with manual override
- **i18n architecture from day one** — English at launch, multi-language ready

### Navigation
- **Customizable bottom tab bar**: 5 user-chosen feature shortcuts + settings gear (6 total)
- **Side drawer** contains all features
- Default 5 tabs: Claude's discretion based on feature priority
- Tab customization UX: **pick from list** in settings (check 5 features to show)
- Settings split: Claude's discretion (household vs personal)

### Monetization
- **Tiered plans: Free / Plus / Pro** with 30-day full-feature trial
- After trial: **graceful downgrade** — features lock based on tier, data preserved, user sees what they're missing
- **Payment processing: both** — App Store/Play Store in-app purchases on mobile, Stripe on web
- **Who pays: split option** — subscription cost can be split among household members (on-brand!)
- Tier details: Claude's discretion
- Launch promotion: Claude's discretion

### AI Credit System
- AI features (receipt OCR, meal planning, chatbot, chore optimization) are metered with a **credit/token system**
- Per-tier limits (Free < Plus < Pro)
- **Always-visible usage meter** in the AI section (like phone storage meter). Alerts at 90% and 100%.
- **Overage: pay-per-use** — can buy extra credits on demand, no hard block
- Credit system design (costs per feature, tier allocations): Claude's discretion — optimize for cost-effectiveness
- **Transparent communication required**: signup T&C, payment T&C, in-app meter, clear limit messaging

### Data & Privacy
- **Data export: both** — per-feature exports (e.g., expense CSV) for convenience + full data export (GDPR-compliant)
- When a member leaves: **admin decides** — remove, anonymize, or keep data as-is
- **Audit trail with rollback**: ability to see historical data by date and time field
- **Account deletion**: user chooses immediate deletion OR 30-day grace period (can cancel during window)
- GDPR-compliant: full personal data removal on deletion. Household data handled per admin's policy.

### Notifications
- **Default: all notifications on** — user opts OUT of what they don't want
- **Permission request during onboarding** — part of guided tour, explain value before system dialog
- Notification architecture: foundation for all future phases (expenses, chores, calendar, etc.)

### Security
- Biometric login from launch (optional, user enables)
- 2FA available, not required (TOTP or SMS)
- Sessions never expire
- Configurable invite link security (single-use, multi-use, password-protected)

### Analytics
- **Full funnel tracking**: onboarding completion, feature adoption, retention, invite conversion, AI usage, churn triggers
- Analytics tool: Claude's discretion (consider PostHog for privacy-friendliness + self-hostability with Expo + Supabase stack)

### Claude's Discretion
- Member list/directory design
- Default bottom tab selection (5 defaults)
- Color palette within warm & friendly direction
- Admin permission set details
- Household vs personal settings split
- Tier pricing and feature breakdown (Free/Plus/Pro)
- Launch promotion strategy
- AI credit system design (costs per feature, tier allocations)
- Analytics tool selection

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Project vision, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — Full requirements with AUTH-01..04, HOUS-01..08 for this phase
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, requirement mapping

### Research
- `.planning/research/STACK.md` — Recommended tech stack (Expo SDK 53, Supabase, tRPC)
- `.planning/research/ARCHITECTURE.md` — Component boundaries, RLS multi-tenancy pattern, data flow
- `.planning/research/PITFALLS.md` — Adoption blocker, solo-first design, notification architecture
- `.planning/research/DEEP-EXPENSES.md` — Expense UX benchmarks (relevant for monetization/credit system design)
- `.planning/research/SUMMARY.md` — Synthesized research findings

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes all foundational patterns

### Integration Points
- Supabase Auth for all sign-up methods (email, Google, Apple, magic link)
- Supabase Database with RLS for household data isolation
- Expo Router for navigation (bottom tabs + drawer)
- Expo Push Notifications service
- App Store / Play Store for in-app purchases
- Stripe for web payment processing

</code_context>

<specifics>
## Specific Ideas

- "Jolly Home" name reflects founder Jackey's personal connection (J-name) and warm/friendly product personality
- AI assistant "Jolly" should feel like a friendly housemate, not a corporate chatbot
- Subscription split feature is very on-brand — the household splitting app even splits its own subscription cost
- Web app fallback for invites is critical — zero friction for new users, with persistent app download banner
- Sandbox/demo mode should make the app feel "alive" immediately — users should understand the full vision before inviting anyone
- AI credit system modeled after Claude's token approach — visible, transparent, fair

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. All monetization and AI credit decisions are foundational architecture that belongs in Phase 1.

</deferred>

---

*Phase: 01-foundation-household*
*Context gathered: 2026-03-20*
