import { notFound, redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth";
import { getWctPopQuizStore } from "@/lib/wct-pop-quiz-store";
import { getWctPopQuizAttempt, isWctPopQuizEligible } from "@/lib/wct/pop-quiz/service";
import { getWctStore } from "@/lib/wct-store";

export const dynamic = "force-dynamic";

export default async function WctPopQuizPage({
  params
}: {
  params: Promise<{ bookId: string }>;
}) {
  const user = await requireCurrentUser();
  const { bookId } = await params;
  const book = await getWctStore(user).getBook(bookId);
  if (!book || !isWctPopQuizEligible(book)) notFound();

  const attempt = await getWctPopQuizAttempt({
    wctPopQuizStore: getWctPopQuizStore(user)
  }, book.id);
  if (!attempt) redirect(`/lessons/books/${book.id}`);

  return (
    <main className="min-h-screen px-1 py-6 sm:px-4 sm:py-10">
      <h1 className="text-3xl font-black text-ink">Pop Quiz</h1>
      <p className="mt-3 text-sm text-slate-600">{attempt.currentIndex} / 20</p>
    </main>
  );
}
