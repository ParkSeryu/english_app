import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import type { WctPopQuizStore } from "@/lib/wct-pop-quiz-store/contract";
import type { WctQuizStore } from "@/lib/wct-quiz-store/contract";
import { isCurrentStandardWctQuizSet } from "@/lib/wct/quiz/current-set";
import { standardWctLessonKey } from "@/lib/wct/quiz/keys";
import { resolveStandardWctLevel } from "@/lib/wct/quiz/standard/source";
import type {
  WctQuizGeneratorVersion,
  WctQuizSet
} from "@/lib/wct/quiz/types";
import { wctQuizSetCreateSchema } from "@/lib/wct/quiz/validation";
import { selectWctPopQuizQuestions } from "@/lib/wct/pop-quiz/selector";
import {
  WctPopQuizRestartRequiredError,
  type WctPopQuizAttempt,
  type WctPopQuizCandidate,
  type WctPopQuizQuestion,
  type WctPopQuizSelectionInput,
  type WctPopQuizSummary
} from "@/lib/wct/pop-quiz/types";
import type { WctStore } from "@/lib/wct-store/contract";
import type { WctBook, WctDay } from "@/lib/wct/types";

export { WctPopQuizRestartRequiredError } from "@/lib/wct/pop-quiz/types";

const ineligibleBookMessage = "Pop Quiz is available for Prenovice and Novice only";
const incompleteInventoryMessage = "Pop Quiz needs one complete quiz version";

type InventoryDependencies = {
  wctStore: Pick<WctStore, "getBook" | "getDay">;
  wctQuizStore: Pick<WctQuizStore, "listSetsByLessonKeys">;
};

type StartDependencies = InventoryDependencies & {
  wctPopQuizStore: Pick<WctPopQuizStore, "getAttempt" | "startAttempt">;
  createSeed?: () => string;
  selectQuestions?: (input: WctPopQuizSelectionInput) => WctPopQuizQuestion[];
};

type AttemptDependencies = InventoryDependencies & {
  wctPopQuizStore: Pick<WctPopQuizStore, "getAttempt">;
};

type SummaryDependencies = {
  wctPopQuizStore: Pick<WctPopQuizStore, "getSummary">;
};

type CurrentInventory = {
  sets: WctQuizSet[];
  candidates: WctPopQuizCandidate[];
  sourceVersion: WctQuizGeneratorVersion;
};

export function isWctPopQuizEligible(book: WctBook) {
  try {
    resolveStandardWctLevel(book);
    return true;
  } catch {
    return false;
  }
}

function requireEligibleBook(book: WctBook | null): WctBook {
  if (!book || !isWctPopQuizEligible(book)) {
    throw new Error(ineligibleBookMessage);
  }
  return book;
}

function failIncompleteInventory(): never {
  throw new Error(incompleteInventoryMessage);
}

async function prepareCurrentInventory(
  deps: InventoryDependencies,
  book: WctBook
): Promise<CurrentInventory> {
  const orderedSummaries = [...book.days].sort((left, right) => left.dayNumber - right.dayNumber);
  const expectedDayCount = resolveStandardWctLevel(book) === "prenovice" ? 16 : 28;
  if (
    book.dayCount !== expectedDayCount
    || orderedSummaries.length !== expectedDayCount
    || new Set(orderedSummaries.map((day) => day.id)).size !== expectedDayCount
    || new Set(orderedSummaries.map((day) => day.dayNumber)).size !== expectedDayCount
    || orderedSummaries.some((day) => !Number.isInteger(day.dayNumber) || day.dayNumber <= 0)
  ) {
    return failIncompleteInventory();
  }

  const loadedDays = await Promise.all(
    orderedSummaries.map((summary) => deps.wctStore.getDay(summary.id))
  );
  if (loadedDays.some((day) => !day)) return failIncompleteInventory();
  const allDays = loadedDays as WctDay[];
  if (allDays.some((day, index) => (
    day.id !== orderedSummaries[index].id
    || day.bookId !== book.id
    || day.dayNumber !== orderedSummaries[index].dayNumber
    || day.shortLabel !== orderedSummaries[index].shortLabel
    || day.displayLabel !== orderedSummaries[index].displayLabel
  ))) {
    return failIncompleteInventory();
  }

  const lessonKeys = orderedSummaries.map((day) => (
    standardWctLessonKey(book.title, day.dayNumber)
  ));
  const loadedSets = await deps.wctQuizStore.listSetsByLessonKeys(lessonKeys);
  if (loadedSets.length !== lessonKeys.length) return failIncompleteInventory();
  if (
    new Set(loadedSets.map((set) => set.id)).size !== loadedSets.length
    || new Set(loadedSets.map((set) => set.sourceId)).size !== loadedSets.length
  ) {
    return failIncompleteInventory();
  }
  const setByLessonKey = new Map(loadedSets.map((set) => [set.lessonKey, set]));
  if (setByLessonKey.size !== lessonKeys.length) return failIncompleteInventory();
  const sets = lessonKeys.map((lessonKey) => setByLessonKey.get(lessonKey));
  if (sets.some((set) => !set)) return failIncompleteInventory();
  const exactSets = sets as WctQuizSet[];

  const versions = new Set(exactSets.map((set) => set.generatorVersion));
  if (versions.size !== 1) return failIncompleteInventory();
  const sourceVersion = exactSets[0]?.generatorVersion;
  if (sourceVersion !== "wct-review-v1" && sourceVersion !== "wct-review-v2") {
    return failIncompleteInventory();
  }

  for (const [index, set] of exactSets.entries()) {
    const parsed = wctQuizSetCreateSchema.safeParse({
      lessonKey: set.lessonKey,
      sourceKind: set.sourceKind,
      sourceId: set.sourceId,
      generatorVersion: set.generatorVersion,
      sourceHash: set.sourceHash,
      questions: set.questions
    });
    if (!parsed.success || !isCurrentStandardWctQuizSet({
      book,
      day: allDays[index],
      allDays,
      quizSet: set
    })) {
      return failIncompleteInventory();
    }
  }

  const candidates = exactSets.flatMap((set, index) => {
    const day = orderedSummaries[index];
    return set.questions.map((question) => ({
      sourceQuizSetId: set.id,
      dayId: day.id,
      dayNumber: day.dayNumber,
      dayLabel: day.displayLabel,
      dayTopic: day.shortLabel,
      question
    }));
  });
  return { sets: exactSets, candidates, sourceVersion };
}

