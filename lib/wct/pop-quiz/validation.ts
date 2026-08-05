import { z } from "zod";

import { wctQuizQuestionSchema } from "@/lib/wct/quiz/validation";

const popQuizQuestionSchema = z.object({
  sourceQuizSetId: z.string().trim().min(1).max(240),
  dayId: z.string().trim().min(1).max(240),
  dayNumber: z.number().int().positive(),
  dayLabel: z.string().trim().min(1).max(240),
  dayTopic: z.string().trim().min(1).max(240).optional(),
  question: wctQuizQuestionSchema,
  band: z.enum(["early", "middle", "late"])
}).strict();

export const wctPopQuizQuestionsSchema = z.array(popQuizQuestionSchema)
  .min(1)
  .max(100)
  .superRefine((questions, context) => {
    const questionIds = questions.map((item) => item.question.id);
    if (new Set(questionIds).size !== questions.length) {
      context.addIssue({ code: "custom", path: [], message: "Question IDs must be distinct" });
    }
  });
