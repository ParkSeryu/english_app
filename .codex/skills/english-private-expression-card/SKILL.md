---
name: english-private-expression-card
description: "Prepare and save English expression cards as private personal expressions for exactly one specified user in the /home/ubuntu/code/english app. Use when the user wants expressions, lesson notes, or memorization cards to be visible only to a named/target app user rather than shared with all learners; triggers include 'specific user only', '특정 유저만', '나만 보이게', '개인 표현', 'private expression', or adding cards to one user's 암기카드."
---

# English Private Expression Card

## Purpose

Add English memorization cards as **private personal expressions** for one target English-app user. This is not the shared ingestion flow: private cards are inserted with the target user's `owner_id` and `expression_progress.user_id`, so other learners should not see them.

Use the existing `english-expression-card` skill only for shared/all-learner content. Use this skill for one-user-only cards.

## Required Inputs

Collect or infer these before saving:

- Target user: prefer the exact Supabase auth UUID. If the user gives only a name/email, resolve it safely before writing; do not guess.
- Target topic/day: prefer `targetExpressionDayId`. An exact topic title plus optional `day_date` is acceptable if it resolves to one visible topic for the target user.
- Cards: `english`, `koreanPrompt`, optional `grammarNote`, optional `userMemo`.
- Memorization inclusion: default `isMemorizationEnabled: true` because this skill is for 암기카드. Use `false` only if the user says list-only/not in memorize queue.
- Hosted environment: main/production only. Before hosted DB access, state that the main Supabase project is targeted.

## Card Rules

- Preserve the user-provided main English and Korean prompt by default.
- Keep `grammarNote` compact, using `문법:` or `패턴:` when useful.
- Keep private notes in `userMemo`; do not put the visible private marker there manually.
- Do not create shared ingestion runs and do not use `/api/ingestion/runs` for this skill.
- Do not delete, overwrite, or bulk-edit existing cards unless explicitly requested.

## Save Workflow

1. Parse the user's raw expressions into a payload with one target user and one target topic.
2. Show a concise preview of the cards and the target user/topic. Treat questions or revisions as non-approval.
3. Save only after an explicit approval phrase such as `이 유저한테만 넣어줘`, `저장해`, `추가해`, `앱에 넣어줘`, or `save/add it`.
4. Use `scripts/add-private-expressions.mjs` from this skill. Run without `--apply` first for a dry run, then run with `--apply` after approval.
5. Report inserted/reused expression IDs, target environment, and whether cards are in the target user's memorize queue.

## Payload Shape

Create a temporary JSON file outside the repo unless the user asks to commit it:

```json
{
  "targetUserId": "00000000-0000-4000-8000-000000000001",
  "targetExpressionDayId": "11111111-1111-4111-8111-111111111111",
  "isMemorizationEnabled": true,
  "cards": [
    {
      "english": "I need to sleep on it.",
      "koreanPrompt": "좀 더 생각해 봐야겠어요.",
      "grammarNote": "패턴: sleep on it = 하룻밤 생각해보다",
      "userMemo": "개인 추가 표현"
    }
  ]
}
```

If the topic ID is unknown, use exact title/date instead while keeping the same non-empty `cards` array:

```json
{
  "targetUserId": "00000000-0000-4000-8000-000000000001",
  "targetExpressionDayTitle": "1주차 (260427)",
  "targetExpressionDayDate": "2026-04-27",
  "cards": [
    {
      "english": "I need to sleep on it.",
      "koreanPrompt": "좀 더 생각해 봐야겠어요."
    }
  ]
}
```

## Script Usage

From `/home/ubuntu/code/english_app`:

```bash
node .codex/skills/english-private-expression-card/scripts/add-private-expressions.mjs \
  --payload /tmp/private-expression-payload.json

node .codex/skills/english-private-expression-card/scripts/add-private-expressions.mjs \
  --payload /tmp/private-expression-payload.json \
  --apply \
  --confirm-production
```

The script always reads `.env.local`, which must target main/production. It requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Safety Checks

- `.env.local` must point to main project ref `ccawzrrkxuirrwvaecvw`.
- Every write requires `--confirm-production`.
- The script verifies the target auth user exists.
- The script verifies the target topic is visible to the target user before writing.
- Private expression rows use `owner_id = targetUserId` and `user_memo = "__personal_expression__"`.
- Per-user memo/queue state is stored in `expression_progress` for only `targetUserId`.
