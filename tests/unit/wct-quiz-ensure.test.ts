import { beforeEach, describe, expect, it } from "vitest";

import type { WctQuizStore } from "@/lib/wct-quiz-store/contract";
import {
  MemoryWctQuizStore,
  resetMemoryWctQuizStoreForTests
} from "@/lib/wct-quiz-store/memory-store";
import type {
  WctStandardQuizBookSync,
  WctStandardQuizSyncResult
} from "@/lib/wct/quiz/types";
import {
  ensureImportedWctQuizzes,
  ensurePremiumWctQuiz
} from "@/lib/wct/quiz/ensure";
import {
  buildLegacyStandardWctQuizSource
} from "@/lib/wct/quiz/adapters";
import {
  generateLegacyWctQuizSetDraft
} from "@/lib/wct/quiz/generator";
import { premiumWctLessonKey, standardWctLessonKey } from "@/lib/wct/quiz/keys";
import {
  MemoryWctStore,
  resetMemoryWctStoreForTests
} from "@/lib/wct-store/memory-store";
import { getWctPremiumLesson } from "@/lib/wct/premium-lessons";
import type {
  WctApprovedImportInput,
  WctBook,
  WctDay,
  WctImportResult
} from "@/lib/wct/types";

const USER_ID = "00000000-0000-4000-8000-000000000001";

function completeImportInput(): WctApprovedImportInput {
  return {
    idempotencyKey: "quiz-ensure-complete-v1",
    payloadHash: "quiz-ensure-complete-hash-v1",
    book: {
      title: "WCT Pattern Book Prenovice",
      levelLabel: "Pre Novice"
    },
    days: Array.from({ length: 16 }, (_, dayIndex) => {
      const dayNumber = dayIndex + 1;
      return {
        dayNumber,
        shortLabel: `가능성 연습 ${dayNumber}`,
        duplicateAction: "create" as const,
        concepts: [],
        patterns: Array.from({ length: 5 }, (_, patternIndex) => {
          const letter = String.fromCharCode(65 + patternIndex);
          return {
            patternText: `can + base verb (${letter})`,
            meaningKo: `가능 표현 ${dayNumber}-${letter}`,
            usageNote: "Use can before a base verb.",
            usageSource: "book" as const,
            examples: [{
              englishText: `I can finish task ${dayNumber}-${letter} today.`,
              meaningKo: `나는 오늘 과제 ${dayNumber}-${letter}를 끝낼 수 있다.`
            }]
          };
        }),
        importantNotes: [],
        practicePrompts: []
      };
    })
  };
}

async function loadCompleteBook(store: MemoryWctStore, result: WctImportResult) {
  const book = await store.getBook(result.bookId);
  if (!book) throw new Error("missing fixture book");
  const days = await Promise.all(book.days.map((day) => store.getDay(day.id)));
  if (days.some((day) => day === null)) throw new Error("missing fixture Day");
  return { book, days: days as WctDay[] };
}

async function seedLegacySets(
  store: MemoryWctQuizStore,
  book: WctBook,
  days: WctDay[]
) {
  for (const day of days) {
    await store.createSetIfMissing(generateLegacyWctQuizSetDraft(
      buildLegacyStandardWctQuizSource(book, day, days)
    ));
  }
}

class CountingQuizStore implements WctQuizStore {
  syncCalls: WctStandardQuizBookSync[][] = [];

  constructor(
    private readonly delegate: WctQuizStore,
    private readonly failure: Error | null = null
  ) {}

  getSetByLessonKey: WctQuizStore["getSetByLessonKey"] = (key) => (
    this.delegate.getSetByLessonKey(key)
  );
  listSetsByLessonKeys: WctQuizStore["listSetsByLessonKeys"] = (keys) => (
    this.delegate.listSetsByLessonKeys(keys)
  );
  getSummaryByLessonKey: WctQuizStore["getSummaryByLessonKey"] = (key) => (
    this.delegate.getSummaryByLessonKey(key)
  );
  createSetIfMissing: WctQuizStore["createSetIfMissing"] = (input) => (
    this.delegate.createSetIfMissing(input)
  );
  submitAttempt: WctQuizStore["submitAttempt"] = (input) => (
    this.delegate.submitAttempt(input)
  );

  async syncStandardSets(
    books: WctStandardQuizBookSync[]
  ): Promise<WctStandardQuizSyncResult> {
    this.syncCalls.push(structuredClone(books));
    if (this.failure) throw this.failure;
    return this.delegate.syncStandardSets(books);
  }
}

