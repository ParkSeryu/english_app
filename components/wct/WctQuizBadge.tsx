import Link from "next/link";

import type { WctQuizSummary } from "@/lib/wct/quiz/types";

export function WctQuizBadge({
  href,
  summary
}: {
  href: string;
  summary: WctQuizSummary;
}) {
  const label = summary.latestScore == null
    ? `복습 문제 ${summary.questionCount}개`
    : `복습 완료 · ${summary.latestScore}/${summary.questionCount}`;

  return (
    <Link
      href={href}
      className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-black text-teal-700 transition hover:border-teal-300 hover:bg-teal-100"
    >
      {label}
    </Link>
  );
}
