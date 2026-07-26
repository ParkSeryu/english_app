# PRD: WCT Private Course Library

## Goal

Turn the bottom `수업` destination into a private, read-only WCT textbook library organized as
`WCT → textbook → Day → concepts/patterns/examples/important notes/core practice`.

## Scope

- Add `수업` at `/lessons`.
- Show textbook cards, ordered Day cards, and fully expanded Day content.
- Use compact labels such as `Day 1 (수동태)`.
- Mark AI-added grammar clarification as `AI 보완`.
- Import reviewed Day batches only after explicit approval.
- Support explicit duplicate actions: replace, merge, skip.
- Keep WCT content private to its owner.
- Remove only unused legacy `lessons`, `study_items`, and `study_examples`.

## Non-goals

- Topic content or navigation.
- WCT memorization or quiz mode.
- Learner editing.
- In-app PDF upload/OCR.
- AI-generated example sentences.
- Generic course-management abstractions.

## Data boundaries

- Raw OCR and scans are not persisted.
- The import owner comes from server configuration, never request JSON.
- Browser clients have read-only owner-scoped access.
- `ingestion_runs` and all expression-card data remain intact.

## Acceptance criteria

- `/lessons` is reachable through the bottom GNB.
- A user can open a book and an ordered Day.
- Day content is fully readable without mutation controls.
- Other users cannot read guessed WCT IDs.
- Import is explicit, atomic, idempotent, and duplicate-aware.
- Topic data and raw OCR are absent from the contract and database.
