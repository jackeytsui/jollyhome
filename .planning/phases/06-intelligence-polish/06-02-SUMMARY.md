# Phase 06-02 Summary

## Outcome

Shipped the dashboard and reporting layer on top of the new home entry:

- Added shared dashboard aggregation helpers for household status, fairness, monthly reporting, and spending insights.
- Added a `useDashboard` hook that composes balances, chores, calendar, pantry, maintenance, meals, expenses, and member data into one reusable summary surface.
- Turned the home tab into a real household dashboard with:
  - at-a-glance household metrics
  - combined fairness across labor and money
  - a monthly household report
  - evidence-backed spending insights with inspectable trend lines

## Files

- `src/lib/dashboard.ts`
- `src/hooks/useDashboard.ts`
- `src/components/home/HouseholdDashboard.tsx`
- `src/components/home/FairnessDashboardCard.tsx`
- `src/components/home/MonthlyReportCard.tsx`
- `src/components/home/SpendingInsightCard.tsx`
- `src/app/(app)/(home)/index.tsx`
- `src/__tests__/notifications-dashboard.test.ts`

## Verification

- `npm test -- --runInBand src/__tests__/notifications-dashboard.test.ts`
- `npx tsc --noEmit --pretty false 2>&1 | rg 'src/(lib/dashboard\\.ts|hooks/useDashboard\\.ts|components/home/HouseholdDashboard\\.tsx|components/home/FairnessDashboardCard\\.tsx|components/home/MonthlyReportCard\\.tsx|components/home/SpendingInsightCard\\.tsx|app/\\(app\\)/\\(home\\)/index\\.tsx|__tests__/notifications-dashboard\\.test\\.ts)'`

## Notes

- Fairness is intentionally composite: it combines chore contribution deltas and financial balance deltas into one inspectable score instead of maintaining separate “money fairness” and “labor fairness” stories.
- Spending insights are derived from actual expense history and category totals, not static advice copy.
