# WCT Day Review Quiz Test Specification

| Surface | Verification |
| --- | --- |
| Generator invariants | 일반 3+2, Premium 3+2, 5문항, 문항별 선택지 4개, 유일 정답, 결정적 ID/순서 |
| Sparse standard Day | 예문/패턴 순환 및 책 단위 오답 fallback을 확인하고 4개 선택지가 불가능하면 부분 저장 없이 실패 |
| Premium adapter | 승인된 섹션/규칙/예문만 사용하고 새 한국어 번역을 만들지 않음 |
| Validation | 중복 문항/선택지/답안, 없는 정답 ID, 잘못된 UUID와 5개가 아닌 payload 거부 |
| Memory store | owner 격리, 불변 create-if-missing, 최신 점수 교체, 잘못된 답안 거부 |
| RLS and RPC | anon 차단, 다른 owner 차단, 직접 쓰기 차단, 서버 점수 계산과 upsert |
| Import replay | 첫 import와 exact replay 모두 ensure를 실행하되 기존 세트는 덮어쓰지 않음 |
| Dev backfill | Prenovice 16 + Novice 28 + Premium 1, 총 45세트와 문항 payload 완전 일치 |
| Korean integrity | 생성 원본과 저장 JSON을 비교하고 `???`, U+FFFD 또는 필드 차이 시 실패 |
| Badge component | `복습 문제 5개`와 `복습 완료 · N/5`, 올바른 퀴즈 링크 |
| Runner component | 진행도, 선택 잠금, 즉시 피드백/해설, 결과 저장, 재시도, 다시 풀기, Day 복귀 |
| Standard route | book/Day/source 관계 검증, 정상 렌더, 다른 owner 추측 URL은 404 |
| Premium route | first-load ensure, source 관계 검증, 동일한 전체화면 runner 사용 |
| Playwright | 일반과 Premium에서 5문항 완료, 저장된 배지 확인, 재응시 최신 점수 확인 |
| Command gate | lint, typecheck, Vitest, RLS, dev migration status, backfill verify, build |
| Live app | task-owned `0.0.0.0:3101`에서 일반/Premium 퀴즈 완료 및 서버 로그의 500/청크/schema 오류 부재 |

## Evidence log — 2026-07-28

- Full Vitest: 60 files and 306 tests passed, 1 conditional skip.
- RLS/RPC: owner isolation, anonymous/direct-write denial, server scoring, latest-score replacement, duplicate/unknown answer rejection passed.
- Dev `uixpyibcpleuwsgemdno`: 35 applied migrations, pending 0, checksum mismatches 0.
- Backfill verify: standard 44, Premium 1, question payload 45, Korean 45 matched.
- Production build passed and emitted both Standard/Premium quiz routes.
- Combined mobile Chromium WCT run passed 8/8; post-build running-server quiz run passed 3/3.
- Task server listened on `0.0.0.0:3101`; local/external `/lessons` and both quiz routes returned 200.
- Server log scan found no InternalServerError, HTTP 500, missing module/chunk, schema error, or failed server action.
- Port 3000 was occupied by a pre-existing `.env.main.local` server and was not stopped or modified.
- Production `ccawzrrkxuirrwvaecvw` remains untouched.
