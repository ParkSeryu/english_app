import { describe, expect, it } from "vitest";

import { selectWctPopQuizQuestions } from "@/lib/wct/pop-quiz/selector";
import { wctPopQuizQuestionsSchema } from "@/lib/wct/pop-quiz/validation";
import type { WctBook } from "@/lib/wct/types";
import type { WctPopQuizCandidate } from "@/lib/wct/pop-quiz/types";

function createBook(): WctBook {
  const id = "book-prenovice";
  return {
    id,
    title: "Prenovice",
    levelLabel: "Prenovice",
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

function createCandidates(book: WctBook): WctPopQuizCandidate[] {
  return book.days.flatMap((day) => (["translation", "translation", "pattern", "pattern"] as const).map((kind, index) => {
    const questionId = `${day.id}-${kind}-${index + 1}`;
    return {
      sourceQuizSetId: `quiz-set-${day.id}`,
      dayId: day.id,
      dayNumber: day.dayNumber,
      dayLabel: day.displayLabel,
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

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function signature(items: Array<{ sourceQuizSetId: string; question: { id: string } }>) {
  return items.map((item) => `${item.sourceQuizSetId}:${item.question.id}`).sort().join("|");
}

const book = createBook();
const candidates = createCandidates(book);

const input = {
  book,
  candidates,
  seed: "attempt-seed-a",
  previousSignature: null
};

describe("WCT Pop Quiz selector", () => {
  it("selects twenty questions with every fixed quota and no duplicate source question", () => {
    const selected = selectWctPopQuizQuestions(input);

    expect(selected).toHaveLength(20);
    expect(selected.filter((item) => item.question.kind === "translation")).toHaveLength(12);
    expect(selected.filter((item) => item.question.kind === "pattern")).toHaveLength(8);
    expect(countBy(selected, (item) => item.band)).toEqual({
      early: 7,
      middle: 7,
      late: 6
    });
    expect(Math.max(...Object.values(countBy(selected, (item) => item.dayId)))).toBeLessThanOrEqual(2);
    expect(new Set(selected.map((item) => item.question.id)).size).toBe(20);
  });

  it("is stable for the same seed", () => {
    expect(selectWctPopQuizQuestions(input)).toEqual(selectWctPopQuizQuestions(input));
  });

  it("uses different source-question sets for different seeds", () => {
    const second = selectWctPopQuizQuestions({ ...input, seed: "attempt-seed-b" });

    expect(signature(second)).not.toBe(signature(selectWctPopQuizQuestions(input)));
  });

  it("resamples when the first signature is the previous attempt", () => {
    const first = selectWctPopQuizQuestions(input);
    const resampled = selectWctPopQuizQuestions({
      ...input,
      previousSignature: signature(first)
    });

    expect(signature(resampled)).not.toBe(signature(first));
  });

  it("fails explicitly when the candidate pool cannot supply twenty eligible questions", () => {
    expect(() => selectWctPopQuizQuestions({
      ...input,
      candidates: candidates.slice(0, 19)
    })).toThrow("Pop Quiz needs 20 eligible questions");
  });

  it("fails when twenty or more candidates cannot meet a cell quota", () => {
    const quotaInsufficient = candidates.filter((candidate) => {
      if (candidate.dayNumber > 6) return true;
      return candidate.question.kind === "translation"
        ? candidate.dayNumber <= 3
        : candidate.dayNumber === 4;
    });

    expect(quotaInsufficient.length).toBeGreaterThanOrEqual(20);
    expect(() => selectWctPopQuizQuestions({ ...input, candidates: quotaInsufficient }))
      .toThrow("Pop Quiz needs 20 eligible questions");
  });

  it("backtracks from a high-ranked early translation that would block the required patterns", () => {
    const allowedEarlyQuestionIds = new Set([
      "day-1-translation-1",
      "day-1-pattern-3",
      "day-1-pattern-4",
      "day-2-translation-1",
      "day-2-pattern-3",
      "day-3-translation-1",
      "day-3-translation-2",
      "day-4-translation-1",
      "day-4-translation-2"
    ]);
    const constrainedCandidates = candidates.filter((candidate) => (
      candidate.dayNumber > 6 || allowedEarlyQuestionIds.has(candidate.question.id)
    ));

    const selected = selectWctPopQuizQuestions({
      ...input,
      candidates: constrainedCandidates,
      seed: "backtrack-seed"
    });

    expect(selected.filter((item) => item.band === "early" && item.question.kind === "translation")
      .some((item) => item.dayId === "day-1")).toBe(false);
  });
  it("rejects a concept question", () => {
    const invalid = selectWctPopQuizQuestions(input).map((item) => ({ ...item, question: { ...item.question } }));
    invalid[0].question.kind = "concept";

    expect(() => wctPopQuizQuestionsSchema.parse(invalid)).toThrow();
  });

  it("rejects duplicate question IDs", () => {
    const invalid = selectWctPopQuizQuestions(input).map((item) => ({ ...item, question: { ...item.question } }));
    invalid[1].question.id = invalid[0].question.id;

    expect(() => wctPopQuizQuestionsSchema.parse(invalid)).toThrow("Question IDs must be distinct");
  });

  it("rejects duplicate choice IDs", () => {
    const invalid = selectWctPopQuizQuestions(input).map((item) => ({ ...item, question: { ...item.question } }));
    invalid[0].question.choices[1].id = invalid[0].question.choices[0].id;

    expect(() => wctPopQuizQuestionsSchema.parse(invalid)).toThrow("Choice IDs must be distinct");
  });
  it("rejects a correct choice ID that is not present", () => {
    const invalid = selectWctPopQuizQuestions(input).map((item) => ({ ...item, question: { ...item.question } }));
    invalid[0].question.correctChoiceId = "missing-choice";

    expect(() => wctPopQuizQuestionsSchema.parse(invalid)).toThrow("Correct choice must exist");
  });

  it("rejects an incorrect translation and pattern quota", () => {
    const invalid = selectWctPopQuizQuestions(input).map((item) => ({ ...item, question: { ...item.question } }));
    const translation = invalid.find((item) => item.question.kind === "translation");
    if (!translation) throw new Error("Fixture must contain a translation question");
    translation.question.kind = "pattern";

    expect(() => wctPopQuizQuestionsSchema.parse(invalid)).toThrow("Pop Quiz type quotas must match");
  });

  it("rejects an incorrect early, middle, and late quota", () => {
    const invalid = selectWctPopQuizQuestions(input).map((item) => ({ ...item, question: { ...item.question } }));
    const early = invalid.find((item) => item.band === "early");
    if (!early) throw new Error("Fixture must contain an early-band question");
    early.band = "middle";

    expect(() => wctPopQuizQuestionsSchema.parse(invalid)).toThrow("Pop Quiz band quotas must match");
  });
  it("rejects more than two questions from one Day", () => {
    const invalid = selectWctPopQuizQuestions(input).map((item) => ({ ...item, question: { ...item.question } }));
    const dayId = invalid[0].dayId;
    invalid.filter((item) => item.dayId !== dayId).slice(0, 2).forEach((item) => {
      item.dayId = dayId;
    });

    expect(() => wctPopQuizQuestionsSchema.parse(invalid)).toThrow("A Day may contribute at most two questions");
  });
});
