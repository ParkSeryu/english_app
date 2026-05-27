# Kakao Social Login

## Status

- Tracker item: T-006 in `docs/prd/future-work.md`.
- Lifecycle folder: `complete`.
- Artifact state: PRD, test spec, and implementation plan were completed for the first Kakao OAuth slice.

## Current Slice

로그인 화면에 카카오 로그인 버튼을 추가하고, Supabase Auth의 Kakao OAuth provider로 이동한 뒤 기존 `/auth/callback` 세션 교환 경로로 돌아오게 합니다.

## External Setup Required

실제 로그인 성공에는 Kakao Developers 앱과 Supabase Kakao provider 설정이 필요합니다. 앱 코드는 provider 미설정 시 오류 메시지를 표시하고, provider 설정 완료 후 같은 버튼으로 동작합니다.

## Artifacts

- PRD: `docs/prd/complete/kakao-social-login/prd.md`
- Test spec: `docs/prd/complete/kakao-social-login/test-spec.md`
- Implementation plan: `docs/prd/complete/kakao-social-login/implementation-plan.md`
