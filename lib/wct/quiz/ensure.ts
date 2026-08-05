import type { WctQuizStore } from "@/lib/wct-quiz-store/contract";
import type { WctStore } from "@/lib/wct-store/contract";
import {
  buildPremiumWctQuizSource
} from "@/lib/wct/quiz/adapters";
import {
  generatePremiumWctQuizSetDraft
} from "@/lib/wct/quiz/generator";
import { standardWctLessonKey } from "@/lib/wct/quiz/keys";
import {
  generateStandardWctQuizBook
} from "@/lib/wct/quiz/standard/generator";
import {
  buildStandardWctQuizSource
} from "@/lib/wct/quiz/standard/source";
import type {
  WctStandardQuizSyncResult
} from "@/lib/wct/quiz/types";
import type { WctPremiumLesson } from "@/lib/wct/premium-lessons";
import type { WctBook, WctDay, WctImportResult } from "@/lib/wct/types";

export type WctImportedQuizEnsureResult =
  | ({ status: "synced" } & WctStandardQuizSyncResult)
  | { status: "deferred_v1_release" };

function levelLabel(book: WctBook) {
  const identity = `${book.title} ${book.levelLabel ?? ""}`.toLowerCase();
  return /pre\s*novice|prenovice/u.test(identity) ? "Prenovice" : "Novice";
}

function preparationError(
  book: WctBook,
  message: string,
  dayNumber?: number
) {
  return new Error(
    `WCT ${levelLabel(book)} quiz preparation failed${
      dayNumber === undefined ? "" : ` for Day ${dayNumber}`
    }: ${message}`
  );
}

async function loadCompleteDays(
  wctStore: WctStore,
  book: WctBook
): Promise<WctDay[]> {
  const loaded = await Promise.all(
    book.days.map((item) => wctStore.getDay(item.id))
  );
  if (loaded.some((item) => item === null)) {
    throw preparationError(book, "could not load the complete book");
  }
  return (loaded as WctDay[]).sort(
    (left, right) => left.dayNumber - right.dayNumber
  );
}

function generateCompleteBook(book: WctBook, days: WctDay[]) {
  for (const day of days) {
    try {
      buildStandardWctQuizSource(book, day);
    } catch (error) {
      throw preparationError(
        book,
        error instanceof Error ? error.message : "unknown source rule failure",
        day.dayNumber
      );
    }
  }
  try {
    return generateStandardWctQuizBook(book, days);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown generation rule failure";
    const dayNumber = /Day (\d+)/u.exec(message)?.[1];
    throw preparationError(
      book,
      message,
      dayNumber === undefined ? undefined : Number(dayNumber)
    );
  }
}

export async function ensureImportedWctQuizzes(
  wctStore: WctStore,
  quizStore: WctQuizStore,
  result: WctImportResult
): Promise<WctImportedQuizEnsureResult> {
  const book = await wctStore.getBook(result.bookId);
  if (!book) throw new Error("WCT quiz book was not found after import");

  const allDays = await loadCompleteDays(wctStore, book);
  const lessonKeys = allDays.map((day) => (
    standardWctLessonKey(book.title, day.dayNumber)
  ));
  const existing = await quizStore.listSetsByLessonKeys(lessonKeys);
  const completeInventory = existing.length === lessonKeys.length
    && new Set(existing.map((set) => set.lessonKey)).size === lessonKeys.length
    && allDays.every((day) => existing.some((set) => (
      set.lessonKey === standardWctLessonKey(book.title, day.dayNumber)
      && set.sourceId === day.id
    )));

  if (existing.length !== 0 && !completeInventory) {
    throw preparationError(book, "partial or mixed quiz inventory");
  }
  if (completeInventory) {
    const allLegacy = existing.every((set) => (
      set.sourceKind === "wct_day"
      && set.generatorVersion === "wct-review-v1"
    ));
    if (allLegacy) return { status: "deferred_v1_release" };
    const allV2 = existing.every((set) => (
      set.sourceKind === "wct_day"
      && set.generatorVersion === "wct-review-v2"
    ));
    if (!allV2) {
      throw preparationError(book, "partial or mixed quiz inventory");
    }
  }

  const generated = generateCompleteBook(book, allDays);
  const synchronized = await quizStore.syncStandardSets([{
    bookId: book.id,
    sets: generated.sets.map((set) => set.draft)
  }]);
  return { status: "synced", ...synchronized };
}

export async function ensurePremiumWctQuiz(
  quizStore: WctQuizStore,
  lesson: WctPremiumLesson
) {
  const source = buildPremiumWctQuizSource(lesson);
  return quizStore.createSetIfMissing(generatePremiumWctQuizSetDraft(source));
}
