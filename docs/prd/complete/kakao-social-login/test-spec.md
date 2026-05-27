# Test Spec: 카카오 소셜 로그인 첫 Slice

## 검증 범위

- 로그인 UI에 카카오 OAuth 진입점이 표시됩니다.
- 서버 액션이 Supabase Kakao OAuth를 정확한 redirect URL로 시작합니다.
- unsafe `next` 값은 외부 redirect로 전달되지 않습니다.
- 기존 이메일/비밀번호 인증 UI와 callback safe redirect가 유지됩니다.
- 실행 중인 앱에서 `/login` route가 정상 렌더링됩니다.

## Acceptance Checks

| ID | Check | Method |
| --- | --- | --- |
| AC-001 | `/login`에 `카카오로 계속하기` 버튼이 보입니다. | component test + live route smoke |
| AC-002 | Kakao 버튼은 `signInWithKakaoAction` server action에 연결됩니다. | component test |
| AC-003 | OAuth 시작 액션은 provider `kakao`와 encoded `/auth/callback?next=...`를 사용합니다. | unit test |
| AC-004 | unsafe `next` 값은 `/`로 fallback됩니다. | unit test |
| AC-005 | 기존 이메일 로그인/회원가입/비밀번호 재설정 전환 UI가 유지됩니다. | existing component tests |
| AC-006 | `/auth/callback` open redirect 방어가 유지됩니다. | existing security tests |
| AC-007 | provider 미설정/오류 응답은 사용자에게 메시지로 표시 가능한 `ActionState`를 반환합니다. | unit test |
| AC-008 | `/login` live route가 running app에서 200으로 응답하고 Kakao 버튼 HTML을 포함합니다. | dev server curl smoke |

## Required Commands

- `npm test -- tests/components/auth-panel.test.tsx tests/unit/auth-actions.test.ts tests/unit/site-url.test.ts tests/security/auth-callback.test.ts`
- `npm run lint`
- `npm run typecheck`
- `/login` live route smoke check with dev server bound to `0.0.0.0`

## Schema/RLS

- 새 schema/RLS 변경 없음.
- hosted DB migration 없음.
- Kakao provider credentials는 dev/main Supabase project에 별도로 설정해야 합니다.
