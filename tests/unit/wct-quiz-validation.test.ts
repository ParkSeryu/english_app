import { describe, expect, it } from "vitest";

import {
  wctQuizSetCreateSchema,
  wctQuizSubmissionSchema
} from "@/lib/wct/quiz/validation";
import type { WctQuizSetCreateInput } from "@/lib/wct/quiz/types";

function validDraft(): WctQuizSetCreateInput {
  return {
    lessonKey: "wct-book:wct-prenovice:day:1",
    sourceKind: "wct_day",
    sourceId: "day-1",
    generatorVersion: "wct-review-v1",
    sourceHash: "a".repeat(64),
    questions: Array.from({ length: 5 }, (_, questionIndex) => ({
      id: `q-${questionIndex + 1}`,
      kind: questionIndex < 3 ? "translation" : "pattern",
      prompt: `질문 ${questionIndex + 1}`,
      choices: Array.from({ length: 4 }, (_, choiceIndex) => ({
        id: `q-${questionIndex + 1}-c-${choiceIndex + 1}`,
        text: `선택 ${questionIndex + 1}-${choiceIndex + 1}`
      })),
      correctChoiceId: `q-${questionIndex + 1}-c-1`,
      explanation: `해설 ${questionIndex + 1}`
    }))
  };
}

describe("WCT quiz validation", () => {
  it("accepts one strict five-question set", () => {
    expect(wctQuizSetCreateSchema.parse(validDraft())).toEqual(validDraft());
  });

  it("rejects normalized duplicate choice text", () => {
    const draft = validDraft();
    draft.questions[0].choices[1].text = "  선택   1-1 ";

    expect(() => wctQuizSetCreateSchema.parse(draft))
      .toThrow("Choices must be distinct");
  });

  it("rejects a correct choice ID that is not in the question", () => {
    const draft = validDraft();
    draft.questions[0].correctChoiceId = "missing-choice";

    expect(() => wctQuizSetCreateSchema.parse(draft))
      .toThrow("Correct choice must exist");
  });

  it("rejects normalized duplicate prompts", () => {
    const draft = validDraft();
    draft.questions[1].prompt = "  질문   1 ";

    expect(() => wctQuizSetCreateSchema.parse(draft))
      .toThrow("Question prompts must be distinct");
  });

  it("requires five unique submitted question IDs", () => {
    const answers = Array.from({ length: 5 }, (_, index) => ({
      questionId: `q-${index + 1}`,
      choiceId: `q-${index + 1}-c-1`
    }));
    answers[4].questionId = "q-1";

    expect(() => wctQuizSubmissionSchema.parse({
      quizSetId: "00000000-0000-4000-8000-000000000001",
      answers
    })).toThrow("Each question must be answered once");
  });
});
