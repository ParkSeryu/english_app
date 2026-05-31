import type { ExpressionCard } from "@/lib/types";

type ExpressionReviewCounts = Pick<ExpressionCard, "hard_count" | "okay_count" | "easy_count">;

export function getRememberedBreakdownParts(expression: ExpressionReviewCounts) {
  return [`어려움 ${expression.hard_count}회`, `알긴암 ${expression.okay_count}회`, `쉬움 ${expression.easy_count}회`];
}
