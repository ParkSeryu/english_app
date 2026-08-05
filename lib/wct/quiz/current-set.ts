import {
  buildLegacyStandardWctQuizSource
} from "@/lib/wct/quiz/adapters";
import { generateLegacyWctQuizSetDraft } from "@/lib/wct/quiz/generator";
import { standardWctLessonKey } from "@/lib/wct/quiz/keys";
import {
  buildStandardWctQuizSource
} from "@/lib/wct/quiz/standard/source";
import type { WctQuizSet } from "@/lib/wct/quiz/types";
import type { WctBook, WctDay } from "@/lib/wct/types";

export function isCurrentStandardWctQuizSet({
  book,
  day,
  allDays,
  quizSet
}: {
  book: WctBook;
  day: WctDay;
  allDays: readonly WctDay[];
  quizSet: WctQuizSet;
}) {
  if (
    day.bookId !== book.id
    || quizSet.sourceKind !== "wct_day"
    || quizSet.sourceId !== day.id
    || quizSet.lessonKey !== standardWctLessonKey(book.title, day.dayNumber)
    || allDays.length !== book.days.length
    || allDays.some((candidate) => candidate.bookId !== book.id)
    || book.days.some((summary) => !allDays.some((candidate) => (
      candidate.id === summary.id
    )))
  ) {
    return false;
  }

  try {
    const expectedHash = quizSet.generatorVersion === "wct-review-v2"
      ? buildStandardWctQuizSource(book, day).sourceHash
      : generateLegacyWctQuizSetDraft(
          buildLegacyStandardWctQuizSource(book, day, allDays)
        ).sourceHash;
    return quizSet.sourceHash === expectedHash;
  } catch {
    return false;
  }
}
