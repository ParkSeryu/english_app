import type { WctBook } from "@/lib/wct/types";
import type { WctQuizQuestion } from "@/lib/wct/quiz/types";

export type WctPopQuizBand = "early" | "middle" | "late";

export type WctPopQuizCandidate = {
  sourceQuizSetId: string;
  dayId: string;
  dayNumber: number;
  dayLabel: string;
  question: WctQuizQuestion;
};

export type WctPopQuizQuestion = WctPopQuizCandidate & {
  band: WctPopQuizBand;
};

export type WctPopQuizSelectionInput = {
  book: WctBook;
  candidates: WctPopQuizCandidate[];
  seed: string;
  previousSignature: string | null;
};

export const WCT_POP_QUIZ_TOTAL = 20 as const;
export const WCT_POP_QUIZ_TYPE_QUOTA = { translation: 12, pattern: 8 } as const;
export const WCT_POP_QUIZ_BAND_QUOTA = { early: 7, middle: 7, late: 6 } as const;
export type WctPopQuizAnswer = {
  questionId: string;
  choiceId: string;
  confirmedAt: string;
};

export type WctPopQuizIncorrectDay = {
  dayId: string;
  dayNumber: number;
  dayLabel: string;
};

export type WctPopQuizAttempt = {
  attemptId: string;
  bookId: string;
  seed: string;
  questions: WctPopQuizQuestion[];
  answers: WctPopQuizAnswer[];
  currentIndex: number;
  status: "in_progress" | "completed";
  latestScore: number | null;
  incorrectDays: WctPopQuizIncorrectDay[];
  startedAt: string;
  completedAt: string | null;
};

export type WctPopQuizSummary = Pick<
  WctPopQuizAttempt,
  "attemptId" | "status" | "currentIndex" | "latestScore" | "completedAt"
>;

export type WctPopQuizStartInput = {
  bookId: string;
  seed: string;
  questions: WctPopQuizQuestion[];
};

export type WctPopQuizConfirmInput = {
  bookId: string;
  attemptId: string;
  questionId: string;
  choiceId: string;
};

export type WctPopQuizConfirmResult = {
  answer: WctPopQuizAnswer;
  isCorrect: boolean;
  correctChoiceId: string;
  currentIndex: number;
};

export type WctPopQuizCompleteInput = {
  bookId: string;
  attemptId: string;
};

export type WctPopQuizResult = {
  score: number;
  total: 20;
  incorrectDays: WctPopQuizIncorrectDay[];
  completedAt: string;
};
