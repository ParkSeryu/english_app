import type {
  WctPopQuizAttempt,
  WctPopQuizCompleteInput,
  WctPopQuizConfirmInput,
  WctPopQuizConfirmResult,
  WctPopQuizResult,
  WctPopQuizStartInput,
  WctPopQuizSummary
} from "@/lib/wct/pop-quiz/types";

export interface WctPopQuizStore {
  getSummary(bookId: string): Promise<WctPopQuizSummary | null>;
  getAttempt(bookId: string): Promise<WctPopQuizAttempt | null>;
  startAttempt(input: WctPopQuizStartInput): Promise<WctPopQuizAttempt>;
  confirmAnswer(input: WctPopQuizConfirmInput): Promise<WctPopQuizConfirmResult>;
  completeAttempt(input: WctPopQuizCompleteInput): Promise<WctPopQuizResult>;
}