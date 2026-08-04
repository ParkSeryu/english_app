# WCT Pop Quiz Test Specification

| Surface | Verification |
| --- | --- |
| Selector | One unique approved translation/pattern question per ordered Day; 16-Day Prenovice and 28-Day Novice inventories; no concept question |
| Selector determinism | Same seed yields the same Day-ordered selection; a retake keeps the Day set and changes at least one question for the matching Day |
| Selector failure | A Day without an eligible candidate throws `Pop Quiz needs one eligible question per Day` |
| Validation/mappers | Dynamic 1–100 snapshot lengths, choice integrity, totals bounded by snapshot length, and legacy 20-question snapshots without `dayTopic` |
| Store/RPC | Owner isolation, one latest attempt per book, resume, idempotent confirmation, dynamic completion totals, and current-Day coverage enforcement |
| UI and routes | Dynamic CTA/progress/results, source absent until confirmation then `Day N · topic`, legacy fallback, result links, Premium exclusion, and foreign/missing-book handling |
| Security | Authenticated reads honor RLS; browser direct writes are blocked; server actions own mutations and scoring |
| Command gate | Lint, typecheck, focused/full tests, build, RLS, hosted rollback-only flow, and live app paths before completion |

## Completion results

- Focused Pop Quiz Vitest: 10 files, 56 tests passed. Full Vitest: 70 files,
  362 tests passed; 1 skipped. `npm run lint`, `npm run typecheck`, and
  `npm run build` passed.
- Post-build focused mobile Chromium Pop Quiz journey: 2/2 passed. It covered
  the complete/retake flows for 16-Day Prenovice and 28-Day Novice, hidden then
  confirmed source text, refresh/resume, result links, Premium exclusion, and
  cross-owner isolation.
- Main/production `ccawzrrkxuirrwvaecvw`: migration
  `20260804120000_update_wct_pop_quiz_day_coverage.sql` applied; 37 migrations,
  pending 0, checksum mismatch 0. `npm run db:validate` validated 37 records.
- `npm run verify:rls` passed, including dynamic-Day and malformed-completed
  replay smoke coverage. The direct authenticated production rollback-only
  flow selected `[16, 28]` inventories, completed both matching-total attempts,
  verified direct insert denial, and ended with `ROLLBACK` and no residue.
- After rebuilding and restarting with `0.0.0.0`, local Prenovice/Novice book
  and Pop Quiz routes returned HTTP 200; the reachable LAN Prenovice Pop Quiz
  route also returned HTTP 200. Server logs had no runtime-error markers.

## Remaining targeted regression gap

The database smoke does not insert a literal legacy 20-question attempt row.
Legacy parsing, mapper coverage, and dynamic SQL constraints cover the
compatibility contract, but a dedicated database fixture remains desirable.
