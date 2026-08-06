# WCT Pop Quiz Bulk Day Loading

- Status: Active
- Tracker: `docs/prd/future-work.md#t-013-wct-pop-quiz-bulk-day-loading`
- Approved design: `docs/superpowers/specs/2026-08-06-wct-pop-quiz-bulk-day-loading-design.md`
- Canonical plan: `docs/superpowers/plans/2026-08-06-wct-pop-quiz-bulk-day-loading.md`

## User Problem

Starting or resuming a WCT Pop Quiz currently validates each Day separately,
creating 16 Prenovice or 28 Novice full-Day reads for every inventory check.

## Scope

- Add a bulk full-Day read at the existing WCT store boundary.
- Use that single bulk read for Pop Quiz inventory preparation.
- Restore canonical Day-summary order before applying the existing source and
  snapshot validation.
- Preserve fail-closed validation before any attempt mutation.

## Non-goals

UI/copy, selector rules, persistence/RPC, schema/migration, production data,
standard Day quiz, and Premium changes.

## Acceptance

- [ ] Every Pop inventory validation uses one bulk full-Day store read instead of 16/28 single-Day reads.
- [ ] Unordered bulk rows are normalized to canonical Day-summary order before existing source validation.
- [ ] Missing, duplicate, foreign, mismatched, and stale inventory still fails closed before attempt mutation.
- [ ] Existing shuffle, resume, retake, persistence, scoring, v1, standard Day quiz, and Premium behavior remains unchanged.
- [ ] Full verification, live routes, exact production deployment, and clean main synchronization pass.

- Surface classification: shared store/server-action/dynamic-route loading path => runtime-facing.
