# Main-Only Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire every dev environment resource and leave GitHub, Vercel, Supabase, repository tooling, and local development on main only.

**Architecture:** Convert the repository and ignored local environment files to a single guarded main configuration first, then verify and push main before deleting hosted resources. Delete only exact, authenticated dev targets, and remove the Git dev worktree and branches last.

**Tech Stack:** Next.js 15, TypeScript, Vitest, Node.js scripts, Git/GitHub CLI, Vercel CLI, Supabase Management CLI/API.

## Global Constraints

- Preserve Vercel project `english` and its main Production deployment.
- Preserve Supabase project `ccawzrrkxuirrwvaecvw`.
- Delete Supabase project `uixpyibcpleuwsgemdno` without backup or data merge.
- Local `.env.local` must point to `ccawzrrkxuirrwvaecvw`; `.env.main.local` must be removed.
- Main database writes must retain an explicit `--confirm-production` guard.
- Preserve completed historical plans and test records; update active operational instructions only.
- Stop before hosted deletion if main verification or authenticated identity checks fail.
- Source branch/worktree: `main` at `/home/ubuntu/code/english_app`.
- Integration target: `origin/main`.

---

### Task 1: Make database and WCT tooling main-only

**Files:**
- Create: `tests/unit/main-only-environment.test.ts`
- Modify: `package.json`
- Modify: `scripts/db-migrations.mjs`
- Modify: `scripts/generate-wct-quiz-backfill.ts`
- Delete: `scripts/sync-main-to-dev.mjs`

**Interfaces:**
- Consumes: `.env.local` with main Supabase credentials.
- Produces: `db:status`, `db:validate`, `db:migrate`, and `db:baseline` scripts that target only project `ccawzrrkxuirrwvaecvw`.

- [ ] **Step 1: Write the failing main-only configuration test**

```ts
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const packageJson = JSON.parse(read("package.json")) as {
  scripts: Record<string, string>;
};

describe("main-only hosted environment", () => {
  it("exposes only one guarded database command set", () => {
    expect(packageJson.scripts).toMatchObject({
      "db:status": "node scripts/db-migrations.mjs status",
      "db:validate": "node scripts/db-migrations.mjs validate",
      "db:migrate": "node scripts/db-migrations.mjs migrate",
      "db:baseline": "node scripts/db-migrations.mjs baseline"
    });
    expect(Object.keys(packageJson.scripts)).not.toContain("sync:main-to-dev");
    expect(Object.keys(packageJson.scripts).some((name) => name.endsWith(":dev"))).toBe(false);
    expect(Object.keys(packageJson.scripts).some((name) => name.endsWith(":main"))).toBe(false);
  });

  it("contains no active dev project or secondary env file references", () => {
    for (const file of [
      "package.json",
      "scripts/db-migrations.mjs",
      "scripts/generate-wct-quiz-backfill.ts"
    ]) {
      const source = read(file);
      expect(source).not.toContain("uixpyibcpleuwsgemdno");
      expect(source).not.toContain(".env.main.local");
      expect(source).not.toContain("--env dev");
    }
    expect(read("scripts/db-migrations.mjs")).toContain("ccawzrrkxuirrwvaecvw");
    expect(read("scripts/db-migrations.mjs")).toContain(".env.local");
  });
});
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```bash
npm test -- tests/unit/main-only-environment.test.ts
```

Expected: FAIL because the old dual-environment scripts and dev project ref still exist.

- [ ] **Step 3: Replace package scripts with the single main command set**

Use these exact script entries:

```json
"db:status": "node scripts/db-migrations.mjs status",
"db:migrate": "node scripts/db-migrations.mjs migrate",
"db:baseline": "node scripts/db-migrations.mjs baseline",
"db:validate": "node scripts/db-migrations.mjs validate",
"wct:quiz-backfill:generate": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types scripts/generate-wct-quiz-backfill.ts generate --output supabase/migrations/20260728121000_backfill_wct_review_quizzes.sql",
"wct:quiz-backfill:verify": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types scripts/generate-wct-quiz-backfill.ts verify"
```

Remove `sync:main-to-dev`, every `db:*:dev`, and every `db:*:main` entry.

- [ ] **Step 4: Simplify the migration runner to one guarded environment**

Replace the environment map and `--env` selection with:

```js
const ENVIRONMENT = {
  name: "main",
  envFile: ".env.local",
  projectRef: "ccawzrrkxuirrwvaecvw"
};

