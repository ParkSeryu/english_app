# Test Spec: WCT Private Course Library

## Required evidence

| Area | Evidence |
|---|---|
| Contract | Strict validation and normalization unit tests |
| Duplicate behavior | Memory-store and PostgreSQL RPC tests for create/replace/merge/skip |
| Privacy | Executable anon/owner/other-owner/browser-write RLS checks |
| Import safety | Bearer auth, server-derived owner, explicit approval, idempotency |
| UI | Component tests for compact labels, AI badges, read-only sections |
| Navigation | Playwright GNB → book → Day flow |
| Scope | No Topic payload/display and no raw OCR persistence |
| Regression | Expression tests, lint, typecheck, full test suite, build |
| Runtime | Healthy dev `/lessons` route and representative Day navigation |

## Environment gates

- Dev project ref: `uixpyibcpleuwsgemdno`.
- Production project ref: `ccawzrrkxuirrwvaecvw`.
- Dev and production migrations/imports require separate verification.
- Production apply and production content import require explicit user authorization.

## Evidence log

- Dev migration status (`npm run db:status:dev`): project
  `uixpyibcpleuwsgemdno`, pending `0`, checksum mismatches `0`.
- Dev migration apply (`npm run db:migrate:dev`): private WCT schema,
  transactional import RPC, and legacy lesson-table removal committed.
- Static checks: `npm run lint` and `npm run typecheck` passed.
- Automated tests (`npm test`): 41 files passed, 1 skipped; 217 tests passed,
  1 skipped.
- RLS behavior (`npm run verify:rls`): owner isolation, anonymous denial,
  browser-write denial, service-role import/idempotency, and all duplicate
  modes passed.
- Production build (`npm run build`): passed with WCT pages and import APIs in
  the route manifest.
- Authenticated browser flow
  (`npx playwright test e2e/wct-course-library.spec.ts --project=mobile-chromium`):
  2 passed, covering GNB → book → Day reading and guessed-URL owner isolation.
- Runtime route: the task-owned server started with
  `npm run dev -- --hostname 0.0.0.0 --port 3000`. Both
  `http://127.0.0.1:3000/lessons` and
  `http://172.30.1.22:3000/lessons` returned the expected `307` redirect to
  `/login?next=%2Flessons` for an unauthenticated request. The in-app browser
  loaded that login route with HTTP 200, and the server log contained no 500,
  missing-module, or failed-action error.
- Production database and production content remain untouched pending
  separate explicit authorization.
