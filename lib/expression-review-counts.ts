import type { ExpressionCard } from "@/lib/types";

type ExpressionReviewCounts = Pick<ExpressionCard, "known_count" | "unknown_count" | "hard_count" | "okay_count" | "easy_count">;

export function getUnsplitRememberedCount(expression: ExpressionReviewCounts) {
  return Math.max(0, expression.known_count - expression.hard_count - expression.okay_count - expression.easy_count);
}

export function getRememberedBreakdownParts(expression: ExpressionReviewCounts) {
  const parts = [`어려움 ${expression.hard_count}회`, `알긴암 ${expression.okay_count}회`, `쉬움 ${expression.easy_count}회`];
  const unsplitCount = getUnsplitRememberedCount(expression);
  if (unsplitCount > 0) parts.push(`이전 ${unsplitCount}회`);
  return parts;
}