const args = process.argv.slice(2);
const command = args.find((arg) => !arg.startsWith("-")) ?? "help";
const confirmProduction = args.includes("--confirm-production");
const unknownOption = args.find((arg) => (
  arg.startsWith("-")
  && !["--confirm-production", "--help", "-h"].includes(arg)
));
if (unknownOption) fail(`Unknown option: ${unknownOption}`);
```

Always require `--confirm-production` for `migrate` and `baseline`. Load only
`.env.local`, validate only `ccawzrrkxuirrwvaecvw`, and print
`environment: "main"` in status output. Update help text so it has no `--env`
argument or dev mapping.

- [ ] **Step 5: Make the WCT backfill command main-only**

Rename dev-specific constants and helpers to neutral names:

```ts
const ENV_FILE = ".env.local";
const PROJECT_REF = "ccawzrrkxuirrwvaecvw";
```

Remove `--env` parsing, reject unknown options, and use `createClientFromEnv()`
and `readBooks()` in `main()`. Keep generation and verification behavior
unchanged.

- [ ] **Step 6: Delete the obsolete synchronization script**

Delete `scripts/sync-main-to-dev.mjs`. No replacement is needed because only
one hosted database remains.

- [ ] **Step 7: Run focused tests**

Run:

```bash
npm test -- tests/unit/main-only-environment.test.ts tests/unit/wct-quiz-backfill.test.ts
node scripts/db-migrations.mjs --help
node scripts/db-migrations.mjs status --env dev
```

Expected: Vitest PASS; help names only main and `.env.local`; the legacy
`--env dev` call fails with `Unknown option: --env` before any database access.

- [ ] **Step 8: Commit the tooling change**

```bash
git add package.json scripts tests/unit/main-only-environment.test.ts
git commit -m "chore: make database tooling main-only"
```

---

### Task 2: Make the private-expression skill main-only

**Files:**
- Modify: `.codex/skills/english-private-expression-card/SKILL.md`
- Modify: `.codex/skills/english-private-expression-card/scripts/add-private-expressions.mjs`
- Modify: `tests/unit/main-only-environment.test.ts`

**Interfaces:**
- Consumes: `.env.local`, a reviewed payload, and `--confirm-production`.
- Produces: one private-expression write path targeting only `ccawzrrkxuirrwvaecvw`.

- [ ] **Step 1: Invoke the skill-editing workflow**

Read and follow `superpowers:writing-skills` before editing the local skill.

- [ ] **Step 2: Extend the failing configuration test**

Add these files to the no-dev scan:

```ts
".codex/skills/english-private-expression-card/SKILL.md",
".codex/skills/english-private-expression-card/scripts/add-private-expressions.mjs"
```

Also assert that the script contains `ccawzrrkxuirrwvaecvw`, `.env.local`, and
`--confirm-production`.

- [ ] **Step 3: Run the targeted test and verify it fails**

```bash
npm test -- tests/unit/main-only-environment.test.ts
```

Expected: FAIL on the skill's dev ref and `.env.main.local` references.

- [ ] **Step 4: Simplify the private-expression CLI**

Use one constant and one env file:

```js
const PROJECT_REF = "ccawzrrkxuirrwvaecvw";

