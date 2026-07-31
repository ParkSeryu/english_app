# Main-Only Infrastructure Design

## Goal

Retire the hosted and Git `dev` environment and keep `main` as the only
application environment across GitHub, Vercel, Supabase, and local development.

## Confirmed decisions

- Keep GitHub `main` as the default and only long-lived branch.
- Keep the Vercel `english` project and its `main` Production deployment.
- Keep Supabase project `ccawzrrkxuirrwvaecvw` as the only hosted database.
- Delete Supabase project `uixpyibcpleuwsgemdno` without backing up or merging
  its dev-only content, user progress, questions, or ingestion history.
- Point local development at the main Supabase project through `.env.local`.
- Remove `.env.main.local` after its main values have become the local default.
- Preserve historical references in completed design, plan, and verification
  documents. Update only active operational instructions and scripts.

## Current-state evidence

- Local `main`, local `dev`, `origin/main`, and `origin/dev` were all at commit
  `8b11158`.
- GitHub's default branch is `main`, and no pull requests are open.
- Both Supabase projects report 35 known migrations, zero pending migrations,
  and zero checksum mismatches.
- WCT row counts match between the projects, although environment-specific IDs
  differ.
- Main has more expression content than dev. Dev-only records still exist, and
  the user explicitly approved discarding them.
- Vercel has both Production and Preview deployments for the current commit.
  The project itself must remain; only dev Preview resources are in scope.

## Repository design

The repository will expose one set of database commands backed by `.env.local`
and project `ccawzrrkxuirrwvaecvw`. Main database writes will retain an explicit
production confirmation guard.

Dev-only commands and synchronization code will be removed:

- `sync:main-to-dev`
- `db:*:dev`
- the two-environment branch in `scripts/db-migrations.mjs`
- `scripts/sync-main-to-dev.mjs`

Main-specific command names may be simplified to `db:status`, `db:migrate`,
`db:baseline`, and `db:validate`. Active instructions will name `main` as the
integration target and `.env.local` as the sole hosted configuration.

## Deletion sequence

1. Convert active repository configuration and local environment files to the
   main-only model.
2. Run lint, typecheck, targeted tests, build, migration status, and a live
   main-backed route smoke check.
3. Push the verified main commit and confirm the Vercel Production deployment
   remains healthy.
4. Delete dev-scoped Vercel Preview deployments and Preview environment
   configuration while preserving the `english` project and Production.
5. Reconfirm the exact Supabase refs, then delete
   `uixpyibcpleuwsgemdno`.
6. Remove `/home/ubuntu/code/english_app_dev`, local `dev`, and `origin/dev`.
7. Verify that GitHub, Vercel, Supabase, local configuration, and active
   repository commands expose only main.

## Failure handling

- Stop before hosted deletion if main verification fails.
- Stop if `dev` and `main` no longer point to the inspected commit or if new
  dev work appears.
- Never delete a hosted project unless its exact project identity is visible in
  an authenticated management surface.
- If Vercel or Supabase management authentication is unavailable, complete the
  safe repository work and report the exact remaining deletion instead of
  guessing or deleting an adjacent resource.

## Verification

- `npm run lint`
- `npm run typecheck`
- relevant database/script tests
- `npm run build`
- main migration status: zero pending and zero mismatches for
  `ccawzrrkxuirrwvaecvw`
- local live route using `.env.local`
- Vercel Production route after the main push
- GitHub branch list contains only `main`
- no local `dev` worktree or branch remains
- Supabase management view contains main and no dev project
- Vercel contains main Production and no dev Preview resources

