# Implementation Plan: 카카오 소셜 로그인 첫 Slice

1. PRD tracker
   - `docs/prd/future-work.md`의 Active에 T-006을 추가합니다.
   - `docs/prd/README.md`에 active feature folder를 표시합니다.

2. Redirect helper
   - 현재 origin을 재사용해 `/auth/callback?next=...` URL을 만드는 helper를 추가합니다.
   - 기존 safe same-origin redirect policy를 재사용합니다.

3. Server action
   - `signInWithKakaoAction`을 추가합니다.
   - Supabase `signInWithOAuth` provider는 `kakao`를 사용합니다.
   - 성공 시 반환된 OAuth URL로 redirect하고, 실패 시 `ActionState` 오류를 반환합니다.

4. Login UI
   - `AuthPanel` 로그인 모드에 별도 카카오 로그인 form/button을 추가합니다.
   - 기존 이메일 로그인/회원가입/비밀번호 재설정 UI는 유지합니다.
   - `/login?next=...`의 safe next path를 hidden input으로 전달합니다.

5. Tests and verification
   - AuthPanel component test에 Kakao 버튼 표시를 추가합니다.
   - auth action unit test로 provider, redirect URL, 오류 처리를 확인합니다.
   - site-url helper test를 추가합니다.
   - lint, typecheck, focused tests, `/login` live route smoke check를 실행합니다.
