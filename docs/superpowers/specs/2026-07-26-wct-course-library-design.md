# WCT Course Library Design

Date: 2026-07-26
Status: Approved in conversation; awaiting review of this written specification

## Summary

Replace the legacy lesson content with a private, read-only WCT course library. The library is separate from expressions, memorization, and question notes. The owner sends scanned textbook pages to the assistant, reviews an OCR-derived structured draft in conversation, and explicitly approves the draft before it is stored.

The first supported textbook is `WCT Pattern Book Prenovice`. Only its `Day 1` through `Day 16` pattern section is in scope. The later `Topic 1` through `Topic 14` section is excluded.

## Repository Baseline

The current repository has two relevant historical surfaces:

- The active expression system uses `expression_days`, `expressions`, `expression_examples`, and `ingestion_runs`.
- Legacy migrations still define `lessons`, `study_items`, and `study_examples`, but the current `/lessons` routes redirect to `/expressions`.

The user-facing product expectation is that the bottom GNB contains `수업`. The implementation will make that destination the WCT library. It will not reuse the expression or memorization data model.

The legacy `lessons`, `study_items`, and `study_examples` data does not need to be preserved or migrated. `ingestion_runs` must remain because the active expression ingestion flow still uses it.

## Goals

- Show a private WCT textbook shelf from the existing `수업` GNB destination.
- Organize content as textbook, Day, pattern, example, important note, and selected practice prompt.
- Accept a multi-page or whole-book scan through the assistant workflow.
- Detect Day boundaries and extract multiple Days from one upload.
- Review and revise the complete structured draft in conversation.
- Require explicit approval before writing any WCT content.
- Keep all WCT data visible only to the configured owner account.
- Support safe duplicate handling for an already stored textbook Day.

## Non-Goals

- Memorization cards, quizzes, progress, or speaking practice mode
- Topic 1 through Topic 14 from the supplied textbook
- Scan or PDF storage in the app
- App-based WCT entry, editing, or deletion
- Search, filtering, completion status, or progress tracking
- Compatibility with or migration of legacy lesson data
- Additional academy types or non-WCT course providers
- AI-generated extra example sentences

## Source Material Findings

The supplied source is an image-only, 160-page PDF:

- File: `WCT Pre Novice.pdf`
- Cover title: `WCT Pattern book Prenovice`
- Pattern section: Day 1 through Day 16
- Conversation section: Topic 1 through Topic 14
- The PDF contains printed workbook content and handwritten answers, corrections, and teacher notes.
- Several Day sections contain both an annotated copy and a clean repeated copy of the same A/B example set.
- Day sections vary in length, so the importer must detect explicit Day title pages rather than assume a fixed page count.

Observed PDF page boundaries:

| Day | Start page | Next boundary |
| --- | ---: | ---: |
| 1 | 7 | 15 |
| 2 | 15 | 24 |
| 3 | 24 | 32 |
| 4 | 32 | 40 |
| 5 | 40 | 48 |
| 6 | 48 | 56 |
| 7 | 56 | 64 |
| 8 | 64 | 72 |
| 9 | 72 | 80 |
| 10 | 80 | 87 |
| 11 | 87 | 94 |
| 12 | 94 | 102 |
| 13 | 102 | 109 |
| 14 | 109 | 117 |
| 15 | 117 | 124 |
| 16 | 124 | 128 |

Topic content begins on PDF page 128 and must not be imported.

## Information Architecture

The hierarchy is:

`수업 → WCT 교재 → Day → 핵심 개념 / 대표 패턴 / 중요 메모 / 핵심 연습`

The first screen is a textbook shelf. Selecting a textbook opens its ordered Day list. Selecting a Day opens one vertically readable page with all pattern cards expanded.

### Day labels

The source Day cover pages usually contain only a number. The assistant generates a short, content-derived Korean label and presents it for review.

Display format:

`Day N (짧은 핵심어)`

The label should normally be 2 to 10 characters or one short Korean-English phrase. It must identify the dominant pattern without pretending the source printed a title. Format examples include `Day 1 (주어와 like)` and `Day 13 (can 가능)`. The actual labels are derived from the inspected content and remain editable before approval.

## User Flow

1. The user sends one or more scanned images or a PDF and supplies or selects the textbook name.
2. The assistant detects explicit Day cover pages and splits the scan into Day ranges.
3. The assistant extracts only the approved Day range and ignores Topic pages.
4. The assistant builds a structured draft grouped by textbook and Day.
5. The assistant marks uncertain OCR text as `확인 필요`.
6. The user revises the draft in conversation.
7. The assistant checks the target database for duplicate textbook-Day pairs.
8. For every duplicate, the user chooses `교체`, `병합`, or `취소`.
9. The user explicitly approves the final draft for saving.
10. A protected server endpoint validates the payload and stores all approved operations in one transaction.
11. The assistant reports the textbook, affected Days, and resulting WCT URLs.

No app data is written before step 9.

## OCR and Editorial Rules

### Canonical text

