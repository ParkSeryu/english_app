# WCT Pop Quiz PRD

## Status

Active

## Goal

WCT Prenovice and Novice learners can take a book-level Pop Quiz that reviews
material across the book in one 20-question, resumable session.

## Requirements

- Use immutable, owner-scoped Day quiz questions already approved for the selected book.
- Each attempt contains exactly 20 unique questions: 12 translation and 8 pattern.
- The ordered book Days are split into contiguous early, middle, and late bands,
  contributing 7, 7, and 6 questions respectively.
- No Day supplies more than two questions.
- A retake must not repeat the exact set of 20 source questions from the previous attempt.
- Persist only the current/latest owner-and-book attempt, including confirmed answers,
  position, latest score, and deduplicated incorrect-Day references.
- Premium books never expose Pop Quiz.

## Non-goals

- AI question generation or question authoring
- Premium Pop Quiz
- Attempt history, timers, rankings, certificates, or notifications
- Changing existing Day quiz behavior

## Acceptance

- [ ] Every new attempt exactly satisfies total, type, band, uniqueness, and per-Day constraints.
- [ ] Refresh resumes the in-progress selection and confirmed answers.
- [ ] Retake creates a different source-question set.
- [ ] Server-owned persistence and scoring remain owner-isolated.
- [ ] Relevant test, build, RLS, and live-route checks pass before completion.