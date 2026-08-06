import { describe, expect, it, vi } from "vitest";

import { mapWctPopQuizAttempt } from "@/lib/wct-pop-quiz-store/mappers";
import { buildLegacyStandardWctQuizSource } from "@/lib/wct/quiz/adapters";
import { generateLegacyWctQuizSetDraft } from "@/lib/wct/quiz/generator";
import { standardWctLessonKey } from "@/lib/wct/quiz/keys";
import { buildStandardWctQuizSource } from "@/lib/wct/quiz/standard/source";
import type { WctQuizQuestionFormat, WctQuizSet } from "@/lib/wct/quiz/types";
import {
  WctPopQuizRestartRequiredError,
  type WctPopQuizAttempt,
  type WctPopQuizQuestion
} from "@/lib/wct/pop-quiz/types";
import type { WctBook, WctDay } from "@/lib/wct/types";

const OWNER_ID = "22222222-2222-4222-8222-222222222222";
const productionNoviceDays = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
  27, 28, 29, 30, 31
] as const;

function createBook(
  overrides: Partial<Pick<WctBook, "id" | "title" | "levelLabel" | "dayCount">> = {}
): WctBook {
  const id = overrides.id ?? "11111111-1111-4111-8111-111111111111";
  const dayCount = overrides.dayCount ?? 16;
  return {
    id,
    title: overrides.title ?? "WCT Pattern book Prenovice",
    levelLabel: overrides.levelLabel === undefined ? "Pre Novice" : overrides.levelLabel,
    dayCount,
    sortOrder: 1,
    days: Array.from({ length: dayCount }, (_, index) => ({
      id: `day-${index + 1}`,
      bookId: id,
      dayNumber: index + 1,
      shortLabel: `Topic ${index + 1}`,
      displayLabel: `Day ${index + 1}`,
      sourcePageStart: null,
      sourcePageEnd: null,
      sourceNeedsReview: false
    }))
  };
}

function createFullDays(book: WctBook): WctDay[] {
  return book.days.map((summary) => ({
    ...summary,
    learningSummary: null,
    concepts: [],
    importantNotes: [],
    practicePrompts: [],
    patterns: [{
      id: `pattern-${summary.dayNumber}`,
      patternText: `I can item ${summary.dayNumber}`,
      meaningKo: `의미 ${summary.dayNumber}`,
      usageNote: null,
      usageSource: "book",
      sourcePage: null,
      sourceNeedsReview: false,
      sortOrder: 1,
      examples: [{
        id: `example-${summary.dayNumber}`,
        englishText: `I can item ${summary.dayNumber}.`,
        meaningKo: `나는 항목 ${summary.dayNumber}을 할 수 있다.`,
        sourcePage: null,
        sourceNeedsReview: false,
        sortOrder: 1
      }]
    }]
  }));
}

function useProductionNoviceDays(book: WctBook) {
  book.days = book.days.map((day, index) => ({
    ...day,
    id: `day-${productionNoviceDays[index]}`,
    dayNumber: productionNoviceDays[index],
    shortLabel: `Topic ${productionNoviceDays[index]}`,
    displayLabel: `Day ${productionNoviceDays[index]}`
  }));
  return book;
}

function choices(questionId: string, format?: WctQuizQuestionFormat) {
  return Array.from({ length: format === "true_false" ? 2 : 4 }, (_, index) => ({
    id: `${questionId}-choice-${index + 1}`,
    text: `Choice ${questionId}-${index + 1}`
  }));
}

const formats = [
  "multiple_choice",
  "fill_blank",
  "true_false",
  "multiple_choice",
  "fill_blank"
] as const;

