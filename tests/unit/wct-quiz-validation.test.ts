import { describe, expect, it } from "vitest";

import { mapWctQuizSet } from "@/lib/wct-quiz-store/mappers";
import {
  wctQuizSetSchema,
  wctQuizSetCreateSchema,
  wctStandardQuizSetCreateSchema,
  wctQuizSubmissionSchema
} from "@/lib/wct/quiz/validation";
import {
  getWctQuizQuestionFormat,
  type WctQuizQuestion,
  type WctQuizSetCreateInput
} from "@/lib/wct/quiz/types";

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

function choice(id: string, text: string) {
  return { id, text };
}

function v2Question(
  questionIndex: number,
  format: "multiple_choice" | "fill_blank" | "true_false"
): WctQuizQuestion {
  const questionId = `v2-q-${questionIndex + 1}`;
  const choices = format === "true_false"
    ? [choice(`${questionId}-o`, "O"), choice(`${questionId}-x`, "X")]
    : Array.from({ length: 4 }, (_, choiceIndex) => choice(
      `${questionId}-c-${choiceIndex + 1}`,
      `V2 선택 ${questionIndex + 1}-${choiceIndex + 1}`
    ));
  return {
    id: questionId,
    kind: questionIndex < 3 ? "translation" : "pattern",
    format,
    prompt: `V2 질문 ${questionIndex + 1}`,
    choices,
    correctChoiceId: choices[0].id,
    explanation: `V2 해설 ${questionIndex + 1}`,
    feedback: {
      correctSentence: `Correct sentence ${questionIndex + 1}.`,
      pattern: `Pattern ${questionIndex + 1}`,
      reason: `Reason ${questionIndex + 1}`
    }
  };
}

function v2Draft(firstQuestion?: Partial<WctQuizQuestion>) {
  const firstFormat = firstQuestion?.format ?? "multiple_choice";
  const formats = firstFormat === "true_false"
    ? ["true_false", "multiple_choice", "fill_blank", "multiple_choice", "fill_blank"] as const
    : ["multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"] as const;
  const questions = formats.map((format, index) => v2Question(index, format));
  questions[0] = { ...questions[0], ...firstQuestion };
  return {
    lessonKey: "wct-book:wct-prenovice:day:1",
    sourceKind: "wct_day" as const,
    sourceId: "day-1",
    generatorVersion: "wct-review-v2" as const,
    sourceHash: "b".repeat(64),
    questions
  };
}

function legacyStoredSet() {
  return {
    id: "00000000-0000-4000-8000-000000000010",
    ownerId: "00000000-0000-4000-8000-000000000001",
    ...validDraft(),
    createdAt: "2026-08-05T01:00:00.000Z"
  };
}

describe("WCT quiz validation", () => {
  it("accepts one strict five-question set", () => {
    expect(wctQuizSetCreateSchema.parse(validDraft())).toEqual(validDraft());
  });

  it("accepts v2 O/X with two choices and structured feedback", () => {
    const parsed = wctStandardQuizSetCreateSchema.parse(v2Draft({
      format: "true_false",
      choices: [choice("o", "O"), choice("x", "X")],
      correctChoiceId: "o"
    }));

    expect(parsed.questions[0].format).toBe("true_false");
    expect(parsed.questions[0].feedback).toEqual({
      correctSentence: "Correct sentence 1.",
      pattern: "Pattern 1",
      reason: "Reason 1"
    });
  });

  it("accepts and maps v1 without materializing format or feedback", () => {
    const input = legacyStoredSet();
    const parsed = wctQuizSetSchema.parse(input);
    const mapped = mapWctQuizSet({
      id: input.id,
      owner_id: input.ownerId,
      lesson_key: input.lessonKey,
      source_kind: input.sourceKind,
      source_id: input.sourceId,
      generator_version: input.generatorVersion,
      source_hash: input.sourceHash,
      questions: input.questions,
      created_at: input.createdAt
    });

    expect(parsed).toEqual(input);
    expect(mapped).toEqual(input);
    expect("format" in parsed.questions[0]).toBe(false);
    expect("feedback" in parsed.questions[0]).toBe(false);
    expect("format" in mapped.questions[0]).toBe(false);
    expect("feedback" in mapped.questions[0]).toBe(false);
    expect(getWctQuizQuestionFormat(parsed.questions[0]))
      .toBe("multiple_choice");
  });

  it("accepts a legacy v1 Premium stored set", () => {
    const input = {
      ...legacyStoredSet(),
      lessonKey: "wct-premium:day-1",
      sourceKind: "wct_premium" as const,
      sourceId: "day-1"
    };

    expect(wctQuizSetSchema.parse(input)).toEqual(input);
  });

  it("rejects a v2 true/false question with four choices", () => {
    const draft = v2Draft();
    draft.questions[3].choices = Array.from({ length: 4 }, (_, index) => (
      choice(`wrong-${index + 1}`, `Wrong ${index + 1}`)
    ));
    draft.questions[3].correctChoiceId = "wrong-1";

    expect(() => wctStandardQuizSetCreateSchema.parse(draft))
      .toThrow("true_false needs exactly 2 choices");
  });

  it("rejects the wrong v2 format mix", () => {
    const draft = v2Draft();
    draft.questions[3] = v2Question(3, "multiple_choice");

    expect(() => wctStandardQuizSetCreateSchema.parse(draft)).toThrow();
  });

  it("rejects adjacent identical v2 formats", () => {
    const draft = v2Draft();
    draft.questions[1] = v2Question(1, "multiple_choice");
    draft.questions[2] = v2Question(2, "fill_blank");

    expect(() => wctStandardQuizSetCreateSchema.parse(draft)).toThrow();
  });

  it("rejects v2 Premium, legacy version, concept, and incomplete questions", () => {
    const premium = { ...v2Draft(), sourceKind: "wct_premium" as const };
    const legacyVersion = {
      ...v2Draft(),
      generatorVersion: "wct-review-v1" as const
    };
    const concept = v2Draft();
    concept.questions[0].kind = "concept";
    const missingFormat = v2Draft();
    delete missingFormat.questions[0].format;
    const missingFeedback = v2Draft();
    delete missingFeedback.questions[0].feedback;

    expect(() => wctStandardQuizSetCreateSchema.parse(premium)).toThrow();
    expect(() => wctStandardQuizSetCreateSchema.parse(legacyVersion)).toThrow();
    expect(() => wctStandardQuizSetCreateSchema.parse(concept)).toThrow();
    expect(() => wctStandardQuizSetCreateSchema.parse(missingFormat)).toThrow();
    expect(() => wctStandardQuizSetCreateSchema.parse(missingFeedback)).toThrow();
  });

  it("rejects the wrong v2 translation/pattern mix", () => {
    const draft = v2Draft();
    draft.questions[2].kind = "pattern";

    expect(() => wctStandardQuizSetCreateSchema.parse(draft)).toThrow();
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
