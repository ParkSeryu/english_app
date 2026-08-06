import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const verifierPath = "scripts/verify-wct-quiz-v2-data-migration.sh";
const policyVerifierPath = "scripts/verify-rls-local.sh";
const checkpointBPath =
  "supabase/migrations/20260805130000_replace_wct_standard_quizzes_v2.sql";

describe("WCT quiz v2 checkpoint-B executable verification", () => {
  it("keeps both verification shell entry points syntactically valid", () => {
    for (const path of [policyVerifierPath, verifierPath]) {
      const result = spawnSync("bash", ["-n", path], { encoding: "utf8" });
      expect(result.status, `${path}: ${result.stderr}`).toBe(0);
    }
  });

  it.skipIf(existsSync(checkpointBPath))(
    "skips the disposable migration replay clearly while checkpoint B is absent",
    () => {
      const result = spawnSync("bash", [verifierPath], { encoding: "utf8" });

      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain(
        `Skipping WCT v2 data migration verification: ${checkpointBPath} is absent.`
      );
    }
  );

  it("keeps blank policy replay opt-in local and runs the data verifier after it", () => {
    const policyVerifier = readFileSync(policyVerifierPath, "utf8");
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(policyVerifier).toContain(
      "set app.wct_v2_allow_empty_fixture = 'on';"
    );
    expect(policyVerifier).toContain(
      "reset app.wct_v2_allow_empty_fixture;"
    );
    expect(packageJson.scripts["verify:wct-quiz-v2-data-migration"]).toBe(
      `bash ${verifierPath}`
    );
    expect(packageJson.scripts["verify:rls"]).toBe(
      "bash scripts/verify-rls-local.sh && npm run verify:wct-quiz-v2-data-migration"
    );
  });

  it("pins local replay through checkpoint A and contains bounded success and rollback databases", () => {
    const verifier = readFileSync(verifierPath, "utf8");

    expect(verifier).toContain(
      'MIGRATION_CUTOFF="20260805120000_add_wct_quiz_v2_compatibility.sql"'
    );
    expect(verifier).toContain("npm run wct:quiz-v2:fixture");
    expect(verifier).toContain("trap cleanup EXIT");
    expect(verifier).toMatch(/timeout\s+"\$\{?COMMAND_TIMEOUT/);
    expect(verifier).toContain("wct_v2_success");
    expect(verifier).toContain("wct_v2_zero_target");
    expect(verifier).toContain(
      "Checkpoint B unexpectedly accepted a zero-target normal session."
    );
    expect(verifier).toContain("WCT v2 exact target book inventory mismatch");
    expect(verifier).toContain("wct_v2_preimage_failure");
    expect(verifier).toContain("wct_v2_postcondition_failure");
    expect(verifier).toContain("fixture-sentinel-concept");
    expect(verifier).toContain("fixture-sentinel-note");
    expect(verifier).toContain("fixture-sentinel-practice");
    expect(verifier).toContain("fixture-all-standard-progress");
    expect(verifier).toContain("assert_snapshot_unchanged");
    expect(verifier).not.toContain("--confirm-production");
    expect(verifier).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(verifier).not.toContain("app.wct_v2_allow_empty_fixture");
  });
});
