import { beforeEach, describe, expect, it } from "vitest";

import {
  MemoryWctPopQuizStore,
  resetMemoryWctPopQuizStoreForTests
} from "@/lib/wct-pop-quiz-store/memory-store";
import type { WctPopQuizQuestion } from "@/lib/wct/pop-quiz/types";
import { WctPopQuizRestartRequiredError } from "@/lib/wct/pop-quiz/types";

const OWNER_A = "00000000-0000-4000-8000-000000000001";
const OWNER_B = "00000000-0000-4000-8000-000000000002";
const BOOK_ID = "00000000-0000-4000-8000-000000000010";

function questions(dayCount: 16 | 28 = 16): WctPopQuizQuestion[] {
  return Array.from({ length: dayCount }, (_, index) => {
    const dayNumber = index + 1;
    const questionId = `question-${dayNumber}`;
    return {
      sourceQuizSetId: `set-${dayNumber}`,
      dayId: `day-${dayNumber}`,
      dayNumber,
      dayLabel: `Day ${dayNumber}`,
      band: dayNumber <= Math.ceil(dayCount / 3)
        ? "early"
        : dayNumber <= Math.ceil((dayCount * 2) / 3)
          ? "middle"
          : "late",
      question: {
        id: questionId,
        kind: dayNumber % 2 === 0 ? "pattern" : "translation",
        prompt: `Prompt ${dayNumber}`,
        choices: [0, 1, 2, 3].map((choiceIndex) => ({
          id: `${questionId}-choice-${choiceIndex + 1}`,
          text: `Choice ${choiceIndex + 1}`
        })),
        correctChoiceId: `${questionId}-choice-1`,
        explanation: `Explanation ${dayNumber}`
      }
    };
  });
}

describe("MemoryWctPopQuizStore", () => {
  beforeEach(() => resetMemoryWctPopQuizStoreForTests());

  it("starts one owner-scoped attempt and resumes it", async () => {
    const ownerA = new MemoryWctPopQuizStore({ id: OWNER_A });
    const started = await ownerA.startAttempt({
      bookId: BOOK_ID,
      seed: "seed-a",
      questions: questions()
    });
    const resumed = await ownerA.startAttempt({
      bookId: BOOK_ID,
      seed: "seed-replacement",
      questions: questions()
    });

    expect(resumed).toEqual(started);
    await expect(ownerA.getSummary(BOOK_ID)).resolves.toMatchObject({
      attemptId: started.attemptId,
      status: "in_progress",
      currentIndex: 0,
      latestScore: null,
      completedAt: null,
      total: 16
    });
    await expect(new MemoryWctPopQuizStore({ id: OWNER_B }).getAttempt(BOOK_ID))
      .resolves.toBeNull();
  });

  it("replays the same confirmed answer but rejects a changed answer", async () => {
    const ownerA = new MemoryWctPopQuizStore({ id: OWNER_A });
    const quizQuestions = questions();
    const started = await ownerA.startAttempt({
      bookId: BOOK_ID,
      seed: "seed-a",
      questions: quizQuestions
    });
    const input = {
      bookId: BOOK_ID,
      attemptId: started.attemptId,
      questionId: quizQuestions[0].question.id,
      choiceId: quizQuestions[0].question.choices[1].id
    };

    const confirmed = await ownerA.confirmAnswer(input);

    await expect(ownerA.confirmAnswer(input)).resolves.toEqual(confirmed);
    await expect(ownerA.confirmAnswer({
      ...input,
      choiceId: quizQuestions[0].question.choices[0].id
    })).rejects.toThrow("already confirmed");
    await expect(ownerA.getAttempt(BOOK_ID)).resolves.toMatchObject({
      currentIndex: 1,
      status: "in_progress"
    });
  });

  it("completes a 16-question attempt with its dynamic total and replaces it on retake", async () => {
    const ownerA = new MemoryWctPopQuizStore({ id: OWNER_A });
    const quizQuestions = questions();
    const first = await ownerA.startAttempt({
      bookId: BOOK_ID,
      seed: "seed-a",
      questions: quizQuestions
    });

    for (const [index, item] of quizQuestions.entries()) {
      await ownerA.confirmAnswer({
        bookId: BOOK_ID,
        attemptId: first.attemptId,
        questionId: item.question.id,
        choiceId: item.question.choices[index === 0 ? 1 : 0].id
      });
    }
    await expect(ownerA.completeAttempt({
      bookId: BOOK_ID,
      attemptId: first.attemptId
    })).resolves.toMatchObject({
      score: 15,
      total: 16,
      incorrectDays: [{ dayId: "day-1", dayNumber: 1, dayLabel: "Day 1" }],
      completedAt: expect.any(String)
    });

    const retake = await ownerA.startAttempt({
      bookId: BOOK_ID,
      seed: "seed-b",
      questions: quizQuestions
    });
    expect(retake).toMatchObject({
      bookId: BOOK_ID,
      seed: "seed-b",
      currentIndex: 0,
      status: "in_progress",
      latestScore: null,
      incorrectDays: [],
      completedAt: null
    });
    expect(retake.attemptId).not.toBe(first.attemptId);
  });

  it("confirms every question in a 28-question attempt", async () => {
    const ownerA = new MemoryWctPopQuizStore({ id: OWNER_A });
    const quizQuestions = questions(28);
    const started = await ownerA.startAttempt({
      bookId: BOOK_ID,
      seed: "seed-a",
      questions: quizQuestions
    });

    for (const item of quizQuestions) {
      await ownerA.confirmAnswer({
        bookId: BOOK_ID,
        attemptId: started.attemptId,
        questionId: item.question.id,
        choiceId: item.question.choices[0].id
      });
    }

    await expect(ownerA.getAttempt(BOOK_ID)).resolves.toMatchObject({
      currentIndex: 28,
      status: "in_progress"
    });
  });

  it("throws the typed restart error when a referenced attempt was reset", async () => {
    const ownerA = new MemoryWctPopQuizStore({ id: OWNER_A });

    await expect(ownerA.confirmAnswer({
      bookId: BOOK_ID,
      attemptId: "00000000-0000-4000-8000-000000000099",
      questionId: "question-1",
      choiceId: "question-1-choice-1"
    })).rejects.toBeInstanceOf(WctPopQuizRestartRequiredError);
    await expect(ownerA.completeAttempt({
      bookId: BOOK_ID,
      attemptId: "00000000-0000-4000-8000-000000000099"
    })).rejects.toBeInstanceOf(WctPopQuizRestartRequiredError);
  });
});
