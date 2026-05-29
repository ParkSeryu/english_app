import { describe, expect, it } from "vitest";

import { getExpressionTopicDepth, getExpressionTopicDisplayLabel } from "@/lib/expression-topic-label";

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
});
