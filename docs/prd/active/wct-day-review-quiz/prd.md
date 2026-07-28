# WCT Day Review Quiz PRD

## Status

Active

## Goal

모든 WCT Day 상세에서 고정된 5문항 객관식 복습 문제를 풀고, 각 선택 직후
정오답과 해설을 확인한 뒤 최신 점수를 Day 배지에서 다시 볼 수 있게 합니다.

## Included inventory

- WCT Prenovice: 데이터베이스 기반 16 Days
- WCT Novice: 데이터베이스 기반 28 Days
- WCT Premium: 코드 기반 1 Day
- 합계: dev 환경의 기존 45 Days

## Requirements

- 각 세트는 정확히 5문항이며 각 문항은 서로 다른 선택지 4개와 정답 1개를 가집니다.
- 일반 WCT Day는 뜻 인식 3문항과 패턴 인식 2문항을 사용합니다.
- Premium은 번역을 새로 만들지 않고 개념/규칙 3문항과 패턴/예문 2문항을 사용합니다.
- 선택 즉시 답을 잠그고 정오답, 정답, 출처 기반 해설을 표시합니다.
- 다섯 번째 답을 확인한 후 `결과 보기`로 서버 채점을 저장합니다.
- Day 상세 배지는 미완료 시 `복습 문제 5개`, 완료 시 `복습 완료 · N/5`입니다.
- 다시 풀기는 동일한 고정 세트를 사용하고 최신 완료 점수만 교체합니다.
- 기존 45개 세트는 dev 데이터 마이그레이션으로 생성합니다.
- 미래 일반 Day는 승인 import 후, 미래 Premium Day는 첫 인증 상세 요청에서
  누락된 세트를 한 번만 생성합니다.
- 생성은 `wct-review-v1` 결정적 소스 기반 생성기를 사용하며 런타임 AI API를
  호출하지 않습니다.

## Data and security

- 대상 환경은 `.env.local`의 dev Supabase `uixpyibcpleuwsgemdno`입니다.
- 세트와 진행도는 소유자 범위로 격리합니다.
- 브라우저의 직접 쓰기는 금지하고 서버 RPC가 저장된 정답으로 점수를 계산합니다.
- main/production `ccawzrrkxuirrwvaecvw`에는 별도 승인 없이 적용하지 않습니다.
- 한국어가 포함된 dev 백필은 저장 후 전체 payload를 원본과 비교합니다.

## Non-goals

- 자유 입력, 말하기 평가, 오디오, 발음 채점
- 매 시도마다 새 문제 생성
- 퀴즈 편집기와 시도 이력
- 복습 스케줄, 연속 학습, 알림
- 런타임 모델 API 및 기존 WCT 수업 내용 수정
- main/production 스키마 또는 데이터 적용

## Acceptance

The feature is accepted when all 45 existing dev Days have one valid set,
standard and Premium Day details show the correct badge, immediate feedback
works across five questions, and the server-calculated latest score survives
returning to the Day.

- [ ] 일반 44세트와 Premium 1세트가 각각 5문항 검증을 통과합니다.
- [ ] 일반 및 Premium Day 상세/퀴즈 경로가 실제 앱에서 정상 동작합니다.
- [ ] 다른 사용자의 세트와 진행도는 읽거나 쓸 수 없습니다.
- [ ] 미래 Day 생성 경로와 import replay가 기존 세트를 덮어쓰지 않습니다.
- [ ] lint, typecheck, 관련 테스트, RLS, build, E2E, live route 검증이 통과합니다.
