# Phase 06-01 Summary

## Outcome

Shipped the first intelligence layer for the household dashboard:

- Added persisted per-member notification preferences with digest timing and category modes.
- Added shared notification reference payloads so digest items point back into finances, chores, calendar, meals, supplies, maintenance, and rules instead of dead-end text.
- Added a daily digest preview that combines chores, meals, calendar context, low-stock alerts, balances, and maintenance into one dashboard view.
- Updated the home screen to surface the digest preview, notification controls, and real shopping/meals quick links.

## Files

- `supabase/migrations/00008_intelligence_polish.sql`
- `src/types/notifications.ts`
- `src/hooks/useNotifications.ts`
- `src/components/home/NotificationPreferencesCard.tsx`
- `src/components/home/DailyDigestPreviewCard.tsx`
- `src/app/(app)/(home)/index.tsx`
- `src/__tests__/notifications-dashboard.test.ts`

## Verification

- `npm test -- --runInBand src/__tests__/notifications-dashboard.test.ts`
- `npx tsc --noEmit --pretty false 2>&1 | rg 'src/(types/notifications\\.ts|hooks/useNotifications\\.ts|components/home/NotificationPreferencesCard\\.tsx|components/home/DailyDigestPreviewCard\\.tsx|app/\\(app\\)/\\(home\\)/index\\.tsx)'`

## Notes

- The TypeScript verification was filtered to touched files because the repo still has unrelated baseline type noise outside this phase.
- Delivery is intentionally scoped to preference handling, digest assembly, and dashboard surfaces. Actual push transport can build on these contracts in a later phase.
