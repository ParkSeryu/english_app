# WCT Quiz Quality and Variety Design

Date: 2026-08-05
Status: Approved

## Summary

Replace the low-quality generated questions in the standard WCT Day quizzes
and the Prenovice/Novice book Pop Quiz with a source-faithful `wct-review-v2`
question system. Each standard Day keeps five choice-based questions, but the
set now mixes sentence choice, fill-in-the-blank choice, and O/X. A book Pop
Quiz still selects exactly one question from every Day and balances the three
formats across the attempt.

The implementation must remove Day/course labels from question text, eliminate
random unrelated distractors, and reject ambiguous output. Correct answers come
only from the approved pattern, example, and Korean-meaning data already stored
for that Day. No typing question is added. Premium and WCT lesson content remain
unchanged.

## Current Failure and Root Cause

The current `wct-review-v1` standard generator creates three translation and
two pattern questions, then selects three strings from a book-wide example
pool by hash rank. This guarantees four distinct strings but does not guarantee
one defensible answer. It can therefore present two acceptable choices,
unrelated distractors, or a poor source example. The standard adapter also
inserts labels such as `Day 2` into some prompts.

The book Pop Quiz snapshots one existing question from each Day set. It does
not improve or reinterpret that question, so every Day-level quality problem is
copied into the Pop Quiz. Existing validation checks shape, counts, and string
uniqueness, but it does not check grammar intent, answer ambiguity, metadata
leaks, or explanation quality.

## Goals

- Rebuild all 44 standard WCT Day quiz sets: Prenovice 16 and Novice 28.
- Keep exactly five questions in every standard Day quiz.
- Use three button-only formats: sentence choice, fill-in-the-blank choice, and
  O/X.
- Keep exactly one question per Day in each book Pop Quiz: 16 for Prenovice and
  28 for Novice.
- Make consecutive Pop Quiz attempts use a different question and format for
  every Day while keeping refresh/resume stable.
- Reveal source Day and topic in confirmed-answer feedback, not in the question
  prompt or choices.
- Generate correct answers only from that Day's approved patterns, examples,
  and meanings.
- Reject ambiguous, malformed, metadata-bearing, or otherwise unsafe output
  before anything is written.
- Provide a curated, source-hash-guarded override for a Day that cannot safely
  produce all five questions automatically.
- Replace production data atomically, reset scores made against the old
  questions, deploy the app, and verify the live user flows.

## Non-goals

- Typing, free-text marking, speaking, audio, or pronunciation scoring
- Runtime AI/model calls or generated lesson content
- Editing WCT books, Days, topics, patterns, meanings, or examples
- Adding a quiz editor or exposing answer-authoring controls in the app
- Changing WCT Premium questions, progress, routes, or quiz behavior
- Attempt history, rankings, timers, streaks, or spaced repetition
- Changing the existing one-current-attempt Pop Quiz persistence model

## Question Contract

### Semantic kind and interaction format

The existing semantic `kind` remains the description of what is tested:

- `translation`: recognizing the English expression for an approved Korean
  meaning;
- `pattern`: recognizing or applying an approved Day pattern;
- `concept`: legacy/Premium only and not generated for standard v2 sets.

A separate `format` controls the interaction:

- `multiple_choice`: four sentence choices;
- `fill_blank`: four choices for one blank;
- `true_false`: exactly two choices, `O` and `X`.

All formats continue to use stable `choiceId` values and the existing
select-then-confirm scoring flow. No answer is typed. Stored legacy questions
without `format` are interpreted as `multiple_choice` at the rendering and
selection boundary. The reader preserves the original JSON shape rather than
materializing a default `format` property, because Pop Quiz source validation
compares its snapshot with the stored question JSON exactly.

### Feedback data

The existing `explanation` string remains readable for legacy and Premium
questions. A v2 question also carries structured feedback:

- `correctSentence`: the complete approved source sentence;
- `pattern`: the approved source pattern;
- `reason`: why the answer is correct or the selected construction is wrong.

The v2 generator must populate all three fields. The common question UI renders
structured feedback when present and falls back to the legacy explanation when
it is absent. This keeps old snapshots and Premium readable without upgrading
them to v2.

