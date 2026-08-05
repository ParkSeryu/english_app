import { z } from "zod";

import { normalizeWctIdentity } from "../normalization.ts";

const choiceSchema = z.object({
  id: z.string().min(1).max(160),
  text: z.string().trim().min(1).max(2_000)
}).strict();

const feedbackSchema = z.object({
  correctSentence: z.string().trim().min(1).max(2_000),
  pattern: z.string().trim().min(1).max(2_000),
  reason: z.string().trim().min(1).max(2_000)
}).strict();

export const wctQuizQuestionSchema = z.object({
  id: z.string().min(1).max(160),
  kind: z.enum(["translation", "pattern", "concept"]),
  format: z.enum(["multiple_choice", "fill_blank", "true_false"]).optional(),
  prompt: z.string().trim().min(1).max(2_000),
  choices: z.array(choiceSchema),
  correctChoiceId: z.string().min(1).max(160),
  explanation: z.string().trim().min(1).max(2_000),
  feedback: feedbackSchema.optional()
}).strict().superRefine((question, context) => {
  const ids = question.choices.map((choice) => choice.id);
  const texts = question.choices.map((choice) => (
    normalizeWctIdentity(choice.text)
  ));
  const format = question.format ?? "multiple_choice";
  const expectedChoices = format === "true_false" ? 2 : 4;

  if (question.choices.length !== expectedChoices) {
    context.addIssue({
      code: "custom",
      path: ["choices"],
      message: `${format} needs exactly ${expectedChoices} choices`
    });
  }
  if (
    new Set(ids).size !== question.choices.length
    || new Set(texts).size !== question.choices.length
  ) {
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

export const wctQuizQuestionsSchema = z.array(wctQuizQuestionSchema).length(5)
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
  generatorVersion: z.enum(["wct-review-v1", "wct-review-v2"]),
  sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  questions: wctQuizQuestionsSchema
};

const quizSetCreateBaseSchema = z.object(quizSetFields).strict();

function validateStandardQuizSet(
  set: z.infer<typeof quizSetCreateBaseSchema>,
  context: z.RefinementCtx
) {
    if (set.sourceKind !== "wct_day") {
      context.addIssue({
        code: "custom",
        path: ["sourceKind"],
        message: "Standard v2 quiz requires a WCT Day source"
      });
    }
    if (set.generatorVersion !== "wct-review-v2") {
      context.addIssue({
        code: "custom",
        path: ["generatorVersion"],
        message: "Standard v2 quiz requires generator wct-review-v2"
      });
    }

    const formatCounts = {
      multiple_choice: 0,
      fill_blank: 0,
      true_false: 0
    };
    const kindCounts = { translation: 0, pattern: 0 };
    for (const [index, question] of set.questions.entries()) {
      if (!question.format) {
        context.addIssue({
          code: "custom",
          path: ["questions", index, "format"],
          message: "Standard v2 question requires an explicit format"
        });
      } else {
        formatCounts[question.format] += 1;
      }
      if (!question.feedback) {
        context.addIssue({
          code: "custom",
          path: ["questions", index, "feedback"],
          message: "Standard v2 question requires complete feedback"
        });
      }
      if (question.kind === "concept") {
        context.addIssue({
          code: "custom",
          path: ["questions", index, "kind"],
          message: "Standard v2 quiz does not allow concept questions"
        });
      } else {
        kindCounts[question.kind] += 1;
      }
      if (
        index > 0
        && question.format
        && question.format === set.questions[index - 1].format
      ) {
        context.addIssue({
          code: "custom",
          path: ["questions", index, "format"],
          message: "Standard v2 quiz cannot repeat adjacent formats"
        });
      }
    }

    if (
      formatCounts.multiple_choice !== 2
      || formatCounts.fill_blank !== 2
      || formatCounts.true_false !== 1
    ) {
      context.addIssue({
        code: "custom",
        path: ["questions"],
        message: "Standard v2 quiz requires a 2/2/1 format mix"
      });
    }
    if (kindCounts.translation !== 3 || kindCounts.pattern !== 2) {
      context.addIssue({
        code: "custom",
        path: ["questions"],
        message: "Standard v2 quiz requires three translation and two pattern questions"
      });
    }
}

function validateQuizSetVersion(
  set: z.infer<typeof quizSetCreateBaseSchema>,
  context: z.RefinementCtx
) {
  if (set.generatorVersion === "wct-review-v2") {
    validateStandardQuizSet(set, context);
    return;
  }
  for (const [index, question] of set.questions.entries()) {
    if (question.format !== undefined || question.feedback !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["questions", index],
        message: "Legacy v1 questions cannot include format or feedback"
      });
    }
  }
}

export const wctStandardQuizSetCreateSchema = quizSetCreateBaseSchema
  .superRefine(validateStandardQuizSet);

export const wctQuizSetCreateSchema = quizSetCreateBaseSchema
  .superRefine(validateQuizSetVersion);

export const wctQuizSetSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  ...quizSetFields,
  createdAt: z.string().datetime({ offset: true })
}).strict().superRefine(validateQuizSetVersion);

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
