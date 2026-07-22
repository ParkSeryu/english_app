import { describe, expect, it } from "vitest";

import { expressionMatchesQuery, filterExpressionDaysByQuery } from "@/lib/expression-search";
import type { ExpressionDay, ExpressionExample } from "@/lib/types";

function expression({
  english = "Could you give me a hand?",
  koreanPrompt = "저 좀 도와주실래요?",
  examples = []
}: {
  english?: string;
  koreanPrompt?: string;
  examples?: Array<Pick<ExpressionExample, "example_text" | "meaning_ko">>;
} = {}) {
  return {
    english,
    korean_prompt: koreanPrompt,
    examples: examples as ExpressionExample[]
  };
}

describe("expression search", () => {
  it("matches English without case sensitivity and ignores extra whitespace", () => {
    expect(expressionMatchesQuery(expression(), "  GIVE   me ")).toBe(true);
  });

  it("matches Korean prompts", () => {
    expect(expressionMatchesQuery(expression(), "도와주실래요")).toBe(true);
  });

  it("matches English and Korean text in similar expressions", () => {
    const candidate = expression({
      examples: [{ example_text: "Can you help me out?", meaning_ko: "나 좀 도와줄래?" }]
    });

    expect(expressionMatchesQuery(candidate, "help me out")).toBe(true);
    expect(expressionMatchesQuery(candidate, "도와줄래")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(expressionMatchesQuery(expression(), "예약을 변경하다")).toBe(false);
  });

  it("returns matches from every topic and removes topics without matches", () => {
    const days = [
      { id: "topic-a", expressions: [expression({ english: "First topic expression" })] },
      { id: "topic-b", expressions: [expression({ english: "Second topic expression" })] }
    ] as unknown as ExpressionDay[];

    const result = filterExpressionDaysByQuery(days, "second topic");

    expect(result.map((day) => day.id)).toEqual(["topic-b"]);
    expect(result[0].expressions.map((item) => item.english)).toEqual(["Second topic expression"]);
  });
});
