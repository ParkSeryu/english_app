import Link from "next/link";

import type { WctQuizSummary } from "@/lib/wct/quiz/types";

export function WctQuizBadge({
  href,
  summary
}: {
  href: string;
  summary: WctQuizSummary;
}) {
  const actionLabel = summary.latestScore == null
    ? "문제 풀기"
    : "다시 풀기";
  const statusLabel = summary.latestScore == null
    ? `${summary.questionCount}문제`
    : `최근 ${summary.latestScore}/${summary.questionCount}`;

  return (
    <Link
      href={href}
      aria-label={`${actionLabel} ${statusLabel}`}
      className="flex w-full items-center justify-between rounded-2xl bg-teal-600 px-5 py-4 text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200"
    >
      <span className="text-base font-black">{actionLabel}</span>
      <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-black">
        {statusLabel}
      </span>
    </Link>
  );
}
