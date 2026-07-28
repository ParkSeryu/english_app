export const WCT_QUIZ_GENERATOR_VERSION = "wct-review-v1" as const;

export type WctQuizSourceKind = "wct_day" | "wct_premium";
export type WctQuizQuestionKind = "translation" | "pattern" | "concept";

export type WctQuizChoice = {
  id: string;
  text: string;
};

export type WctQuizQuestion = {
  id: string;
  kind: WctQuizQuestionKind;
  prompt: string;
  choices: WctQuizChoice[];
  correctChoiceId: string;
  explanation: string;
};

export type WctQuizQuestionSeed = {
  seedKey: string;
  kind: WctQuizQuestionKind;
  prompt: string;
  correctText: string;
  explanation: string;
  distractorPool: string[];
};

export type WctQuizSource = {
  lessonKey: string;
  sourceKind: WctQuizSourceKind;
  sourceId: string;
  sourceHashInput: unknown;
  seeds: WctQuizQuestionSeed[];
};

export type WctQuizSetCreateInput = {
  lessonKey: string;
  sourceKind: WctQuizSourceKind;
  sourceId: string;
  generatorVersion: typeof WCT_QUIZ_GENERATOR_VERSION;
  sourceHash: string;
  questions: WctQuizQuestion[];
};

export type WctQuizSet = WctQuizSetCreateInput & {
  id: string;
  ownerId: string;
  createdAt: string;
};

export type WctQuizSummary = {
  quizSetId: string;
  questionCount: 5;
  latestScore: number | null;
  completedAt: string | null;
};

export type WctQuizAnswer = {
  questionId: string;
  choiceId: string;
};

export type WctQuizSubmission = {
  quizSetId: string;
  answers: WctQuizAnswer[];
};

export type WctQuizAttemptResult = {
  score: number;
  total: 5;
  completedAt: string;
};

export type WctQuizActionResult =
  | ({ ok: true } & WctQuizAttemptResult)
  | { ok: false; message: string };
