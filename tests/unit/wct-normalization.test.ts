import { describe, expect, it } from "vitest";

import {
  formatWctDayLabel,
  normalizeWctIdentity,
  stableStringify
} from "@/lib/wct/normalization";

describe("normalizeWctIdentity", () => {
  it("normalizes case and repeated whitespace", () => {
    expect(normalizeWctIdentity("  WCT   Pre NOVICE ")).toBe("wct pre novice");
  });
});

describe("formatWctDayLabel", () => {
  it("formats the approved compact label", () => {
    expect(formatWctDayLabel(13, " if 가능 ")).toBe("Day 13 (if 가능)");
  });
});

describe("stableStringify", () => {
  it("produces the same JSON for equivalent object key order", () => {
    expect(stableStringify({ days: [{ b: 2, a: 1 }], book: { title: "WCT" } }))
      .toBe(stableStringify({ book: { title: "WCT" }, days: [{ a: 1, b: 2 }] }));
  });

  it("preserves array order", () => {
    expect(stableStringify({ days: [1, 2] })).not.toBe(stableStringify({ days: [2, 1] }));
  });
});
