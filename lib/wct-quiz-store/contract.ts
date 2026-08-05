import type {
  WctQuizAttemptResult,
  WctQuizSet,
  WctQuizSetCreateInput,
  WctStandardQuizBookSync,
  WctStandardQuizSyncResult,
  WctQuizSubmission,
  WctQuizSummary
} from "@/lib/wct/quiz/types";

export interface WctQuizStore {
  getSetById(id: string): Promise<WctQuizSet | null>;
  getSetByLessonKey(lessonKey: string): Promise<WctQuizSet | null>;
  listSetsByLessonKeys(lessonKeys: string[]): Promise<WctQuizSet[]>;
  getSummaryByLessonKey(lessonKey: string): Promise<WctQuizSummary | null>;
  createSetIfMissing(input: WctQuizSetCreateInput): Promise<WctQuizSet>;
  syncStandardSets(
    books: WctStandardQuizBookSync[]
  ): Promise<WctStandardQuizSyncResult>;
  submitAttempt(input: WctQuizSubmission): Promise<WctQuizAttemptResult>;
}
