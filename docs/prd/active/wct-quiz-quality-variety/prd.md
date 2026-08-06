# WCT Quiz Quality and Variety PRD

## Status

Active

## User problem

The current standard WCT Day quizzes use fixed v1 questions that do not provide
enough interaction variety or reliable Pop Quiz retake variation. Learners need
source-faithful, button-only questions that can be safely replaced without
mixing old and new production contracts.

## Scope

- Rebuild the 44 standard WCT Day quiz sets: Prenovice 16 Days and Novice 28
  Days, for 220 total questions.
- Keep five questions in each Day set: two sentence-choice
  (`multiple_choice`), two fill-in-the-blank (`fill_blank`), and one O/X
  (`true_false`) question. Every question remains button-only; typing is not
  included.
- Use only the target Day's approved, non-review-pending patterns and examples
  for correct answers, prompts, and distractor evidence.
- Rotate every Day's Pop Quiz question and format on retake, for all 16
  Prenovice or 28 Novice Days.
- Reset existing standard Day progress and targeted Prenovice/Novice Pop Quiz
  progress when v2 data replaces the v1 questions.
- Correct exactly eight reviewed English/Korean example text fields across six
  source Days in the same checkpoint-B transaction as the v2 replacement;
  preserve every source ID, relationship, pattern, sort order, and all other
  source fields.
- Keep Premium on `wct-review-v1`; Premium questions, progress, routes, and
  learner behavior are excluded from this work.

## Production boundary

The sole hosted target is main/production Supabase project
`ccawzrrkxuirrwvaecvw`. Release is split into two production checkpoints:

1. Checkpoint A deploys only the additive compatibility schema/RPC migration
   and dual-read application code, then verifies the still-v1 production
   quizzes.
2. After checkpoint A is healthy, checkpoint B atomically applies the exact
   eight-field source correction manifest and the reviewed 44-set v2
   data/reset migration, reads production data back exactly, and runs
   authenticated production route smoke checks.

The checkpoint-B data migration must not exist when checkpoint A is applied.

## Non-goals

- Free-text input, audio, speech, runtime model calls, a quiz editor, attempt
  history, timers, rankings, or unrelated WCT cleanup.
- Any WCT source change outside the approved eight-field correction manifest,
  or any Premium row change.

## Acceptance criteria

The feature is accepted when all 44 standard sets are audited v2 payloads,
every Day quiz has the 2/2/1 button-only format mix, every Pop retake changes
format and question for all 16 or 28 Days, old targeted progress is reset,
Premium remains v1, and production readback plus live routes pass.

The production source delta must equal the approved eight-field manifest
exactly; checkpoint B must roll those edits back together with quiz/progress
changes on any failed assertion.

- [ ] All 44 standard sets and 220 questions pass source, composition, and
  audit validation before any production replacement is generated.
- [ ] Each v2 Day set has the required 2/2/1 format mix, three translation and
  two pattern questions, and no adjacent identical formats.
- [ ] Every v2 Pop retake changes both format and question ID for every Day.
- [ ] Checkpoint A and checkpoint B complete in the required order, with exact
  production readback and authenticated live-route verification after v2
  replacement.
