import { z } from "zod";

import { WCT_DUPLICATE_ACTIONS, WCT_SOURCE_KINDS } from "@/lib/wct/types";

const trimmedText = (max: number) => z.string().trim().min(1).max(max);
const nullableText = (max: number) => trimmedText(max).nullable().optional();
const sourcePageSchema = z.number().int().positive().nullable().optional();

const exampleSchema = z.object({
  englishText: trimmedText(500),
  meaningKo: nullableText(500),
  sourcePage: sourcePageSchema,
  sourceNeedsReview: z.boolean().optional()
}).strict();

const patternSchema = z.object({
  patternText: trimmedText(300),
  meaningKo: nullableText(500),
  usageNote: nullableText(2_000),
  usageSource: z.enum(WCT_SOURCE_KINDS),
  sourcePage: sourcePageSchema,
  sourceNeedsReview: z.boolean().optional(),
  examples: z.array(exampleSchema)
}).strict();

const conceptSchema = z.object({
  text: trimmedText(2_000),
  sourceKind: z.enum(WCT_SOURCE_KINDS)
}).strict();

const importantNoteSchema = z.object({
  patternIndex: z.number().int().nonnegative().nullable().optional(),
  noteText: trimmedText(2_000),
  sourcePage: sourcePageSchema
}).strict();

const practicePromptSchema = z.object({
  patternIndex: z.number().int().nonnegative().nullable().optional(),
  promptText: trimmedText(2_000),
  meaningKo: nullableText(1_000),
  sourcePage: sourcePageSchema
}).strict();

const daySchema = z.object({
  dayNumber: z.number().int().min(1).max(999),
  shortLabel: trimmedText(18).refine((value) => !/^day\s/i.test(value), {
    message: "shortLabel must not include the Day prefix"
  }),
  learningSummary: nullableText(2_000),
  sourcePageStart: sourcePageSchema,
  sourcePageEnd: sourcePageSchema,
  sourceNeedsReview: z.boolean().optional(),
  duplicateAction: z.enum(WCT_DUPLICATE_ACTIONS),
  concepts: z.array(conceptSchema),
  patterns: z.array(patternSchema),
  importantNotes: z.array(importantNoteSchema),
  practicePrompts: z.array(practicePromptSchema)
}).strict().superRefine((day, context) => {
  if (
    day.sourcePageStart != null
    && day.sourcePageEnd != null
    && day.sourcePageEnd < day.sourcePageStart
  ) {
    context.addIssue({
      code: "custom",
      message: "sourcePageEnd must not precede sourcePageStart",
      path: ["sourcePageEnd"]
    });
  }

  for (const [collectionName, items] of [
    ["importantNotes", day.importantNotes],
    ["practicePrompts", day.practicePrompts]
  ] as const) {
    items.forEach((item, index) => {
      if (item.patternIndex != null && item.patternIndex >= day.patterns.length) {
        context.addIssue({
          code: "custom",
          message: "patternIndex must reference a pattern in the same Day",
          path: [collectionName, index, "patternIndex"]
        });
      }
    });
  }
});

export const wctImportRequestSchema = z.object({
  approvalText: trimmedText(200),
  idempotencyKey: trimmedText(160),
  book: z.object({
    title: trimmedText(160),
    levelLabel: nullableText(80),
    sortOrder: z.number().int().optional()
  }).strict(),
  days: z.array(daySchema).min(1)
}).strict().superRefine((request, context) => {
  const seen = new Set<number>();
  request.days.forEach((day, index) => {
    if (seen.has(day.dayNumber)) {
      context.addIssue({
        code: "custom",
        message: "dayNumber must be unique within one import",
        path: ["days", index, "dayNumber"]
      });
    }
    seen.add(day.dayNumber);
  });
});

export const wctPreflightRequestSchema = z.object({
  bookTitle: trimmedText(160),
  dayNumbers: z.array(z.number().int().min(1).max(999)).min(1)
}).strict().superRefine((request, context) => {
  if (new Set(request.dayNumbers).size !== request.dayNumbers.length) {
    context.addIssue({
      code: "custom",
      message: "dayNumbers must be unique",
      path: ["dayNumbers"]
    });
  }
});
