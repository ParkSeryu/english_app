import Link from "next/link";

import type { WctPremiumLesson } from "@/lib/wct/premium-lessons";

export function WctPremiumDayCard({ lesson }: { lesson: WctPremiumLesson }) {
  return (
    <Link
      href={`/lessons/premium/days/${lesson.id}`}
      className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-card"
    >
      <h2 className="text-lg font-black text-ink">{lesson.displayLabel}</h2>
    </Link>
  );
}
