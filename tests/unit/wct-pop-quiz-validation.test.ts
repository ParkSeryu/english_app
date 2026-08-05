import { describe, expect, it } from "vitest";

import type { WctPopQuizQuestion } from "@/lib/wct/pop-quiz/types";
import { wctPopQuizQuestionsSchema } from "@/lib/wct/pop-quiz/validation";

function questions(count: number, includeDayTopic: boolean): WctPopQuizQuestion[] {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    const questionId = `question-${number}`;
    return {
      sourceQuizSetId: `set-${number}`,
      dayId: `day-${number}`,
      dayNumber: number,
      dayLabel: `Day ${number}`,
      ...(includeDayTopic ? { dayTopic: `Topic ${number}` } : {}),
      band: number <= Math.ceil(count / 3) ? "early" : number <= Math.ceil((count * 2) / 3) ? "middle" : "late",
      question: {
        id: questionId,
        kind: number % 2 === 0 ? "pattern" : "translation",
        prompt: `Prompt ${number}`,
        choices: [1, 2, 3, 4].map((choice) => ({
          id: `${questionId}-choice-${choice}`,
          text: `Choice ${choice}`
        })),
        correctChoiceId: `${questionId}-choice-1`,
        explanation: `Explanation ${number}`
      }
    };
  });
}

describe("wctPopQuizQuestionsSchema", () => {
  it("accepts a 16-question new snapshot with Day topics", () => {
    expect(wctPopQuizQuestionsSchema.safeParse(questions(16, true)).success).toBe(true);
  });

  it("accepts a 28-question new snapshot with Day topics", () => {
    expect(wctPopQuizQuestionsSchema.safeParse(questions(28, true)).success).toBe(true);
  });

  it("accepts a legacy 20-question snapshot without Day topics", () => {
    const rawSnapshot = questions(20, false);
    const parsed = wctPopQuizQuestionsSchema.parse(rawSnapshot);

    expect(parsed).toEqual(rawSnapshot);
    expect("format" in parsed[0].question).toBe(false);
  });

  it("accepts a shared v2 two-choice true/false question", () => {
    const snapshot = questions(16, true);
    snapshot[0].question = {
      ...snapshot[0].question,
      format: "true_false",
      choices: [
        { id: "question-1-o", text: "O" },
        { id: "question-1-x", text: "X" }
      ],
      correctChoiceId: "question-1-o",
      feedback: {
        correctSentence: "This is correct.",
        pattern: "be + adjective",
        reason: "The sentence follows the pattern."
      }
    };

    expect(wctPopQuizQuestionsSchema.parse(snapshot)).toEqual(snapshot);
  });

  it("rejects duplicate question IDs", () => {
    const snapshot = questions(16, true);
    snapshot[1].question.id = snapshot[0].question.id;

    expect(() => wctPopQuizQuestionsSchema.parse(snapshot)).toThrow("Question IDs must be distinct");
  });

  it("rejects duplicate choice IDs", () => {
    const snapshot = questions(16, true);
    snapshot[0].question.choices[1].id = snapshot[0].question.choices[0].id;

    expect(() => wctPopQuizQuestionsSchema.parse(snapshot)).toThrow("Choices must be distinct");
  });

  it("rejects a correct choice ID that is not present", () => {
    const snapshot = questions(16, true);
    snapshot[0].question.correctChoiceId = "missing-choice";

    expect(() => wctPopQuizQuestionsSchema.parse(snapshot)).toThrow("Correct choice must exist");
  });

  it("preserves an absent format when parsing a legacy snapshot", () => {
    const snapshot = questions(16, true);
    const parsed = wctPopQuizQuestionsSchema.parse(snapshot);

    expect("format" in parsed[0].question).toBe(false);
  });

  it.each([0, 101])("rejects a %i-question snapshot", (count) => {
    expect(wctPopQuizQuestionsSchema.safeParse(questions(count, true)).success).toBe(false);
  });
});
