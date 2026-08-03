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