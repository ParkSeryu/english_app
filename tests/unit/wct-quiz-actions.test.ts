import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MemoryWctQuizStore,
  resetMemoryWctQuizStoreForTests
} from "@/lib/wct-quiz-store/memory-store";
import {
  buildLegacyStandardWctQuizSource
} from "@/lib/wct/quiz/adapters";
import {
  isCurrentStandardWctQuizSet
} from "@/lib/wct/quiz/current-set";
import {
  ensurePremiumWctQuiz
} from "@/lib/wct/quiz/ensure";
import { generateLegacyWctQuizSetDraft } from "@/lib/wct/quiz/generator";
import { buildStandardWctQuizSource } from "@/lib/wct/quiz/standard/source";
import type { WctQuizSet, WctQuizSubmission } from "@/lib/wct/quiz/types";
import { getWctPremiumLesson } from "@/lib/wct/premium-lessons";
import {
  MemoryWctStore,
  resetMemoryWctStoreForTests
} from "@/lib/wct-store/memory-store";
import type { WctBook, WctDay } from "@/lib/wct/types";

const mocks = vi.hoisted(() => ({
  getWctQuizStore: vi.fn(),
  getWctStore: vi.fn(),
  getBook: vi.fn(),
  getDay: vi.fn(),
  getSetById: vi.fn(),
  getSetByLessonKey: vi.fn(),
  requireCurrentUser: vi.fn(),
  submitAttempt: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  requireCurrentUser: mocks.requireCurrentUser
}));

vi.mock("@/lib/wct-quiz-store", () => ({
  getWctQuizStore: mocks.getWctQuizStore
}));

vi.mock("@/lib/wct-store", () => ({
  getWctStore: mocks.getWctStore
}));

const submission = {
  quizSetId: "11111111-1111-4111-8111-111111111111",
  answers: Array.from({ length: 5 }, (_, index) => ({
    questionId: `question-${index + 1}`,
    choiceId: `choice-${index + 1}-1`
  }))
};
const USER_ID = "22222222-2222-4222-8222-222222222222";

function day(overrides: Partial<WctDay> = {}): WctDay {
  return {
    id: "day-1",
    bookId: "book-1",
    dayNumber: 1,
    shortLabel: "가능성 연습",
    displayLabel: "Day 1 (가능성 연습)",
    learningSummary: null,
    sourcePageStart: null,
    sourcePageEnd: null,
    sourceNeedsReview: false,
    concepts: [],
    patterns: Array.from({ length: 5 }, (_, index) => ({
      id: `pattern-${index + 1}`,
      patternText: `can + base verb (${index + 1})`,
      meaningKo: `가능 표현 ${index + 1}`,
      usageNote: "Use can before a base verb.",
      usageSource: "book" as const,
      sourcePage: null,
      sourceNeedsReview: false,
      sortOrder: index,
      examples: [{
        id: `example-${index + 1}`,
        englishText: `I can finish task ${index + 1} today.`,
        meaningKo: `나는 오늘 과제 ${index + 1}를 끝낼 수 있다.`,
        sourcePage: null,
        sourceNeedsReview: false,
        sortOrder: 0
      }]
    })),
    importantNotes: [],
    practicePrompts: [],
    ...overrides
  };
}

function book(target: WctDay): WctBook {
  return {
    id: target.bookId,
    title: "WCT Pattern Book Prenovice",
    levelLabel: "Pre Novice",
    dayCount: 1,
    sortOrder: 1,
    days: [{
      id: target.id,
      bookId: target.bookId,
      dayNumber: target.dayNumber,
      shortLabel: target.shortLabel,
      displayLabel: target.displayLabel,
      sourcePageStart: target.sourcePageStart,
      sourcePageEnd: target.sourcePageEnd,
      sourceNeedsReview: target.sourceNeedsReview
    }]
  };
}

function storedV2(targetBook: WctBook, targetDay: WctDay): WctQuizSet {
  return {
    id: submission.quizSetId,
    ownerId: "22222222-2222-4222-8222-222222222222",
    lessonKey: "wct-book:wct-pattern-book-prenovice:day:1",
    sourceKind: "wct_day",
    sourceId: targetDay.id,
    generatorVersion: "wct-review-v2",
    sourceHash: buildStandardWctQuizSource(targetBook, targetDay).sourceHash,
    questions: [],
    createdAt: "2026-07-28T00:00:00.000Z"
  };
}

