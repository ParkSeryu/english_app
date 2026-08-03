import { z } from "zod";

import {
  WCT_POP_QUIZ_BAND_QUOTA,
  WCT_POP_QUIZ_TOTAL,
  WCT_POP_QUIZ_TYPE_QUOTA
} from "./types";

const choiceSchema = z.object({
  id: z.string().min(1).max(160),
  text: z.string().trim().min(1).max(2_000)
}).strict();

const questionSchema = z.object({
  id: z.string().min(1).max(160),
  kind: z.enum(["translation", "pattern"]),
  prompt: z.string().trim().min(1).max(2_000),
  choices: z.array(choiceSchema).length(4),
  correctChoiceId: z.string().min(1).max(160),
  explanation: z.string().trim().min(1).max(2_000)
}).strict().superRefine((question, context) => {
  const choiceIds = question.choices.map((choice) => choice.id);
  if (new Set(choiceIds).size !== question.choices.length) {
    context.addIssue({ code: "custom", path: ["choices"], message: "Choice IDs must be distinct" });
  }
  if (!choiceIds.includes(question.correctChoiceId)) {
    context.addIssue({ code: "custom", path: ["correctChoiceId"], message: "Correct choice must exist" });
  }
});

const popQuizQuestionSchema = z.object({
  sourceQuizSetId: z.string().trim().min(1).max(240),
  dayId: z.string().trim().min(1).max(240),
  dayNumber: z.number().int().positive(),
  dayLabel: z.string().trim().min(1).max(240),
  question: questionSchema,
  band: z.enum(["early", "middle", "late"])
}).strict();

export const wctPopQuizQuestionsSchema = z.array(popQuizQuestionSchema)
  .length(WCT_POP_QUIZ_TOTAL)
  .superRefine((questions, context) => {
    const questionIds = questions.map((item) => item.question.id);
    if (new Set(questionIds).size !== questions.length) {
      context.addIssue({ code: "custom", path: [], message: "Question IDs must be distinct" });
    }

    const typeCounts = {
      translation: questions.filter((item) => item.question.kind === "translation").length,
      pattern: questions.filter((item) => item.question.kind === "pattern").length
    };
    if (typeCounts.translation !== WCT_POP_QUIZ_TYPE_QUOTA.translation || typeCounts.pattern !== WCT_POP_QUIZ_TYPE_QUOTA.pattern) {
      context.addIssue({ code: "custom", path: [], message: "Pop Quiz type quotas must match" });
    }

    for (const band of ["early", "middle", "late"] as const) {
      if (questions.filter((item) => item.band === band).length !== WCT_POP_QUIZ_BAND_QUOTA[band]) {
        context.addIssue({ code: "custom", path: [], message: "Pop Quiz band quotas must match" });
      }
    }

    const dayCounts = new Map<string, number>();
    for (const question of questions) {
      const count = (dayCounts.get(question.dayId) ?? 0) + 1;
      dayCounts.set(question.dayId, count);
      if (count > 2) {
        context.addIssue({ code: "custom", path: [], message: "A Day may contribute at most two questions" });
        return;
      }
    }
  });