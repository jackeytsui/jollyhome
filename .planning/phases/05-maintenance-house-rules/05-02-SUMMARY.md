## 05-02 Summary

Implemented the Phase 5 rules and coordination layer so HomeOS now has versioned house rules with acknowledgements, plus quiet hours, guest notices, and shared-space bookings routed through the shared calendar model.

### What changed

- Extended [00007_maintenance_house_rules.sql](/Users/jackeytsui/Downloads/HomeOS/supabase/migrations/00007_maintenance_house_rules.sql) with:
  - `house_rule_versions`
  - `house_rule_acknowledgements`
  - RLS policies, indexes, and `updated_at` trigger wiring for rule versions
- Added [rules.ts](/Users/jackeytsui/Downloads/HomeOS/src/types/rules.ts) for the rules and coordination contracts
- Added [useHouseRules.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useHouseRules.ts) for:
  - version loading and current-version resolution
  - current-version acknowledgement
  - next-version label generation
  - coordination-event payload creation
  - calendar-backed quiet-hours, guest, and booking creation
- Added [rules.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/rules.tsx) as the dedicated rules screen with:
  - current/history rule version cards
  - publish-rules flow
  - acknowledgement flow
  - quick coordination-event entry point
- Added [RuleVersionCard.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/rules/RuleVersionCard.tsx), [RuleEditorSheet.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/rules/RuleEditorSheet.tsx), [RuleAcknowledgementSheet.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/rules/RuleAcknowledgementSheet.tsx), and [CoordinationEventSheet.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/rules/CoordinationEventSheet.tsx)
- Added real coverage in [rules-coordination-ui.test.ts](/Users/jackeytsui/Downloads/HomeOS/src/__tests__/rules-coordination-ui.test.ts)

### Verification

- `npm test -- --runInBand src/__tests__/rules-coordination-ui.test.ts`
- `npx tsc --noEmit --pretty false 2>&1 | rg "src/types/rules.ts|src/hooks/useHouseRules.ts|src/components/rules/RuleVersionCard.tsx|src/components/rules/RuleEditorSheet.tsx|src/components/rules/RuleAcknowledgementSheet.tsx|src/components/rules/CoordinationEventSheet.tsx|src/app/\\(app\\)/rules.tsx|src/__tests__/rules-coordination-ui.test.ts"`

### Notes

- Coordination events persist into `calendar_events` using the existing `quiet_hours`, `guest`, and `booking` activity types instead of a separate scheduling subsystem.
- The filtered TypeScript check was clean for the touched 05-02 files. The full repo still has unrelated pre-existing type issues outside this slice.
- The unrelated local Phase 03 planning files were left untouched.
