import { describe, expect, it } from "vitest";

import { getLatestWctLesson, getWctLessons } from "@/lib/wct-lessons";

describe("WCT lesson notes", () => {
  it("keeps Novice Day 31 as a lesson note with review sections", () => {
    const latest = getLatestWctLesson();

    expect(latest.day).toBe("Novice Day 31");
    expect(latest.topic).toContain("It's + adjective");
    expect(latest.form).toContain("for + 사람/대상 + to + 동사원형");
    expect(latest.sentenceSteps.length).toBeGreaterThan(0);
    expect(latest.examples).toHaveLength(3);
    expect(latest.commonMistakes.length).toBeGreaterThan(0);
    expect(latest.reviewQuestions.length).toBeGreaterThan(0);
  });

  it("exposes the WCT lesson list separately from expression cards", () => {
    expect(getWctLessons().map((lesson) => lesson.id)).toEqual(["novice-day-31"]);
  });
});
