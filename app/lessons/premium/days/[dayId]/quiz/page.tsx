import { notFound } from "next/navigation";

import { WctQuizRunner } from "@/components/wct/WctQuizRunner";
import { requireCurrentUser } from "@/lib/auth";
import {
  getAdminWctQuizStore,
  getWctQuizStore
} from "@/lib/wct-quiz-store";
import { getWctPremiumLesson } from "@/lib/wct/premium-lessons";
import { ensurePremiumWctQuiz } from "@/lib/wct/quiz/ensure";
import { premiumWctLessonKey } from "@/lib/wct/quiz/keys";

export const dynamic = "force-dynamic";

export default async function WctPremiumDayQuizPage({
  params
}: {
  params: Promise<{ dayId: string }>;
}) {
  const user = await requireCurrentUser();
  const { dayId } = await params;
  const lesson = getWctPremiumLesson(dayId);
  if (!lesson) notFound();

  const lessonKey = premiumWctLessonKey(lesson.id);
  const quizStore = getWctQuizStore(user);
  let quizSet = await quizStore.getSetByLessonKey(lessonKey);
  if (!quizSet) {
    await ensurePremiumWctQuiz(getAdminWctQuizStore(user), lesson);
    quizSet = await quizStore.getSetByLessonKey(lessonKey);
  }
  if (
    !quizSet
    || quizSet.sourceKind !== "wct_premium"
    || quizSet.sourceId !== lesson.id
  ) {
    notFound();
  }

  return (
    <main className="min-h-screen px-1 py-6 sm:px-4 sm:py-10">
      <WctQuizRunner
        quizSet={quizSet}
        returnHref={`/lessons/premium/days/${lesson.id}`}
      />
    </main>
  );
}
