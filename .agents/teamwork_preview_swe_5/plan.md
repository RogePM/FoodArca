# SWE Light Execution Plan

## Objective
Build a safe, free image fetcher feature for Next.js App Router and integrate an elegant two-state inline UI in `mobile-manual-entry-view.jsx`.

## Requirements
- R1: Safe Backend Image Fetcher (Next.js API route accepting name & category, returning 3-4 image URLs via free scraper, strictly safe and biased toward food products).
- R2: Elegant Two-State UI in `mobile-manual-entry-view.jsx` (State 1: Find Image button/placeholder, State 2: Expanded options to select from, attaching selected image to form state).

## Strategy: SWE Light
1. **Initial Implementation**:
   - Dispatch `teamwork_preview_implementer` with verbatim user request.
   - Implementer explores, implements API route & UI, runs test suite.
2. **Independent Verification**:
   - Inspect git diff and re-run relevant tests/build.
   - Initialize Open-Issues Ledger.
3. **Reviewer Round 1**:
   - Dispatch `teamwork_preview_reviewer_r1` with verbatim request + prior report + open-issues ledger.
   - Reviewer attempts to break diff, fixes issues, and re-verifies.
4. **Reviewer Round 2**:
   - Dispatch `teamwork_preview_reviewer_r2` with verbatim request + prior report + open-issues ledger.
   - Reviewer validates edge cases, safe search enforcement, UI ergonomics.
5. **Reviewer Round 3**:
   - Dispatch `teamwork_preview_reviewer_r3` with verbatim request + prior report + open-issues ledger.
   - Reviewer stress-tests and confirms compliance with all acceptance criteria.
6. **Victory Audit**:
   - Dispatch `teamwork_preview_victory_auditor` for independent verification.
7. **Final Acceptance & Handoff**:
   - Write `handoff.md` and report completion to parent.
