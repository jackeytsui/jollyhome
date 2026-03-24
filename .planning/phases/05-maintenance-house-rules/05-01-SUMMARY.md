## 05-01 Summary

Implemented the Phase 5 maintenance foundation so HomeOS now has a dedicated maintenance surface with lifecycle tracking, searchable history, and calendar-aware appointment scheduling.

### What changed

- Added [00007_maintenance_house_rules.sql](/Users/jackeytsui/Downloads/HomeOS/supabase/migrations/00007_maintenance_house_rules.sql) with:
  - `maintenance_requests` for household request lifecycle state
  - `maintenance_updates` for append-only notes, status changes, cost updates, and appointment history
  - RLS policies, indexes, and `updated_at` trigger wiring
- Added [maintenance.ts](/Users/jackeytsui/Downloads/HomeOS/src/types/maintenance.ts) for the new maintenance contracts
- Added [useMaintenance.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useMaintenance.ts) for:
  - maintenance request loading
  - lifecycle mutation helpers
  - searchable history filtering
  - maintenance appointment payload building and calendar event creation
- Added [maintenance.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/maintenance.tsx) as the dedicated maintenance screen with:
  - active queue summary
  - create/edit request flow
  - status advancement
  - history access
- Added [MaintenanceRequestCard.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/maintenance/MaintenanceRequestCard.tsx), [MaintenanceEditorSheet.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/maintenance/MaintenanceEditorSheet.tsx), [MaintenanceStatusSheet.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/maintenance/MaintenanceStatusSheet.tsx), and [MaintenanceHistorySheet.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/maintenance/MaintenanceHistorySheet.tsx) for the request, editor, status, appointment, and history UI flows
- Added real coverage in [maintenance-ui.test.ts](/Users/jackeytsui/Downloads/HomeOS/src/__tests__/maintenance-ui.test.ts)

### Verification

- `npm test -- --runInBand src/__tests__/maintenance-ui.test.ts`
- `npx tsc --noEmit --pretty false 2>&1 | rg "src/types/maintenance.ts|src/hooks/useMaintenance.ts|src/components/maintenance/MaintenanceRequestCard.tsx|src/components/maintenance/MaintenanceEditorSheet.tsx|src/components/maintenance/MaintenanceStatusSheet.tsx|src/components/maintenance/MaintenanceHistorySheet.tsx|src/app/\\(app\\)/maintenance.tsx|src/__tests__/maintenance-ui.test.ts"`

### Notes

- The filtered TypeScript check was clean for the touched 05-01 files. The full repo still has unrelated pre-existing type issues outside this slice.
- The unrelated local Phase 03 planning files were left untouched.
