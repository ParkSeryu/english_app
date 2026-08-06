# WCT Pop Quiz Bulk Day Loading

- Status: Active
- Tracker: `docs/prd/future-work.md#t-013-wct-pop-quiz-bulk-day-loading`
- Approved design: `docs/superpowers/specs/2026-08-06-wct-pop-quiz-bulk-day-loading-design.md`
- Canonical plan: `docs/superpowers/plans/2026-08-06-wct-pop-quiz-bulk-day-loading.md`

The canonical step-by-step implementation plan is:

`docs/superpowers/plans/2026-08-06-wct-pop-quiz-bulk-day-loading.md`

Acceptance:
- [ ] Every Pop inventory validation uses one bulk full-Day store read instead of 16/28 single-Day reads.
- [ ] Unordered bulk rows are normalized to canonical Day-summary order before existing source validation.
- [ ] Missing, duplicate, foreign, mismatched, and stale inventory still fails closed before attempt mutation.
- [ ] Existing shuffle, resume, retake, persistence, scoring, v1, standard Day quiz, and Premium behavior remains unchanged.
- [ ] Full verification, live routes, exact production deployment, and clean main synchronization pass.

- Surface classification: shared store/server-action/dynamic-route loading path => runtime-facing.
- Non-goals: UI/copy, selector rules, persistence/RPC, schema/migration, production data, standard Day quiz, and Premium changes.
