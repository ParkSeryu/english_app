# WCT Pop Quiz Bulk Day Loading Design

## Status

Approved in conversation on 2026-08-06.

## Goal

Reduce the wait after a learner starts or resumes a WCT Pop Quiz by replacing
the current one-request-per-Day inventory load with one bulk Day query. Preserve
all quiz selection, shuffle, snapshot validation, progress, and scoring behavior.

## Measured Problem

`prepareCurrentInventory()` currently loads each full Day through
`WctStore.getDay()` inside `Promise.all()`. That creates 16 Supabase requests for
Prenovice and 28 for Novice every time the inventory is validated. A new start
validates once in the server action and again on the redirected dynamic quiz
page, so the same N+1 pattern is paid twice.

Read-only production measurements against Supabase project
`ccawzrrkxuirrwvaecvw` showed that one bulk query returned the same full Day
payload substantially faster than the parallel per-Day requests. Warm and cold
runs varied, but the bulk path reduced the Day-query wall time in every measured
Prenovice and Novice run. No production data was changed during measurement.

## Scope

- Add `getDays(dayIds: string[]): Promise<WctDay[]>` to the `WctStore` contract.
- Implement the method in both memory and Supabase stores.
- Use one `getDays()` call in WCT Pop Quiz inventory preparation.
- Restore canonical book-summary order after the store returns rows, because a
  database `IN` query does not guarantee result ordering.
- Reject missing, duplicate, foreign, or summary-mismatched full Days exactly as
  the current inventory guard does.
- Keep the existing single-Day `getDay()` method for all other consumers.

## Non-Goals

- Do not change question content, format distribution, Day-order shuffling,
  retake behavior, totals, feedback, scoring, or persisted attempts.
- Do not remove either the server-action or redirected-page inventory validation.
- Do not add a loading overlay, optimistic UI, caching layer, RPC, schema change,
  migration, dependency, or production data write.
- Do not refactor standard Day quiz generation, WCT ingestion, or Premium.

## Chosen Approach

Extend the existing store boundary with one bulk read. The Supabase implementation
will reuse the exact full-Day projection used by `getDay()` and filter with one
`.in("id", dayIds)` call. The memory implementation will scan only books owned by
the current user and return cloned, child-sorted Days for matching IDs.

The Pop Quiz service will:

1. sort and validate book Day summaries as it does today;
2. request all summary IDs once through `getDays()`;
3. build a unique Day-ID map from the returned rows;
4. reconstruct `allDays` in canonical summary order;
5. run the unchanged book ID, Day number, topic, display label, quiz-set schema,
   source hash, and current-set validations.

This removes the dominant network fan-out while preserving the current fail-closed
inventory contract and every downstream selection rule.

## Alternatives Considered

### Dedicated inventory RPC or database view

One RPC could join book summaries, full Days, and quiz sets in a single request.
It could reduce the remaining calls further, but it adds SQL, a production
migration, new mapping logic, and a larger atomic compatibility surface. The
measured dominant cost does not require that expansion.

### Loading-state-only UI

A pending screen could make the wait more explicit but would not reduce the 16/28
remote Day queries. It is outside this performance fix.

## Store Contract and Error Semantics

- Empty input returns an empty array without opening a Supabase query.
- The bulk store may return rows in any order; callers must not depend on query
  order.
- Unknown or unauthorized IDs are omitted, matching repeated `getDay()` results
  that would have contained `null` for those IDs.
- Supabase query failures retain the existing `WCT Day query failed: ...` error
  prefix.
- Every returned Day uses the existing `mapWctDay()` mapping and child sorting.
- The Pop Quiz service treats any missing or duplicate requested Day as an
  incomplete inventory and does not create or mutate an attempt.

## Testing

- Supabase store unit test: an empty ID list performs no query; a non-empty list
  performs exactly one `wct_days` selection with one `.in("id", ids)` filter and
  maps complete Day rows.
- Memory store integration test: bulk reads return only owned matching Days,
  omit unknown/foreign IDs, and return defensive clones.
- Pop Quiz service unit tests: one inventory preparation calls `getDays()` once
  with all canonical Day IDs, succeeds when rows are returned in a different
  order, and still rejects missing, duplicate, or mismatched Days before attempt
  mutation.
- Existing Pop Quiz selector, service, action, store, component, RLS, mobile E2E,
  and live-route checks prove shuffle, resume, retake, persistence, and scoring
  are unchanged.

## Verification and Release

The affected surface is runtime-facing shared store logic and the WCT Pop Quiz
server-action/page load path. Run focused tests first, then lint, typecheck, the
full test suite, build, local RLS verification, mobile Pop Quiz E2E, and live
localhost/LAN route checks. Merge the isolated feature branch into `main`, push
`main`, wait for the exact Vercel deployment commit to succeed, and smoke-check
the production root and exact Prenovice/Novice Pop routes.

No hosted Supabase write, schema migration, or progress reset is part of this
release.

## Acceptance Criteria

- Each Pop Quiz inventory validation issues one bulk full-Day store call instead
  of 16 Prenovice or 28 Novice single-Day calls.
- Both Prenovice and Novice still require exactly one valid current quiz set for
  every current Day and fail closed on incomplete or stale inventory.
- Store result order cannot change candidate/validation order.
- Existing shuffled start, resume, retake, Day/topic feedback, progress, totals,
  scoring, v1 compatibility, standard Day quiz, and Premium behavior remain
  unchanged.
- `main` is pushed, the exact commit deploys successfully, and production route
  smoke checks pass without a database or production-data change.