function envFileFor(repo) {
  return path.join(repo, ".env.local");
}
```

Remove `--env`, require `--confirm-production` for every `--apply`, and keep
dry-run as the default. Update usage to:

```text
node add-private-expressions.mjs --payload <file.json> [--repo <path>] [--apply] [--confirm-production]
```

- [ ] **Step 5: Update the skill instructions**

Document `.env.local` as the only configuration, identify
`ccawzrrkxuirrwvaecvw` as main/production, remove environment selection, and
retain exact preview-before-apply plus production confirmation requirements.

- [ ] **Step 6: Verify the skill and tests**

```bash
node .codex/skills/english-private-expression-card/scripts/add-private-expressions.mjs --help
node .codex/skills/english-private-expression-card/scripts/add-private-expressions.mjs --env dev --payload missing.json
npm test -- tests/unit/main-only-environment.test.ts
```

Expected: help shows the main-only usage; `--env dev` fails as an unknown
argument; Vitest PASS.

- [ ] **Step 7: Commit the skill change**

```bash
git add .codex/skills/english-private-expression-card tests/unit/main-only-environment.test.ts
git commit -m "chore: target main from private expression skill"
```

---

### Task 3: Convert active instructions and local secrets to main

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/supabase-setup.md`
- Modify: `docs/prd/future-work.md`
- Replace ignored file: `.env.local`
- Delete ignored file: `.env.main.local`

**Interfaces:**
- Consumes: the existing main credentials in `.env.main.local`.
- Produces: active documentation and local runtime configuration with one main environment.

- [ ] **Step 1: Update active operational documentation**

In `AGENTS.md`:

- make `main` the default worktree/PR/merge target;
- describe `.env.local` → `ccawzrrkxuirrwvaecvw` as the only hosted mapping;
- replace dual database commands with `db:status`, `db:validate`,
  `db:migrate -- --confirm-production`, and
  `db:baseline -- --confirm-production`;
- remove the dev Supabase MCP mapping and two-database verification language.

In `docs/supabase-setup.md`, keep only the main Supabase and Kakao callback
instructions. In `README.md`, warn that local `.env.local` uses the production
database. Add a dated main-only environment note near the top of
`docs/prd/future-work.md`; do not rewrite completed historical entries.

- [ ] **Step 2: Verify the ignored env source and destination paths**

Resolve both paths and confirm they are exactly:

```text
/home/ubuntu/code/english_app/.env.local
/home/ubuntu/code/english_app/.env.main.local
```

Read only `NEXT_PUBLIC_SUPABASE_URL` from `.env.main.local` and require project
ref `ccawzrrkxuirrwvaecvw`.

- [ ] **Step 3: Replace the local env mechanically without printing secrets**

Copy `.env.main.local` over `.env.local`, compare file hashes, then delete
`.env.main.local`. Do not echo either file.

- [ ] **Step 4: Verify the resulting mapping**

Read only the `.env.local` Supabase host and require
`ccawzrrkxuirrwvaecvw.supabase.co`. Verify `.env.main.local` no longer exists.

- [ ] **Step 5: Run the main migration preflight**

```bash
npm run db:status
npm run db:validate
```

Expected: project ref `ccawzrrkxuirrwvaecvw`, env file `.env.local`, 35
migrations, pending 0, mismatch 0.

- [ ] **Step 6: Commit active documentation**

```bash
git add AGENTS.md README.md docs/supabase-setup.md docs/prd/future-work.md
git commit -m "docs: adopt the main-only environment"
```

---

### Task 4: Verify and publish main

**Files:**
- No new files.
- Runtime log: `/tmp/english-app-main-only.log`

**Interfaces:**
- Consumes: the main-only commits and `.env.local`.
- Produces: a verified `origin/main` and healthy Vercel Production deployment.

- [ ] **Step 1: Run the command-level gate**

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Restart a task-owned main server**

Start Next on `0.0.0.0:3000` with output in
`/tmp/english-app-main-only.log`. If port 3000 is occupied, verify the owning
process and working directory before stopping it.

- [ ] **Step 3: Exercise the live app**

```bash
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:3000/login
```

