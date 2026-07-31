import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function runNode(script: string, args: string[] = []) {
  return spawnSync(process.execPath, [path.join(root, script), ...args], {
    cwd: root,
    encoding: "utf8"
  });
}

function outputOf(result: ReturnType<typeof runNode>) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

describe("main-only environment CLIs", () => {
  it("documents one guarded main migration target", () => {
    const result = runNode("scripts/db-migrations.mjs", ["--help"]);
    const output = outputOf(result);

    expect(result.status).toBe(0);
    expect(output).toContain(".env.local");
    expect(output).toContain("ccawzrrkxuirrwvaecvw");
    expect(output).toContain("--confirm-production");
    expect(output).not.toContain("uixpyibcpleuwsgemdno");
    expect(output).not.toContain(".env.main.local");
    expect(output).not.toContain("--env");
  });

  it("rejects the retired migration environment option before database access", () => {
    const result = runNode("scripts/db-migrations.mjs", [
      "status",
      "--env",
      "dev"
    ]);

    expect(result.status).toBe(1);
    expect(outputOf(result)).toContain("Unknown option: --env");
  });

  it("documents one main WCT backfill target", async () => {
    const backfillModule = await import(
      "@/scripts/generate-wct-quiz-backfill.ts"
    );
    const usage = backfillModule.wctBackfillUsage();

    expect(usage).toContain(".env.local");
    expect(usage).toContain("ccawzrrkxuirrwvaecvw");
    expect(usage).not.toContain("uixpyibcpleuwsgemdno");
    expect(usage).not.toContain("--env");
  });

  it("rejects the retired WCT environment option before hosted access", async () => {
    const backfillModule = await import(
      "@/scripts/generate-wct-quiz-backfill.ts"
    );

    expect(() => backfillModule.parseWctBackfillArgs([
      "verify",
      "--env",
      "dev"
    ])).toThrow("Unknown option: --env");
  });
});
