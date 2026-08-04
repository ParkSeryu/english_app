import { z } from "zod";

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
  dayTopic: z.string().trim().min(1).max(240).optional(),
  question: questionSchema,
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