function validateAttemptSnapshot(
  attempt: WctPopQuizAttempt,
  book: WctBook,
  inventory: CurrentInventory
) {
  if (attempt.bookId !== book.id) throw new WctPopQuizRestartRequiredError();
  const orderedDays = [...book.days].sort((left, right) => left.dayNumber - right.dayNumber);
  const dayIds = attempt.questions.map((item) => item.dayId);
  const dayNumbers = attempt.questions.map((item) => item.dayNumber);
  const hasInvalidCanonicalPosition = attempt.questions.length === orderedDays.length
    && inventory.sourceVersion === "wct-review-v1"
    && attempt.questions.some((item, index) => (
      item.dayId !== orderedDays[index].id
      || item.dayNumber !== orderedDays[index].dayNumber
      || item.dayTopic !== orderedDays[index].shortLabel
    ));
  if (
    attempt.questions.length !== orderedDays.length
    || new Set(dayIds).size !== orderedDays.length
    || new Set(dayNumbers).size !== orderedDays.length
    || hasInvalidCanonicalPosition
  ) {
    throw new WctPopQuizRestartRequiredError();
  }
  const dayById = new Map(orderedDays.map((day) => [day.id, day]));
  const setById = new Map(inventory.sets.map((set) => [set.id, set]));

  for (const stored of attempt.questions) {
    const day = dayById.get(stored.dayId);
    const set = setById.get(stored.sourceQuizSetId);
    if (
      !day
      || !set
      || stored.dayNumber !== day.dayNumber
      || stored.dayLabel !== day.displayLabel
      || stored.dayTopic !== day.shortLabel
      || set.lessonKey !== standardWctLessonKey(book.title, day.dayNumber)
      || set.sourceKind !== "wct_day"
      || set.sourceId !== day.id
      || !set.questions.some((question) => isDeepStrictEqual(question, stored.question))
    ) {
      throw new WctPopQuizRestartRequiredError();
    }
  }
}

export async function getWctPopQuizSummary(
  deps: SummaryDependencies,
  bookId: string
): Promise<WctPopQuizSummary | null> {
  return deps.wctPopQuizStore.getSummary(bookId);
}

export async function getWctPopQuizAttempt(
  deps: AttemptDependencies,
  bookId: string
): Promise<WctPopQuizAttempt> {
  const book = requireEligibleBook(await deps.wctStore.getBook(bookId));
  const attempt = await deps.wctPopQuizStore.getAttempt(book.id);
  if (!attempt) throw new WctPopQuizRestartRequiredError();
  let inventory: CurrentInventory;
  try {
    inventory = await prepareCurrentInventory(deps, book);
  } catch (error) {
    if (error instanceof Error && error.message === incompleteInventoryMessage) {
      throw new WctPopQuizRestartRequiredError();
    }
    throw error;
  }
  validateAttemptSnapshot(attempt, book, inventory);
  return attempt;
}

export async function startWctPopQuiz(
  deps: StartDependencies,
  input: { bookId: string; mode: "start" | "retake" }
): Promise<WctPopQuizAttempt> {
  const book = requireEligibleBook(await deps.wctStore.getBook(input.bookId));
  const existing = await deps.wctPopQuizStore.getAttempt(book.id);
  if (input.mode === "retake" && !existing) {
    throw new WctPopQuizRestartRequiredError();
  }
  if (input.mode === "retake" && existing?.status !== "completed") {
    throw new Error("Pop Quiz can only be restarted after completion");
  }

  let inventory: CurrentInventory;
  try {
    inventory = await prepareCurrentInventory(deps, book);
  } catch (error) {
    if (
      existing
      && error instanceof Error
      && error.message === incompleteInventoryMessage
    ) {
      throw new WctPopQuizRestartRequiredError();
    }
    throw error;
  }
  if (existing) validateAttemptSnapshot(existing, book, inventory);
  if (input.mode === "start" && existing) return existing;

  const seed = (deps.createSeed ?? randomUUID)();
  const questions = (deps.selectQuestions ?? selectWctPopQuizQuestions)({
    book,
    candidates: inventory.candidates,
    seed,
    sourceVersion: inventory.sourceVersion,
    previousQuestions: input.mode === "retake" ? existing!.questions : null
  });

  return deps.wctPopQuizStore.startAttempt({
    bookId: book.id,
    seed,
    questions
  });
}
