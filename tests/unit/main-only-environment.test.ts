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
});
