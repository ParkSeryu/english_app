---
name: english-expression-card
description: "Format Korean/English class notes or user-provided English expressions into the lightweight English memorization card format for the /home/ubuntu/code/english app, and optionally ingest them through the app's approval-gated API. Use when the user says they want to add, insert, save, or prepare English expression cards, gives expressions with Korean meanings, or asks to convert lesson notes into the agreed format: main English, Korean meaning, optional similar expression, optional one-line grammar."
---

# English Expression Card

## Purpose

Turn raw English expressions into compact memorization cards for the English app. Keep cards light: one main answer, one Korean prompt, optional similar expression, and optional one-line grammar only when useful.

## Card Format

Default preview format:

```text
Main English expression.
한국어 뜻.

비슷한 표현
Optional similar English expression.
비슷한 표현의 한국어 뜻.

문법/패턴(필요한 경우만)
optional one-line grammar
```

Rules:

- Preserve the user-provided main English and Korean as the card body by default. Do not rewrite the main answer unless the user explicitly asks for a correction.
- Put the original/main English expression in `english`.
- Put the original Korean meaning/prompt in `korean_prompt`.
- Put more natural alternatives or nearby expressions in `examples`, usually 0–1 per card.
- Put grammar/pattern notes in `grammar_note` only for compact reusable forms, prefixed as `문법:` or `패턴:`. Use `문법:` for form rules such as `문법: be used to + 명사/-ing = ~에 익숙하다`; use `패턴:` for collocation/use patterns such as `패턴: affect + 대상 = ~에 영향을 주다`. Replace routine tense/context/memorization explanations with a compact prefixed note or omit grammar.
- Always leave `nuance_note` and `structure_note` empty/null.
- Never write “원문 그대로 암기”, “문맥상”, “현재의 일반적인 사실/체질”, or similar explanation into the card.
- Avoid long paragraphs and textbook explanations.
- Use `문법:` when the learner may choose the wrong grammatical form; use `패턴:` when the learner needs a word/phrase usage pattern.


## Canonical Simplification Example

When the user provides:

```text
Coffee doesn't affect me when I sleep.
커피를 마셔도 수면에 영향을 받지 않아요.

문법/패턴(필요한 경우만)
현재의 일반적인 사실/체질을 말하므로 현재시제 doesn't affect 사용. 'when I sleep'은 문맥상 수면에 영향을 받지 않는다는 뜻으로 암기.
```

Keep the main English/Korean as given, but replace the verbose grammar note and move the natural alternative into `비슷한 표현`:

```text
Coffee doesn't affect me when I sleep.
커피를 마셔도 수면에 영향을 받지 않아요.

문법/패턴(필요한 경우만)
패턴: affect + 대상 = ~에 영향을 주다

비슷한 표현
Caffeine doesn’t keep me awake.
카페인을 마셔도 잠이 안 깨요.
```

Never replace compact grammar/pattern notes with a long tense/context/memorization explanation.

## Default grouping for this user

Until the user explicitly gives a different grouping/date, use:

- `expression_day.title`: `1주차 (260427)`
- `expression_day.day_date`: `2026-04-27`
- `expression_day.source_note`: `수업 표현`

## Workflow

1. Parse the user’s expressions.
   - If a date is present like `오늘의 영어표현 (20260427)`, normalize it as `YYYY-MM-DD` in the payload.
   - If no date is present, use today only if the user clearly means today; otherwise omit `day_date`.
2. Produce a concise preview in the card format above.
3. If the user asks for revisions, revise the preview only; do not insert.
4. Save only after an explicit approval phrase such as `저장해`, `앱에 넣어줘`, `이대로 앱에 넣어줘`, `추가해`, `save this`, or `add to app`.
5. On save, use the approval-gated ingestion API; never write directly to Supabase tables.

## Payload Mapping

Use the expression-day ingestion contract:

```json
{
  "expression_day": {
    "title": "1주차 (260427)",
    "raw_input": "original user text",
    "source_note": "수업 표현",
    "day_date": "2026-04-27"
  },
  "expressions": [
    {
      "english": "Coffee doesn't affect me when I sleep.",
      "korean_prompt": "커피를 마셔도 수면에 영향을 받지 않아요.",
      "grammar_note": "패턴: affect + 대상 = ~에 영향을 주다",
      "examples": [
        {
          "example_text": "Caffeine doesn’t keep me awake.",
          "meaning_ko": "카페인을 마셔도 잠이 안 깨요.",
          "source": "llm"
        }
      ]
    }
  ]
}
```

Do not include `owner_id`, `nuance_note`, or `structure_note` in generated payloads unless a compatibility caller requires the fields; if included, set the latter two to null.

## Ingestion API

Use this only after explicit approval.

Requirements:

- `APP_URL` points to the deployed or local app.
- `INGESTION_API_TOKEN` is available in the environment.
- The app assigns owner from server-side `INGESTION_OWNER_ID`; do not send owner fields.

Commands:

```bash
curl -sS -X POST "$APP_URL/api/ingestion/runs" \
  -H "Authorization: Bearer $INGESTION_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data @expression-day-payload.json

curl -sS -X PATCH "$APP_URL/api/ingestion/runs/$RUN_ID" \
  -H "Authorization: Bearer $INGESTION_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data @revised-expression-day-payload.json

curl -sS -X POST "$APP_URL/api/ingestion/runs/$RUN_ID/approve" \
  -H "Authorization: Bearer $INGESTION_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"approvalText":"이대로 앱에 넣어줘"}'
```

Report the returned `expressionUrls` after approval.

## Safety

- Treat `좋네`, `괜찮아`, questions, and revision requests as non-approval.
- Do not delete, overwrite, or bulk-edit existing cards.
- If API env vars are missing, provide the payload and curl commands instead of pretending it was saved.
- Keep raw draft files outside the repo unless the user asks to commit them.
