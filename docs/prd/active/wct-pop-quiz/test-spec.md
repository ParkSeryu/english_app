# WCT Pop Quiz Test Specification

| Surface | Verification |
| --- | --- |
| Selector | 20 unique questions; translation/pattern ratio 12/8; early/middle/late ratio 7/7/6; at most two per Day |
| Selector determinism | Same seed yields the same ordered selection; different seeds yield different source signatures |
| Retake selection | A matching previous signature forces bounded resampling and returns a new set |
| Selector failure | An unsatisfiable candidate pool throws `Pop Quiz needs 20 eligible questions` without relaxing a quota |
| Validation | Reject concept questions, duplicate source question IDs, invalid choices or correct IDs, wrong quotas, and more than two questions from a Day |
| Store | Owner isolation, one latest attempt per book, resume, idempotent confirmation, completion, result replacement, and deduplicated incorrect Days |
| UI and routes | Prenovice/Novice CTA state, runner confirm flow, result links, Premium exclusion, and foreign/missing-book 404s |
| Security | Authenticated reads honor RLS; browser direct writes are blocked; server actions own mutations and scoring |
| Command gate | Lint, typecheck, targeted/full tests, build, relevant RLS checks, and live app paths before feature completion |

## Completion results

- Full Vitest suite: 364 passed, 1 skipped.
- Combined WCT mobile Chromium: 10/10 passed. Fresh external-bind Pop Quiz run: 2/2 passed, covering both levels, refresh/resume, result links, different retake, Premium exclusion, and foreign-book isolation.
- Main migration ledger: `20260803120000_create_wct_pop_quiz.sql` applied; pending 0 and checksum mismatch 0.
- Hosted rollback-only execution passed: direct authenticated INSERT and anonymous SELECT were actually denied; start, persisted confirm/resume, 20 confirms, complete 20/20, and different-retake RPC calls all succeeded with valid production source questions.
- A memory-disabled `0.0.0.0:3101` run against main Supabase completed start, refresh/resume at 2/20, all 20 confirms, 5/20 result, 11 incorrect-Day links, and a different 20-question retake. The verification row was removed and the pre-test count of 0 was restored.
- Local Docker was unavailable, so `npm run verify:rls` exited before starting its local stack; this limitation is documented.
