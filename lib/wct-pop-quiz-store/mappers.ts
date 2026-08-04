import { z } from "zod";

import type {
  WctPopQuizAttempt,
  WctPopQuizConfirmResult,
  WctPopQuizResult,
  WctPopQuizSummary
} from "@/lib/wct/pop-quiz/types";
import { wctPopQuizQuestionsSchema } from "@/lib/wct/pop-quiz/validation";

type Row = Record<string, unknown>;

const answerSchema = z.object({
  questionId: z.string().min(1).max(160),
  choiceId: z.string().min(1).max(160),
  confirmedAt: z.string().datetime({ offset: true })
}).strict();

const incorrectDaySchema = z.object({
  dayId: z.string().min(1).max(240),
  dayNumber: z.number().int().positive(),
  dayLabel: z.string().trim().min(1).max(240)
}).strict();

const progressSchema = z.object({
  attemptId: z.uuid(),
  status: z.enum(["in_progress", "completed"]),
  currentIndex: z.number().int().min(0).max(100),
  latestScore: z.number().int().min(0).max(100).nullable(),
  completedAt: z.string().datetime({ offset: true }).nullable(),
  questions: wctPopQuizQuestionsSchema
}).strict().superRefine((progress, context) => {
  const total = progress.questions.length;
  if (progress.currentIndex > total) {
    context.addIssue({
      code: "custom",
      path: ["currentIndex"],
      message: "Current index cannot exceed the question count"
    });
  }
  if (progress.latestScore !== null && progress.latestScore > total) {
    context.addIssue({
      code: "custom",
      path: ["latestScore"],
      message: "Latest score cannot exceed the question count"
    });
  }
});

const attemptSchema = progressSchema.extend({
  bookId: z.uuid(),
  seed: z.string().trim().min(1).max(240),
  answers: z.array(answerSchema).max(100),
  incorrectDays: z.array(incorrectDaySchema),
  startedAt: z.string().datetime({ offset: true })
}).strict().superRefine((attempt, context) => {
  if (attempt.answers.length > attempt.questions.length) {
    context.addIssue({
      code: "custom",
      path: ["answers"],
      message: "Answer count cannot exceed the question count"
    });
  }
});

const confirmResultSchema = z.object({
  answer: answerSchema,
  isCorrect: z.boolean(),
  correctChoiceId: z.string().min(1).max(160),
  currentIndex: z.number().int().min(0).max(100)
}).strict();

const resultSchema = z.object({
  score: z.number().int().min(0).max(100),
  total: z.number().int().min(1).max(100),
  incorrectDays: z.array(incorrectDaySchema),
  completedAt: z.string().datetime({ offset: true })
}).strict().superRefine((result, context) => {
  if (result.score > result.total) {
    context.addIssue({
      code: "custom",
      path: ["score"],
      message: "Score cannot exceed the total"
    });
  }
});

function parse<T>(schema: z.ZodType<T>, value: unknown, message: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(message, { cause: result.error });
  return result.data;
}

export function mapWctPopQuizSummary(row: Row): WctPopQuizSummary {
  const progress = parse(progressSchema, {
    attemptId: row.attempt_id,
    status: row.status,
    currentIndex: row.current_index,
    latestScore: row.latest_score,
    completedAt: row.completed_at,
    questions: row.questions
  }, "Invalid stored WCT Pop Quiz summary");
  return {
    attemptId: progress.attemptId,
    status: progress.status,
    currentIndex: progress.currentIndex,
    latestScore: progress.latestScore,
    completedAt: progress.completedAt,
    total: progress.questions.length
  };
}

export function mapWctPopQuizAttempt(row: Row): WctPopQuizAttempt {
  return parse(attemptSchema, {
    attemptId: row.attempt_id,
    status: row.status,
    currentIndex: row.current_index,
    latestScore: row.latest_score,
    completedAt: row.completed_at,
    questions: row.questions,
    bookId: row.book_id,
    seed: row.seed,
    answers: row.answers,
    incorrectDays: row.incorrect_days,
    startedAt: row.started_at
  }, "Invalid stored WCT Pop Quiz attempt");
}

export function mapWctPopQuizConfirmResult(value: unknown): WctPopQuizConfirmResult {
  return parse(
    confirmResultSchema,
    value,
    "Invalid WCT Pop Quiz confirmation result"
  );
}

export function mapWctPopQuizResult(value: unknown): WctPopQuizResult {
  return parse(resultSchema, value, "Invalid WCT Pop Quiz result");
}
