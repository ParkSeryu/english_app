import { notFound } from "next/navigation";

import { WctDayContent } from "@/components/wct/WctDayContent";
import { requireCurrentUser } from "@/lib/auth";
import { getWctStore } from "@/lib/wct-store";

export const dynamic = "force-dynamic";

export default async function WctDayPage({
  params
}: {
  params: Promise<{ bookId: string; dayId: string }>;
}) {
  const user = await requireCurrentUser();
  const { bookId, dayId } = await params;
  const store = getWctStore(user);
  const [book, day] = await Promise.all([store.getBook(bookId), store.getDay(dayId)]);
  if (!book || !day || day.bookId !== book.id) notFound();

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">{book.title}</p>
        <h1 className="mt-2 text-3xl font-black text-ink">{day.displayLabel}</h1>
        {day.learningSummary ? <p className="mt-3 text-sm leading-6 text-slate-600">{day.learningSummary}</p> : null}
      </header>
      <WctDayContent day={day} />
    </div>
  );
}
