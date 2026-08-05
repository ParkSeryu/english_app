import { describe, expect, it } from "vitest";

import {
  buildStandardWctQuizSource,
  computeStandardWctQuizSourceHash
} from "@/lib/wct/quiz/standard/source";
import { buildMultipleChoiceCandidate } from "@/lib/wct/quiz/standard/candidates";
import type { WctBook, WctDay, WctPattern } from "@/lib/wct/types";

function pattern(overrides: Partial<WctPattern> = {}): WctPattern {
  return {
    id: "pattern-1",
    patternText: "can + base verb",
    meaningKo: "~할 수 있다",
    usageNote: "Use can before a base verb.",
    usageSource: "book",
    sourcePage: null,
    sourceNeedsReview: false,
    sortOrder: 1,
    examples: [{
      id: "example-1",
      englishText: "I can finish this today.",
      meaningKo: "나는 이것을 오늘 끝낼 수 있다.",
      sourcePage: null,
      sourceNeedsReview: false,
      sortOrder: 1
    }],
    ...overrides
  };
}

function day(overrides: Partial<WctDay> = {}): WctDay {
  return {
    id: "day-1",
    bookId: "book-1",
    dayNumber: 1,
    shortLabel: "가능성 말하기",
    displayLabel: "첫 수업",
    sourcePageStart: null,
    sourcePageEnd: null,
    sourceNeedsReview: false,
    learningSummary: null,
    concepts: [],
    patterns: [pattern()],
    importantNotes: [],
    practicePrompts: [],
    ...overrides
  };
}

function book(overrides: Partial<WctBook> = {}): WctBook {
  return {
    id: "book-1",
    title: "WCT Pattern Book Prenovice",
    levelLabel: "Pre Novice",
    dayCount: 2,
    sortOrder: 1,
    days: [],
    ...overrides
  };
}

describe("standard WCT quiz source", () => {
  it("keeps exact approved target-Day source references in canonical order", () => {
    const later = pattern({
      id: "pattern-2",
      sortOrder: 2,
      examples: [{
        id: "example-2",
        englishText: "We can meet outside.",
        meaningKo: "우리는 밖에서 만날 수 있다.",
        sourcePage: null,
        sourceNeedsReview: false,
        sortOrder: 2
      }]
    });
    const target = day({ patterns: [later, pattern()] });
    const first = buildStandardWctQuizSource(book(), target);

    expect(first.sourceHash).toBe(computeStandardWctQuizSourceHash(book(), target));
    expect(first.entries[0]).toMatchObject({
      patternId: target.patterns[1].id,
      exampleId: target.patterns[1].examples[0].id,
      englishText: target.patterns[1].examples[0].englishText
    });
    expect(buildStandardWctQuizSource.length).toBe(2);
    expect(computeStandardWctQuizSourceHash.length).toBe(2);
  });

  it("includes target identity in the source hash", () => {
    const original = day();
    const clone = day({ id: "day-9", dayNumber: 9 });

    expect(computeStandardWctQuizSourceHash(book(), clone))
      .not.toBe(computeStandardWctQuizSourceHash(book(), original));
    expect(buildStandardWctQuizSource(book(), clone).lessonKey)
      .not.toBe(buildStandardWctQuizSource(book(), original).lessonKey);
  });

  it("rejects review-pending and learner-facing course metadata source", () => {
    const pendingPattern = pattern({ sourceNeedsReview: true });
    const pendingExample = pattern({
      examples: [{ ...pattern().examples[0], sourceNeedsReview: true }]
    });
    const metadata = pattern({
      examples: [{
        ...pattern().examples[0],
        englishText: "This WCT Day 3 course is useful."
      }]
    });

    for (const target of [
      day({ sourceNeedsReview: true }),
      day({ patterns: [pendingPattern, pendingExample] }),
      day({ patterns: [metadata] }),
      day({ shortLabel: "Novice Day 3" })
    ]) {
      expect(() => buildStandardWctQuizSource(book(), target))
        .toThrow("WCT v2 needs approved target-Day source");
    }
  });

  it("does not mistake ordinary day vocabulary for a Day label", () => {
    const ordinary = pattern({
      examples: [{
        ...pattern().examples[0],
        englishText: "I can work every day."
      }]
    });

    expect(buildStandardWctQuizSource(book(), day({ patterns: [ordinary] })).entries)
      .toHaveLength(1);
  });

  it("preserves missing Korean while limiting it to pattern candidates", () => {
    const target = day({
      patterns: [pattern({
        meaningKo: null,
        examples: [{ ...pattern().examples[0], meaningKo: null }]
      })]
    });
    const entry = buildStandardWctQuizSource(book(), target).entries[0];

    expect(entry.meaningKo).toBeNull();
    expect(buildMultipleChoiceCandidate(entry, "pattern")).not.toBeNull();
    expect(buildMultipleChoiceCandidate(entry, "translation")).toBeNull();
  });

  it("accepts matching Prenovice and Novice identities and rejects mismatches", () => {
    expect(buildStandardWctQuizSource(book(), day()).level).toBe("prenovice");
    expect(buildStandardWctQuizSource(
      book({ title: "WCT Novice", levelLabel: "Novice" }),
      day()
    ).level).toBe("novice");

    for (const invalidBook of [
      book({ title: "WCT Premium", levelLabel: "Premium" }),
      book({ title: "WCT Prenovice", levelLabel: "Novice" }),
      book({ title: "General English", levelLabel: "Novice" })
    ]) {
      expect(() => buildStandardWctQuizSource(invalidBook, day()))
        .toThrow("WCT v2 requires a matching Prenovice or Novice book");
    }
  });
});