Validation is format-aware: O/X has two unique choices; the other formats have
four unique choices; every question has exactly one stored correct choice; and
v2 questions require the structured feedback fields. Day and Pop Quiz readers
reuse one common question schema/helper so their supported formats and legacy
behavior cannot drift.

## Source Eligibility and Provenance

The standard v2 source adapter reads only the target Day. It does not use
sentences from neighboring Days or the rest of the book as distractors. Eligible
correct-answer material must:

- belong to an approved pattern/example relationship in that Day;
- have non-empty English text and Korean meaning where the format requires a
  translation prompt;
- not be marked as needing source review;
- not contain a course-name or metadata token such as `WCT`, `Day N`,
  `Prenovice`, or `Novice` in the source example or generated learner-facing
  fields; the intentional post-confirmation `Day N · topic` line is the only
  exception;
- remain unchanged when used as the correct sentence.

The v2 `sourceHash` is calculated from the normalized target Day fields used by
the generator: Day identity, topic, pattern text, pattern meaning/usage, example
text, and example meaning. It no longer depends on a book-wide distractor pool.
Question IDs include the v2 generator version, source identity, format, and
question slot so v1 and v2 IDs cannot collide.

The generation/audit output records the source pattern and example identifiers
for each question even if those identifiers are not displayed to the learner.
This provides a direct trace from every correct answer back to approved Day
content.

## Standard Day Set Composition

Every Prenovice/Novice Day set contains:

- two `multiple_choice` questions;
- two `fill_blank` questions;
- one `true_false` question;
- three `translation` and two `pattern` semantic kinds across those formats.

The five questions are ordered deterministically from the lesson key and source
hash. Identical formats may not be adjacent. The set stays fixed during normal
retakes of that individual Day quiz, preserving the existing latest-score
contract; the book Pop Quiz is where per-attempt Day selection rotates.

### Sentence choice

The prompt gives an approved Korean meaning or approved pattern target. The
correct choice is the exact linked source example. The three wrong choices are
controlled one-error mutations of that same source sentence, not random
book-wide examples.

An eligible mutation changes one target-bearing element such as the required
auxiliary/modal, verb form, agreement, tense/aspect marker, preposition, or word
order. It is used only when the target meaning or pattern makes the mutated
choice wrong. If another choice can also satisfy the prompt, the question is
rejected.

### Fill-in-the-blank choice

The prompt shows an approved complete example with one core pattern chunk
replaced by a single blank and includes the Korean meaning when available. The
correct choice restores the exact source sentence. The three wrong choices are
the same grammatical category as the missing chunk and each violates exactly
one requirement of the target pattern or meaning.

The generator must be able to reconstruct the exact source sentence by
inserting the correct choice. It rejects blanks that are merely vocabulary
guessing, blanks with two interchangeable answers, and alternatives that change
unrelated parts of the sentence.

### O/X

The prompt pairs an approved target meaning/pattern with one English statement
and asks whether the statement matches it. An O statement is the exact source
example. An X statement changes exactly one controlled grammar element. The
mutation is allowed only when it creates a definite mismatch with the stated
meaning or pattern; a different but still grammatical sentence is not enough.

The explanation identifies the changed element, shows the correct sentence,
and ties it back to the original pattern. The correct choice is represented by
the same `choiceId` scoring mechanism as every other format.

## Deterministic Generator and Curated Overrides

The standard adapter, finite mutation recipes, format-aware validator, and set
composer are separate units. The generator has no database, React, or network
dependency. Given the same Day content and generator version, it produces the
same validated set.

Generator versions are not represented by one shared mutable constant. The
standard entry point uses
`WCT_STANDARD_QUIZ_GENERATOR_VERSION = 'wct-review-v2'`, while the separate
Premium entry point keeps
`WCT_PREMIUM_QUIZ_GENERATOR_VERSION = 'wct-review-v1'`. Read validation accepts
both versions and dispatches by `sourceKind`; the standard v2 path cannot accept
a Premium source, and the Premium v1 path cannot generate a standard v2 set.

