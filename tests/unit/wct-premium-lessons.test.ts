import { describe, expect, it } from "vitest";

import {
  getWctPremiumLesson,
  listWctPremiumLessons
} from "@/lib/wct/premium-lessons";

describe("WCT Premium lessons", () => {
  it("exposes the approved relative-pronoun Day 1 content", () => {
    const lessons = listWctPremiumLessons();
    expect(lessons).toHaveLength(1);

    const lesson = getWctPremiumLesson("day-1");
    expect(lesson).toMatchObject({
      id: "day-1",
      dayNumber: 1,
      displayLabel: "Day 1",
      title: "관계대명사 기초 — 두 문장을 하나로 합치기"
    });

    const serialized = JSON.stringify(lesson);
    expect(serialized).toContain("I know the person who came to WCT.");
    expect(serialized).toContain("관계대명사 뒤에 바로 동사가 나오면 → 생략 불가");
    expect(serialized).toContain("관계대명사 뒤에 별도의 주어 + 동사가 나오면 → 생략 가능");
    expect(serialized).toContain("what = the thing that");
    expect(serialized).not.toContain("ai_supplement");
    expect(serialized).not.toContain("\"book\"");
  });

  it("returns null for an unknown Premium Day", () => {
    expect(getWctPremiumLesson("missing-day")).toBeNull();
  });
});