Also check the reachable WSL/LAN IP on port 3000. Expected: healthy HTTP
responses with no 500.

- [ ] **Step 4: Inspect runtime logs**

Search `/tmp/english-app-main-only.log` for:

```text
InternalServerError|Cannot find module|500|missing chunk|schema error|failed server action
```

Expected: no matches.

- [ ] **Step 5: Reconfirm the Git boundary and push**

```bash
git status --short --branch
git log --oneline origin/main..main
git push origin main
```

Expected: a clean main branch and a successful push to `origin/main`.

- [ ] **Step 6: Verify Vercel Production**

Use GitHub deployment status or authenticated Vercel inspection to confirm the
new main commit deployed successfully. Exercise the Production `/` and `/login`
URLs and require healthy responses before deleting any Preview resource.

---

### Task 5: Delete Vercel dev Preview resources

**Files:**
- No repository files.

**Interfaces:**
- Consumes: authenticated Vercel access to project `english`.
- Produces: main Production retained with no dev Preview deployments or Preview env configuration.

- [ ] **Step 1: Authenticate and inspect the exact project**

```bash
vercel whoami
vercel project inspect english
```

Expected: the authenticated account owns `parkseryus-projects/english`. Stop if
the scope or project differs.

- [ ] **Step 2: List dev Preview deployments**

```bash
vercel list english --environment preview --format json -m githubCommitRef=dev
```

Inspect each returned deployment's ID, project, environment, and Git ref. Do
not treat Production deployments as deletion candidates.

- [ ] **Step 3: Remove only the verified dev deployment IDs**

Parse the JSON defensively, require every candidate to identify the `dev` Git
ref, and delete the collected deployment UIDs:

```powershell
$DevDeploymentPayload = vercel list english --environment preview --format json -m githubCommitRef=dev | ConvertFrom-Json
$DevDeployments = if ($DevDeploymentPayload.deployments) { @($DevDeploymentPayload.deployments) } else { @($DevDeploymentPayload) }
$UnexpectedDeployment = $DevDeployments | Where-Object {
  $GitRef = if ($_.gitSource.ref) { $_.gitSource.ref } else { $_.meta.githubCommitRef }
  $GitRef -ne "dev"
}
if ($UnexpectedDeployment) { throw "Vercel returned a non-dev deployment candidate" }
$DevDeploymentIds = @($DevDeployments | ForEach-Object { if ($_.uid) { $_.uid } else { $_.id } })
foreach ($DevDeploymentId in $DevDeploymentIds) {
  vercel remove $DevDeploymentId --yes
  if ($LASTEXITCODE -ne 0) { throw "Failed to remove Vercel deployment $DevDeploymentId" }
}
```

- [ ] **Step 4: Remove Preview environment variables**

List and remove Preview keys programmatically while preserving Production:

```powershell
$PreviewEnvPayload = vercel env list preview --format json | ConvertFrom-Json
$PreviewEnvItems = if ($PreviewEnvPayload.envs) {
  @($PreviewEnvPayload.envs)
} elseif ($PreviewEnvPayload.environmentVariables) {
  @($PreviewEnvPayload.environmentVariables)
} else {
  @($PreviewEnvPayload)
}
$PreviewEnvNames = @($PreviewEnvItems | ForEach-Object { if ($_.name) { $_.name } else { $_.key } } | Sort-Object -Unique)
foreach ($PreviewEnvName in $PreviewEnvNames) {
  if (-not $PreviewEnvName) { throw "Vercel returned a Preview variable without a name" }
  vercel env remove $PreviewEnvName preview --yes
  if ($LASTEXITCODE -ne 0) { throw "Failed to remove Vercel Preview variable $PreviewEnvName" }
}
```

Never print secret values.

- [ ] **Step 5: Verify Vercel final state**

Re-run the Preview deployment and env lists. Expected: no dev Preview
deployment, no Preview variables, and the Production deployment remains READY.

---

### Task 6: Delete the dev Supabase project

