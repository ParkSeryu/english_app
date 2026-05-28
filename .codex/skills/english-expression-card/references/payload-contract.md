# English App Expression Payload Contract

Source app: `/home/ubuntu/code/english`.

Validation lives in `lib/validation.ts` as `expressionIngestionPayloadSchema`.

Required:

- `expression_day.title`: non-empty string, max 200.
- `expression_day.raw_input`: non-empty string, max 10,000.
- `expressions`: 1–30 cards.
- `expressions[].english`: main English answer, max 500.
- `expressions[].korean_prompt`: Korean prompt/meaning, max 1,000.

Optional:

- `expression_day.source_note`: max 500.
- `expression_day.day_date`: `YYMMDD`, `YYYYMMDD`, or `YYYY-MM-DD`; server normalizes to `YYYY-MM-DD`.
- `expressions[].grammar_note`: max 3,000, but this skill should keep it one line.
- `expressions[].examples`: up to 12; this skill should usually use 0–1 similar expression.
- `examples[].source`: `llm`, `user`, or `class`; default `llm`.

Retired/lightweight fields:

- `nuance_note`: do not populate.
- `structure_note`: do not populate.