Every mutation recipe has explicit eligibility preconditions and emits its
changed span and reason. It may not silently fall back to arbitrary corpus
sentences. Automatic generation fails when it cannot produce enough distinct,
defensible questions.

Unsafe Days use a checked-in full-Day override keyed by normalized level and
Day number. Each override includes the expected target-Day `sourceHash` and the
same five-question schema and format distribution as generated sets. A hash
mismatch makes the override stale and fails generation; it never silently
applies authored questions to changed source content. Curated correct answers
must still reference exact approved Day examples and patterns.

The batch workflow first attempts automatic generation for every Day. A Day
that fails a rule, or whose generated output fails editorial review, receives a
curated override. The entire 44-Day batch must validate before a migration or
hosted write can be produced. There is no low-quality fallback and no partial
success mode.

## Quality Gates

The following checks are release blockers:

- exactly 44 standard sets and 220 questions;
- the 2 sentence-choice, 2 fill-blank, 1 O/X distribution in every set;
- the 3 translation, 2 pattern distribution in every set;
- no adjacent identical formats in a Day set;
- an exact O/X answer balance within each book's standard sets: Prenovice
  `8 O / 8 X` and Novice `14 O / 14 X`;
- no normalized duplicate prompts or choices within a set;
- no `Day N`, `Prenovice`, `Novice`, or `WCT` token in learner-facing prompts
  or choices;
- the correct sentence and pattern resolve to that Day's approved source;
- every wrong choice is traceable to one declared mutation and differs from the
  source in only the declared target;
- correct blank insertion exactly reconstructs the source sentence;
- O uses the exact source sentence and X contains exactly one declared error;
- exactly one answer satisfies the stated meaning/pattern;
- non-empty structured feedback that names the exact correction;
- no replacement characters, `???`, or corrupted Korean text.

Mechanical checks enforce structure, provenance, reconstruction, mutation
count, and forbidden text. Because semantic ambiguity cannot be proved by
string validation alone, a stable human-readable audit artifact lists all 220
questions with Day/topic, prompt, choices, correct answer, source pattern,
source sentence, and reason. Every question is reviewed before the production
migration is generated. A deterministic output hash ensures any later generator
or payload change invalidates that review and requires a fresh audit. A
checked-in v2 audit-approval manifest stores the generator version, complete
source-inventory hash, question-artifact hash, reviewer, review timestamp, and
explicit approved state. Data-migration generation refuses to proceed unless
all manifest values match the current source and artifact.

## Pop Quiz Selection and Retakes

The Pop Quiz continues to select exactly one non-concept question from every
Day and presents Days in ascending order. On the first attempt, the target
format follows a repeating three-format schedule whose starting format is
derived from the attempt seed. This produces counts that differ by at most one:

- Prenovice 16: `6 / 5 / 5` across the three formats;
- Novice 28: `10 / 9 / 9` across the three formats.

The format receiving the extra question varies with the first-attempt seed.
When more than one candidate exists for a target format, seeded ranking chooses
the candidate.

On a completed-attempt retake, the previous snapshot—not a fresh random offset—
determines each Day's next format using one fixed cycle:
`multiple_choice → fill_blank → true_false → multiple_choice`. Since every Day
set has all three formats, this is a per-Day derangement: every Day receives a
different format and therefore a different question ID. The new seed only ranks
candidates within the already required format. Rotating all formats preserves
the count difference of at most one. Refreshing or reopening an in-progress
attempt reuses its stored snapshot and does not rotate anything.

Standard-set O/X answer state is allocated deterministically from level and Day
number to produce the exact 8/8 and 14/14 book balances. If a Day cannot support
a safe X mutation, the batch allocator swaps its target state with an eligible
O Day and uses a curated override as needed; it may not weaken the X rule. Since
Pop Quiz true/false slots occur every third Day in the ordered schedule, their O
and X totals also differ by at most one on every attempt.

The Pop Quiz validator and database start RPC verify one question per current
book Day, balanced format counts, source payload equality, and a different
format and question ID for each individual Day on retake. Overall signature
inequality alone is insufficient. Attempt creation fails atomically when any
Day lacks a valid candidate.

