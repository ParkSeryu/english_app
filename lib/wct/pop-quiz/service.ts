import { randomUUID } from "node:crypto";

import type { WctPopQuizStore } from "@/lib/wct-pop-quiz-store/contract";
import type { WctQuizStore } from "@/lib/wct-quiz-store/contract";
import { normalizeWctIdentity } from "@/lib/wct/normalization";
import { selectWctPopQuizQuestions } from "@/lib/wct/pop-quiz/selector";
import type {
  WctPopQuizAttempt,
  WctPopQuizCandidate,
  WctPopQuizQuestion,
  WctPopQuizSelectionInput,
  WctPopQuizSummary
} from "@/lib/wct/pop-quiz/types";
import { standardWctLessonKey } from "@/lib/wct/quiz/keys";
import type { WctStore } from "@/lib/wct-store/contract";
import type { WctBook } from "@/lib/wct/types";

const ineligibleBookMessage = "Pop Quiz is available for Prenovice and Novice only";

type StartDependencies = {
  wctStore: Pick<WctStore, "getBook">;
  wctQuizStore: Pick<WctQuizStore, "listSetsByLessonKeys">;
  wctPopQuizStore: Pick<WctPopQuizStore, "getAttempt" | "startAttempt">;
  createSeed?: () => string;
  selectQuestions?: (input: WctPopQuizSelectionInput) => WctPopQuizQuestion[];
};

type AttemptDependencies = {
  wctPopQuizStore: Pick<WctPopQuizStore, "getAttempt">;
};

type SummaryDependencies = {
  wctPopQuizStore: Pick<WctPopQuizStore, "getSummary">;
};

function compactIdentity(value: string | null) {
  return value ? normalizeWctIdentity(value).replace(/\s/g, "") : "";
}

export function isWctPopQuizEligible(book: WctBook) {
  const titleWords = normalizeWctIdentity(book.title).split(" ");
  const level = compactIdentity(book.levelLabel);
  return (level === "prenovice" || level === "novice")
    && titleWords.some((word) => compactIdentity(word) === level);
}

function requireEligibleBook(book: WctBook | null): WctBook {
  if (!book || !isWctPopQuizEligible(book)) {
    throw new Error(ineligibleBookMessage);
  }
  return book;
}

function previousSignature(attempt: WctPopQuizAttempt | null) {
  if (!attempt) return null;
  return attempt.questions
    .map((item) => `${item.sourceQuizSetId}:${item.question.id}`)
    .sort()
    .join("|");
}

async function candidatesForBook(
  deps: StartDependencies,
  book: WctBook
): Promise<WctPopQuizCandidate[]> {
  const lessonKeys = book.days.map((day) => standardWctLessonKey(book.title, day.dayNumber));
  const sets = await deps.wctQuizStore.listSetsByLessonKeys(lessonKeys);
  const setByLessonKey = new Map(sets.map((set) => [set.lessonKey, set]));

  return book.days.flatMap((day) => {
    const set = setByLessonKey.get(standardWctLessonKey(book.title, day.dayNumber));
    if (!set || set.sourceKind !== "wct_day" || set.sourceId !== day.id) return [];
    return set.questions.map((question) => ({
      sourceQuizSetId: set.id,
      dayId: day.id,
      dayNumber: day.dayNumber,
      dayLabel: day.displayLabel,
      dayTopic: day.shortLabel,
      question
    }));
  });
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
): Promise<WctPopQuizAttempt | null> {
  return deps.wctPopQuizStore.getAttempt(bookId);
}

export async function startWctPopQuiz(
  deps: StartDependencies,
  input: { bookId: string; mode: "start" | "retake" }
): Promise<WctPopQuizAttempt> {
  const book = requireEligibleBook(await deps.wctStore.getBook(input.bookId));
  const existing = await deps.wctPopQuizStore.getAttempt(book.id);
  if (input.mode === "start" && existing) return existing;
  if (input.mode === "retake" && existing?.status !== "completed") {
    throw new Error("Pop Quiz can only be restarted after completion");
  }

  const seed = (deps.createSeed ?? randomUUID)();
  const questions = (deps.selectQuestions ?? selectWctPopQuizQuestions)({
    book,
    candidates: await candidatesForBook(deps, book),
    seed,
    previousSignature: input.mode === "retake" ? previousSignature(existing) : null
  });

  return deps.wctPopQuizStore.startAttempt({
    bookId: book.id,
    seed,
    questions
  });
}
