# PRD: Spaced Repetition Interval Policy for Memorize Queue

## Status

- Tracker item: T-003 in `docs/prd/future-work.md`.
- Lifecycle folder: `active`; implementation is in progress on PR #5.
- Parent complete baseline: `docs/prd/complete/daily-expression-memorization/prd.md`.
- Test spec: covered by focused scheduling, memory-store, and memorize-card tests in the implementation PR.
- Implementation plan: the approved scope is the narrow SRS policy change in PR #5.

## Problem

The memorize queue should reduce review burden as the number of expressions grows. The previous lapse behavior made mature cards feel punishing because pressing `모름` reduced their long-term interval. Learners need a simple Ebbinghaus-inspired two-button SRS policy that keeps misses lightweight while still stretching remembered cards over longer intervals.

## Goals

- Keep the existing two-button UX: `모름` and `외웠음`.
- Make the next review timing visible on the buttons.
- Keep `모름` as a same-day retry without reducing the saved interval.
- Stretch remembered mature cards beyond 30 days.
- Avoid new rating buttons, dependencies, or schema changes.
- Preserve existing queue/session behavior where unknown cards cycle to the back until remembered.

## Non-goals

- Add FSRS/SM-2 ease factors, difficulty, stability, or new rating buttons.
- Add `다시 / 어려움 / 좋음 / 쉬움` Anki-style choices.
- Add push notifications or reminders.
- Add new database columns or migrations.
- Redesign the memorize card layout beyond timing helper text on the two existing buttons.

## Policy

### Interval ladder

Use this bounded ladder:

```text
1일 → 3일 → 7일 → 14일 → 30일 → 60일 → 90일
```

The interval caps at `90일`.

### `외웠음` behavior

When the learner presses `외웠음`:

1. If the previous saved result is not `unknown`, promote to the next larger interval in the ladder.
2. If the card has never been reviewed and the first answer is immediately `외웠음`, schedule it for `3일` later.
3. If the previous saved result is `unknown`, treat this as recovery after a same-day miss and do not promote beyond the current saved interval; use at least `1일` for new/unlearned cards.
4. Set `due_at` to the selected interval's Korean-midnight boundary.
5. Remove the card from the active queue after the server refresh, as today.

Examples:

| Previous state | Action | New interval | Next due label |
| --- | --- | ---: | --- |
| New card, no previous `모름` | `외웠음` | 3 | `3일 뒤` |
| New card after one or more `모름` | `외웠음` | 1 | `1일 뒤` |
| 14-day card, no previous `모름` | `외웠음` | 30 | `30일 뒤` |
| 30-day card, no previous `모름` | `외웠음` | 60 | `60일 뒤` |
| 60-day card, no previous `모름` | `외웠음` | 90 | `90일 뒤` |
| 90-day card, no previous `모름` | `외웠음` | 90 | `90일 뒤` |
| 14-day card after one or more `모름` | `외웠음` | 14 | `14일 뒤` |

### `모름` behavior

When the learner presses `모름`:

1. Keep the saved `interval_days` unchanged.
2. Set `due_at = null` so the expression remains immediately due today.
3. Move the card to the back of the current browser queue, preserving the current session behavior.
4. Do not demote the interval on the first miss or repeated same-day misses.

Examples:

| Previous interval | `모름` result interval | Next due label |
| ---: | ---: | --- |
| 90 | 90 | `오늘 다시` |
| 60 | 60 | `오늘 다시` |
| 30 | 30 | `오늘 다시` |
| 14 | 14 | `오늘 다시` |
| 7 | 7 | `오늘 다시` |
| 3 | 3 | `오늘 다시` |
| 1 | 1 | `오늘 다시` |
| 0 | 0 | `오늘 다시` |

### Button timing labels

After the answer is revealed, show both action and timing:

- `모름` button: `오늘 다시`
- `외웠음` button: `{next interval}일 뒤`

The `외웠음` label must use the same scheduling function as the saved review result so the UI and persistence stay consistent.

### Queue eligibility

`/memorize` should include:

- never-reviewed expressions,
- expressions with `due_at = null`,
- expressions whose `due_at <= now`.

Known expressions with future `due_at` must stay out of the queue. For old rows with `last_result = known` but missing `due_at`, keep the existing safe fallback behavior.

## Data model

No schema change is required for this version.

Use existing `expression_progress` fields:

- `interval_days` — current ladder interval or `0` for unlearned/relearning new cards.
- `last_result` — identifies unresolved lapse state (`unknown`) before the next `외웠음`.
- `due_at` — source of truth for queue reappearance.

## Acceptance criteria

- A new expression marked immediately `외웠음` receives `interval_days = 3` and a `due_at` three Korean calendar days later.
- A new expression marked `모름` one or more times, then `외웠음`, receives `interval_days = 1` and a next-day Korean-midnight `due_at`.
- A 14-day expression marked immediately `외웠음` receives `interval_days = 30`.
- A 30-day expression marked immediately `외웠음` receives `interval_days = 60`.
- A 60-day expression marked immediately `외웠음` receives `interval_days = 90`.
- A 90-day expression marked immediately `외웠음` remains capped at `interval_days = 90`.
- Any expression marked `모름` keeps its previous `interval_days` and receives `due_at = null`.
- Unknown expressions remain due and can still be cycled to the back of the client-side queue.
- The revealed memorize card shows `모름 / 오늘 다시` and `외웠음 / N일 뒤`.
- Existing tests, lint, typecheck, build, and a live `/memorize` route check pass.

## Verification plan

- Unit-test interval promotion, no-demotion `모름`, recovery after unresolved lapses, capped 90-day intervals, and Korean-midnight `due_at` calculation in `lib/scheduling.ts`.
- Integration-test `MemoryExpressionStore.recordReviewResult()` for interval promotion through 60/90 and `모름` interval preservation.
- Component-test `MemorizeCard` timing helper labels.
- Run `npm run lint`.
- Run `npm run typecheck`.
- Run `npm test`.
- Run `npm run clean:runtime && npm run build`.
- Start the Next dev server bound to `0.0.0.0` and exercise `/memorize` locally and externally.
