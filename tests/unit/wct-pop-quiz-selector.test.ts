import { describe, expect, it } from "vitest";

import {
  nextWctQuizFormat,
  selectWctPopQuizQuestions
} from "@/lib/wct/pop-quiz/selector";
import type { WctPopQuizCandidate } from "@/lib/wct/pop-quiz/types";
import type { WctQuizQuestionFormat } from "@/lib/wct/quiz/types";
import type { WctBook } from "@/lib/wct/types";

function createBook(dayCount = 16, levelLabel = "Prenovice"): WctBook {
  const id = "book-prenovice";
  return {
    id,
    title: "Prenovice",
    levelLabel,
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

function createLegacyCandidates(book: WctBook): WctPopQuizCandidate[] {
  return book.days.flatMap((day) => (["translation", "pattern", "translation", "pattern"] as const).map((kind, index) => {
    const questionId = `${day.id}-${kind}-${index + 1}`;
    return {
      sourceQuizSetId: `quiz-set-${day.id}`,
      dayId: day.id,
      dayNumber: day.dayNumber,
      dayLabel: day.displayLabel,
      dayTopic: day.shortLabel,
      question: {
        id: questionId,
        kind,
        prompt: `Prompt ${questionId}`,
        choices: Array.from({ length: 4 }, (_, choiceIndex) => ({
          id: `${questionId}-choice-${choiceIndex + 1}`,
          text: `Choice ${questionId}-${choiceIndex + 1}`
        })),
        correctChoiceId: `${questionId}-choice-1`,
        explanation: `Explanation ${questionId}`
      }
    };
  }));
}

const formats = [
  "multiple_choice",
  "fill_blank",
  "true_false",
  "multiple_choice",
  "fill_blank"
] as const;

const productionNoviceDays = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
  27, 28, 29, 30, 31
] as const;

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

function createV2Candidates(book: WctBook): WctPopQuizCandidate[] {
  return book.days.flatMap((day) => formats.map((format, index) => {
    const questionId = `${day.id}-${format}-${index + 1}`;
    const choiceCount = format === "true_false" ? 2 : 4;
    return {
      sourceQuizSetId: `quiz-set-${day.id}`,
      dayId: day.id,
      dayNumber: day.dayNumber,
      dayLabel: day.displayLabel,
      dayTopic: day.shortLabel,
      question: {
        id: questionId,
        kind: index % 2 === 0 ? "translation" as const : "pattern" as const,
        format,
        prompt: `Prompt ${questionId}`,
        choices: Array.from({ length: choiceCount }, (_, choiceIndex) => ({
          id: `${questionId}-choice-${choiceIndex + 1}`,
          text: `Choice ${questionId}-${choiceIndex + 1}`
        })),
        correctChoiceId: `${questionId}-choice-1`,
        explanation: `Explanation ${questionId}`,
        feedback: {
          correctSentence: `Sentence ${questionId}`,
          pattern: `Pattern ${questionId}`,
          reason: `Reason ${questionId}`
        }
      }
    };
  }));
}

function formatCounts(items: Array<{ question: { format?: WctQuizQuestionFormat } }>) {
  return ["multiple_choice", "fill_blank", "true_false"].map((format) => (
    items.filter((item) => item.question.format === format).length
  ));
}

function dayNumbers(items: Array<{ dayNumber: number }>) {
  return items.map((item) => item.dayNumber);
}

function expectOneLegacyQuestionPerDay(dayCount: number) {
  const book = createBook(dayCount);
  const selected = selectWctPopQuizQuestions({
    book,
    candidates: createLegacyCandidates(book),
    seed: "attempt-seed-a",
    sourceVersion: "wct-review-v1",
    previousQuestions: null
  });

  expect(selected).toHaveLength(dayCount);
  expect(selected.map((item) => item.dayNumber)).toEqual(
    Array.from({ length: dayCount }, (_, index) => index + 1)
  );
  expect(new Set(selected.map((item) => item.dayId)).size).toBe(dayCount);
  expect(selected.every((item) => item.dayTopic === `Topic ${item.dayNumber}`)).toBe(true);
  expect(selected.every((item) => item.question.kind !== "concept")).toBe(true);
  expect(selected.every((item) => !("format" in item.question))).toBe(true);
}

describe("WCT Pop Quiz selector", () => {
  it("keeps legacy one-per-Day selection raw for a 16-Day book", () => {
    expectOneLegacyQuestionPerDay(16);
  });

  it("keeps legacy one-per-Day selection raw for a 28-Day book", () => {
    expectOneLegacyQuestionPerDay(28);
  });

  it("allows a Novice book", () => {
    const book = createBook(16, "Novice");

    expect(selectWctPopQuizQuestions({
      book,
      candidates: createLegacyCandidates(book),
      seed: "attempt-seed-a",
      sourceVersion: "wct-review-v1",
      previousQuestions: null
    })).toHaveLength(16);
  });

  it("rejects a Premium book", () => {
    const book = createBook(16, "Premium");

    expect(() => selectWctPopQuizQuestions({
      book,
      candidates: createLegacyCandidates(book),
      seed: "attempt-seed-a",
      sourceVersion: "wct-review-v1",
      previousQuestions: null
    })).toThrow("Pop Quiz is only available for Prenovice and Novice");
  });

  it("is stable for the same seed", () => {
    const book = createBook();
    const input = {
      book,
      candidates: createV2Candidates(book),
      seed: "attempt-seed-a",
      sourceVersion: "wct-review-v2" as const,
      previousQuestions: null
    };

    expect(selectWctPopQuizQuestions(input)).toEqual(selectWctPopQuizQuestions(input));
  });

  it.each([[16, [5, 5, 6]], [28, [9, 9, 10]]] as const)(
    "balances formats and shuffles Days on the first %i-Day v2 attempt",
    (dayCount, expectedCounts) => {
      const book = createBook(dayCount);
      const selected = selectWctPopQuizQuestions({
        book,
        candidates: createV2Candidates(book),
        seed: "attempt-seed-a",
        sourceVersion: "wct-review-v2",
        previousQuestions: null
      });

      const canonical = Array.from({ length: dayCount }, (_, index) => index + 1);

      expect([...dayNumbers(selected)].sort((left, right) => left - right)).toEqual(canonical);
      expect(dayNumbers(selected)).not.toEqual(canonical);
      expect(formatCounts(selected).sort((left, right) => left - right)).toEqual(expectedCounts);

      const earlyLength = Math.ceil(dayCount / 3);
      const middleLength = Math.ceil((dayCount - earlyLength) / 2);
      const canonicalIndexByDayId = new Map(book.days.map((day, index) => [day.id, index]));
      for (const item of selected) {
        const index = canonicalIndexByDayId.get(item.dayId)!;
        const expectedBand = index < earlyLength
          ? "early"
          : index < earlyLength + middleLength ? "middle" : "late";
        expect(item.band).toBe(expectedBand);
      }
    }
  );

  it("preserves the production Novice Day numbers without requiring a contiguous schedule", () => {
    const book = useProductionNoviceDays(createBook(28, "Novice"));
    const selected = selectWctPopQuizQuestions({
      book,
      candidates: createV2Candidates(book),
      seed: "production-novice-seed",
      sourceVersion: "wct-review-v2",
      previousQuestions: null
    });

    expect([...dayNumbers(selected)].sort((left, right) => left - right)).toEqual([...productionNoviceDays]);
    expect(dayNumbers(selected)).not.toEqual([...productionNoviceDays]);
    expect(new Set(selected.map((item) => item.dayId)).size).toBe(28);
    expect(formatCounts(selected).sort((left, right) => left - right)).toEqual([9, 9, 10]);
  });

  it.each([16, 28])("rotates every Day to the next format on a stable %i-Day v2 retake", (dayCount) => {
    const book = createBook(dayCount);
    const candidates = createV2Candidates(book);
    const first = selectWctPopQuizQuestions({
      book,
      candidates,
      seed: "first-attempt-seed",
      sourceVersion: "wct-review-v2",
      previousQuestions: null
    });
    const input = {
      book,
      candidates,
      seed: "retake-seed",
      sourceVersion: "wct-review-v2" as const,
      previousQuestions: first
    };
    const next = selectWctPopQuizQuestions(input);

    expect(selectWctPopQuizQuestions(input)).toEqual(next);
    const firstByDay = new Map(first.map((item) => [item.dayId, item]));
    expect(next.map((item) => item.dayId)).not.toEqual(first.map((item) => item.dayId));
    for (const item of next) {
      const previous = firstByDay.get(item.dayId)!;
      expect(item.question.id).not.toBe(previous.question.id);
      expect(item.question.format).toBe(nextWctQuizFormat(previous.question.format!));
    }
  });

  it("rotates a first v2 attempt when the seeded order equals canonical order", () => {
    const book = createBook(2);
    const selected = selectWctPopQuizQuestions({
      book,
      candidates: createV2Candidates(book),
      seed: "fallback-seed-1",
      sourceVersion: "wct-review-v2",
      previousQuestions: null
    });

    expect(dayNumbers(selected)).toEqual([2, 1]);
  });

  it("rotates a v2 retake when its seeded order equals the previous order", () => {
    const book = createBook(2);
    const candidates = createV2Candidates(book);
    const previousQuestions = selectWctPopQuizQuestions({
      book,
      candidates,
      seed: "first-attempt-seed",
      sourceVersion: "wct-review-v2",
      previousQuestions: null
    }).sort((left, right) => left.dayNumber - right.dayNumber);
    const next = selectWctPopQuizQuestions({
      book,
      candidates,
      seed: "fallback-seed-1",
      sourceVersion: "wct-review-v2",
      previousQuestions
    });

    expect(dayNumbers(previousQuestions)).toEqual([1, 2]);
    expect(dayNumbers(next)).toEqual([2, 1]);
    const previousByDay = new Map(previousQuestions.map((item) => [item.dayId, item]));
    for (const item of next) {
      const previous = previousByDay.get(item.dayId)!;
      expect(item.question.id).not.toBe(previous.question.id);
      expect(item.question.format).toBe(nextWctQuizFormat(previous.question.format!));
    }
  });

  it("rejects a duplicate v2 previous Day even when Map collapse leaves complete coverage", () => {
    const book = createBook();
    const candidates = createV2Candidates(book);
    const first = selectWctPopQuizQuestions({
      book,
      candidates,
      seed: "first-attempt-seed",
      sourceVersion: "wct-review-v2",
      previousQuestions: null
    });

    expect(() => selectWctPopQuizQuestions({
      book,
      candidates,
      seed: "retake-seed",
      sourceVersion: "wct-review-v2",
      previousQuestions: [...first, structuredClone(first[0])]
    })).toThrow("Pop Quiz needs one complete quiz version");
  });

  it.each([
    ["foreign set", (previous: WctPopQuizCandidate) => {
      previous.sourceQuizSetId = "foreign-set";
    }],
    ["fabricated content", (previous: WctPopQuizCandidate) => {
      previous.question.prompt = "Fabricated previous prompt";
    }],
    ["missing Day topic", (previous: WctPopQuizCandidate) => {
      delete previous.dayTopic;
    }]
  ] as const)("rejects v2 previous snapshot %s", (_label, mutate) => {
    const book = createBook();
    const candidates = createV2Candidates(book);
    const first = selectWctPopQuizQuestions({
      book,
      candidates,
      seed: "first-attempt-seed",
      sourceVersion: "wct-review-v2",
      previousQuestions: null
    });
    const previousQuestions = structuredClone(first);
    mutate(previousQuestions[0]);

    expect(() => selectWctPopQuizQuestions({
      book,
      candidates,
      seed: "retake-seed",
      sourceVersion: "wct-review-v2",
      previousQuestions
    })).toThrow("Pop Quiz needs one complete quiz version");
  });

  it("retains the legacy whole-signature retake rule", () => {
    const book = createBook();
    const input = {
      book,
      candidates: createLegacyCandidates(book),
      seed: "attempt-seed-a",
      sourceVersion: "wct-review-v1" as const,
      previousQuestions: null
    };
    const first = selectWctPopQuizQuestions(input);
    const resampled = selectWctPopQuizQuestions({ ...input, previousQuestions: first });

    expect(resampled.some((item) => (
      first.find((previous) => previous.dayId === item.dayId)?.question.id !== item.question.id
    ))).toBe(true);
    expect(resampled.every((item) => !("format" in item.question))).toBe(true);
  });

  it("fails when a Day has no eligible question", () => {
    const book = createBook();

    expect(() => selectWctPopQuizQuestions({
      book,
      candidates: createLegacyCandidates(book).filter((candidate) => candidate.dayNumber !== 8),
      seed: "attempt-seed-a",
      sourceVersion: "wct-review-v1",
      previousQuestions: null
    })).toThrow("Pop Quiz needs one eligible question per Day");
  });

  it("fails Day-specifically when a v2 Day lacks its scheduled format", () => {
    const book = createBook();
    const candidates = createV2Candidates(book);
    const first = selectWctPopQuizQuestions({
      book,
      candidates,
      seed: "attempt-seed-a",
      sourceVersion: "wct-review-v2",
      previousQuestions: null
    });
    const requiredFormat = first[7].question.format;

    expect(() => selectWctPopQuizQuestions({
      book,
      candidates: candidates.filter((candidate) => (
        candidate.dayNumber !== 8 || candidate.question.format !== requiredFormat
      )),
      seed: "attempt-seed-a",
      sourceVersion: "wct-review-v2",
      previousQuestions: null
    })).toThrow("Day 8");
  });

  it("rejects a mixed v1/v2 candidate inventory", () => {
    const book = createBook();
    const candidates = createV2Candidates(book);
    delete candidates[0].question.format;

    expect(() => selectWctPopQuizQuestions({
      book,
      candidates,
      seed: "attempt-seed-a",
      sourceVersion: "wct-review-v2",
      previousQuestions: null
    })).toThrow("Pop Quiz needs one complete quiz version");
  });
});
