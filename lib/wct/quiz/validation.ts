import { z } from "zod";

import { normalizeWctIdentity } from "../normalization.ts";

const choiceSchema = z.object({
  id: z.string().min(1).max(160),
  text: z.string().trim().min(1).max(2_000)
}).strict();

const questionSchema = z.object({
  id: z.string().min(1).max(160),
  kind: z.enum(["translation", "pattern", "concept"]),
  prompt: z.string().trim().min(1).max(2_000),
  choices: z.array(choiceSchema).length(4),
  correctChoiceId: z.string().min(1).max(160),
  explanation: z.string().trim().min(1).max(2_000)
}).strict().superRefine((question, context) => {
  const ids = question.choices.map((choice) => choice.id);
  const texts = question.choices.map((choice) => (
    normalizeWctIdentity(choice.text)
  ));

  if (new Set(ids).size !== 4 || new Set(texts).size !== 4) {
    context.addIssue({
      code: "custom",
      path: ["choices"],
      message: "Choices must be distinct"
    });
  }
  if (!ids.includes(question.correctChoiceId)) {
    context.addIssue({
      code: "custom",
      path: ["correctChoiceId"],
      message: "Correct choice must exist"
    });
  }
});

export const wctQuizQuestionsSchema = z.array(questionSchema).length(5)
  .superRefine((questions, context) => {
    const ids = questions.map((question) => question.id);
    const prompts = questions.map((question) => (
      normalizeWctIdentity(question.prompt)
    ));

    if (new Set(ids).size !== 5) {
      context.addIssue({
        code: "custom",
        path: [],
        message: "Question IDs must be distinct"
      });
    }
    if (new Set(prompts).size !== 5) {
      context.addIssue({
        code: "custom",
        path: [],
        message: "Question prompts must be distinct"
      });
    }
  });

const quizSetFields = {
  lessonKey: z.string().trim().min(1).max(240),
  sourceKind: z.enum(["wct_day", "wct_premium"]),
  sourceId: z.string().trim().min(1).max(240),
  generatorVersion: z.literal("wct-review-v1"),
  sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  questions: wctQuizQuestionsSchema
};

export const wctQuizSetCreateSchema = z.object(quizSetFields).strict();

export const wctQuizSetSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  ...quizSetFields,
  createdAt: z.string().datetime({ offset: true })
}).strict();

export const wctQuizSubmissionSchema = z.object({
  quizSetId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().min(1).max(160),
    choiceId: z.string().min(1).max(160)
  }).strict()).length(5)
}).strict().superRefine((value, context) => {
  if (new Set(value.answers.map((answer) => answer.questionId)).size !== 5) {
    context.addIssue({
      code: "custom",
      path: ["answers"],
      message: "Each question must be answered once"
    });
  }
});
