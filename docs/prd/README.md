# PRD Documentation Index

## Source of Truth

`docs/prd/future-work.md` is the work queue and portfolio source of truth.

Use individual feature folders as supporting artifacts for a tracker item. If a document and the tracker disagree about whether work is active, the tracker wins.

## Folder Lifecycle

- `active/`: currently being implemented. Keep at most one feature folder here.
- `backlog/`: candidate, planned, or pull-ready work that is not currently being implemented.
- `complete/`: finished, shipped, or retired/superseded work kept for baseline and history.

A backlog item can be **pull-ready** when it already has enough PRD/test-spec detail to start, but it still stays under `backlog/` until it becomes active.

If code implementation has started or an implementation PR is open, the feature is no longer backlog: move its folder to `active/` and move the tracker item to `Active` in the same branch/PR.

## Current Map

| Area | Tracker | Folder | PRD | Test spec | Implementation plan | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Daily expression memorization MVP | Foundation | `complete/` | `complete/daily-expression-memorization/prd.md` | `complete/daily-expression-memorization/test-spec.md` | `complete/daily-expression-memorization/implementation-plan.md` | Current product baseline. Preserve unless a tracker item explicitly changes it. |
| New-member learning load | T-002 | `backlog/` | TBD | TBD | TBD | Brief: `backlog/new-member-learning-load/README.md`. Recommended first slice because it reduces first-session friction. |
| Ebbinghaus/SRS interval policy | T-003 | `active/` | `active/spaced-repetition-interval-policy/prd.md` | Focused scheduling, memory-store, and memorize-card tests in PR #5 | PR #5 | Active implementation: `다시` keeps interval, `어려움` steps down one interval, and `쉬움` stretches to 365 days. |
| Push notifications | T-004 | `backlog/` | TBD | TBD | TBD | Brief: `backlog/push-notifications/README.md`. Needs browser/PWA permission and scheduling decisions before implementation. |
| LLM-assisted lesson ingestion predecessor | Historical | `complete/` | `complete/english-review-app-llm-ingestion-superseded/prd.md` | `complete/english-review-app-llm-ingestion-superseded/test-spec.md` | `complete/english-review-app-llm-ingestion-superseded/implementation-plan.md` | Superseded historical planning context. |

## Folder Structure

```text
docs/prd/
  README.md
  future-work.md
  active/
    README.md
    spaced-repetition-interval-policy/
      prd.md
  backlog/
    new-member-learning-load/
      README.md
    push-notifications/
      README.md
  complete/
    daily-expression-memorization/
      prd.md
      test-spec.md
      implementation-plan.md
    english-review-app-llm-ingestion-superseded/
      prd.md
      test-spec.md
      implementation-plan.md
```

Feature folders can start with `README.md` as a brief. Once work is close to implementation, add stable artifact files:

- `prd.md`
- `test-spec.md`
- `implementation-plan.md`

The folder name identifies the feature. The lifecycle folder identifies whether it is backlog, active, or complete.

## How to Pull Work

1. Add or update a tracker item in `future-work.md`.
2. Keep its feature folder under `backlog/` while it is only planned or pull-ready.
3. Create or update `prd.md` and `test-spec.md` before implementation if the work changes user-visible behavior, scheduling, persistence, auth, push, or schema.
4. Move one feature folder to `active/` when implementation starts, and move the tracker item to `Active`.
5. After verification, move the feature folder to `complete/` and record changed files plus commands/checks in `future-work.md`.

Implementation PRs must not leave their own PRD under `backlog/`; lifecycle state should change in the same PR that starts or carries the implementation.