function createV2Sets(book: WctBook, days: WctDay[]): WctQuizSet[] {
  return days.map((day) => ({
    id: `set-${day.id}`,
    ownerId: OWNER_ID,
    lessonKey: standardWctLessonKey(book.title, day.dayNumber),
    sourceKind: "wct_day",
    sourceId: day.id,
    generatorVersion: "wct-review-v2",
    sourceHash: buildStandardWctQuizSource(book, day).sourceHash,
    createdAt: "2026-08-03T00:00:00Z",
    questions: formats.map((format, index) => {
      const questionId = `${day.id}-${format}-${index + 1}`;
      return {
        id: questionId,
        kind: index < 3 ? "translation" as const : "pattern" as const,
        format,
        prompt: `Prompt ${questionId}`,
        choices: choices(questionId, format),
        correctChoiceId: `${questionId}-choice-1`,
        explanation: `Explanation ${questionId}`,
        feedback: {
          correctSentence: `Sentence ${questionId}`,
          pattern: `Pattern ${questionId}`,
          reason: `Reason ${questionId}`
        }
      };
    })
  }));
}

function createV1Sets(book: WctBook, days: WctDay[]): WctQuizSet[] {
  return days.map((day) => {
    const draft = generateLegacyWctQuizSetDraft(
      buildLegacyStandardWctQuizSource(book, day, days)
    );
    return {
      id: `legacy-set-${day.id}`,
      ownerId: OWNER_ID,
      ...draft,
      createdAt: "2026-08-03T00:00:00Z"
    };
  });
}

function band(index: number) {
  return index < 6 ? "early" as const : index < 11 ? "middle" as const : "late" as const;
}

function snapshot(book: WctBook, sets: WctQuizSet[]): WctPopQuizQuestion[] {
  return book.days.map((day, index) => ({
    sourceQuizSetId: sets[index].id,
    dayId: day.id,
    dayNumber: day.dayNumber,
    dayLabel: day.displayLabel,
    dayTopic: day.shortLabel,
    band: band(index),
    question: structuredClone(sets[index].questions[0])
  }));
}

function legacyTwentySnapshot(book: WctBook, sets: WctQuizSet[]): WctPopQuizQuestion[] {
  return book.days.flatMap((day, dayIndex) => (
    sets[dayIndex].questions.slice(0, dayIndex < 4 ? 2 : 1).map((question) => ({
      sourceQuizSetId: sets[dayIndex].id,
      dayId: day.id,
      dayNumber: day.dayNumber,
      dayLabel: day.displayLabel,
      band: band(dayIndex),
      question: structuredClone(question)
    }))
  ));
}

function attempt(
  book: WctBook,
  sets: WctQuizSet[],
  status: "in_progress" | "completed" = "in_progress"
): WctPopQuizAttempt {
  const questions = snapshot(book, sets);
  return {
    attemptId: "33333333-3333-4333-8333-333333333333",
    bookId: book.id,
    seed: "previous-seed",
    questions,
    answers: [],
    currentIndex: status === "completed" ? questions.length : 3,
    status,
    latestScore: status === "completed" ? questions.length - 2 : null,
    incorrectDays: [],
    startedAt: "2026-08-03T00:00:00Z",
    completedAt: status === "completed" ? "2026-08-03T00:10:00Z" : null
  };
}

function stores(book: WctBook, days: WctDay[], sets: WctQuizSet[]) {
  return {
    wctStore: {
      getBook: vi.fn().mockResolvedValue(book),
      getDay: vi.fn(async (dayId: string) => days.find((day) => day.id === dayId) ?? null)
    },
    wctQuizStore: { listSetsByLessonKeys: vi.fn().mockResolvedValue(sets) }
  };
}

async function service() {
  return import("@/lib/wct/pop-quiz/service");
}

