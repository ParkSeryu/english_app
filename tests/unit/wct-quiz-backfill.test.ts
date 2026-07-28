import { describe, expect, it } from "vitest";

import {
  buildBackfillRows,
  type BackfillBook
} from "@/scripts/generate-wct-quiz-backfill.ts";
import { listWctPremiumLessons } from "@/lib/wct/premium-lessons";
import type { WctDay } from "@/lib/wct/types";

function fixtureDay(bookId: string, dayNumber: number): WctDay {
  return {
    id: `${bookId}-day-${dayNumber}`,
    bookId,
    dayNumber,
    shortLabel: `표현 ${dayNumber}`,
    displayLabel: `Day ${dayNumber} (표현 ${dayNumber})`,
    sourcePageStart: null,
    sourcePageEnd: null,
    sourceNeedsReview: false,
    learningSummary: null,
    concepts: [],
    patterns: [{
      id: `${bookId}-pattern-${dayNumber}`,
      patternText: `Pattern ${bookId} ${dayNumber}`,
      meaningKo: `패턴 뜻 ${bookId} ${dayNumber}`,
      usageNote: null,
      usageSource: "book",
      sourcePage: null,
      sourceNeedsReview: false,
      sortOrder: 0,
      examples: [{
        id: `${bookId}-example-${dayNumber}`,
        englishText: `Example sentence ${bookId} ${dayNumber}.`,
        meaningKo: `예문 뜻 ${bookId} ${dayNumber}`,
        sourcePage: null,
        sourceNeedsReview: false,
        sortOrder: 0
      }]
    }],
    importantNotes: [],
    practicePrompts: []
  };
}

function fixtureBook(
  id: string,
  title: string,
  dayCount: number
): BackfillBook {
  return {
    id,
    ownerId: "00000000-0000-4000-8000-000000000001",
    title,
    levelLabel: null,
    dayCount,
    sortOrder: 0,
    days: Array.from({ length: dayCount }, (_, index) => (
      fixtureDay(id, index + 1)
    ))
  };
}

describe("WCT quiz backfill rows", () => {
  it("builds 44 standard plus 1 Premium valid row", () => {
    const rows = buildBackfillRows([
      fixtureBook("prenovice", "WCT Prenovice", 16),
      fixtureBook("novice", "WCT Novice", 28)
    ], listWctPremiumLessons());

    expect(rows).toHaveLength(45);
    expect(rows.filter((row) => row.sourceKind === "wct_day"))
      .toHaveLength(44);
    expect(rows.filter((row) => row.sourceKind === "wct_premium"))
      .toHaveLength(1);
    expect(rows.every((row) => row.questions.length === 5)).toBe(true);
    expect(rows.every((row) => !("ownerId" in row))).toBe(true);
  });
});
