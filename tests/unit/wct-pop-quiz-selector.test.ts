import { describe, expect, it } from "vitest";

import { selectWctPopQuizQuestions } from "@/lib/wct/pop-quiz/selector";
import type { WctPopQuizCandidate } from "@/lib/wct/pop-quiz/types";
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

function createCandidates(book: WctBook): WctPopQuizCandidate[] {
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

function signature(items: Array<{ sourceQuizSetId: string; question: { id: string } }>) {
  return items.map((item) => `${item.sourceQuizSetId}:${item.question.id}`).sort().join("|");
}

function expectOneQuestionPerDay(dayCount: number) {
  const book = createBook(dayCount);
  const selected = selectWctPopQuizQuestions({
    book,
    candidates: createCandidates(book),
    seed: "attempt-seed-a",
    previousSignature: null
  });

  expect(selected).toHaveLength(dayCount);
  expect(selected.map((item) => item.dayNumber)).toEqual(
    Array.from({ length: dayCount }, (_, index) => index + 1)
  );
  expect(new Set(selected.map((item) => item.dayId)).size).toBe(dayCount);
  expect(selected.every((item) => item.dayTopic === `Topic ${item.dayNumber}`)).toBe(true);
  expect(selected.every((item) => item.question.kind !== "concept")).toBe(true);
}

describe("WCT Pop Quiz selector", () => {
  it("selects one eligible question from every Day in a 16-Day book", () => {
    expectOneQuestionPerDay(16);
  });

  it("selects one eligible question from every Day in a 28-Day book", () => {
    expectOneQuestionPerDay(28);
  });

  it("allows a Novice book", () => {
    const book = createBook(16, "Novice");

    expect(selectWctPopQuizQuestions({
      book,
      candidates: createCandidates(book),
      seed: "attempt-seed-a",
      previousSignature: null
    })).toHaveLength(16);
  });

  it("rejects a Premium book", () => {
    const book = createBook(16, "Premium");

    expect(() => selectWctPopQuizQuestions({
      book,
      candidates: createCandidates(book),
      seed: "attempt-seed-a",
      previousSignature: null
    })).toThrow("Pop Quiz is only available for Prenovice and Novice");
  });

  it("is stable for the same seed", () => {
    const book = createBook();
    const input = { book, candidates: createCandidates(book), seed: "attempt-seed-a", previousSignature: null };

    expect(selectWctPopQuizQuestions(input)).toEqual(selectWctPopQuizQuestions(input));
  });

  it("resamples a retake so at least one Day uses a different source question", () => {
    const book = createBook();
    const input = { book, candidates: createCandidates(book), seed: "attempt-seed-a", previousSignature: null };
    const first = selectWctPopQuizQuestions(input);
    const resampled = selectWctPopQuizQuestions({ ...input, previousSignature: signature(first) });

    expect(resampled.some((item) => (
      first.find((previous) => previous.dayId === item.dayId)?.question.id !== item.question.id
    ))).toBe(true);
  });

  it("fails when a Day has no eligible question", () => {
    const book = createBook();

    expect(() => selectWctPopQuizQuestions({
      book,
      candidates: createCandidates(book).filter((candidate) => candidate.dayNumber !== 8),
      seed: "attempt-seed-a",
      previousSignature: null
    })).toThrow("Pop Quiz needs one eligible question per Day");
  });
});
