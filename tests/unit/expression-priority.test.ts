import { describe, expect, it } from "vitest";

import { sortExpressionsByPriority } from "@/lib/expression-priority";

type Candidate = {
  id: string;
  unknown_count: number;
  review_count: number;
  source_order: number;
  can_delete?: boolean;
  is_memorization_enabled?: boolean;
};

function expression(overrides: Partial<Candidate> & { id: string }): Candidate {
  return {
    unknown_count: 0,
    review_count: 0,
    source_order: 0,
    ...overrides
  };
}

describe("expression priority sorting", () => {
  it("moves more wrong answers upward and more reviewed answers downward", () => {
    const sorted = sortExpressionsByPriority([
      expression({ id: "remembered", unknown_count: 0, review_count: 5, source_order: 0 }),
      expression({ id: "mixed-more-reviewed", unknown_count: 2, review_count: 3, source_order: 1 }),
      expression({ id: "mixed-less-reviewed", unknown_count: 2, review_count: 1, source_order: 2 }),
      expression({ id: "hard", unknown_count: 3, review_count: 0, source_order: 3 }),
      expression({ id: "new", unknown_count: 0, review_count: 0, source_order: 4 })
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["hard", "mixed-less-reviewed", "mixed-more-reviewed", "new", "remembered"]);
  });

  it("lists expressions excluded from memorization before active memorization expressions", () => {
    const sorted = sortExpressionsByPriority([
      expression({ id: "active-personal", can_delete: true, unknown_count: 5, review_count: 0, source_order: 0, is_memorization_enabled: true }),
      expression({ id: "excluded-newer", can_delete: false, unknown_count: 0, review_count: 0, source_order: 2, is_memorization_enabled: false }),
      expression({ id: "excluded-older", can_delete: false, unknown_count: 0, review_count: 0, source_order: 1, is_memorization_enabled: false })
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["excluded-older", "excluded-newer", "active-personal"]);
  });

  it("lists directly added personal expressions before shared expressions", () => {
    const sorted = sortExpressionsByPriority([
      expression({ id: "shared-hard", unknown_count: 5, review_count: 0, source_order: 0 }),
      expression({ id: "personal-newer", can_delete: true, unknown_count: 0, review_count: 0, source_order: 2 }),
      expression({ id: "personal-older", can_delete: true, unknown_count: 0, review_count: 0, source_order: 1 })
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["personal-older", "personal-newer", "shared-hard"]);
  });

  it("uses source order when review counts are tied", () => {
    const sorted = sortExpressionsByPriority([
      expression({ id: "second", unknown_count: 1, review_count: 2, source_order: 2 }),
      expression({ id: "first", unknown_count: 1, review_count: 2, source_order: 1 })
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["first", "second"]);
  });
});
