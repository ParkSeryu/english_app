# Implementation Plan: 신규회원 가입 이후 토픽 노출 정책

1. Auth user context
   - Add optional `createdAt` to `UserIdentity`.
   - Propagate Supabase `data.user.created_at` through trusted middleware headers and direct server auth fallback.

2. Shared policy helper
   - Add a small store policy helper that decides whether an `expression_day` is visible for a learner.
   - Keep behavior unchanged when user signup time or topic created time is unavailable.

3. Store application
   - Memory store: apply the helper to `listExpressionDays`, `getExpressionDay`, `getExpression`, queue, and dashboard-derived reads through existing day/expression listing paths.
   - Supabase store: include topic `created_at` in expression-day summaries, apply the helper to day/expression list reads, and derive dashboard overview/stats from filtered lists.

4. Tests and verification
   - Add memory integration coverage for old-vs-new shared topics around a learner signup cutoff.
   - Run lint, typecheck, focused test, and live `/memorize` route smoke check.
