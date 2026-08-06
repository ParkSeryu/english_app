# WCT Pop Quiz Bulk Day Loading

- Status: Active
- Tracker: `docs/prd/future-work.md#t-013-wct-pop-quiz-bulk-day-loading`
- Approved design: `docs/superpowers/specs/2026-08-06-wct-pop-quiz-bulk-day-loading-design.md`
- Canonical plan: `docs/superpowers/plans/2026-08-06-wct-pop-quiz-bulk-day-loading.md`

## Verification Contract

| Surface | Verification |
| --- | --- |
| Bulk store read | Every Pop inventory validation calls one bulk full-Day store read rather than 16/28 single-Day reads. |
| Canonical order | Unordered bulk rows are normalized to canonical Day-summary order before existing source validation. |
| Fail-closed inventory | Missing, duplicate, foreign, mismatched, and stale inventory fails before attempt mutation. |
| Compatibility | Shuffle, resume, retake, persistence, scoring, v1, standard Day quiz, and Premium behavior remain unchanged. |
| Release | Full verification, live routes, exact production deployment, and clean main synchronization pass. |

Acceptance:
- [ ] Every Pop inventory validation uses one bulk full-Day store read instead of 16/28 single-Day reads.
- [ ] Unordered bulk rows are normalized to canonical Day-summary order before existing source validation.
- [ ] Missing, duplicate, foreign, mismatched, and stale inventory still fails closed before attempt mutation.
- [ ] Existing shuffle, resume, retake, persistence, scoring, v1, standard Day quiz, and Premium behavior remains unchanged.
- [ ] Full verification, live routes, exact production deployment, and clean main synchronization pass.

- Surface classification: shared store/server-action/dynamic-route loading path => runtime-facing.
- Non-goals: UI/copy, selector rules, persistence/RPC, schema/migration, production data, standard Day quiz, and Premium changes.
