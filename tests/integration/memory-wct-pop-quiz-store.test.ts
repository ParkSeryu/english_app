import { beforeEach, describe, expect, it } from "vitest";

import {
  MemoryWctPopQuizStore,
  resetMemoryWctPopQuizStoreForTests
} from "@/lib/wct-pop-quiz-store/memory-store";
import type { WctPopQuizQuestion } from "@/lib/wct/pop-quiz/types";

const OWNER_A = "00000000-0000-4000-8000-000000000001";
const OWNER_B = "00000000-0000-4000-8000-000000000002";
const BOOK_ID = "00000000-0000-4000-8000-000000000010";

function questions(): WctPopQuizQuestion[] {
  const groups = [
    ["early", "translation", 4],
    ["early", "pattern", 3],
    ["middle", "translation", 4],
    ["middle", "pattern", 3],
    ["late", "translation", 4],
    ["late", "pattern", 2]
  ] as const;
  let index = 0;

  return groups.flatMap(([band, kind, count]) => Array.from(
    { length: count },
    () => {
      index += 1;
      const dayNumber = Math.ceil(index / 2);
      const questionId = `question-${index}`;
      return {
        sourceQuizSetId: `set-${dayNumber}`,
        dayId: `day-${dayNumber}`,
        dayNumber,
        dayLabel: `Day ${dayNumber}`,
        band,
        question: {
          id: questionId,
          kind,
          prompt: `Prompt ${index}`,
          choices: [0, 1, 2, 3].map((choiceIndex) => ({
            id: `${questionId}-choice-${choiceIndex + 1}`,
            text: `Choice ${choiceIndex + 1}`
          })),
          correctChoiceId: `${questionId}-choice-1`,
          explanation: `Explanation ${index}`
        }
      };
    }
  ));
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
      completedAt: null
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

  it("completes with one incorrect Day entry per day and replaces it on retake", async () => {
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
        choiceId: item.question.choices[index < 2 ? 1 : 0].id
      });
    }
    await expect(ownerA.completeAttempt({
      bookId: BOOK_ID,
      attemptId: first.attemptId
    })).resolves.toMatchObject({
      score: 18,
      total: 20,
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
});