function storedV1(
  targetBook: WctBook,
  targetDay: WctDay,
  allDays: WctDay[]
): WctQuizSet {
  return {
    ...generateLegacyWctQuizSetDraft(
      buildLegacyStandardWctQuizSource(targetBook, targetDay, allDays)
    ),
    id: submission.quizSetId,
    ownerId: "22222222-2222-4222-8222-222222222222",
    createdAt: "2026-07-28T00:00:00.000Z"
  };
}

function submissionFor(set: WctQuizSet): WctQuizSubmission {
  return {
    quizSetId: set.id,
    answers: set.questions.map((question) => ({
      questionId: question.id,
      choiceId: question.correctChoiceId
    }))
  };
}

function standardImportInput(
  duplicateAction: "create" | "replace" = "create"
) {
  return {
    idempotencyKey: `stored-standard-${duplicateAction}`,
    payloadHash: `stored-standard-${duplicateAction}-hash`,
    book: {
      title: "WCT Pattern Book Prenovice",
      levelLabel: "Pre Novice"
    },
    days: [{
      dayNumber: 1,
      shortLabel: duplicateAction === "create" ? "가능성 연습" : "변경된 가능성 연습",
      duplicateAction,
      concepts: [],
      patterns: Array.from({ length: 5 }, (_, index) => ({
        patternText: `can + base verb (${index + 1})`,
        meaningKo: `가능 표현 ${index + 1}`,
        usageNote: "Use can before a base verb.",
        usageSource: "book" as const,
        examples: [{
          englishText: `I can finish task ${index + 1} today.${
            duplicateAction === "replace" ? " Changed." : ""
          }`,
          meaningKo: `나는 오늘 과제 ${index + 1}를 끝낼 수 있다.`
        }]
      })),
      importantNotes: [],
      practicePrompts: []
    }]
  };
}

async function seedStoredStandard(stale: boolean) {
  const wctStore = new MemoryWctStore({ id: USER_ID });
  const imported = await wctStore.importApprovedBatch(standardImportInput());
  const book = await wctStore.getBook(imported.bookId);
  if (!book) throw new Error("missing stored standard book");
  const targetDay = await wctStore.getDay(book.days[0].id);
  if (!targetDay) throw new Error("missing stored standard Day");
  const admin = new MemoryWctQuizStore({ id: USER_ID }, true);
  const set = await admin.createSetIfMissing(generateLegacyWctQuizSetDraft(
    buildLegacyStandardWctQuizSource(book, targetDay, [targetDay])
  ));
  if (stale) {
    await wctStore.importApprovedBatch(standardImportInput("replace"));
  }
  return {
    book,
    day: targetDay,
    learner: new MemoryWctQuizStore({ id: USER_ID }),
    set,
    wctStore
  };
}

async function seedStoredPremium() {
  const lesson = getWctPremiumLesson("day-1");
  if (!lesson) throw new Error("missing Premium fixture lesson");
  const admin = new MemoryWctQuizStore({ id: USER_ID }, true);
  const set = await ensurePremiumWctQuiz(admin, lesson);
  return {
    learner: new MemoryWctQuizStore({ id: USER_ID }),
    set
  };
}

describe("isCurrentStandardWctQuizSet", () => {
  it("dispatches target-Day v2 and book-wide legacy v1 source hashes", () => {
    const currentDay = day();
    const currentBook = book(currentDay);
    const allDays = [currentDay];
    const currentV2 = storedV2(currentBook, currentDay);
    const currentV1 = storedV1(currentBook, currentDay, allDays);
    const changedDay = day({
      patterns: currentDay.patterns.map((pattern, index) => (
        index === 0
          ? {
              ...pattern,
              examples: pattern.examples.map((example) => ({
                ...example,
                englishText: `${example.englishText} Changed.`
              }))
            }
          : pattern
      ))
    });

    expect(isCurrentStandardWctQuizSet({
      book: currentBook,
      day: currentDay,
      allDays,
      quizSet: currentV2
    })).toBe(true);
    expect(isCurrentStandardWctQuizSet({
      book: currentBook,
      day: changedDay,
      allDays: [changedDay],
      quizSet: currentV2
    })).toBe(false);
    expect(isCurrentStandardWctQuizSet({
      book: currentBook,
      day: currentDay,
      allDays,
      quizSet: currentV1
    })).toBe(true);
  });
});

