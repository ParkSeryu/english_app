---
name: wct-lesson-note
description: "Prepare WCT academy lesson notes from textbook photos, PDF pages, pasted text, OCR, or brief class notes for the /home/ubuntu/code/english_app app. Use when the user mentions WCT, WCT 수업 정리, WCT 교재, Novice Day, or asks to preview, add, or revise a WCT lesson. Extract a source-faithful Day, topic, key point, and pattern; keep WCT separate from expression cards; and write to the app only after the user approves the exact preview."
---

# WCT Lesson Note

## Goal

Turn WCT source material into a compact lesson note with one Day header and exactly three content fields: `주제`, `핵심 내용`, and `패턴`.

Keep this workflow separate from the English expression-card system.

## Handle Input

- Accept textbook photos, screenshots, PDF pages, pasted text, OCR output, or rough class notes.
- Do not require the user to transcribe a textbook page manually.
- Inspect every supplied page that belongs to the requested Day before drafting.
- Treat the textbook as the authority for what the lesson covered. Use general English knowledge only to normalize obvious notation or repair clear OCR errors.
- Use a teacher note supplied by the user as an additional source. Do not invent teacher emphasis that is absent from the input.
- Ask at most one concise question when a missing or unreadable Day, topic, key point, or pattern would materially change the note. Otherwise, produce the preview directly.
- Keep different Days separate. When a source contains several Days and the target is unclear, ask which Day to process.

## Produce the Preview

Use this exact shape:

```text
WCT
Novice Day 31

주제
It's + adjective + for + someone + to + verb

핵심 내용
누가 어떤 행동을 하는 것이 쉽다, 어렵다, 중요하다처럼 평가할 때 쓰는 표현.

패턴
It's + 형용사 + for + 사람/대상 + to + 동사원형
```

Apply these rules:

- Preserve the Day label shown in the source, normalized only for spacing and capitalization.
- Keep `주제` short. Prefer the lesson title, grammar focus, or English construction used by the source.
- Write `핵심 내용` as one concise Korean sentence explaining the construction's main meaning or use.
- Write `패턴` as one reusable formula. Use `+` between parts and Korean placeholders where they make the structure easier to understand.
- Do not add examples, sentence-building steps, common mistakes, quizzes, tests, or self-check sections unless the user explicitly requests them.
- Do not force `주제` and `패턴` to differ when the textbook presents the same construction for both.
- Flag an inference briefly outside the three fields when the source is incomplete. Do not save inferred content without confirmation.

## Require Approval

Always show the preview before writing to the app, including when the first request says `추가해` or `넣어줘`.

Treat `좋네`, `괜찮아`, questions, and revision requests as non-approval. Write only after a follow-up approval of the displayed preview such as `반영해`, `이대로 넣어`, `앱에 추가해`, or `저장해`.

If the user requests changes, revise the preview and wait for approval again.

## Write to the App

After approval:

1. Re-read the current repository files and preserve unrelated user changes.
2. Add or revise the lesson in `/home/ubuntu/code/english_app/lib/wct-lessons.ts`.
   - Map `핵심 내용` to `takeaway`.
   - Map `패턴` to `form`.
   - Use a stable lowercase ID such as `novice-day-32`.
   - Keep the newest lesson first while `getLatestWctLesson()` returns the first item.
3. Keep `/home/ubuntu/code/english_app/app/wct/page.tsx` limited to the Day header and the three approved fields. Do not expand the page for a new lesson.
4. Update focused WCT tests when the lesson list or latest lesson changes.
5. Follow the repository working gate: run lint, typecheck, relevant tests, and a live `/wct` route check.

Never use the expression-card ingestion API, expression-card skills, or Supabase tables for WCT lesson notes. Do not write any files when the user asked only for a preview.
