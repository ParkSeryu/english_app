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

const summarySchema = z.object({
  attemptId: z.uuid(),
  status: z.enum(["in_progress", "completed"]),
  currentIndex: z.number().int().min(0).max(20),
  latestScore: z.number().int().min(0).max(20).nullable(),
  completedAt: z.string().datetime({ offset: true }).nullable()
}).strict();

const attemptSchema = summarySchema.extend({
  bookId: z.uuid(),
  seed: z.string().trim().min(1).max(240),
  questions: wctPopQuizQuestionsSchema,
  answers: z.array(answerSchema).max(20),
  incorrectDays: z.array(incorrectDaySchema),
  startedAt: z.string().datetime({ offset: true })
}).strict();

const confirmResultSchema = z.object({
  answer: answerSchema,
  isCorrect: z.boolean(),
  correctChoiceId: z.string().min(1).max(160),
  currentIndex: z.number().int().min(0).max(20)
}).strict();

const resultSchema = z.object({
  score: z.number().int().min(0).max(20),
  total: z.literal(20),
  incorrectDays: z.array(incorrectDaySchema),
  completedAt: z.string().datetime({ offset: true })
}).strict();

function parse<T>(schema: z.ZodType<T>, value: unknown, message: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(message, { cause: result.error });
  return result.data;
}

export function mapWctPopQuizSummary(row: Row): WctPopQuizSummary {
  return parse(summarySchema, {
    attemptId: row.attempt_id,
    status: row.status,
    currentIndex: row.current_index,
    latestScore: row.latest_score,
    completedAt: row.completed_at
  }, "Invalid stored WCT Pop Quiz summary");
}

export function mapWctPopQuizAttempt(row: Row): WctPopQuizAttempt {
  return parse(attemptSchema, {
    ...mapWctPopQuizSummary(row),
    bookId: row.book_id,
    seed: row.seed,
    questions: row.questions,
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
