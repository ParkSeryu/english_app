import { notFound } from "next/navigation";

import { WctDayContent } from "@/components/wct/WctDayContent";
import { WctQuizBadge } from "@/components/wct/WctQuizBadge";
import { requireCurrentUser } from "@/lib/auth";
import { getWctQuizStore } from "@/lib/wct-quiz-store";
import { getWctStore } from "@/lib/wct-store";
import { isCurrentStandardWctQuizSet } from "@/lib/wct/quiz/current-set";
import { standardWctLessonKey } from "@/lib/wct/quiz/keys";
import type { WctDay } from "@/lib/wct/types";

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
  const lessonKey = standardWctLessonKey(book.title, day.dayNumber);
  const quizStore = getWctQuizStore(user);
  const [loadedDays, quizSet, summary] = await Promise.all([
    Promise.all(book.days.map((item) => store.getDay(item.id))),
    quizStore.getSetByLessonKey(lessonKey),
    quizStore.getSummaryByLessonKey(lessonKey)
  ]);
  const allDays = loadedDays.filter((item): item is WctDay => item !== null);
  const hasCurrentQuiz = quizSet !== null
    && allDays.length === book.days.length
    && isCurrentStandardWctQuizSet({ book, day, allDays, quizSet });

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">{book.title}</p>
        <h1 className="mt-2 text-3xl font-black text-ink">{day.displayLabel}</h1>
        {day.learningSummary ? <p className="mt-3 text-sm leading-6 text-slate-600">{day.learningSummary}</p> : null}
      </header>
      {summary && hasCurrentQuiz ? (
        <WctQuizBadge
          href={`/lessons/books/${book.id}/days/${day.id}/quiz`}
          summary={summary}
        />
      ) : null}
      <WctDayContent day={day} />
    </div>
  );
}