describe("WCT Pop Quiz service", () => {
  it("loads every full Day and starts from one complete current v2 inventory", async () => {
    const book = createBook();
    const days = createFullDays(book);
    const sets = createV2Sets(book, days);
    const currentSnapshot = snapshot(book, sets);
    const selectQuestions = vi.fn().mockReturnValue(currentSnapshot);
    const startAttempt = vi.fn(async (input) => ({
      ...attempt(book, sets),
      ...input
    }));
    const deps = stores(book, days, sets);
    const { startWctPopQuiz } = await service();

    const started = await startWctPopQuiz({
      ...deps,
      wctPopQuizStore: { getAttempt: vi.fn().mockResolvedValue(null), startAttempt },
      createSeed: () => "fresh-seed",
      selectQuestions
    }, { bookId: book.id, mode: "start" });

    expect(deps.wctStore.getDay).toHaveBeenCalledTimes(book.days.length);
    expect(deps.wctQuizStore.listSetsByLessonKeys).toHaveBeenCalledWith(
      book.days.map((day) => standardWctLessonKey(book.title, day.dayNumber))
    );
    expect(selectQuestions).toHaveBeenCalledWith(expect.objectContaining({
      sourceVersion: "wct-review-v2",
      previousQuestions: null,
      candidates: expect.arrayContaining([
        expect.objectContaining({ dayNumber: 1, dayTopic: book.days[0].shortLabel })
      ])
    }));
    expect(started.questions).toEqual(currentSnapshot);
  });

  it("accepts the complete production Novice inventory with gapped Day numbers", async () => {
    const book = useProductionNoviceDays(createBook({
      title: "WCT Pattern book Novice",
      levelLabel: "Novice",
      dayCount: 28
    }));
    const days = createFullDays(book);
    const sets = createV2Sets(book, days);
    const currentSnapshot = snapshot(book, sets);
    const selectQuestions = vi.fn().mockReturnValue(currentSnapshot);
    const deps = stores(book, days, sets);
    const { startWctPopQuiz } = await service();

    const started = await startWctPopQuiz({
      ...deps,
      wctPopQuizStore: {
        getAttempt: vi.fn().mockResolvedValue(null),
        startAttempt: vi.fn(async (input) => ({ ...attempt(book, sets), ...input }))
      },
      createSeed: () => "production-novice-seed",
      selectQuestions
    }, { bookId: book.id, mode: "start" });

    expect(started.questions.map((item) => item.dayNumber)).toEqual(productionNoviceDays);
    expect(deps.wctQuizStore.listSetsByLessonKeys).toHaveBeenCalledWith(
      productionNoviceDays.map((dayNumber) => standardWctLessonKey(book.title, dayNumber))
    );
  });

  it("returns a current in-progress attempt unchanged only after validating its snapshot", async () => {
    const book = createBook();
    const days = createFullDays(book);
    const sets = createV2Sets(book, days);
    const existing = attempt(book, sets);
    const startAttempt = vi.fn();
    const deps = stores(book, days, sets);
    const { startWctPopQuiz } = await service();

    await expect(startWctPopQuiz({
      ...deps,
      wctPopQuizStore: { getAttempt: vi.fn().mockResolvedValue(existing), startAttempt }
    }, { bookId: book.id, mode: "start" })).resolves.toEqual(existing);

    expect(deps.wctStore.getDay).toHaveBeenCalledTimes(16);
    expect(deps.wctQuizStore.listSetsByLessonKeys).toHaveBeenCalledTimes(1);
    expect(startAttempt).not.toHaveBeenCalled();
  });

  it("passes the complete prior snapshot and uniform version to a retake", async () => {
    const book = createBook();
    const days = createFullDays(book);
    const sets = createV2Sets(book, days);
    const previous = attempt(book, sets, "completed");
    const selectQuestions = vi.fn().mockReturnValue(previous.questions);
    const deps = stores(book, days, sets);
    const { startWctPopQuiz } = await service();

    await startWctPopQuiz({
      ...deps,
      wctPopQuizStore: {
        getAttempt: vi.fn().mockResolvedValue(previous),
        startAttempt: vi.fn(async (input) => ({ ...previous, ...input }))
      },
      createSeed: () => "replacement-seed",
      selectQuestions
    }, { bookId: book.id, mode: "retake" });

    expect(selectQuestions).toHaveBeenCalledWith(expect.objectContaining({
      seed: "replacement-seed",
      sourceVersion: "wct-review-v2",
      previousQuestions: previous.questions
    }));
  });

  it.each(["missing", "mixed", "stale"])(
    "rejects a %s inventory before attempt mutation",
    async (problem) => {
      const book = createBook();
      const days = createFullDays(book);
      const v2Sets = createV2Sets(book, days);
      let sets = v2Sets;
      if (problem === "missing") sets = v2Sets.slice(0, -1);
      if (problem === "mixed") sets = [createV1Sets(book, days)[0], ...v2Sets.slice(1)];
      if (problem === "stale") sets = v2Sets.map((set, index) => (
        index === 4 ? { ...set, sourceHash: "f".repeat(64) } : set
      ));
      const startAttempt = vi.fn();
      const deps = stores(book, days, sets);
      const { startWctPopQuiz } = await service();

      await expect(startWctPopQuiz({
        ...deps,
        wctPopQuizStore: { getAttempt: vi.fn().mockResolvedValue(null), startAttempt }
      }, { bookId: book.id, mode: "start" }))
        .rejects.toThrow("Pop Quiz needs one complete quiz version");
      expect(startAttempt).not.toHaveBeenCalled();
    }
  );

  it("throws the typed restart error when immutable snapshot content is stale", async () => {
    const book = createBook();
    const days = createFullDays(book);
    const sets = createV2Sets(book, days);
    const existing = attempt(book, sets);
    existing.questions[0].question.prompt = "Stale stored prompt";
    const deps = stores(book, days, sets);
    const { startWctPopQuiz } = await service();

    await expect(startWctPopQuiz({
      ...deps,
      wctPopQuizStore: { getAttempt: vi.fn().mockResolvedValue(existing), startAttempt: vi.fn() }
    }, { bookId: book.id, mode: "start" }))
      .rejects.toBeInstanceOf(WctPopQuizRestartRequiredError);
  });

  it.each([
    ["partial", (questions: WctPopQuizQuestion[]) => questions.slice(0, -1)],
    ["duplicate Day", (questions: WctPopQuizQuestion[]) => {
      const changed = structuredClone(questions);
      changed[1] = structuredClone(changed[0]);
      return changed;
    }],
    ["missing Day topic", (questions: WctPopQuizQuestion[]) => {
      const changed = structuredClone(questions);
      delete changed[0].dayTopic;
      return changed;
    }],
    ["changed Day topic", (questions: WctPopQuizQuestion[]) => {
      const changed = structuredClone(questions);
      changed[0].dayTopic = "Changed topic";
      return changed;
    }]
  ] as const)("rejects a %s current v2 active snapshot", async (_label, change) => {
    const book = createBook();
    const days = createFullDays(book);
    const sets = createV2Sets(book, days);
    const existing = attempt(book, sets);
    existing.questions = change(existing.questions);
    const deps = stores(book, days, sets);
    const { startWctPopQuiz } = await service();

    await expect(startWctPopQuiz({
      ...deps,
      wctPopQuizStore: {
        getAttempt: vi.fn().mockResolvedValue(existing),
        startAttempt: vi.fn()
      }
    }, { bookId: book.id, mode: "start" }))
      .rejects.toBeInstanceOf(WctPopQuizRestartRequiredError);
  });

  it("resumes a complete current v2 snapshot in its persisted shuffled order", async () => {
    const book = createBook();
    const days = createFullDays(book);
    const sets = createV2Sets(book, days);
    const existing = attempt(book, sets);
    existing.questions = [...existing.questions].reverse();
    const deps = stores(book, days, sets);
    const { startWctPopQuiz } = await service();

    await expect(startWctPopQuiz({
      ...deps,
      wctPopQuizStore: {
        getAttempt: vi.fn().mockResolvedValue(existing),
        startAttempt: vi.fn()
      }
    }, { bookId: book.id, mode: "start" })).resolves.toEqual(existing);
  });

  it("throws the typed restart error when the requested attempt was reset", async () => {
    const book = createBook();
    const days = createFullDays(book);
    const sets = createV2Sets(book, days);
    const deps = stores(book, days, sets);
    const { getWctPopQuizAttempt } = await service();

    await expect(getWctPopQuizAttempt({
      ...deps,
      wctPopQuizStore: { getAttempt: vi.fn().mockResolvedValue(null) }
    }, book.id)).rejects.toBeInstanceOf(WctPopQuizRestartRequiredError);
  });

  it("throws the typed restart error when an existing attempt references a missing current set", async () => {
    const book = createBook();
    const days = createFullDays(book);
    const sets = createV2Sets(book, days);
    const existing = attempt(book, sets);
    const deps = stores(book, days, sets.slice(0, -1));
    const { getWctPopQuizAttempt } = await service();

    await expect(getWctPopQuizAttempt({
      ...deps,
      wctPopQuizStore: { getAttempt: vi.fn().mockResolvedValue(existing) }
    }, book.id)).rejects.toBeInstanceOf(WctPopQuizRestartRequiredError);
  });

  it("accepts a complete current v1 inventory without materializing format", async () => {
    const book = createBook();
    const days = createFullDays(book);
    const sets = createV1Sets(book, days);
    const selectQuestions = vi.fn().mockReturnValue(snapshot(book, sets));
    const deps = stores(book, days, sets);
    const { startWctPopQuiz } = await service();

    await startWctPopQuiz({
      ...deps,
      wctPopQuizStore: {
        getAttempt: vi.fn().mockResolvedValue(null),
        startAttempt: vi.fn(async (input) => ({ ...attempt(book, sets), ...input }))
      },
      selectQuestions
    }, { bookId: book.id, mode: "start" });

    const selectionInput = selectQuestions.mock.calls[0][0];
    expect(selectionInput.sourceVersion).toBe("wct-review-v1");
    expect(selectionInput.candidates.every((item: { question: object }) => (
      !("format" in item.question)
    ))).toBe(true);
  });

  it("keeps legacy v1 20-question rows readable but requires a current-service restart", async () => {
    const book = createBook();
    const days = createFullDays(book);
    const sets = createV1Sets(book, days);
    const historicalQuestions = legacyTwentySnapshot(book, sets);
    const existing = mapWctPopQuizAttempt({
      attempt_id: "33333333-3333-4333-8333-333333333333",
      book_id: book.id,
      seed: "legacy-seed",
      questions: historicalQuestions,
      answers: [],
      current_index: 0,
      status: "in_progress",
      latest_score: null,
      incorrect_days: [],
      started_at: "2026-08-03T00:00:00Z",
      completed_at: null
    });
    const deps = stores(book, days, sets);
    const { startWctPopQuiz } = await service();

    expect(existing.questions).toHaveLength(20);
    expect(existing.questions.every((item) => (
      item.dayTopic === undefined && !("format" in item.question)
    ))).toBe(true);
    await expect(startWctPopQuiz({
      ...deps,
      wctPopQuizStore: {
        getAttempt: vi.fn().mockResolvedValue(existing),
        startAttempt: vi.fn()
      }
    }, { bookId: book.id, mode: "start" }))
      .rejects.toBeInstanceOf(WctPopQuizRestartRequiredError);
  });

  it("rejects a partial current v1 one-per-Day snapshot", async () => {
    const book = createBook();
    const days = createFullDays(book);
    const sets = createV1Sets(book, days);
    const existing = attempt(book, sets);
    existing.questions = existing.questions.slice(0, -1);
    const deps = stores(book, days, sets);
    const { startWctPopQuiz } = await service();

    await expect(startWctPopQuiz({
      ...deps,
      wctPopQuizStore: {
        getAttempt: vi.fn().mockResolvedValue(existing),
        startAttempt: vi.fn()
      }
    }, { bookId: book.id, mode: "start" }))
      .rejects.toBeInstanceOf(WctPopQuizRestartRequiredError);
  });

  it("keeps positional validation for a reordered current v1 snapshot", async () => {
    const book = createBook();
    const days = createFullDays(book);
    const sets = createV1Sets(book, days);
    const existing = attempt(book, sets);
    existing.questions = [...existing.questions].reverse();
    const deps = stores(book, days, sets);
    const { startWctPopQuiz } = await service();

    await expect(startWctPopQuiz({
      ...deps,
      wctPopQuizStore: {
        getAttempt: vi.fn().mockResolvedValue(existing),
        startAttempt: vi.fn()
      }
    }, { bookId: book.id, mode: "start" }))
      .rejects.toBeInstanceOf(WctPopQuizRestartRequiredError);
  });

  it.each([
    ["15-Day Prenovice", "Prenovice", "WCT Pattern book Prenovice", 15],
    ["17-Day Prenovice", "Prenovice", "WCT Pattern book Prenovice", 17],
    ["16-Day Novice", "Novice", "WCT Pattern book Novice", 16]
  ] as const)(
    "rejects a %s inventory before attempt mutation",
    async (_label, levelLabel, title, dayCount) => {
      const book = createBook({ title, levelLabel, dayCount });
      const days = createFullDays(book);
      const sets = createV2Sets(book, days);
      const startAttempt = vi.fn();
      const deps = stores(book, days, sets);
      const { startWctPopQuiz } = await service();

      await expect(startWctPopQuiz({
        ...deps,
        wctPopQuizStore: {
          getAttempt: vi.fn().mockResolvedValue(null),
          startAttempt
        },
        selectQuestions: vi.fn().mockReturnValue(snapshot(book, sets))
      }, { bookId: book.id, mode: "start" }))
        .rejects.toThrow("Pop Quiz needs one complete quiz version");
      expect(startAttempt).not.toHaveBeenCalled();
    }
  );

  it("rejects duplicate current quiz-set IDs before attempt mutation", async () => {
    const book = createBook();
    const days = createFullDays(book);
    const sets = createV2Sets(book, days);
    sets[1].id = sets[0].id;
    const startAttempt = vi.fn();
    const deps = stores(book, days, sets);
    const { startWctPopQuiz } = await service();

    await expect(startWctPopQuiz({
      ...deps,
      wctPopQuizStore: {
        getAttempt: vi.fn().mockResolvedValue(null),
        startAttempt
      }
    }, { bookId: book.id, mode: "start" }))
      .rejects.toThrow("Pop Quiz needs one complete quiz version");
    expect(startAttempt).not.toHaveBeenCalled();
  });

  it.each(["shortLabel", "displayLabel"] as const)(
    "rejects a full-Day %s that differs from its book summary",
    async (field) => {
      const book = createBook();
      const days = createFullDays(book);
      days[0][field] = field === "shortLabel" ? "Changed topic" : "Changed Day 1";
      const sets = createV2Sets(book, days);
      const startAttempt = vi.fn();
      const deps = stores(book, days, sets);
      const { startWctPopQuiz } = await service();

      await expect(startWctPopQuiz({
        ...deps,
        wctPopQuizStore: {
          getAttempt: vi.fn().mockResolvedValue(null),
          startAttempt
        }
      }, { bookId: book.id, mode: "start" }))
        .rejects.toThrow("Pop Quiz needs one complete quiz version");
      expect(startAttempt).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["title without WCT", "Pattern book Prenovice", "Prenovice", 16],
    ["Premium mixed title", "WCT Premium Prenovice", "Prenovice", 16],
    ["title-level mismatch", "WCT Pattern book Prenovice", "Novice", 28]
  ] as const)("rejects a %s through the shared standard-book identity rules", async (
    _label,
    title,
    levelLabel,
    dayCount
  ) => {
    const book = createBook({ title, levelLabel, dayCount });
    const days = createFullDays(book);
    const sets = createV1Sets(book, days);
    const startAttempt = vi.fn();
    const deps = stores(book, days, sets);
    const { startWctPopQuiz } = await service();

    await expect(startWctPopQuiz({
      ...deps,
      wctPopQuizStore: {
        getAttempt: vi.fn().mockResolvedValue(null),
        startAttempt
      }
    }, { bookId: book.id, mode: "start" }))
      .rejects.toThrow("Pop Quiz is available for Prenovice and Novice only");
    expect(startAttempt).not.toHaveBeenCalled();
  });

  it("rejects missing, Premium, and mismatched title-level books", async () => {
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
        wctStore: {
          getBook: vi.fn().mockResolvedValue(book),
          getDay: vi.fn()
        }
      }, { bookId: "11111111-1111-4111-8111-111111111111", mode: "start" }))
        .rejects.toThrow("Pop Quiz is available for Prenovice and Novice only");
    }
  });
});
