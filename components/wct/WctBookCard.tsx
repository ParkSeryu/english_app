import Link from "next/link";

import type { WctBookSummary } from "@/lib/wct/types";

export function WctBookCard({ book }: { book: WctBookSummary }) {
  return (
    <Link
      href={`/lessons/books/${book.id}`}
      className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-card"
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">WCT</p>
      <h2 className="mt-2 text-xl font-black text-ink">{book.title}</h2>
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
        {book.levelLabel ? <span>{book.levelLabel}</span> : null}
        {book.levelLabel ? <span aria-hidden="true">·</span> : null}
        <span>Day {book.dayCount}개</span>
      </div>
    </Link>
  );
}
