import { beforeEach, describe, expect, it } from "vitest";

import {
  MemoryWctQuizStore,
  resetMemoryWctQuizStoreForTests
} from "@/lib/wct-quiz-store/memory-store";
import {
  MemoryWctPopQuizStore,
  resetMemoryWctPopQuizStoreForTests
} from "@/lib/wct-pop-quiz-store/memory-store";
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

function v2Draft(dayNumber: number): WctQuizSetCreateInput {
  const base = draft();
  return {
    ...base,
    lessonKey: `wct-book:wct-prenovice:day:${dayNumber}`,
    sourceId: `day-${dayNumber}`,
    generatorVersion: "wct-review-v2",
    sourceHash: String(dayNumber).repeat(64).slice(0, 64),
    questions: base.questions.map((question, index) => {
      const format = [
        "multiple_choice",
        "fill_blank",
        "multiple_choice",
        "fill_blank",
        "true_false"
      ][index] as "multiple_choice" | "fill_blank" | "true_false";
      const choices = format === "true_false"
        ? question.choices.slice(0, 2)
        : question.choices;
      return {
        ...question,
        id: `day-${dayNumber}-${question.id}`,
        prompt: `Day ${dayNumber} ${question.prompt}`,
        format,
        choices: choices.map((choice) => ({
          ...choice,
          id: `day-${dayNumber}-${choice.id}`
        })),
        correctChoiceId: `day-${dayNumber}-${question.correctChoiceId}`,
        feedback: {
          correctSentence: `Correct sentence ${dayNumber}-${index + 1}`,
          pattern: `Pattern ${dayNumber}-${index + 1}`,
          reason: `Reason ${dayNumber}-${index + 1}`
        }
      };
    })
  };
}

function popQuestions(sets: readonly WctQuizSetCreateInput[]) {
  return sets.map((set, index) => ({
    sourceQuizSetId: `set-${index + 1}`,
    dayId: set.sourceId,
    dayNumber: index + 1,
    dayLabel: `Day ${index + 1}`,
    band: "early" as const,
    question: set.questions[0]
  }));
}

