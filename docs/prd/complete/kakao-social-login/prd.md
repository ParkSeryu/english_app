# PRD: 카카오 소셜 로그인 첫 Slice

## 상태

- 트래커 항목: `docs/prd/future-work.md`의 T-006.
- 생명주기 폴더: `complete`.
- 구현 방향: 기존 이메일/비밀번호 로그인을 유지하면서, 로그인 화면에 카카오 OAuth 진입점을 추가합니다.

## 문제

현재 사용자는 이메일과 비밀번호를 직접 입력해 계정을 만들고 로그인해야 합니다. 한국어 사용자에게는 카카오 계정으로 시작하는 흐름이 더 익숙하며, 첫 로그인 장벽을 낮출 수 있습니다.

## 목표

- `/login` 화면에서 카카오 로그인 버튼을 제공합니다.
- 버튼은 Supabase Auth의 `kakao` OAuth provider를 사용합니다.
- OAuth 완료 후 기존 `/auth/callback` route에서 code를 session으로 교환합니다.
- 보호 route에서 `/login?next=...`로 온 경우, 카카오 로그인 완료 후 같은 앱 내부 경로로 돌아갑니다.
- Kakao/Supabase provider가 아직 설정되지 않은 환경에서는 앱이 깨지지 않고 오류 메시지를 보여줍니다.

## 비목표

- Google, Naver, Apple 등 다른 소셜 provider 추가
- Kakao Developers 앱 생성/Client Secret 입력 자동화
- Supabase hosted project auth 설정 변경 자동화
- 기존 이메일/비밀번호 로그인 UX 변경
- 계정 병합 정책, 프로필 이미지/닉네임 동기화, 추가 Kakao API 호출
- DB schema/RLS 변경

## 정책

### OAuth provider

- provider 값은 Supabase JS의 `kakao`를 사용합니다.
- 앱은 OAuth provider token을 저장하거나 Kakao API를 직접 호출하지 않습니다.
- 사용자 식별과 세션 관리는 기존 Supabase Auth user/session을 그대로 사용합니다.

### Redirect

- OAuth `redirectTo`는 현재 앱 origin의 `/auth/callback?next=...`입니다.
- `next`는 앱 내부 same-origin path만 허용하고, 외부 URL이나 위험한 encoding은 `/`로 대체합니다.
- `/auth/callback`은 기존 `exchangeCodeForSession` 흐름을 유지합니다.

### 환경 설정

- Dev Supabase project: `uixpyibcpleuwsgemdno`
- Main/production Supabase project: `ccawzrrkxuirrwvaecvw`
- 각 환경에서 별도로 Kakao provider credentials와 redirect allow list를 설정해야 합니다.
- Kakao Developers 쪽 Redirect URI는 Supabase provider callback URL인 `https://<project-ref>.supabase.co/auth/v1/callback`을 등록합니다.

## 성공 기준

- 로그인 화면에 `카카오로 계속하기` 버튼이 보입니다.
- 버튼 submit은 `supabase.auth.signInWithOAuth({ provider: "kakao", options: { redirectTo } })`를 호출합니다.
- Supabase가 OAuth URL을 반환하면 서버 액션이 그 URL로 redirect합니다.
- Supabase/provider 설정 오류가 발생하면 로그인 화면에 오류 메시지가 표시됩니다.
- 기존 이메일 로그인, 회원가입, 비밀번호 재설정 form은 계속 접근 가능합니다.
- `/auth/callback`의 safe redirect 정책이 유지됩니다.