- Printed textbook content is the canonical source.
- When the workbook repeats the same A/B example set as an annotated and a clean copy, store one canonical copy.
- Match Korean and English lines by section, numbering, and layout before relying on OCR text order.
- Preserve the source sequence within each Day.
- Do not silently guess a low-confidence word or sentence. Mark it `확인 필요`.

### AI supplements

- When the book lacks a concise usage or grammar explanation, the assistant may add one.
- Every generated explanation carries the source marker `AI 보완`.
- Printed explanations carry the source marker `교재`.
- Do not generate additional example sentences in the first version.

### Handwriting

Do not copy handwriting wholesale. Store a handwritten item as an important note only when it materially improves learning:

- a correction to more natural spoken English;
- a grammar exception or easily confused distinction;
- a correction that changes meaning;
- a clearly emphasized condition for using the pattern.

Exclude ordinary answers, circles, check marks, repeated copying, calculations, and illegible or context-free marks.

### Questions and practice

Questions and Practice pages are not imported in full. Store only prompts that directly help the learner understand, transform, or use the Day's central pattern. These appear in the Day's `핵심 연습` section.

## Screen Design

### Textbook shelf

The `수업` GNB destination opens the WCT textbook shelf.

Each book card shows:

- textbook name;
- level when available;
- stored Day range;
- number of stored Days.

The selected visual direction is a bookshelf/card layout, not a mixed recent-Day feed.

### Textbook detail

The textbook detail page lists Days in ascending numeric order. Each row or card shows:

- `Day N (short label)`;
- pattern count;
- whether any item still requires confirmation.

### Day detail

The Day detail page shows:

1. the Day label and short learning summary;
2. ordered core concepts;
3. fully expanded pattern cards;
4. each pattern's meaning, explanation, source badge, and examples;
5. a compact `중요 메모` section when applicable;
6. a compact `핵심 연습` section when applicable.

The selected visual direction is fully expanded pattern cards. Accordion-only or pattern-per-page navigation is not used in the first version.

The app does not expose add, edit, or delete controls for WCT content. Changes go through the approval-gated assistant workflow.

### States

- Empty shelf: explain that approved WCT imports will appear here.
- Empty Day: show a non-destructive empty state without inventing content.
- Unauthorized or missing entity: return the existing app's not-found/access-safe behavior.
- Load failure: show a retryable error and log the server-side cause without exposing secrets.

## Data Model

All tables use UUID primary keys and timestamps. Child ownership is derived through the parent book. RLS policies use an ownership check that joins back to `wct_books.owner_id`.

### `wct_books`

- `id`
- `owner_id`
- `title`
- `level_label`
- `sort_order`
- `created_at`
- `updated_at`

Constraint: one normalized title per owner.

### `wct_days`

- `id`
- `book_id`
- `day_number`
- `short_label`
- `learning_summary`
- `source_page_start`
- `source_page_end`
- `source_needs_review`
- `created_at`
- `updated_at`

Constraint: unique `(book_id, day_number)`.

### `wct_day_concepts`

- `id`
- `day_id`
- `concept_text`
- `source_kind`: `book` or `ai_supplement`
- `sort_order`

### `wct_patterns`

- `id`
- `day_id`
- `pattern_text`
- `meaning_ko`
- `usage_note`
- `usage_source`: `book` or `ai_supplement`
- `source_page`
- `source_needs_review`
- `sort_order`

### `wct_examples`

- `id`
- `pattern_id`
- `english_text`
- `meaning_ko`
- `source_page`
- `source_needs_review`
- `sort_order`

### `wct_important_notes`

- `id`
- `day_id`
- `pattern_id`, nullable
- `note_text`
- `source_page`
- `sort_order`

### `wct_practice_prompts`

- `id`
- `day_id`
- `pattern_id`, nullable
- `prompt_text`
- `meaning_ko`, nullable
- `source_page`
- `sort_order`

### `wct_import_receipts`

Stores only an approved import receipt, not the scan or draft:

- `id`
- `owner_id`
- `book_id`
- `idempotency_key`
- `payload_hash`
- `operation_summary`
- `created_at`

Constraint: unique `idempotency_key`.

This receipt prevents a successful assistant/API retry from duplicating content.

## Approved Import Contract

The protected endpoint accepts one approved batch containing:

- book identity and title;
- a client-stable idempotency key;
- ordered Day payloads;
- a duplicate operation for each Day: `create`, `replace`, `merge`, or `skip`;
- ordered concepts, patterns, examples, important notes, and practice prompts.

The endpoint never accepts an owner ID from the client. It resolves the WCT owner from server-only configuration, validates every nested field, confirms duplicate operations against current data, and calls one database transaction.

The draft itself remains in conversation. The app stores only the approved normalized records and the small import receipt.

## Duplicate Semantics

Duplicate identity is `(owner, normalized book title, day number)`.

- `create`: valid only when the Day does not exist.
- `replace`: remove the existing Day's child content and write the approved replacement.
- `merge`: keep existing content and add only normalized non-duplicates.
- `skip`: leave the existing Day unchanged.

