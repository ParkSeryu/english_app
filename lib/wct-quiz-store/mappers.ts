import { z } from "zod";

import type {
  WctQuizAttemptResult,
  WctQuizSet
} from "@/lib/wct/quiz/types";
import { wctQuizSetSchema } from "@/lib/wct/quiz/validation";

type Row = Record<string, unknown>;

const attemptResultSchema = z.object({
  score: z.number().int().min(0).max(5),
  total: z.literal(5),
  completedAt: z.string().datetime({ offset: true })
}).strict();

export function mapWctQuizSet(row: Row): WctQuizSet {
  const result = wctQuizSetSchema.safeParse({
    id: row.id,
    ownerId: row.owner_id,
    lessonKey: row.lesson_key,
    sourceKind: row.source_kind,
    sourceId: row.source_id,
    generatorVersion: row.generator_version,
    sourceHash: row.source_hash,
    questions: row.questions,
    createdAt: row.created_at
  });
  if (!result.success) {
    throw new Error("Invalid stored WCT quiz", { cause: result.error });
  }
  return result.data;
}

export function mapWctQuizAttemptResult(value: unknown): WctQuizAttemptResult {
  const result = attemptResultSchema.safeParse(value);
  if (!result.success) {
    throw new Error("Invalid WCT quiz attempt result", { cause: result.error });
  }
  return result.data;
}
