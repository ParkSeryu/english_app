import type { WctQuizStore } from "@/lib/wct-quiz-store/contract";
import type { WctStore } from "@/lib/wct-store/contract";
import {
  buildLegacyStandardWctQuizSource,
  buildPremiumWctQuizSource
} from "@/lib/wct/quiz/adapters";
import {
  generateLegacyWctQuizSetDraft,
  generatePremiumWctQuizSetDraft
} from "@/lib/wct/quiz/generator";
import type { WctPremiumLesson } from "@/lib/wct/premium-lessons";
import type { WctDay, WctImportResult } from "@/lib/wct/types";

export async function ensureImportedWctQuizzes(
  wctStore: WctStore,
  quizStore: WctQuizStore,
  result: WctImportResult
) {
  const book = await wctStore.getBook(result.bookId);
  if (!book) throw new Error("WCT quiz book was not found after import");

  const allDays = (await Promise.all(
    book.days.map((item) => wctStore.getDay(item.id))
  )).filter((item): item is WctDay => item !== null);
  if (allDays.length !== book.days.length) {
    throw new Error("WCT quiz could not load the complete book after import");
  }

  for (const operation of result.operations) {
    const day = allDays.find((item) => item.id === operation.dayId);
    if (!day) {
      throw new Error(
        `WCT quiz Day ${operation.dayNumber} was not found after import`
      );
    }
    try {
      const source = buildLegacyStandardWctQuizSource(book, day, allDays);
      await quizStore.createSetIfMissing(
        generateLegacyWctQuizSetDraft(source)
      );
    } catch (error) {
      throw new Error(
        `WCT quiz generation failed for ${day.displayLabel}`,
        { cause: error }
      );
    }
  }
}

export async function ensurePremiumWctQuiz(
  quizStore: WctQuizStore,
  lesson: WctPremiumLesson
) {
  const source = buildPremiumWctQuizSource(lesson);
  return quizStore.createSetIfMissing(generatePremiumWctQuizSetDraft(source));
}
