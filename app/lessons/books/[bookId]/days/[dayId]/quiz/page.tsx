import { notFound } from "next/navigation";

import { WctQuizRunner } from "@/components/wct/WctQuizRunner";
import { requireCurrentUser } from "@/lib/auth";
import { getWctQuizStore } from "@/lib/wct-quiz-store";
import { getWctStore } from "@/lib/wct-store";
import { standardWctLessonKey } from "@/lib/wct/quiz/keys";

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

  const quizSet = await getWctQuizStore(user).getSetByLessonKey(
    standardWctLessonKey(book.title, day.dayNumber)
  );
  if (
    !quizSet
    || quizSet.sourceKind !== "wct_day"
    || quizSet.sourceId !== day.id
  ) {
    notFound();
  }

  return (
    <main className="min-h-screen px-1 py-6 sm:px-4 sm:py-10">
      <WctQuizRunner
        quizSet={quizSet}
        returnHref={`/lessons/books/${book.id}/days/${day.id}`}
      />
    </main>
  );
}
