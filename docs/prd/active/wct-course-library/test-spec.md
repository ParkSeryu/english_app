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

Implementation evidence will be appended as each task completes.
