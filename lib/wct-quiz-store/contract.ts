import type {
  WctQuizAttemptResult,
  WctQuizSet,
  WctQuizSetCreateInput,
  WctQuizSubmission,
  WctQuizSummary
} from "@/lib/wct/quiz/types";

export interface WctQuizStore {
  getSetByLessonKey(lessonKey: string): Promise<WctQuizSet | null>;
  listSetsByLessonKeys(lessonKeys: string[]): Promise<WctQuizSet[]>;
  getSummaryByLessonKey(lessonKey: string): Promise<WctQuizSummary | null>;
  createSetIfMissing(input: WctQuizSetCreateInput): Promise<WctQuizSet>;
  submitAttempt(input: WctQuizSubmission): Promise<WctQuizAttemptResult>;
}
