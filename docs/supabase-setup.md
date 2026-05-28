# Supabase Setup

1. Create a Supabase Free project for personal MVP use.
2. In Authentication > Providers, enable email/password.
3. Copy the project URL and publishable/anon key into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

4. Apply all SQL files in `supabase/migrations/` in timestamp order using the SQL editor or Supabase CLI.
5. Create the app account from `/login` or Supabase Authentication > Users. Keep that user UUID for `INGESTION_OWNER_ID` so the Codex/assistant ingestion route saves expressions into the same account you log in with.
6. Confirm RLS is enabled on all current review/ingestion tables:
   - `expression_days`
   - `expressions`
   - `expression_examples`
   - `question_notes`
   - `ingestion_runs`
7. Legacy rollback tables may also exist from earlier migrations and should keep RLS enabled:
   - `lessons`
   - `study_items`
   - `study_examples`
   - `study_cards`
   - `card_examples`
8. Confirm policies allow authenticated users to read shared expression content while managing only their own progress/questions. Locally, run `npm run verify:rls` if Docker is available.

## Supabase Auth redirect URLs

For the dev Supabase project (`uixpyibcpleuwsgemdno`) and the main/production project (`ccawzrrkxuirrwvaecvw`) separately, allow these app URLs in Supabase Dashboard > Authentication > URL Configuration:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/update-password`
- the production deployment URL ending in `/auth/callback`
- the production deployment URL ending in `/auth/update-password`

`/auth/callback` is used for OAuth/code exchange flows. `/auth/update-password` is used directly by password reset emails so recovery links can carry Supabase recovery tokens back to the browser.

## Kakao social login setup

The app includes a Kakao OAuth entry point on `/login`, but actual sign-in succeeds only after each Supabase environment has Kakao credentials configured.

For the dev Supabase project (`uixpyibcpleuwsgemdno`) and the main/production project (`ccawzrrkxuirrwvaecvw`) separately:

1. In Kakao Developers, create or open the app for this service.
2. Copy the Kakao **REST API key**; Supabase uses it as the Kakao provider client ID.
3. Enable Kakao Login and activate the Kakao Login Client Secret.
4. Register the Supabase Auth callback URL in Kakao Login Redirect URI:
   - Dev: `https://uixpyibcpleuwsgemdno.supabase.co/auth/v1/callback`
   - Main/production: `https://ccawzrrkxuirrwvaecvw.supabase.co/auth/v1/callback`
5. In Supabase Dashboard > Authentication > Providers > Kakao, enable Kakao and enter the REST API key plus Kakao Login Client Secret.
6. In Supabase Auth URL configuration, allow the app callback URL for each deployed app origin as listed above.

If Kakao `account_email` consent is not available, configure the Supabase Kakao provider to allow users without an email before testing real sign-in.

## Minimum env for login and app usage

The browser/server auth path only needs the public Supabase project URL and publishable/anon key:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

With only those two variables configured, users can sign up, log in, log out, read already-saved shared expression content, and maintain their own progress/questions. The app intentionally redirects unauthenticated users away from persisted study screens.

## Codex/assistant ingestion server secrets

For the route that lets Codex/assistant turn your chat message into saved study expressions, configure these only in server environments such as `.env.local` or Vercel server env vars:

```bash
INGESTION_API_TOKEN=long-random-token
INGESTION_OWNER_ID=your-supabase-auth-user-uuid
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`INGESTION_API_TOKEN` is not an OpenAI/LLM provider API key. It is just a long random shared secret for this app, so Codex/assistant can call the protected save route and random internet traffic cannot.

Safety requirements:

- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser.
- The ingestion route must reject missing or invalid bearer tokens.
- The ingestion route must assign `owner_id` from `INGESTION_OWNER_ID`, not from request JSON.
- Drafts/revisions may create or update `ingestion_runs`, but `expression_days`/`expressions`/`expression_examples` are inserted only after explicit approval.

## App-managed updated_at

The MVP updates `updated_at` from app code on note edits, review status changes, draft revisions, and ingestion status changes. No database trigger is required for MVP.

## Public deployment safety

Do not deploy a public Supabase-backed app if Auth or the RLS migration has not been applied. A no-auth public Supabase path is out of scope for this MVP.
