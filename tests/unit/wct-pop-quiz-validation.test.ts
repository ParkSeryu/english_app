import { describe, expect, it } from "vitest";

import type { WctPopQuizQuestion } from "@/lib/wct/pop-quiz/types";
import { wctPopQuizQuestionsSchema } from "@/lib/wct/pop-quiz/validation";

function questions(): WctPopQuizQuestion[] {
  return Array.from({ length: 20 }, (_, index) => {
    const number = index + 1;
    const questionId = `question-${number}`;
    return {
      sourceQuizSetId: `set-${Math.ceil(number / 2)}`,
      dayId: `day-${Math.ceil(number / 2)}`,
      dayNumber: Math.ceil(number / 2),
      dayLabel: `Day ${Math.ceil(number / 2)}`,
      band: index < 7 ? "early" : index < 14 ? "middle" : "late",
      question: {
        id: questionId,
        kind: index < 12 ? "translation" : "pattern",
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
  it("accepts exactly 20 valid questions", () => {
    expect(wctPopQuizQuestionsSchema.safeParse(questions()).success).toBe(true);
  });

  it.each([19, 21])("rejects a %i-question snapshot", (count) => {
    const snapshot = questions();
    if (count === 19) snapshot.pop();
    if (count === 21) snapshot.push({
      ...snapshot[19],
      sourceQuizSetId: "set-11",
      dayId: "day-11",
      dayNumber: 11,
      dayLabel: "Day 11",
      question: {
        ...snapshot[19].question,
        id: "question-21",
        choices: snapshot[19].question.choices.map((choice, index) => ({
          ...choice,
          id: `question-21-choice-${index + 1}`
        })),
        correctChoiceId: "question-21-choice-1"
      }
    });

    expect(wctPopQuizQuestionsSchema.safeParse(snapshot).success).toBe(false);
  });

  it("rejects a snapshot with a 13/7 type split", () => {
    const snapshot = questions();
    snapshot[12].question.kind = "translation";

    expect(wctPopQuizQuestionsSchema.safeParse(snapshot).success).toBe(false);
  });

  it("rejects a snapshot with a 6/8/6 band split", () => {
    const snapshot = questions();
    snapshot[0].band = "middle";

    expect(wctPopQuizQuestionsSchema.safeParse(snapshot).success).toBe(false);
  });

  it("rejects more than two questions from one Day", () => {
    const snapshot = questions();
    snapshot[2] = {
      ...snapshot[2],
      dayId: snapshot[0].dayId,
      dayNumber: snapshot[0].dayNumber,
      dayLabel: snapshot[0].dayLabel
    };

    expect(wctPopQuizQuestionsSchema.safeParse(snapshot).success).toBe(false);
  });
});
