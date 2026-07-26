import { describe, expect, it } from "vitest";

import { wctImportRequestSchema, wctPreflightRequestSchema } from "@/lib/wct/validation";

const validRequest = {
  approvalText: "저장해",
  idempotencyKey: "wct-pre-novice-day-1-v1",
  book: { title: "WCT Pattern book Prenovice", levelLabel: "Pre Novice" },
  days: [{
    dayNumber: 1,
    shortLabel: "수동태",
    sourcePageStart: 7,
    sourcePageEnd: 14,
    duplicateAction: "create",
    concepts: [{ text: "행위보다 대상을 강조한다.", sourceKind: "book" }],
    patterns: [{
      patternText: "be + p.p.",
      usageSource: "book",
      examples: [{ englishText: "It is made of wood." }]
    }],
    importantNotes: [],
    practicePrompts: []
  }]
};

describe("wctImportRequestSchema", () => {
  it("accepts a strict Day-only import request", () => {
    expect(wctImportRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it.each(["", "Day 1 (수동태)", "이 라벨은 열여덟 글자를 확실하게 넘기는 긴 문장입니다"])(
    "rejects an invalid short label: %s",
    (shortLabel) => {
      const result = wctImportRequestSchema.safeParse({
        ...validRequest,
        days: [{ ...validRequest.days[0], shortLabel }]
      });
      expect(result.success).toBe(false);
    }
  );

  it("rejects Topic-shaped and unknown input", () => {
    expect(wctImportRequestSchema.safeParse({
      ...validRequest,
      topics: [{ topicNumber: 1 }]
    }).success).toBe(false);
  });

  it("rejects a source page range whose end precedes its start", () => {
    const result = wctImportRequestSchema.safeParse({
      ...validRequest,
      days: [{ ...validRequest.days[0], sourcePageStart: 14, sourcePageEnd: 7 }]
    });
    expect(result.success).toBe(false);
  });

  it("rejects a note pattern index outside the Day pattern array", () => {
    const result = wctImportRequestSchema.safeParse({
      ...validRequest,
      days: [{
        ...validRequest.days[0],
        importantNotes: [{ patternIndex: 1, noteText: "중요" }]
      }]
    });
    expect(result.success).toBe(false);
  });

  it("accepts book and AI-supplement sources only", () => {
    const result = wctImportRequestSchema.safeParse({
      ...validRequest,
      days: [{
        ...validRequest.days[0],
        patterns: [{
          ...validRequest.days[0].patterns[0],
          usageSource: "teacher"
        }]
      }]
    });
    expect(result.success).toBe(false);
  });
});

describe("wctPreflightRequestSchema", () => {
  it("accepts unique positive Day numbers", () => {
    const result = wctPreflightRequestSchema.safeParse({
      bookTitle: "WCT Pattern book Prenovice",
      dayNumbers: [1, 13, 16]
    });
    expect(result.success).toBe(true);
  });

  it("rejects duplicate Day numbers", () => {
    const result = wctPreflightRequestSchema.safeParse({
      bookTitle: "WCT Pattern book Prenovice",
      dayNumbers: [1, 1]
    });
    expect(result.success).toBe(false);
  });
});