## Learner Experience

The common question card shows a small interaction badge above the prompt:
`문장 선택`, `빈칸`, or `O/X`. This badge describes only how to answer; it does
not reveal the source Day.

- O/X renders two large `O` and `X` buttons.
- Sentence choice and fill-in-the-blank render four choice buttons.
- Selection remains editable until `정답 확인` and locked afterward.
- There is no input field, keyboard submission, or typing mode.

Generated prompts and choices never include Day, topic, level, or WCT course
labels. In the book Pop Quiz, source Day/topic are completely hidden before
confirmation. After confirmation, the feedback panel shows `Day N · topic`,
then the correct sentence, original pattern, and exact correction reason. The
standard Day route retains its existing surrounding Day navigation context but
uses the same post-confirmation feedback details; it does not inject Day/topic
into the question itself.

Result screens, score calculation, answer locking, resume, and review links keep
their existing behavior apart from the variable choice layout and improved
feedback.

## Persistence and Backward Compatibility

`wct_quiz_sets` continues to store five questions atomically and retains its
unique `(owner_id, lesson_key)` identity. Standard v2 sets use
`generator_version = 'wct-review-v2'`. Premium remains on
`wct-review-v1`; introducing v2 must not make the Premium ensure path generate
or replace a Premium set.

Question readers accept both versions:

- missing `format` is interpreted as `multiple_choice` without rewriting the
  stored/snapshotted JSON;
- missing structured feedback falls back to `explanation`;
- legacy four-choice questions and stored snapshots remain parseable.

The production rollout deliberately deletes current Prenovice/Novice Pop Quiz
snapshots, so known poor attempts do not remain visible. The compatibility path
still protects any legacy fixture or row outside the targeted rollout and keeps
Premium unchanged.

### Future Day creation or edits

The current `createSetIfMissing` behavior cannot update an existing v1 or stale
set. Standard v2 synchronization therefore uses a dedicated admin-only atomic
batch operation. The coordinator generates and validates every affected Day
draft before calling it. Within one transaction, the operation:

1. inserts each missing standard set;
2. skips any set whose generator version and source hash already match;
3. updates every other existing row in place, preserving its set UUID;
4. deletes `wct_quiz_progress` for every changed set because its questions
   changed;
5. deletes the current Pop Quiz row for every affected book because its
   immutable snapshot may contain an old source question;
6. rolls back every set and progress change if any affected Day fails.

The skip case assumes deterministic generator integrity: matching generator
version and source hash must also reproduce the same canonical question JSON.
If those identity fields match but the payload differs, synchronization treats
the row as a version/hash collision and fails without mutation; it does not
silently overwrite questions or reset progress under an unchanged version.

The database implementation is one service-role-only transactional RPC; normal
authenticated clients retain read-only table access and cannot call it. The
memory implementation mirrors the batch behavior for tests.

The existing source import remains its own approval-gated transaction; this
feature does not merge lesson-source writes into the quiz RPC. After that import
commits, the coordinator loads the complete resulting Days, preflights all
affected v2 drafts, and submits them as one quiz batch. Thus “all-or-nothing”
applies to the affected quiz sets and their progress, not to the already
approved source import. If preflight or batch synchronization fails, all old
quiz sets and progress remain stored, the response identifies the exact
Day/reason, and the operation can be retried.

Standard Day and Pop Quiz loaders compare a stored v2 set hash with the current
target-Day source hash. A stale set is not offered or scored even though it is
retained for transactional recovery; the Day content remains readable and the
quiz surface shows the existing preparation/restart error until synchronization
succeeds. An active Pop snapshot is also rejected when any referenced set is
stale.

## Production Replacement

The sole hosted target is main/production Supabase project
`ccawzrrkxuirrwvaecvw`. Before any hosted read or write, the implementation
verifies `.env.local` resolves to that project ref. Hosted writes use the
repository migration ledger and require the project's explicit production
confirmation guard immediately before application.