Merge normalization:

- patterns: trimmed, case-folded, whitespace-normalized `pattern_text`;
- examples: normalized English text plus Korean meaning;
- notes and practice prompts: normalized text.

All selected operations occur in one transaction. A validation or database failure rolls back the entire approved batch.

## Privacy and Security

- `wct_books.owner_id` is the trust anchor.
- Every WCT read requires an authenticated user whose ID matches the owning book.
- Child write policies require an owned ancestor.
- Browser payloads cannot select or override the owner.
- The assistant endpoint uses the existing server-only token boundary and a server-configured owner ID.
- Service-role credentials never reach the browser.
- Scan files and unapproved OCR text are not uploaded to app storage or saved in WCT tables.
- RLS verification includes authenticated owner and non-owner reads for every new table.

## Legacy Removal and Migration

Implementation uses timestamped SQL migrations and the repository migration ledger.

The replacement migration may remove:

- `public.study_examples`;
- `public.study_items`;
- `public.lessons`;
- their policies and indexes.

It must preserve:

- `public.ingestion_runs`;
- all expression, memorization, question, auth, and folder data.

Before dropping anything, the implementation must verify that runtime code, tests, and database objects no longer depend on the legacy tables. The migration does not attempt to copy legacy lesson rows into WCT tables.

Database environments remain separate:

- dev: project `uixpyibcpleuwsgemdno`;
- main/production: project `ccawzrrkxuirrwvaecvw`.

Run migration status and apply/verify in dev first. Main requires a separate status check and the repository's explicit production confirmation path. Approval of this design does not substitute for verifying the exact production migration target.

## Error Handling

- Unreadable page: retain the Day draft and mark affected fields `확인 필요`.
- Missing Day cover: do not infer a new Day solely from page count.
- Out-of-order pages: surface the order problem before drafting.
- Duplicate without an explicit operation: reject the approved request.
- Stale duplicate decision: reject if the target changed after review.
- Invalid nested content: reject the entire batch with field-level errors.
- Transaction failure: roll back all Day changes.
- Idempotent retry: return the prior successful receipt rather than writing again.

## Acceptance Criteria

1. The `수업` GNB destination opens a WCT textbook shelf.
2. Only the authenticated owner can view WCT books and their descendants.
3. A textbook page lists Day records in ascending numeric order.
4. A Day label uses `Day N (short label)`.
5. A Day page renders concepts, expanded pattern cards, examples, important notes, and selected practice prompts.
6. AI-supplemented explanations are visibly labeled `AI 보완`.
7. A full-book draft can include Day 1 through Day 16 in one approved batch.
8. Topic 1 through Topic 14 is absent from the imported result.
9. Repeated clean and annotated A/B pages do not produce duplicate examples.
10. Ordinary handwriting is excluded; only high-value corrections become important notes.
11. Uncertain OCR remains visibly flagged until corrected.
12. No WCT item appears in expression or memorization queues.
13. Duplicate create, replace, merge, and skip operations follow the defined semantics.
14. Any failure rolls back the complete approved batch.
15. A retried successful request does not duplicate content.
16. The retired legacy lesson data is not migrated, while expression and ingestion data remains intact.

## Verification Plan

### Unit and schema tests

- payload validation and ordering;
- Day label formatting;
- normalization and duplicate detection;
- merge behavior for patterns, examples, notes, and prompts;
- AI source badge mapping;
- RLS policy presence and migration checksum.

### Integration tests

- multi-Day transactional create;
- replace, merge, and skip in one batch;
- full rollback on an injected failure;
- idempotent retry;
- owner read/write and non-owner denial;
- preservation of `ingestion_runs` and expression data after legacy removal.

### Component and route tests

- textbook shelf;
- Day list sorting;
- expanded Day content;
- empty, missing, unauthorized, and load-error states;
- bottom GNB `수업` navigation.

### Source-material smoke

Use the supplied PDF to verify representative cases:

- Day 1: early workbook structure and repeated A/B content;
- Day 10 or Day 11: a shorter Day boundary;
- Day 16: the final Day and boundary before Topic content;
- confirm PDF page 128 and later Topic pages are excluded;
- confirm ordinary handwriting is dropped and at least one high-value correction can be retained when present.

### Runtime gate

For implementation, run:

- `npm run lint`
- `npm run typecheck`
- targeted WCT tests
- `npm run build`
- `npm run verify:rls` when the new migration is present
- dev migration status, migration, and post-migration status
- a healthy running-app check of the WCT shelf, book, and Day routes
- a browser flow from the bottom `수업` GNB through a Day detail page

Main/production migration and live verification are separate from dev and require the explicit production confirmation path.

## Implementation Boundary

This document specifies the feature but does not authorize implementation in the brainstorming phase. The next step after written-spec approval is a detailed implementation plan. When implementation starts, the feature must follow the repository PRD lifecycle and move into `docs/prd/active/` with the matching tracker status.
