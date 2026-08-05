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
    "balances formats and preserves ordered Days on the first %i-Day v2 attempt",
    (dayCount, expectedCounts) => {
      const book = createBook(dayCount);
      const selected = selectWctPopQuizQuestions({
        book,
        candidates: createV2Candidates(book),
        seed: "attempt-seed-a",
        sourceVersion: "wct-review-v2",
        previousQuestions: null
      });

      expect(formatCounts(selected).sort((left, right) => left - right)).toEqual(expectedCounts);
      expect(selected.map((item) => item.dayNumber)).toEqual(
        Array.from({ length: dayCount }, (_, index) => index + 1)
      );
    }
  );

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
    next.forEach((item, index) => {
      expect(item.question.id).not.toBe(first[index].question.id);
      expect(item.question.format).toBe(nextWctQuizFormat(first[index].question.format!));
    });
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
