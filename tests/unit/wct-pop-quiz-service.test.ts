import { describe, expect, it, vi } from "vitest";

import { standardWctLessonKey } from "@/lib/wct/quiz/keys";
import type { WctQuizSet } from "@/lib/wct/quiz/types";
import type { WctBook } from "@/lib/wct/types";

function createBook(overrides: Partial<Pick<WctBook, "id" | "title" | "levelLabel">> = {}): WctBook {
  const id = overrides.id ?? "11111111-1111-4111-8111-111111111111";
  return {
    id,
    title: overrides.title ?? "WCT Pattern book Prenovice",
    levelLabel: overrides.levelLabel === undefined ? "Pre Novice" : overrides.levelLabel,
    dayCount: 16,
    sortOrder: 1,
    days: Array.from({ length: 16 }, (_, index) => ({
      id: `day-${index + 1}`,
      bookId: id,
      dayNumber: index + 1,
      shortLabel: `Day ${index + 1}`,
      displayLabel: `Day ${index + 1}`,
      sourcePageStart: null,
      sourcePageEnd: null,
      sourceNeedsReview: false
    }))
  };
}

function createSets(book: WctBook): WctQuizSet[] {
  return book.days.map((day) => ({
    id: `set-${day.id}`,
    ownerId: "22222222-2222-4222-8222-222222222222",
    lessonKey: standardWctLessonKey(book.title, day.dayNumber),
    sourceKind: "wct_day",
    sourceId: day.id,
    generatorVersion: "wct-review-v1",
    sourceHash: `hash-${day.id}`,
    createdAt: "2026-08-03T00:00:00Z",
    questions: (["translation", "translation", "pattern", "pattern"] as const).map((kind, index) => {
      const questionId = `${day.id}-${kind}-${index + 1}`;
      return {
        id: questionId,
        kind,
        prompt: `Prompt ${questionId}`,
        choices: [1, 2, 3, 4].map((choice) => ({
          id: `${questionId}-choice-${choice}`,
          text: `Choice ${choice}`
        })),
        correctChoiceId: `${questionId}-choice-1`,
        explanation: `Explanation ${questionId}`
      };
    })
  }));
}

function attempt(bookId: string, status: "in_progress" | "completed" = "in_progress") {
  return {
    attemptId: "33333333-3333-4333-8333-333333333333",
    bookId,
    seed: "previous-seed",
    questions: [],
    answers: [],
    currentIndex: status === "completed" ? 20 : 3,
    status,
    latestScore: status === "completed" ? 18 : null,
    incorrectDays: [],
    startedAt: "2026-08-03T00:00:00Z",
    completedAt: status === "completed" ? "2026-08-03T00:10:00Z" : null
  };
}

async function service() {
  return import("@/lib/wct/pop-quiz/service");
}

describe("WCT Pop Quiz service", () => {
  it("starts an eligible book from every matching Day quiz set", async () => {
    const book = createBook();
    const listSetsByLessonKeys = vi.fn().mockResolvedValue(createSets(book));
    const startAttempt = vi.fn(async (input) => ({ ...attempt(book.id), ...input }));
    const { startWctPopQuiz } = await service();

    const started = await startWctPopQuiz({
      wctStore: { getBook: vi.fn().mockResolvedValue(book) },
      wctQuizStore: { listSetsByLessonKeys },
      wctPopQuizStore: { getAttempt: vi.fn().mockResolvedValue(null), startAttempt },
      createSeed: () => "fresh-seed"
    }, { bookId: book.id, mode: "start" });

    expect(listSetsByLessonKeys).toHaveBeenCalledWith(
      book.days.map((day) => standardWctLessonKey(book.title, day.dayNumber))
    );
    expect(started.questions).toHaveLength(20);
    expect(startAttempt).toHaveBeenCalledWith(expect.objectContaining({
      bookId: book.id,
      seed: "fresh-seed",
      questions: expect.any(Array)
    }));
  });

  it("rejects missing, foreign, Premium, and mismatched title-level books", async () => {
    const { startWctPopQuiz } = await service();
    const baseDeps = {
      wctQuizStore: { listSetsByLessonKeys: vi.fn() },
      wctPopQuizStore: { getAttempt: vi.fn(), startAttempt: vi.fn() }
    };

    for (const book of [
      null,
      createBook({ title: "Premium", levelLabel: "Premium" }),
      createBook({ title: "Prenovice", levelLabel: "Novice" })
    ]) {
      await expect(startWctPopQuiz({
        ...baseDeps,
        wctStore: { getBook: vi.fn().mockResolvedValue(book) }
      }, { bookId: "11111111-1111-4111-8111-111111111111", mode: "start" }))
        .rejects.toThrow("Pop Quiz is available for Prenovice and Novice only");
    }
  });

  it("returns an in-progress attempt without rebuilding questions", async () => {
    const book = createBook();
    const existing = attempt(book.id);
    const getAttempt = vi.fn().mockResolvedValue(existing);
    const { startWctPopQuiz } = await service();

    await expect(startWctPopQuiz({
      wctStore: { getBook: vi.fn().mockResolvedValue(book) },
      wctQuizStore: { listSetsByLessonKeys: vi.fn() },
      wctPopQuizStore: { getAttempt, startAttempt: vi.fn() }
    }, { bookId: book.id, mode: "start" })).resolves.toEqual(existing);
  });

  it("uses a fresh seed and prior signature when replacing a completed attempt", async () => {
    const book = createBook();
    const previous = {
      ...attempt(book.id, "completed"),
      questions: createSets(book).flatMap((set, setIndex) => set.questions.slice(0, setIndex === 0 ? 4 : 0)).map((question, index) => ({
        sourceQuizSetId: "set-day-1",
        dayId: "day-1",
        dayNumber: 1,
        dayLabel: "Day 1",
        band: index < 4 ? "early" as const : "middle" as const,
        question
      }))
    };
    const selectQuestions = vi.fn().mockReturnValue(createSets(book).flatMap((set) => set.questions).slice(0, 20).map((question, index) => ({
      sourceQuizSetId: `set-day-${Math.floor(index / 4) + 1}`,
      dayId: `day-${Math.floor(index / 4) + 1}`,
      dayNumber: Math.floor(index / 4) + 1,
      dayLabel: `Day ${Math.floor(index / 4) + 1}`,
      band: index < 7 ? "early" as const : index < 14 ? "middle" as const : "late" as const,
      question
    })));
    const { startWctPopQuiz } = await service();

    await startWctPopQuiz({
      wctStore: { getBook: vi.fn().mockResolvedValue(book) },
      wctQuizStore: { listSetsByLessonKeys: vi.fn().mockResolvedValue(createSets(book)) },
      wctPopQuizStore: { getAttempt: vi.fn().mockResolvedValue(previous), startAttempt: vi.fn(async (input) => ({ ...previous, ...input })) },
      createSeed: () => "replacement-seed",
      selectQuestions
    }, { bookId: book.id, mode: "retake" });

    expect(selectQuestions).toHaveBeenCalledWith(expect.objectContaining({
      seed: "replacement-seed",
      previousSignature: "set-day-1:day-1-pattern-3|set-day-1:day-1-pattern-4|set-day-1:day-1-translation-1|set-day-1:day-1-translation-2"
    }));
  });
});
