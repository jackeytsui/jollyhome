## 04-07 Summary

Implemented the Phase 4 atomic grocery receipt workflow so one reviewed grocery receipt confirmation now persists the expense, pantry restocks, and shopping-list reconciliation behind a single server-side commit boundary.

### What changed

- Added [00006_food_receipt_sync.sql](/Users/jackeytsui/Downloads/HomeOS/supabase/migrations/00006_food_receipt_sync.sql) with:
  - `grocery_receipt_commits` audit table
  - `perform_grocery_receipt_commit(...)` transactional SQL helper
- Added [commit-grocery-receipt/index.ts](/Users/jackeytsui/Downloads/HomeOS/supabase/functions/commit-grocery-receipt/index.ts) as the Edge Function entry point for the atomic receipt commit
- Added [receiptWorkflow.ts](/Users/jackeytsui/Downloads/HomeOS/src/lib/receiptWorkflow.ts) for:
  - grocery-receipt detection
  - reviewed pantry/shopping staging
  - expense split assembly
  - atomic commit payload creation and invocation
- Extended [useReceipt.ts](/Users/jackeytsui/Downloads/HomeOS/src/hooks/useReceipt.ts) to enrich reviewed OCR payloads with catalog resolution and shopping matches before save
- Extended [ReceiptReviewCard.tsx](/Users/jackeytsui/Downloads/HomeOS/src/components/receipt/ReceiptReviewCard.tsx) with pantry add/skip, quantity review, and shopping reconciliation toggles
- Updated [finances.tsx](/Users/jackeytsui/Downloads/HomeOS/src/app/(app)/finances.tsx) so grocery receipt confirmation routes through `commitGroceryReceipt` instead of direct client-side multi-write choreography
- Replaced the scaffold in [receipt-food-flow.test.ts](/Users/jackeytsui/Downloads/HomeOS/src/__tests__/receipt-food-flow.test.ts) with real receipt-sync coverage

### Verification

- `npm test -- --runInBand src/__tests__/receipt-food-flow.test.ts`
- `npx tsc --noEmit --pretty false 2>&1 | rg "receiptWorkflow|useReceipt\\.ts|ReceiptReviewCard\\.tsx|finances\\.tsx|receipt-food-flow\\.test\\.ts|commit-grocery-receipt|00006_food_receipt_sync"`

### Notes

- Full repo TypeScript is still not clean because of unrelated existing dependency and Expo typing issues outside this slice.
- The unrelated local Phase 03 planning files were left untouched.
