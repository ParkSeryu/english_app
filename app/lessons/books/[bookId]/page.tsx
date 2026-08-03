import { notFound } from "next/navigation";

import { WctDayCard } from "@/components/wct/WctDayCard";
import { WctPopQuizCta } from "@/components/wct/WctPopQuizCta";
import { requireCurrentUser } from "@/lib/auth";
import { getWctPopQuizStore } from "@/lib/wct-pop-quiz-store";
import { getWctPopQuizSummary, isWctPopQuizEligible } from "@/lib/wct/pop-quiz/service";
import { getWctStore } from "@/lib/wct-store";

export const dynamic = "force-dynamic";

export default async function WctBookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const user = await requireCurrentUser();
  const { bookId } = await params;
  const book = await getWctStore(user).getBook(bookId);
  if (!book) notFound();

  const isPopQuizEligible = isWctPopQuizEligible(book);
  const popQuizSummary = isPopQuizEligible
    ? await getWctPopQuizSummary({ wctPopQuizStore: getWctPopQuizStore(user) }, book.id)
    : null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">WCT</p>
        <h1 className="mt-2 text-3xl font-black text-ink">{book.title}</h1>
        <p className="mt-3 text-sm text-slate-600">
          {[book.levelLabel, `Day ${book.dayCount}개`].filter(Boolean).join(" · ")}
        </p>
      </header>
      <WctPopQuizCta bookId={book.id} summary={popQuizSummary} isEligible={isPopQuizEligible} />
      <div className="space-y-3">
        {book.days.map((day) => <WctDayCard key={day.id} bookId={book.id} day={day} />)}
      </div>
    </div>
  );
}