**Files:**
- No repository files.

**Interfaces:**
- Consumes: authenticated Supabase Management access.
- Produces: only project `ccawzrrkxuirrwvaecvw` remains.

- [ ] **Step 1: List authenticated projects**

```bash
npx supabase projects list
```

Expected: the same account/organization visibly contains both
`uixpyibcpleuwsgemdno` and `ccawzrrkxuirrwvaecvw`. Stop if either identity is
ambiguous.

- [ ] **Step 2: Reconfirm main health immediately before deletion**

```bash
npm run db:status
```

Expected: main ref `ccawzrrkxuirrwvaecvw`, pending 0, mismatch 0.

- [ ] **Step 3: Permanently delete the exact dev ref**

```bash
npx supabase projects delete uixpyibcpleuwsgemdno
```

Confirm deletion when prompted. No backup or merge is performed, per the
approved scope.

- [ ] **Step 4: Verify Supabase final state**

```bash
npx supabase projects list
npm run db:status
```

Expected: `uixpyibcpleuwsgemdno` is absent,
`ccawzrrkxuirrwvaecvw` remains, and main migration status is healthy.

---

### Task 7: Delete Git dev worktree and branches

**Files:**
- Delete worktree directory: `/home/ubuntu/code/english_app_dev`

**Interfaces:**
- Consumes: verified and pushed `main`.
- Produces: one local worktree, one local branch, and one GitHub branch: `main`.

- [ ] **Step 1: Re-run the destructive preflight**

```bash
git status --short --branch
git -C /home/ubuntu/code/english_app_dev status --short --branch
git rev-parse main
git rev-parse dev
git rev-parse origin/main
git rev-parse origin/dev
git merge-base --is-ancestor dev main
git worktree list --porcelain
```

Expected: both worktrees are clean, local/remote dev still match each other,
local/remote main match each other, and dev is an ancestor of main. Stop if dev
has new work or divergent commits.

- [ ] **Step 2: Remove the exact dev worktree**

```bash
git worktree remove /home/ubuntu/code/english_app_dev
```

- [ ] **Step 3: Remove local and remote dev branches**

```bash
git branch -d dev
git push origin --delete dev
git fetch --prune origin
```

- [ ] **Step 4: Verify final Git state**

```bash
git worktree list
git branch -avv
gh api repos/ParkSeryu/english_app/branches --paginate --jq '.[].name'
```

Expected: only the main worktree and `main` branch remain.

---

### Task 8: Final main-only verification and evidence

**Files:**
- Modify: `docs/prd/future-work.md` only if final external evidence was not already recorded.

**Interfaces:**
- Consumes: completed repository and hosted deletions.
- Produces: an evidence-backed completion report.

- [ ] **Step 1: Scan active files for retired configuration**

```bash
rg -n \
  -e uixpyibcpleuwsgemdno \
  -e .env.main.local \
  -e sync:main-to-dev \
  -e db:status:dev \
  -e db:migrate:dev \
  AGENTS.md README.md package.json scripts .codex/skills docs/supabase-setup.md
```

Expected: no matches. Historical completed documents are outside this scan.

- [ ] **Step 2: Re-run the compact verification gate**

```bash
npm run lint
npm run typecheck
npm test -- tests/unit/main-only-environment.test.ts tests/unit/wct-quiz-backfill.test.ts
npm run db:status
```

Expected: all pass and database status names only main.

- [ ] **Step 3: Record any final external evidence and push if needed**

If `docs/prd/future-work.md` receives final Vercel/Supabase/Git evidence, commit
and push it:

```bash
git add docs/prd/future-work.md
git commit -m "docs: record main-only infrastructure verification"
git push origin main
```

- [ ] **Step 4: Report exact results**

Report changed files; Git branch/worktree state; retained Vercel Production;
deleted Vercel Preview resources; retained main Supabase ref; deleted dev
Supabase ref; commands and live URLs checked; and any authenticated management
step that remained blocked.

