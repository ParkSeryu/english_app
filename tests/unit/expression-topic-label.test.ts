import { describe, expect, it } from "vitest";

import { getExpressionTopicDepth, getExpressionTopicDisplayLabel, sortExpressionTopicsByFolder } from "@/lib/expression-topic-label";

describe("expression topic labels", () => {
  it("adds compact dates so repeated topic names are distinguishable in native selects", () => {
    expect(getExpressionTopicDisplayLabel({
      title: "회화연습반",
      day_date: "2026-05-22",
      folder_path: ["수원영어모임"]
    })).toBe("수원영어모임 / 회화연습반 (260522)");

    expect(getExpressionTopicDisplayLabel({
      title: "회화연습반",
      day_date: "2026-05-29",
      folder_path: ["수원영어모임"]
    })).toBe("수원영어모임 / 회화연습반 (260529)");
  });

  it("does not duplicate an existing compact date suffix", () => {
    expect(getExpressionTopicDisplayLabel({
      title: "회화연습반 (260522)",
      day_date: "2026-05-22",
      folder_path: ["수원영어모임"]
    })).toBe("수원영어모임 / 회화연습반 (260522)");
  });

  it("keeps folder nesting depth for indented topic options", () => {
    expect(getExpressionTopicDepth({ title: "관용표현", folder_path: ["수원영어모임", "회화"] })).toBe(1);
  });

  it("sorts topics by folder path before recent date when opening the expression list", () => {
    const topics = [
      { id: "recent-mixed", title: "최근 섞인 표현", day_date: "2026-06-05", created_at: "2026-06-05T09:00:00Z", folder_path: ["혼합"] },
      { id: "suwon-newer", title: "회화연습반", day_date: "2026-06-02", created_at: "2026-06-02T09:00:00Z", folder_path: ["수원영어모임"] },
      { id: "suwon-older", title: "회화연습반", day_date: "2026-05-22", created_at: "2026-05-22T09:00:00Z", folder_path: ["수원영어모임"] },
      { id: "language", title: "스몰톡", day_date: "2026-06-03", created_at: "2026-06-03T09:00:00Z", folder_path: ["언어교환"] }
    ];

    expect(sortExpressionTopicsByFolder(topics).map((topic) => topic.id)).toEqual([
      "suwon-newer",
      "suwon-older",
      "language",
      "recent-mixed"
    ]);
  });
});