describe("WCT quiz ensure", () => {
  beforeEach(() => {
    resetMemoryWctStoreForTests();
    resetMemoryWctQuizStoreForTests();
  });

  it("generates every Day before one atomic sync and replays all-v2 unchanged", async () => {
    const wctStore = new MemoryWctStore({ id: USER_ID });
    const result = await wctStore.importApprovedBatch(completeImportInput());
    const quizStore = new CountingQuizStore(
      new MemoryWctQuizStore({ id: USER_ID }, true)
    );

    await expect(ensureImportedWctQuizzes(wctStore, quizStore, result))
      .resolves.toMatchObject({
        status: "synced",
        createdCount: 16,
        updatedCount: 0,
        unchangedCount: 0
      });
    expect(quizStore.syncCalls).toHaveLength(1);
    expect(quizStore.syncCalls[0]).toHaveLength(1);
    expect(quizStore.syncCalls[0][0]).toMatchObject({
      bookId: result.bookId,
      sets: expect.arrayContaining([
        expect.objectContaining({ generatorVersion: "wct-review-v2" })
      ])
    });
    expect(quizStore.syncCalls[0][0].sets).toHaveLength(16);

    await expect(ensureImportedWctQuizzes(wctStore, quizStore, result))
      .resolves.toMatchObject({
        status: "synced",
        createdCount: 0,
        updatedCount: 0,
        unchangedCount: 16
      });
    expect(quizStore.syncCalls).toHaveLength(2);
  });

  it("keeps the committed source readable and all quiz state untouched when preflight fails", async () => {
    const input = completeImportInput();
    input.days[6] = { ...input.days[6], sourceNeedsReview: true };
    const wctStore = new MemoryWctStore({ id: USER_ID });
    const result = await wctStore.importApprovedBatch(input);
    const quizStore = new CountingQuizStore(
      new MemoryWctQuizStore({ id: USER_ID }, true)
    );
    const { book } = await loadCompleteBook(wctStore, result);

    await expect(ensureImportedWctQuizzes(wctStore, quizStore, result))
      .rejects.toThrow(/Prenovice.*Day 7.*approved target-Day source/);
    expect(quizStore.syncCalls).toHaveLength(0);
    await expect(wctStore.getDay(book.days[6].id)).resolves.toMatchObject({
      dayNumber: 7,
      sourceNeedsReview: true
    });
    await expect(quizStore.listSetsByLessonKeys(book.days.map((day) => (
      standardWctLessonKey(book.title, day.dayNumber)
    )))).resolves.toEqual([]);
  });

  it("defers a complete all-v1 inventory without generation or progress reset", async () => {
    const wctStore = new MemoryWctStore({ id: USER_ID });
    const result = await wctStore.importApprovedBatch(completeImportInput());
    const { book, days } = await loadCompleteBook(wctStore, result);
    const admin = new MemoryWctQuizStore({ id: USER_ID }, true);
    const learner = new MemoryWctQuizStore({ id: USER_ID });
    await seedLegacySets(admin, book, days);
    const first = await admin.getSetByLessonKey(
      standardWctLessonKey(book.title, 1)
    );
    if (!first) throw new Error("missing legacy fixture set");
    await learner.submitAttempt({
      quizSetId: first.id,
      answers: first.questions.map((question) => ({
        questionId: question.id,
        choiceId: question.correctChoiceId
      }))
    });
    const quizStore = new CountingQuizStore(admin);

    await expect(ensureImportedWctQuizzes(wctStore, quizStore, result))
      .resolves.toEqual({ status: "deferred_v1_release" });
    expect(quizStore.syncCalls).toHaveLength(0);
    await expect(learner.getSummaryByLessonKey(first.lessonKey))
      .resolves.toMatchObject({ latestScore: 5 });
  });

  it("fails closed on partial or mixed inventories without calling sync", async () => {
    const wctStore = new MemoryWctStore({ id: USER_ID });
    const result = await wctStore.importApprovedBatch(completeImportInput());
    const { book, days } = await loadCompleteBook(wctStore, result);
    const admin = new MemoryWctQuizStore({ id: USER_ID }, true);
    const firstLegacy = generateLegacyWctQuizSetDraft(
      buildLegacyStandardWctQuizSource(book, days[0], days)
    );
    await admin.createSetIfMissing(firstLegacy);
    const quizStore = new CountingQuizStore(admin);

    await expect(ensureImportedWctQuizzes(wctStore, quizStore, result))
      .rejects.toThrow(/partial or mixed quiz inventory/);
    expect(quizStore.syncCalls).toHaveLength(0);
    await expect(admin.getSetByLessonKey(firstLegacy.lessonKey))
      .resolves.toMatchObject({ generatorVersion: "wct-review-v1" });
  });

  it("reports an atomic sync failure with Day context and leaves generated input unstored", async () => {
    const wctStore = new MemoryWctStore({ id: USER_ID });
    const result = await wctStore.importApprovedBatch(completeImportInput());
    const delegate = new MemoryWctQuizStore({ id: USER_ID }, true);
    const quizStore = new CountingQuizStore(
      delegate,
      new Error("Day 8 failed semantic audit")
    );

    await expect(ensureImportedWctQuizzes(wctStore, quizStore, result))
      .rejects.toThrow(/Day 8 failed semantic audit/);
    expect(quizStore.syncCalls).toHaveLength(1);
    await expect(delegate.listSetsByLessonKeys(
      quizStore.syncCalls[0][0].sets.map((set) => set.lessonKey)
    )).resolves.toEqual([]);
  });

  it("keeps Premium on the immutable v1 create path", async () => {
    const lesson = getWctPremiumLesson("day-1");
    expect(lesson).not.toBeNull();
    if (!lesson) return;
    const quizStore = new MemoryWctQuizStore({ id: USER_ID }, true);

    const first = await ensurePremiumWctQuiz(quizStore, lesson);
    const replay = await ensurePremiumWctQuiz(quizStore, lesson);

    expect(replay).toEqual(first);
    expect(first.lessonKey).toBe(premiumWctLessonKey(lesson.id));
    expect(first.generatorVersion).toBe("wct-review-v1");
  });
});
