import Link from "next/link";

import type { WctDaySummary } from "@/lib/wct/types";

export function WctDayCard({ bookId, day }: { bookId: string; day: WctDaySummary }) {
  return (
    <Link
      href={`/lessons/books/${bookId}/days/${day.id}`}
      className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-black text-ink">{day.displayLabel}</h2>
        {day.sourceNeedsReview ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700">
            확인 필요
          </span>
        ) : null}
      </div>
    </Link>
  );
}