describe("submitWctQuizAttemptAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMemoryWctQuizStoreForTests();
    resetMemoryWctStoreForTests();
    mocks.requireCurrentUser.mockResolvedValue({
      id: USER_ID,
      email: "learner@example.com"
    });
    mocks.getWctQuizStore.mockReturnValue({
      getSetById: mocks.getSetById,
      getSetByLessonKey: mocks.getSetByLessonKey,
      submitAttempt: mocks.submitAttempt
    });
    mocks.getWctStore.mockReturnValue({
      getBook: mocks.getBook,
      getDay: mocks.getDay
    });
  });

  it("keeps Premium submissions without source context unchanged", async () => {
    mocks.getSetById.mockResolvedValue({ sourceKind: "wct_premium" });
    mocks.submitAttempt.mockResolvedValue({
      score: 4,
      total: 5,
      completedAt: "2026-07-28T00:00:00Z"
    });
    const { submitWctQuizAttemptAction } = await import(
      "@/app/lessons/quiz-actions"
    );

    await expect(submitWctQuizAttemptAction(submission)).resolves.toEqual({
      ok: true,
      score: 4,
      total: 5,
      completedAt: "2026-07-28T00:00:00Z"
    });
    expect(mocks.getWctStore).not.toHaveBeenCalled();
    expect(mocks.getSetById).toHaveBeenCalledWith(submission.quizSetId);
    expect(mocks.submitAttempt).toHaveBeenCalledWith(submission);
  });

  it("reloads and validates trusted standard context before store scoring", async () => {
    const currentDay = day();
    const currentBook = book(currentDay);
    const set = storedV2(currentBook, currentDay);
    mocks.getSetById.mockResolvedValue(set);
    mocks.getBook.mockResolvedValue(currentBook);
    mocks.getDay.mockResolvedValue(currentDay);
    mocks.getSetByLessonKey.mockResolvedValue(set);
    mocks.submitAttempt.mockResolvedValue({
      score: 5,
      total: 5,
      completedAt: "2026-07-28T00:00:00Z"
    });
    const { submitWctQuizAttemptAction } = await import(
      "@/app/lessons/quiz-actions"
    );
    const standardSubmission = {
      ...submission,
      sourceContext: { bookId: currentBook.id, dayId: currentDay.id }
    };

    await expect(submitWctQuizAttemptAction(standardSubmission))
      .resolves.toMatchObject({ ok: true, score: 5 });
    expect(mocks.submitAttempt).toHaveBeenCalledWith(submission);
  });

  it.each(["wct-review-v1", "wct-review-v2"] as const)(
    "rejects a stale %s standard set before submitAttempt",
    async (version) => {
      const currentDay = day();
      const changedDay = day({
        shortLabel: "변경된 수업",
        patterns: currentDay.patterns.map((pattern, index) => (
          index === 0
            ? {
                ...pattern,
                examples: pattern.examples.map((example) => ({
                  ...example,
                  englishText: `${example.englishText} Changed.`
                }))
              }
            : pattern
        ))
      });
      const currentBook = book(changedDay);
      const staleSet = version === "wct-review-v2"
        ? storedV2(book(currentDay), currentDay)
        : storedV1(book(currentDay), currentDay, [currentDay]);
      mocks.getSetById.mockResolvedValue(staleSet);
      mocks.getBook.mockResolvedValue(currentBook);
      mocks.getDay.mockImplementation(async (id: string) => (
        id === changedDay.id ? changedDay : null
      ));
      mocks.getSetByLessonKey.mockResolvedValue(staleSet);
      const { submitWctQuizAttemptAction } = await import(
        "@/app/lessons/quiz-actions"
      );

      await expect(submitWctQuizAttemptAction({
        ...submission,
        sourceContext: { bookId: currentBook.id, dayId: changedDay.id }
      })).resolves.toEqual({
        ok: false,
        message: "퀴즈가 변경되어 다시 준비해야 해요."
      });
      expect(mocks.submitAttempt).not.toHaveBeenCalled();
    }
  );

  it("rejects invalid answers before authentication", async () => {
    const { submitWctQuizAttemptAction } = await import(
      "@/app/lessons/quiz-actions"
    );

    await expect(submitWctQuizAttemptAction({
      ...submission,
      answers: submission.answers.slice(0, 4)
    })).resolves.toEqual({
      ok: false,
      message: "답안을 확인해 주세요."
    });
    expect(mocks.requireCurrentUser).not.toHaveBeenCalled();
    expect(mocks.submitAttempt).not.toHaveBeenCalled();
  });

  it("returns a retryable message when saving fails", async () => {
    mocks.getSetById.mockResolvedValue({ sourceKind: "wct_premium" });
    mocks.submitAttempt.mockRejectedValue(new Error("database unavailable"));
    const { submitWctQuizAttemptAction } = await import(
      "@/app/lessons/quiz-actions"
    );

    await expect(submitWctQuizAttemptAction(submission)).resolves.toEqual({
      ok: false,
      message: "결과를 저장하지 못했어요. 다시 시도해 주세요."
    });
  });

  it.each([
    { label: "current", stale: false },
    { label: "stale", stale: true }
  ])("rejects omitted context on a real stored $label standard set", async ({ stale }) => {
    const fixture = await seedStoredStandard(stale);
    mocks.getWctQuizStore.mockReturnValue(fixture.learner);
    mocks.getWctStore.mockReturnValue(fixture.wctStore);
    const { submitWctQuizAttemptAction } = await import(
      "@/app/lessons/quiz-actions"
    );

    await expect(submitWctQuizAttemptAction(submissionFor(fixture.set)))
      .resolves.toEqual({
        ok: false,
        message: "퀴즈가 변경되어 다시 준비해야 해요."
      });
    await expect(fixture.learner.getSummaryByLessonKey(fixture.set.lessonKey))
      .resolves.toMatchObject({ latestScore: null });
  });

  it("rejects forged standard context on a real stored Premium set", async () => {
    const standard = await seedStoredStandard(false);
    const premium = await seedStoredPremium();
    mocks.getWctQuizStore.mockReturnValue(premium.learner);
    mocks.getWctStore.mockReturnValue(standard.wctStore);
    const { submitWctQuizAttemptAction } = await import(
      "@/app/lessons/quiz-actions"
    );

    await expect(submitWctQuizAttemptAction({
      ...submissionFor(premium.set),
      sourceContext: { bookId: standard.book.id, dayId: standard.day.id }
    })).resolves.toEqual({
      ok: false,
      message: "퀴즈가 변경되어 다시 준비해야 해요."
    });
    await expect(premium.learner.getSummaryByLessonKey(premium.set.lessonKey))
      .resolves.toMatchObject({ latestScore: null });
  });

  it("submits a real stored Premium set without source context", async () => {
    const premium = await seedStoredPremium();
    mocks.getWctQuizStore.mockReturnValue(premium.learner);
    const { submitWctQuizAttemptAction } = await import(
      "@/app/lessons/quiz-actions"
    );

    await expect(submitWctQuizAttemptAction(submissionFor(premium.set)))
      .resolves.toMatchObject({ ok: true, score: 5, total: 5 });
    await expect(premium.learner.getSummaryByLessonKey(premium.set.lessonKey))
      .resolves.toMatchObject({ latestScore: 5 });
  });

  it("rejects context that does not match a real stored standard set", async () => {
    const fixture = await seedStoredStandard(false);
    mocks.getWctQuizStore.mockReturnValue(fixture.learner);
    mocks.getWctStore.mockReturnValue(fixture.wctStore);
    const { submitWctQuizAttemptAction } = await import(
      "@/app/lessons/quiz-actions"
    );

    await expect(submitWctQuizAttemptAction({
      ...submissionFor(fixture.set),
      sourceContext: { bookId: fixture.book.id, dayId: "missing-day" }
    })).resolves.toEqual({
      ok: false,
      message: "퀴즈가 변경되어 다시 준비해야 해요."
    });
    await expect(fixture.learner.getSummaryByLessonKey(fixture.set.lessonKey))
      .resolves.toMatchObject({ latestScore: null });
  });
});