A generator script reads the two target books, asserts one current WCT owner,
asserts the 16/28 Day inventory and exact eight-entry source-correction
preimage, projects that manifest in memory, builds and audits all 44 v2 sets,
and emits a new timestamped data migration. The artifact and approval bind the
manifest hash plus the pre- and post-correction source hashes. The migration
contains the reviewed payloads and, inside one ledger-managed transaction:

1. asserts the expected owner, books, Days, source rows, and all 44 target quiz
   sets before mutation;
2. verifies all eight exact old English/Korean values and parent relationships,
   then changes only the one allowlisted text field in each example;
3. verifies the exact post-correction source hash and unchanged non-allowlisted
   source fields;
4. updates those standard set rows in place to v2 payloads and hashes;
5. deletes all `wct_quiz_progress` rows for those 44 set IDs;
6. deletes all `wct_pop_quiz_progress` rows for the target Prenovice and Novice
   book IDs;
7. leaves every non-allowlisted WCT source field and every Premium row untouched;
8. asserts 44 v2 sets, 220 valid questions, per-set format counts, and zero
   remaining targeted progress rows after mutation.

Any failed assertion rolls back the migration and ledger entry. Applied
migrations are never edited or baselined as a substitute for this new
migration. After application, a direct production readback compares every
stored generator version and source hash, verifies semantic JSONB equality via
the documented canonical serialization/hash, and compares each Korean string
exactly with the reviewed expected payload. JSONB key order and whitespace are
not treated as byte-stable.

### Compatibility-safe release order

The migration runner applies every pending migration, so the schema and data
phases must be separate repository checkpoints. The data migration file must
not exist locally when the schema phase is applied. The release sequence is:

1. In checkpoint A, commit only the additive schema/RPC migration and dual-read
   application code. The migration adds the admin batch-sync contract and
   teaches Pop start validation to accept either a complete v1 or complete v2
   inventory; it does not replace question data.
2. Confirm `db:status` shows only that schema migration pending, apply it, deploy
   the dual-read app, and verify the still-v1 production quizzes.
3. Only after checkpoint A is healthy in production, generate/review/commit the
   audit manifest and 44-set v2 data/reset migration as checkpoint B.
4. Confirm `db:status` now shows exactly the reviewed data migration pending,
   apply it, and perform direct production readback.
5. Deploy checkpoint B if it contains non-migration artifacts required at
   runtime, then run authenticated production smoke checks.

During step 2, the selector uses the existing one-per-Day behavior when every
standard source set is v1 and the v2 balanced/rotating behavior when every set
is v2. A mixed v1/v2 book fails with a preparation error rather than combining
contracts. The Pop start RPC enforces the matching version-specific rules.
Because the 44 updates commit atomically, normal readers see either the complete
v1 inventory or the complete v2 inventory, never an intermediate mix.

After the v2 data conversion, production may not roll back to a v1-only app. A
code rollback must retain the dual-read/v2 contract, or a new forward recovery
migration must restore compatible data before an older app is deployed.

Resetting both progress tables is intentional: old Day scores were calculated
against different questions, and Pop Quiz snapshots contain v1 question JSON.
The learner starts clean on v2. This rollout does not delete lesson content or
unrelated app data.

## Error Handling

- A Day generation error identifies level, Day number, failed rule, and source
  reference; the quiz batch writes nothing. A previously committed approved
  source import is not rolled back.
- A stale curated override reports its expected and actual source hash and
  blocks regeneration.
- Fewer than five safe questions blocks the Day set instead of relaxing a
  quality rule.
- A missing target format blocks Pop Quiz creation instead of reusing another
  format or duplicating a question.
- A stale browser submitting a reset Pop Quiz attempt receives a restart
  message and cannot score against the new set.
- A standard-set synchronization failure preserves the previously committed
  set and progress because replacement and invalidation are transactional.
- Migration inventory, payload, or postcondition mismatch rolls back the whole
  production replacement.
- User-facing errors do not expose correct choice IDs, service credentials, or
  cross-owner data.

## Testing and Verification

### Generator and audit

- Unit tests cover every mutation recipe's eligibility and one-change rule.
- Format validators cover two-choice O/X, four-choice sentence/blank questions,
  legacy defaulting, v2 feedback requirements, and invalid combinations.
