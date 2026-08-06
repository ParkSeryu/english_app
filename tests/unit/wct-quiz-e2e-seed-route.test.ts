import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST as resetSeed } from "@/app/test/reset/route";
import { POST as seedWctBook } from "@/app/test/seed-wct-book/route";

const FAKE_USER_ID = "00000000-0000-4000-8000-000000000001";

type SeedQuestion = {
  level: "prenovice" | "novice";
  dayNumber: number;
  format: "multiple_choice" | "fill_blank" | "true_false";
  correctChoiceText: string;
};

describe("WCT E2E seed route", () => {
  const previousMemoryMode = process.env.E2E_MEMORY_STORE;
  const previousFakeUserId = process.env.E2E_FAKE_USER_ID;

  beforeEach(async () => {
    process.env.E2E_MEMORY_STORE = "1";
    process.env.E2E_FAKE_USER_ID = FAKE_USER_ID;
    expect((await resetSeed()).status).toBe(200);
  });

  afterEach(() => {
    if (previousMemoryMode === undefined) delete process.env.E2E_MEMORY_STORE;
    else process.env.E2E_MEMORY_STORE = previousMemoryMode;
    if (previousFakeUserId === undefined) delete process.env.E2E_FAKE_USER_ID;
    else process.env.E2E_FAKE_USER_ID = previousFakeUserId;
  });

  it("creates complete balanced Prenovice and Novice v2 quiz inventories", async () => {
    const response = await seedWctBook();

    expect(response.status).toBe(200);
    const payload = await response.json() as {
      prenoviceDayCount: number;
      noviceDayCount: number;
      questions: SeedQuestion[];
    };
    expect(payload.prenoviceDayCount).toBe(16);
    expect(payload.noviceDayCount).toBe(28);
    expect(payload.questions).toHaveLength(220);

    const byDay = new Map<string, SeedQuestion[]>();
    for (const question of payload.questions) {
      const key = `${question.level}:${question.dayNumber}`;
      byDay.set(key, [...(byDay.get(key) ?? []), question]);
    }
    expect(byDay.size).toBe(44);
    for (const questions of byDay.values()) {
      expect(questions).toHaveLength(5);
      expect(questions.filter((question) => question.format === "multiple_choice"))
        .toHaveLength(2);
      expect(questions.filter((question) => question.format === "fill_blank"))
        .toHaveLength(2);
      expect(questions.filter((question) => question.format === "true_false"))
        .toHaveLength(1);
    }

    const truthCounts = (level: SeedQuestion["level"]) => {
      const truthRows = payload.questions.filter((question) => (
        question.level === level && question.format === "true_false"
      ));
      return {
        O: truthRows.filter((question) => question.correctChoiceText === "O").length,
        X: truthRows.filter((question) => question.correctChoiceText === "X").length
      };
    };
    expect(truthCounts("prenovice")).toEqual({ O: 8, X: 8 });
    expect(truthCounts("novice")).toEqual({ O: 14, X: 14 });
  });

  it("exposes stored Premium v1 questions without v2 format metadata", async () => {
    const response = await seedWctBook();

    expect(response.status).toBe(200);
    const payload = await response.json() as {
      premiumQuizSet?: {
        generatorVersion: string;
        questions: Array<Record<string, unknown>>;
      };
    };
    expect(payload.premiumQuizSet).toBeDefined();
    const premiumQuizSet = payload.premiumQuizSet!;
    expect(premiumQuizSet.generatorVersion).toBe("wct-review-v1");
    expect(premiumQuizSet.questions).toHaveLength(5);
    expect(premiumQuizSet.questions.every((question) => (
      !Object.hasOwn(question, "format")
    ))).toBe(true);
  });
});
