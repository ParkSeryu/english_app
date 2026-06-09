import type { ExpressionCard } from "@/lib/types";

type ExpressionPriorityCandidate = Pick<ExpressionCard, "unknown_count" | "review_count" | "source_order"> & { can_delete?: boolean; is_memorization_enabled?: boolean };

export function compareExpressionsForPriority<T extends ExpressionPriorityCandidate>(a: T, b: T) {
  const excludedFromMemorizationDelta = Number(b.is_memorization_enabled === false) - Number(a.is_memorization_enabled === false);
  if (excludedFromMemorizationDelta !== 0) return excludedFromMemorizationDelta;

  const personalDelta = Number(Boolean(b.can_delete)) - Number(Boolean(a.can_delete));
  if (personalDelta !== 0) return personalDelta;

  const unknownDelta = b.unknown_count - a.unknown_count;
  if (unknownDelta !== 0) return unknownDelta;

  const reviewDelta = a.review_count - b.review_count;
  if (reviewDelta !== 0) return reviewDelta;

  return a.source_order - b.source_order;
}

export function sortExpressionsByPriority<T extends ExpressionPriorityCandidate>(expressions: T[]) {
  return [...expressions].sort(compareExpressionsForPriority);
}
