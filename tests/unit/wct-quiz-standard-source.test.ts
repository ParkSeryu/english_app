import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { stableStringify } from "@/lib/wct/normalization";
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
    const canonicalPayload = {
      lessonKey: "wct-book:wct-pattern-book-prenovice:day:1",
      sourceId: "day-1",
      level: "prenovice",
      dayNumber: 1,
      topic: "가능성 말하기",
      entries: [{
        patternId: "pattern-1",
        exampleId: "example-1",
        patternText: "can + base verb",
        patternMeaningKo: "~할 수 있다",
        usageNote: "Use can before a base verb.",
        englishText: "I can finish this today.",
        meaningKo: "나는 이것을 오늘 끝낼 수 있다."
      }]
    };
    const expectedHash = "7911db87cd720ea9a8e583a70e00bbcaf91c53392043beff43ea4834d9f604c4";

    expect(createHash("sha256").update(stableStringify(canonicalPayload)).digest("hex"))
      .toBe(expectedHash);
    expect(computeStandardWctQuizSourceHash(book(), day())).toBe(
      expectedHash
    );
  });

  it("changes the hash when only sourceId changes", () => {
    const original = day();

    expect(computeStandardWctQuizSourceHash(book(), { ...original, id: "day-copy" }))
      .not.toBe(computeStandardWctQuizSourceHash(book(), original));
  });

  it("changes the hash when only lessonKey input changes", () => {
    const originalBook = book();

    expect(computeStandardWctQuizSourceHash(
      { ...originalBook, title: "WCT Workbook Prenovice" },
      day()
    )).not.toBe(computeStandardWctQuizSourceHash(originalBook, day()));
  });

  it("changes the hash when only an approved entry field changes", () => {
    const original = day();
    const changed = day({
      patterns: [pattern({
        examples: [{
          ...pattern().examples[0],
          meaningKo: "나는 오늘 이 일을 끝낼 수 있다."
        }]
      })]
    });

    expect(computeStandardWctQuizSourceHash(book(), changed))
      .not.toBe(computeStandardWctQuizSourceHash(book(), original));
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
      book({ title: "WCT Premium Novice", levelLabel: "Novice" }),
      book({ title: "WCT Novice", levelLabel: "Premium Novice" }),
      book({ title: "WCT Prenovice", levelLabel: "Premium Prenovice" }),
      book({ title: "WCT Prenovice", levelLabel: "Novice" }),
      book({ title: "General English", levelLabel: "Novice" })
    ]) {
      expect(() => buildStandardWctQuizSource(invalidBook, day()))
        .toThrow("WCT v2 requires a matching Prenovice or Novice book");
    }
  });

  it("uses ID tie-breakers for equal pattern and example sort orders", () => {
    const exampleA = { ...pattern().examples[0], id: "example-a", sortOrder: 1 };
    const exampleB = {
      ...pattern().examples[0],
      id: "example-b",
      englishText: "We can finish this today.",
      sortOrder: 1
    };
    const patternA = pattern({
      id: "pattern-a",
      sortOrder: 1,
      examples: [exampleB, exampleA]
    });
    const patternB = pattern({
      id: "pattern-b",
      sortOrder: 1,
      examples: [{ ...exampleA, id: "example-c" }]
    });
    const forward = day({ patterns: [patternA, patternB] });
    const reversed = day({
      patterns: [
        patternB,
        { ...patternA, examples: [exampleA, exampleB] }
      ]
    });

    expect(buildStandardWctQuizSource(book(), forward).entries)
      .toEqual(buildStandardWctQuizSource(book(), reversed).entries);
    expect(computeStandardWctQuizSourceHash(book(), forward))
      .toBe(computeStandardWctQuizSourceHash(book(), reversed));
  });
});
