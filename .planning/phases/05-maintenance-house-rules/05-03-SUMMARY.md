## 05-03 Summary

Implemented the Phase 5 cross-feature coordination layer so repair receipts can link into maintenance + expenses, maintenance costs can hand off into a prefilled split-expense flow, and cleaning chores now surface low-supply warnings from inventory state.

### What changed

- Added [commit-repair-receipt/index.ts](/Users/jackeytsui/Downloads/HomeOS/supabase/functions/commit-repair-receipt/index.ts) as the repair-specific receipt commit edge function
- Extended [receiptWorkflow.ts](/Users/jackeytsui/Downloads/HomeOS/src/lib/receiptWorkflow.ts) with:
  - repair-receipt detection
  - maintenance-request matching
  - repair review staging
  - repair commit payload creation and invocation
- Extended [useReceipt.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useReceipt.ts) so reviewed OCR receipts can hydrate either grocery sync or repair-maintenance linkage in the same review-first pipeline
- Extended [ReceiptReviewCard.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/receipt/ReceiptReviewCard.tsx) with maintenance-link review controls
- Updated [finances.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/finances.tsx) so repair receipts route through the new repair commit flow and expense prefills can be opened from route params
- Extended [useMaintenance.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useMaintenance.ts) with maintenance-to-expense prefill helpers and updated [maintenance.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/maintenance.tsx) so costed maintenance work can open a prefilled split-expense flow
- Updated [QuickAddCard.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/expenses/QuickAddCard.tsx) so expense prefills rehydrate correctly when opened from maintenance handoff
- Added chore supply-warning helpers in [useInventory.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useInventory.ts), surfaced warnings in [ChoreCard.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/chores/ChoreCard.tsx), added completion prompts in [CompleteChoreSheet.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/chores/CompleteChoreSheet.tsx), and wired them through [chores.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/chores.tsx)
- Added real coverage in [maintenance-sync.test.ts](/Users/jackeytsui/Downloads/HomeOS/src/__tests__/maintenance-sync.test.ts)

### Verification

- `npm test -- --runInBand src/__tests__/maintenance-sync.test.ts`
- `npx tsc --noEmit --pretty false 2>&1 | rg "src/types/maintenance.ts|src/hooks/useMaintenance.ts|src/components/expenses/QuickAddCard.tsx|src/lib/receiptWorkflow.ts|src/hooks/useReceipt.ts|src/components/receipt/ReceiptReviewCard.tsx|src/hooks/useInventory.ts|src/components/chores/ChoreCard.tsx|src/components/chores/CompleteChoreSheet.tsx|src/app/\\(app\\)/chores.tsx|src/app/\\(app\\)/finances.tsx|src/app/\\(app\\)/maintenance.tsx|supabase/functions/commit-repair-receipt/index.ts|src/__tests__/maintenance-sync.test.ts"`

### Notes

- Repair receipts now stay on the existing receipt review path rather than creating a second scanner stack.
- Maintenance expense handoff is still review-first: users land in the regular expense sheet with prefilled split data instead of an automatic write.
- Cleaning-supply warnings are scoped to cleaning-like chores and low-stock household/personal-care inventory signals to avoid noisy prompts on unrelated tasks.
- The filtered TypeScript check was clean for the touched 05-03 files. The full repo still has unrelated pre-existing type issues outside this slice.
- The unrelated local Phase 03 planning files were left untouched.
