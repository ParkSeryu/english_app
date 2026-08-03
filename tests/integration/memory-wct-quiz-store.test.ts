import { beforeEach, describe, expect, it } from "vitest";

import {
  MemoryWctQuizStore,
  resetMemoryWctQuizStoreForTests
} from "@/lib/wct-quiz-store/memory-store";
import type {
  WctQuizSet,
  WctQuizSetCreateInput,
  WctQuizSubmission
} from "@/lib/wct/quiz/types";

const USER_A = "00000000-0000-4000-8000-000000000001";
const USER_B = "00000000-0000-4000-8000-000000000002";

function draft(): WctQuizSetCreateInput {
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

function answersFor(
  set: WctQuizSet,
  choiceIndex: number
): WctQuizSubmission {
  return {
    quizSetId: set.id,
    answers: set.questions.map((question) => ({
      questionId: question.id,
      choiceId: question.choices[choiceIndex].id
    }))
  };
}

describe("MemoryWctQuizStore", () => {
  beforeEach(() => resetMemoryWctQuizStoreForTests());

  it("creates once and returns the immutable existing set on replay", async () => {
    const admin = new MemoryWctQuizStore({ id: USER_A }, true);
    const first = await admin.createSetIfMissing(draft());
    const replay = await admin.createSetIfMissing({
      ...draft(),
      sourceHash: "f".repeat(64)
    });

    expect(replay).toEqual(first);
    expect(replay.sourceHash).toBe("a".repeat(64));
  });

  it("rejects quiz creation through a learner store", async () => {
    const learner = new MemoryWctQuizStore({ id: USER_A });

    await expect(learner.createSetIfMissing(draft()))
      .rejects.toThrow("WCT quiz creation requires an admin store");
  });

  it("isolates sets and summaries by owner", async () => {
    await new MemoryWctQuizStore({ id: USER_A }, true)
      .createSetIfMissing(draft());
    const ownerB = new MemoryWctQuizStore({ id: USER_B });

    await expect(ownerB.getSetByLessonKey(draft().lessonKey))
      .resolves.toBeNull();
    await expect(ownerB.getSummaryByLessonKey(draft().lessonKey))
      .resolves.toBeNull();
  });

  it("lists only the owner's sets for the requested lesson keys", async () => {
    const adminA = new MemoryWctQuizStore({ id: USER_A }, true);
    const first = await adminA.createSetIfMissing(draft());
    const second = await adminA.createSetIfMissing({
      ...draft(),
      lessonKey: "wct-book:wct-prenovice:day:2",
      sourceId: "day-2"
    });
    await new MemoryWctQuizStore({ id: USER_B }, true).createSetIfMissing({
      ...draft(),
      sourceId: "other-owner"
    });

    await expect(new MemoryWctQuizStore({ id: USER_A }).listSetsByLessonKeys([
      first.lessonKey,
      "wct-book:wct-prenovice:day:missing"
    ])).resolves.toEqual([first]);
    await expect(new MemoryWctQuizStore({ id: USER_A }).listSetsByLessonKeys([
      first.lessonKey,
      second.lessonKey
    ])).resolves.toEqual([first, second]);
  });
  it("scores stored answers and replaces the latest progress", async () => {
    const admin = new MemoryWctQuizStore({ id: USER_A }, true);
    const set = await admin.createSetIfMissing(draft());
    const learner = new MemoryWctQuizStore({ id: USER_A });

    await expect(learner.submitAttempt(answersFor(set, 0)))
      .resolves.toMatchObject({ score: 5, total: 5 });
    await expect(learner.submitAttempt(answersFor(set, 1)))
      .resolves.toMatchObject({ score: 0, total: 5 });
    await expect(learner.getSummaryByLessonKey(draft().lessonKey))
      .resolves.toMatchObject({
        quizSetId: set.id,
        questionCount: 5,
        latestScore: 0,
        completedAt: expect.any(String)
      });
  });

  it("rejects unknown choices and another owner's set ID", async () => {
    const set = await new MemoryWctQuizStore({ id: USER_A }, true)
      .createSetIfMissing(draft());
    const unknownChoice = answersFor(set, 0);
    unknownChoice.answers[0].choiceId = "missing";

    await expect(new MemoryWctQuizStore({ id: USER_A })
      .submitAttempt(unknownChoice))
      .rejects.toThrow("Unknown WCT quiz question or choice");
    await expect(new MemoryWctQuizStore({ id: USER_B })
      .submitAttempt(answersFor(set, 0)))
      .rejects.toThrow("WCT quiz not found");
  });

  it("rejects duplicate submitted question IDs", async () => {
    const set = await new MemoryWctQuizStore({ id: USER_A }, true)
      .createSetIfMissing(draft());
    const duplicate = answersFor(set, 0);
    duplicate.answers[4].questionId = duplicate.answers[0].questionId;

    await expect(new MemoryWctQuizStore({ id: USER_A })
      .submitAttempt(duplicate))
      .rejects.toThrow("Each question must be answered once");
  });
});
