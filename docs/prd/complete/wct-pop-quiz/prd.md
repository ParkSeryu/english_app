# WCT Pop Quiz PRD

## Status

Complete

## Goal

WCT Prenovice and Novice learners can take a resumable book-level Pop Quiz
with one approved question from every current Day.

## Requirements

- Use immutable, owner-scoped approved Day quiz questions for the selected
  non-Premium book.
- Each new attempt selects exactly one `translation` or `pattern` question per
  current book Day: 16 for Prenovice and 28 for Novice at delivery.
- Keep questions in ascending Day order. A retake must change at least one
  source question while retaining the same Day coverage.
- Do not reveal the source before confirmation. In the existing feedback panel,
  show `Day N · topic` from the Day short label; legacy snapshots use their
  stored Day label.
- Persist the actual snapshot length for resume, progress, summary, scoring,
  and completion. Existing 20-question snapshots remain readable and
  completable.
- Persist only the current/latest owner-and-book attempt and preserve
  owner-scoped RPC/RLS protection. Premium books never expose Pop Quiz.

## Non-goals

- AI question generation or question authoring
- Premium Pop Quiz
- Attempt history, timers, rankings, certificates, or notifications
- Changing existing five-question Day quiz behavior

## Acceptance

- [x] Every new attempt has one eligible non-concept question from each current
  Day and preserves ascending Day order.
- [x] `Day N · topic` appears only after the answer is confirmed.
- [x] Refresh resumes the stored selection and confirmed answers.
- [x] Retakes change at least one source question for the same Day set.
- [x] Legacy 20-question snapshots parse and complete with their own total.
- [x] Server-owned persistence/scoring remain owner-isolated and enforce new
  Day coverage.
- [x] Relevant test, build, RLS, hosted rollback, and live-route checks passed.