- Generator tests cover deterministic IDs/order, target-Day-only provenance,
  format/kind distributions, non-adjacent formats, reconstruction, stale
  override failure, and complete failure without five safe questions.
- A full production-source dry run audits all 44 Days and 220 questions and
  produces the reviewed artifact and deterministic hash.
- Negative fixtures reproduce the existing Day-label leak, ambiguous choices,
  unrelated corpus distractors, and malformed source examples; v2 rejects each
  one.

### Selection, UI, and persistence

- Pop selector tests prove 16/28 one-per-Day selection, balanced formats,
  stable resume, and a different question/format for every Day on retake.
- Component tests cover all three badges/layouts, selection and confirmation,
  correct/incorrect states, source metadata hidden before confirmation and
  shown afterward, structured feedback, and legacy fallback rendering.
- Store/RPC tests cover in-place set replacement, idempotent same-hash sync,
  multi-Day all-or-nothing replacement, Day progress reset, Pop snapshot reset,
  trusted server scoring, invalid choice rejection, stale-source blocking, and
  rollback behavior.
- RLS tests prove owner-only reads, anonymous/non-owner denial, browser-direct
  write denial, and service-role-only synchronization.
- Migration tests prove exact target counts, Premium/source preservation,
  atomic rollback, progress resets, and payload/text integrity.
- Compatibility tests prove v1 JSON is not materialized or rewritten, Premium
  remains readable/scorable, v1 Pop behavior works before the data migration,
  v2 behavior works afterward, and mixed inventories fail closed.
- Release-script tests or dry runs prove checkpoint A has only the additive
  migration pending and checkpoint B has only the reviewed data migration
  pending.

### Runtime and release gate

Run lint, typecheck, targeted generator/component/store tests, the relevant
broader test suites, RLS verification, and a production build. Exercise at
least one standard Day quiz containing all three formats and complete both the
16-question Prenovice and 28-question Novice Pop Quiz flows at mobile viewport,
including confirm feedback, refresh/resume, results, and retake rotation.

Run the built app on `0.0.0.0`, verify the affected standard and Pop Quiz routes
over localhost and the reachable machine IP, and scan server output for 500s,
missing chunks, schema errors, and failed actions. After production deployment,
repeat authenticated smoke checks against the live routes and confirm the new
attempt totals and v2 feedback are visible.

## Acceptance Criteria

- All 44 standard Day quiz sets use `wct-review-v2`; Premium remains v1.
- Every Day quiz has five questions with the approved 2/2/1 format mix and no
  typing interaction.
- Standard O/X answers are balanced exactly 8/8 in Prenovice and 14/14 in
  Novice; each Pop attempt's selected O/X answers differ in count by at most
  one.
- Every prompt, correct answer, and feedback item traces to that Day's approved
  content, and every distractor has one declared error.
- No question or choice leaks Day/course metadata or has more than one valid
  answer.
- Prenovice Pop Quiz has 16 questions and Novice has 28, exactly one per Day,
  with format counts differing by at most one.
- A Pop retake changes question and format for every Day; refresh/resume does
  not change the active attempt.
- Day/topic appear in confirmed-answer feedback, not in Pop question prompts or
  choices.
- Existing targeted Day scores and Pop attempts are reset once during the v2
  production replacement; the exact eight approved example text fields change
  atomically, while all other WCT source content and Premium data are unchanged.
- Production data is semantically equal to the reviewed 44-set JSON payload by
  canonical hash after the migration, with exact intact Korean strings.
- Lint, typecheck, tests, build, RLS, local live routes, and deployed production
  smoke checks all pass before completion is reported.

## PRD Lifecycle

At implementation start, create or move this feature's tracked folder to
`docs/prd/active/wct-quiz-quality-variety/` and mark its
`docs/prd/future-work.md` item Active in the same checkpoint. Keep it Active
through the compatibility deployment and production data conversion. Only
after the v2 production readback and authenticated route checks pass, move the
folder to `docs/prd/complete/wct-quiz-quality-variety/` and record changed
files, exact verification commands, deployment evidence, and remaining risks in
the tracker.
