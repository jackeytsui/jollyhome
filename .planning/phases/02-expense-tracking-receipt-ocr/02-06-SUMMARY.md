---
phase: 02-expense-tracking-receipt-ocr
plan: 06
subsystem: ui
tags: [expo-camera, openai, receipt-ocr, supabase-edge-functions, image-picker, expo-haptics]

# Dependency graph
requires:
  - phase: 02-expense-tracking-receipt-ocr
    provides: useExpenses (createExpense), expenseMath (distributeTaxProportionally, suggestCategory), Supabase client, Member type from useMembers, CreateExpenseInput type
provides:
  - Supabase Edge Function (process-receipt/index.ts): image -> GPT-4o Vision -> validated structured receipt JSON
  - useReceipt hook: camera capture, gallery pick, multi-page upload, Edge Function invocation, state management
  - ReceiptCameraView: full-screen camera with permission handling and framing guide
  - ReceiptPageStack: multi-page dot indicator
  - ItemClassificationTag: tap-to-cycle Shared/Personal pill with haptics
  - ReceiptReviewCard: inline-editable review with Confirm & Save mandatory flow
  - SplitSummaryPreview: per-person totals with proportional tax/tip distribution
  - finances.tsx: receipt scan flow wired via Modal overlays
affects: [phase-03, phase-04, phase-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Supabase Edge Function (Deno) calling OpenAI gpt-4o Vision via direct fetch (no SDK)
    - Response validation/sanitization in Edge Function before returning to client (Pitfall 7 guard)
    - AI credits check (SELECT) and deduction (UPDATE) as atomic gate before OCR call
    - useReceipt hook with captureImage/pickFromGallery/addPage/removePage/processReceipt/clearReceipt pattern
    - processReceipt triggered via useEffect in finances.tsx when showReceiptReview becomes true
    - Receipt flow as Modal overlay on finances.tsx (not a separate Expo Router screen)
    - ItemClassificationTag tap-to-cycle: Shared -> Personal:[Member1] -> Personal:[Member2] -> Shared

key-files:
  created:
    - supabase/functions/process-receipt/index.ts
    - src/hooks/useReceipt.ts
    - src/components/receipt/ReceiptCameraView.tsx
    - src/components/receipt/ReceiptPageStack.tsx
    - src/components/receipt/ReceiptReviewCard.tsx
    - src/components/receipt/ItemClassificationTag.tsx
    - src/components/receipt/SplitSummaryPreview.tsx
  modified:
    - src/app/(app)/finances.tsx

key-decisions:
  - "Receipt scan flow rendered as Modal overlay in finances.tsx — avoids Expo Router modal presentation issues with @gorhom/bottom-sheet gesture handler context"
  - "processReceipt triggered via useEffect watching showReceiptReview + images.length — decouples state update from callback chain"
  - "Edge Function validates OpenAI response shape before returning (fills missing fields with defaults: tax_cents:0, tip_cents:0, date:null)"
  - "Gallery pick via pickFromGallery sets images state then useEffect triggers processReceipt — same flow as camera capture"

patterns-established:
  - "Pattern: OCR Edge Function validates and sanitizes AI response before returning to client"
  - "Pattern: AI credits check+deduct in Edge Function (SELECT first, return 402 if insufficient, UPDATE after success)"
  - "Pattern: useReceipt hook owns all image state; finances.tsx triggers processReceipt via useEffect"

requirements-completed: [AIEX-01, AIEX-02, AIEX-03, EXPN-13]

# Metrics
duration: 6min
completed: 2026-03-21
---

# Phase 02 Plan 06: Receipt OCR Pipeline Summary

**GPT-4o Vision receipt scanning via Supabase Edge Function with item-level shared/personal classification, mandatory review card, and proportional tax/tip split summary**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-21T13:12:45Z
- **Completed:** 2026-03-21T13:18:45Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Supabase Edge Function calls GPT-4o Vision with multi-image support (multi-page receipts), validates response shape, checks AI credits (2 per scan) and deducts after success
- useReceipt hook provides full image lifecycle: captureImage, pickFromGallery, addPage, removePage, processReceipt, clearReceipt
- Complete receipt scan UI: full-screen camera with orange corner framing guide, permission handling, multi-page dot indicator, inline-editable review card with item-level classification tags, proportional split summary, Confirm & Save mandatory flow
- ItemClassificationTag cycles Shared -> Personal:[each member] -> Shared with ImpactFeedbackStyle.Medium haptics on each toggle
- finances.tsx wired: camera icon launches receipt flow via Modal, processReceipt triggered by useEffect, creates expense via existing createExpense on confirm

## Task Commits

Each task was committed atomically:

1. **Task 1: Supabase Edge Function for receipt OCR and useReceipt hook** - `9b08ff6` (feat)
2. **Task 2: Receipt scanning UI — camera view, review card, classification tags, split summary** - `2a646e2` (feat)

## Files Created/Modified
- `supabase/functions/process-receipt/index.ts` - Deno Edge Function: storage_paths -> signed URLs -> base64 -> GPT-4o Vision -> validated ReceiptData JSON
- `src/hooks/useReceipt.ts` - Hook managing image capture, gallery pick, multi-page upload, Edge Function invocation
- `src/components/receipt/ReceiptCameraView.tsx` - Full-screen CameraView with useCameraPermissions, orange corner brackets, Take Photo/Choose from Library/Discard Scan buttons
- `src/components/receipt/ReceiptPageStack.tsx` - Multi-page dot indicator with Add page trigger
- `src/components/receipt/ReceiptReviewCard.tsx` - Inline-editable store/date/items/tax/tip, loading state (Reading your receipt...), Confirm & Save
- `src/components/receipt/ItemClassificationTag.tsx` - Tap-to-cycle shared/personal pill, green=Shared, amber=Personal, haptics on toggle
- `src/components/receipt/SplitSummaryPreview.tsx` - Per-person split using distributeTaxProportionally from expenseMath
- `src/app/(app)/finances.tsx` - Camera icon launches receipt Modal flow; useReceipt wired with useEffect processReceipt trigger

## Decisions Made
- Receipt flow rendered as Modal overlay in finances.tsx rather than a separate Expo Router screen — avoids @gorhom/bottom-sheet gesture handler context issues in modal screens (consistent with Pitfall 5 from RESEARCH.md)
- processReceipt triggered via useEffect watching (showReceiptReview, images.length, receiptData, receiptLoading) — decouples React state update timing from synchronous callback chain
- Edge Function validates and sanitizes all OpenAI response fields before returning — fills missing fields with sensible defaults (tax_cents:0, tip_cents:0, date:null, price_cents fallback for wrong field names)
- Gallery pick flow: pickFromGallery adds to images state, then closes camera and shows review — same useEffect trigger as camera capture

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- finances.tsx had been updated by Plan 07 execution (JollyNLInput wired) before Plan 06 could run — re-read the updated file before editing to avoid conflicts. No functional impact.

## User Setup Required
The process-receipt Edge Function requires `OPENAI_API_KEY` as a Supabase Edge Function secret. Set via Supabase CLI:
```
supabase secrets set OPENAI_API_KEY=sk-...
```
No additional setup beyond what was configured in Phase 1 (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY are auto-available in Edge Functions).

## Next Phase Readiness
- Receipt OCR pipeline complete and wired to createExpense — AIEX-01, AIEX-02, AIEX-03, EXPN-13 fulfilled
- SplitSummaryPreview and ItemClassificationTag can be reused in Phase 4 receipt-to-everything pipeline
- process-receipt Edge Function can be extended with additional fields (allergen tagging, nutrition data) in Phase 4

---
*Phase: 02-expense-tracking-receipt-ocr*
*Completed: 2026-03-21*
