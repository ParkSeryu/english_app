import { describe, expect, it } from "vitest";

describe("main-only environment CLIs", () => {
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

  it("keeps audit, generate, and verify on the exact main project", async () => {
    const releaseModule = await import(
      "@/scripts/generate-wct-quiz-v2.ts"
    );
    const usage = releaseModule.wctV2QuizUsage();

    expect(usage).toContain(".env.local");
    expect(usage).toContain("ccawzrrkxuirrwvaecvw.supabase.co");
    expect(usage).toContain("audit, generate, and verify read main/production");
    expect(usage).not.toContain("--env");
  });

  it("keeps approve and fixture local-file-only", async () => {
    const releaseModule = await import(
      "@/scripts/generate-wct-quiz-v2.ts"
    );

    expect(releaseModule.commandUsesHostedReads("audit")).toBe(true);
    expect(releaseModule.commandUsesHostedReads("generate")).toBe(true);
    expect(releaseModule.commandUsesHostedReads("verify")).toBe(true);
    expect(releaseModule.commandUsesHostedReads("approve")).toBe(false);
    expect(releaseModule.commandUsesHostedReads("fixture")).toBe(false);
  });
});
