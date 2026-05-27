import { EXPRESSION_REVIEW_RESULTS, type ExpressionReviewResult, type StoredExpressionReviewResult } from "@/lib/types";

export function isExpressionReviewResult(result: string): result is ExpressionReviewResult {
  return (EXPRESSION_REVIEW_RESULTS as readonly string[]).includes(result);
}

export function isAgainReviewResult(result: ExpressionReviewResult) {
  return result === "again" || result === "unknown";
}

export function isHardReviewResult(result: ExpressionReviewResult) {
  return result === "hard";
}

export function isOkayReviewResult(result: ExpressionReviewResult) {
  return result === "okay";
}

export function isRememberedReviewResult(result: ExpressionReviewResult) {
  return !isAgainReviewResult(result);
}

export function storedReviewResult(result: ExpressionReviewResult): StoredExpressionReviewResult {
  return isAgainReviewResult(result) ? "unknown" : "known";
}