describe("MemoryWctQuizStore", () => {
  beforeEach(() => {
    resetMemoryWctQuizStoreForTests();
    resetMemoryWctPopQuizStoreForTests();
  });

  it("atomically creates, replays, and updates standard sets in place", async () => {
    const bookId = "book-prenovice";
    const sets = [v2Draft(1), v2Draft(2)];
    const keys = sets.map((set) => set.lessonKey);
    const admin = new MemoryWctQuizStore({ id: USER_A }, true);
    const learner = new MemoryWctQuizStore({ id: USER_A });
    const popStore = new MemoryWctPopQuizStore({ id: USER_A });

    await expect(admin.syncStandardSets([{ bookId, sets }])).resolves.toEqual({
      createdCount: 2,
      updatedCount: 0,
      unchangedCount: 0,
      resetQuizProgressCount: 0,
      resetPopProgressCount: 0
    });
    const firstStored = await admin.listSetsByLessonKeys(keys);
    const idsBefore = firstStored.map((set) => set.id);
    await learner.submitAttempt(answersFor(firstStored[0], 0));
    await popStore.startAttempt({
      bookId,
      seed: "sync-reset-fixture",
      questions: popQuestions(sets)
    });

    await expect(admin.syncStandardSets([{ bookId, sets }])).resolves.toEqual({
      createdCount: 0,
      updatedCount: 0,
      unchangedCount: 2,
      resetQuizProgressCount: 0,
      resetPopProgressCount: 0
    });
    await expect(learner.getSummaryByLessonKey(keys[0]))
      .resolves.toMatchObject({ latestScore: 5 });
    await expect(popStore.getAttempt(bookId)).resolves.not.toBeNull();

    const changedSets = [{
      ...sets[0],
      sourceHash: "f".repeat(64),
      questions: sets[0].questions.map((question, index) => (
        index === 0 ? { ...question, prompt: `${question.prompt} changed` } : question
      ))
    }, sets[1]];
    await expect(admin.syncStandardSets([{ bookId, sets: changedSets }]))
      .resolves.toEqual({
        createdCount: 0,
        updatedCount: 1,
        unchangedCount: 1,
        resetQuizProgressCount: 1,
        resetPopProgressCount: 1
      });
    expect((await admin.listSetsByLessonKeys(keys)).map((set) => set.id))
      .toEqual(idsBefore);
    await expect(learner.getSummaryByLessonKey(keys[0]))
      .resolves.toMatchObject({ latestScore: null });
    await expect(popStore.getAttempt(bookId)).resolves.toBeNull();
  });

  it("rolls back the full batch and both progress stores when any set is invalid", async () => {
    const firstBookId = "book-prenovice-a";
    const secondBookId = "book-prenovice-b";
    const sets = [v2Draft(1), v2Draft(2)];
    const keys = sets.map((set) => set.lessonKey);
    const admin = new MemoryWctQuizStore({ id: USER_A }, true);
    const learner = new MemoryWctQuizStore({ id: USER_A });
    const popStore = new MemoryWctPopQuizStore({ id: USER_A });
    await admin.syncStandardSets([
      { bookId: firstBookId, sets: [sets[0]] },
      { bookId: secondBookId, sets: [sets[1]] }
    ]);
    const before = await admin.listSetsByLessonKeys(keys);
    await learner.submitAttempt(answersFor(before[0], 0));
    const popAttempt = await popStore.startAttempt({
      bookId: firstBookId,
      seed: "rollback-fixture",
      questions: popQuestions(sets)
    });

    await expect(admin.syncStandardSets([{
      bookId: firstBookId,
      sets: [{ ...sets[0], sourceHash: "e".repeat(64) }]
    }, {
      bookId: secondBookId,
      sets: [{ ...sets[1], sourceKind: "wct_premium" }]
    }])).rejects.toThrow("Standard v2 quiz requires a WCT Day source");

    await expect(admin.listSetsByLessonKeys(keys)).resolves.toEqual(before);
    await expect(learner.getSummaryByLessonKey(keys[0]))
      .resolves.toMatchObject({ latestScore: 5 });
    await expect(popStore.getAttempt(firstBookId)).resolves.toEqual(popAttempt);
  });

  it("rejects non-admin, Premium, and same-hash question collisions without mutation", async () => {
    const admin = new MemoryWctQuizStore({ id: USER_A }, true);
    const learner = new MemoryWctQuizStore({ id: USER_A });
    const set = v2Draft(1);

    await expect(learner.syncStandardSets([{ bookId: "book", sets: [set] }]))
      .rejects.toThrow("requires an admin store");
    await expect(admin.syncStandardSets([{ bookId: "book", sets: [draft()] }]))
      .rejects.toThrow("generator wct-review-v2");
    await admin.syncStandardSets([{ bookId: "book", sets: [set] }]);
    const stored = await admin.getSetByLessonKey(set.lessonKey);

    await expect(admin.syncStandardSets([{ bookId: "book", sets: [{
      ...set,
      questions: set.questions.map((question, index) => (
        index === 0 ? { ...question, prompt: `${question.prompt} collision` } : question
      ))
    }] }])).rejects.toThrow("integrity collision");
    await expect(admin.getSetByLessonKey(set.lessonKey)).resolves.toEqual(stored);
  });

  it("treats a changed immutable source identity as a collision without resets", async () => {
    const bookId = "book-prenovice";
    const set = v2Draft(1);
    const admin = new MemoryWctQuizStore({ id: USER_A }, true);
    const learner = new MemoryWctQuizStore({ id: USER_A });
    const popStore = new MemoryWctPopQuizStore({ id: USER_A });
    await admin.syncStandardSets([{ bookId, sets: [set] }]);
    const stored = await admin.getSetByLessonKey(set.lessonKey);
    if (!stored) throw new Error("missing standard fixture set");
    await learner.submitAttempt(answersFor(stored, 0));
    const popAttempt = await popStore.startAttempt({
      bookId,
      seed: "source-collision-fixture",
      questions: popQuestions([set])
    });

    await expect(admin.syncStandardSets([{ bookId, sets: [{
      ...set,
      sourceId: "different-day-source"
    }] }])).rejects.toThrow("integrity collision");

    await expect(admin.getSetByLessonKey(set.lessonKey)).resolves.toEqual(stored);
    await expect(learner.getSummaryByLessonKey(set.lessonKey))
      .resolves.toMatchObject({ latestScore: 5 });
    await expect(popStore.getAttempt(bookId)).resolves.toEqual(popAttempt);
  });

  it("treats a changed immutable book relation as a collision without resets", async () => {
    const originalBookId = "book-prenovice-a";
    const set = v2Draft(1);
    const admin = new MemoryWctQuizStore({ id: USER_A }, true);
    const learner = new MemoryWctQuizStore({ id: USER_A });
    const popStore = new MemoryWctPopQuizStore({ id: USER_A });
    await admin.syncStandardSets([{ bookId: originalBookId, sets: [set] }]);
    const stored = await admin.getSetByLessonKey(set.lessonKey);
    if (!stored) throw new Error("missing standard fixture set");
    await learner.submitAttempt(answersFor(stored, 0));
    const popAttempt = await popStore.startAttempt({
      bookId: originalBookId,
      seed: "book-collision-fixture",
      questions: popQuestions([set])
    });

    await expect(admin.syncStandardSets([{
      bookId: "book-prenovice-b",
      sets: [set]
    }])).rejects.toThrow("integrity collision");

    await expect(admin.getSetByLessonKey(set.lessonKey)).resolves.toEqual(stored);
    await expect(learner.getSummaryByLessonKey(set.lessonKey))
      .resolves.toMatchObject({ latestScore: 5 });
    await expect(popStore.getAttempt(originalBookId)).resolves.toEqual(popAttempt);
  });

  it("rejects duplicate source IDs within one book before mutation", async () => {
    const first = v2Draft(1);
    const second = { ...v2Draft(2), sourceId: first.sourceId };
    const admin = new MemoryWctQuizStore({ id: USER_A }, true);

    await expect(admin.syncStandardSets([{
      bookId: "book-prenovice",
      sets: [first, second]
    }])).rejects.toThrow("duplicate source IDs");
    await expect(admin.listSetsByLessonKeys([
      first.lessonKey,
      second.lessonKey
    ])).resolves.toEqual([]);
  });

  it("rejects duplicate source IDs across books before mutation", async () => {
    const first = v2Draft(1);
    const second = { ...v2Draft(2), sourceId: first.sourceId };
    const admin = new MemoryWctQuizStore({ id: USER_A }, true);

    await expect(admin.syncStandardSets([{
      bookId: "book-prenovice-a",
      sets: [first]
    }, {
      bookId: "book-prenovice-b",
      sets: [second]
    }])).rejects.toThrow("duplicate source IDs");
    await expect(admin.listSetsByLessonKeys([
      first.lessonKey,
      second.lessonKey
    ])).resolves.toEqual([]);
  });

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
