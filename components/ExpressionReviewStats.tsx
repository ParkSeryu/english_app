import type { ExpressionCard } from "@/lib/types";

type ExpressionReviewStatsProps = {
  expression: Pick<ExpressionCard, "is_memorization_enabled" | "unknown_count" | "hard_count" | "okay_count" | "easy_count">;
  variant?: "inline" | "stacked";
};

export function ExpressionReviewStats({ expression, variant = "inline" }: ExpressionReviewStatsProps) {
  if (!expression.is_memorization_enabled) return null;

  if (variant === "stacked") {
    return (
      <div className="shrink-0 space-y-0.5 text-xs font-semibold leading-4 text-slate-500">
        <div className="flex justify-end gap-1"><span>모름</span><span className="tabular-nums">{expression.unknown_count}회</span></div>
        <div className="flex justify-end gap-1"><span>어려움</span><span className="tabular-nums">{expression.hard_count}회</span></div>
        <div className="flex justify-end gap-1"><span>알긴암</span><span className="tabular-nums">{expression.okay_count}회</span></div>
        <div className="flex justify-end gap-1"><span>쉬움</span><span className="tabular-nums">{expression.easy_count}회</span></div>
      </div>
    );
  }

  return (
    <span className="inline-flex flex-col gap-0.5">
      <span>모름 {expression.unknown_count}회 · 어려움 {expression.hard_count}회</span>
      <span>알긴암 {expression.okay_count}회 · 쉬움 {expression.easy_count}회</span>
    </span>
  );
}
