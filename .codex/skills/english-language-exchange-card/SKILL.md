---
name: english-language-exchange-card
description: Prepare and optionally save language-exchange English memorization cards for the /home/ubuntu/code/english_app app. Use when the user says "언어교환 카드로 추가", "언어교환 폴더", "language exchange card", or provides a language-exchange topic/date plus numbered English (Korean) pairs that should be stored under the private `language-exchange` content folder.
---

# English Language Exchange Card

## Purpose

Turn language-exchange notes into app cards under the private `언어교환` folder. The memorization direction is always Korean prompt -> recall English.

## Expected user input

Preferred format:

```text
언어교환 카드로 추가해줘

토픽은 with keyri, 날짜는 2026-05-27

1. What do you do for work? (무슨 일 하세요?)
2. I'm into hiking these days. (요즘 등산에 빠져 있어요.)

이대로 앱에 넣어줘
```

Also accept this compact variant:

```text
with Keyri 토픽 2026-05-27 날짜에 추가로 넣어줘

1. What do you do for work?
(무슨 일 하세요?)
```

Accept `YYYY-MM-DD`, `YYYYMMDD`, or `YYMMDD` dates.

## Fixed routing

Always set:

- `expression_day.folder_slug`: `language-exchange`
- `expression_day.source_note`: `언어교환 표현`
- `expression_day.title`: the exact topic after `토픽은`/`토픽:` (for example `with keyri`)
- `expression_day.day_date`: the provided date

The app upserts by `folder_slug + title + day_date`, so later saves with the same topic/date append cards to the existing topic.

## Card mapping

For each numbered `English (한국말)` line:

- `english`: English text before the final Korean parentheses.
- `korean_prompt`: Korean text inside the final parentheses.
- `grammar_note`: only if the user separately gives a compact reusable `문법:` or `패턴:` note.
- `examples`: only if the user explicitly gives similar expressions.
- Leave `nuance_note` and `structure_note` empty/null.

Do not translate, rewrite, deduplicate, or add explanations unless the user asks.

## Workflow

1. Parse the topic, date, and numbered expression pairs.
   - Prefer running `scripts/parse-language-exchange-cards.mjs` on the raw request to produce the JSON payload.
2. Show a concise preview of the cards.
3. Save only after an explicit approval phrase such as `이대로 앱에 넣어줘`, `저장해`, `추가해`, `save this`, or `add to app`.
4. On save, use the approval-gated ingestion API; never write directly to Supabase tables.
5. After saving, query the target database and compare the saved text against the intended payload before reporting success.

## Encoding and save integrity gate

This workflow handles Korean text. Treat Korean/multibyte corruption as a hard failure.

- When passing payloads from PowerShell to WSL/stdin, force UTF-8 before sending the payload:

```powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
```

- Prefer a UTF-8 JSON file or a Node script executed with verified UTF-8 stdin. Do not rely on default PowerShell pipe encoding for Korean text.
- For every target environment saved (`dev`, `main`, or both), query the saved `expression_days`, `expressions`, and `ingestion_runs` rows after approval.
- Verify these fields exactly against the intended payload:
  - `expression_days.raw_input`
  - `expression_days.source_note`
  - each `expressions.korean_prompt`
  - `ingestion_runs.raw_input`
  - `ingestion_runs.normalized_payload`
- Do not report success if Korean text appears as replacement text such as `???` or differs from the intended prompt. Fix the affected rows first, then re-query.
- If saving to both `dev` and `main`, run the integrity query separately for each Supabase project and report both project refs.

## Ingestion API

Use this only after explicit approval and when `APP_URL` plus `INGESTION_API_TOKEN` are available.

```bash
curl -sS -X POST "$APP_URL/api/ingestion/runs" \
  -H "Authorization: Bearer $INGESTION_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data @language-exchange-payload.json

curl -sS -X POST "$APP_URL/api/ingestion/runs/$RUN_ID/approve" \
  -H "Authorization: Bearer $INGESTION_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"approvalText":"이대로 앱에 넣어줘"}'
```

Report returned `expressionUrls` after approval.

## If information is missing

- Missing topic or date: ask for that one missing field before saving.
- Missing approval: preview only; do not save.
- Missing API env vars: provide the payload and curl commands instead of claiming it was saved.

See `references/payload-example.md` for a canonical payload.
