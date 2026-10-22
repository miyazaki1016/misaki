# V0/V1 synthetic prompt selection comparison — 2026-10-22

## Work completed (offline only)
- `chat-prompt-selection-diff.mjs`: compares pre-rendered synthetic baseline and candidate by section.
- Guards **all non-external sections** against text/selection/state/source-id changes, including persona, memory, relationship and safety.
- Supports excluding only six explicitly named external section keys. Rejects rewritten external text and missing/added section keys.
- Computes exact UTF-8 selected-byte differences and per-section sizes. `modelTokenSavings: null` deliberately avoids false Gemini token/cost claims.
- `tests/chat-prompt-selection-diff-offline.test.mjs`: seven isolated tests, run locally using Node v22.16.0. **7/7 PASS** in a reconstructed local copy of these two authored files. The GitHub branch checkout/CI was **not** executed.

## Not established
- Actual main prompt parity, actual Gemini token savings, number of billed requests, runtime correctness, or response quality; these are still **UNVERIFIED**.
- Module is not wired into the current chat route and does not call any external service.
- Not a privacy guard or substitute for auth/provenance/Forget enforcement: upstream inputs must already be approved.
- Branch is synthetic-only. main, live Misaki, Supabase and separate Amafuru project remain untouched.

## Next
Read real main prompt composition, identify existing section boundaries, reproduce baseline V0 byte-for-byte in offline tests, then contrast external data exclusion without altering any protected material.
