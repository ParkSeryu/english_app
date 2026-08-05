import { notFound } from "next/navigation";

import { WctQuizRunner } from "@/components/wct/WctQuizRunner";
import { requireCurrentUser } from "@/lib/auth";
import { getWctQuizStore } from "@/lib/wct-quiz-store";
import { getWctStore } from "@/lib/wct-store";
import { isCurrentStandardWctQuizSet } from "@/lib/wct/quiz/current-set";
import { standardWctLessonKey } from "@/lib/wct/quiz/keys";
import type { WctDay } from "@/lib/wct/types";

export const dynamic = "force-dynamic";

export default async function WctDayQuizPage({
  params
}: {
  params: Promise<{ bookId: string; dayId: string }>;
}) {
  const user = await requireCurrentUser();
  const { bookId, dayId } = await params;
  const wctStore = getWctStore(user);
  const [book, day] = await Promise.all([
    wctStore.getBook(bookId),
    wctStore.getDay(dayId)
  ]);
  if (!book || !day || day.bookId !== book.id) notFound();

  const [quizSet, loadedDays] = await Promise.all([
    getWctQuizStore(user).getSetByLessonKey(
      standardWctLessonKey(book.title, day.dayNumber)
    ),
    Promise.all(book.days.map((item) => wctStore.getDay(item.id)))
  ]);
  const allDays = loadedDays.filter((item): item is WctDay => item !== null);
  if (
    !quizSet
    || allDays.length !== book.days.length
    || !isCurrentStandardWctQuizSet({ book, day, allDays, quizSet })
  ) {
    notFound();
  }

  return (
    <main className="min-h-screen px-1 py-6 sm:px-4 sm:py-10">
      <WctQuizRunner
        quizSet={quizSet}
        returnHref={`/lessons/books/${book.id}/days/${day.id}`}
        feedbackContext={`Day ${day.dayNumber} · ${day.shortLabel}`}
        sourceContext={{ bookId: book.id, dayId: day.id }}
      />
    </main>
  );
}
