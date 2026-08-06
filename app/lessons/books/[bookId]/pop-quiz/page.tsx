import Link from "next/link";
import { notFound } from "next/navigation";

import { WctPopQuizRunner } from "@/components/wct/WctPopQuizRunner";
import { requireCurrentUser } from "@/lib/auth";
import { getWctPopQuizStore } from "@/lib/wct-pop-quiz-store";
import { getWctQuizStore } from "@/lib/wct-quiz-store";
import {
  getWctPopQuizAttempt,
  isWctPopQuizEligible,
  WctPopQuizRestartRequiredError
} from "@/lib/wct/pop-quiz/service";
import { getWctStore } from "@/lib/wct-store";

export const dynamic = "force-dynamic";

export default async function WctPopQuizPage({ params }: { params: Promise<{ bookId: string }> }) {
  const user = await requireCurrentUser();
  const { bookId } = await params;
  const book = await getWctStore(user).getBook(bookId);
  if (!book || !isWctPopQuizEligible(book)) notFound();

  let attempt;
  try {
    attempt = await getWctPopQuizAttempt({
      wctStore: getWctStore(user),
      wctQuizStore: getWctQuizStore(user),
      wctPopQuizStore: getWctPopQuizStore(user)
    }, book.id);
  } catch (error) {
    if (!(error instanceof WctPopQuizRestartRequiredError)) throw error;
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
        <p className="text-lg font-semibold text-slate-900">
          Pop Quiz가 변경됐어요. 새로 시작해 주세요.
        </p>
        <Link
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 font-semibold text-white"
          href={`/lessons/books/${book.id}`}
        >
          책으로 돌아가 새로 시작하기
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-1 py-6 sm:px-4 sm:py-10">
      <WctPopQuizRunner
        key={attempt.attemptId}
        attempt={attempt}
        returnHref={`/lessons/books/${book.id}`}
      />
    </main>
  );
}
