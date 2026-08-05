import type {
  WctQuizFeedback,
  WctQuizQuestion,
  WctQuizQuestionFormat,
  WctQuizSetCreateInput
} from "../types.ts";

export type WctStandardLevel = "prenovice" | "novice";

export type WctStandardSourceEntry = {
  patternId: string;
  exampleId: string;
  patternText: string;
  patternMeaningKo: string | null;
  usageNote: string | null;
  englishText: string;
  meaningKo: string | null;
};

export type WctStandardQuizSource = {
  lessonKey: string;
  sourceId: string;
  level: WctStandardLevel;
  dayNumber: number;
  topic: string;
  sourceHash: string;
  entries: WctStandardSourceEntry[];
};

export type WctMutationEvidence = {
  recipe: string;
  ruleFamily: string;
  text: string;
  changedFrom: string;
  changedTo: string;
  start: number;
  end: number;
  reason: string;
};

export type WctQuestionProvenance = {
  patternId: string;
  exampleId: string;
  sourceSentence: string;
  choiceEvidence: Array<{
    choiceText: string;
    role: "correct" | "distractor";
    mutation?: WctMutationEvidence;
  }>;
  statementMutation?: WctMutationEvidence;
  blankSpan?: { start: number; end: number; correctText: string };
};

export type WctBlankCandidate = {
  promptSentence: string;
  correctText: string;
  choices: Array<{
    text: string;
    category: string;
    role: "correct" | "distractor";
    mutation?: WctMutationEvidence;
  }>;
  reconstruct(choiceText: string): string;
};

export type WctStandardQuestionCandidate = {
  question: WctQuizQuestion & {
    kind: "translation" | "pattern";
    format: WctQuizQuestionFormat;
    feedback: WctQuizFeedback;
  };
  provenance: WctQuestionProvenance;
};

export type WctGeneratedStandardQuizSet = {
  source: WctStandardQuizSource;
  draft: WctQuizSetCreateInput & {
    sourceKind: "wct_day";
    generatorVersion: "wct-review-v2";
  };
  candidates: readonly WctStandardQuestionCandidate[];
};

export type WctGeneratedStandardQuizBook = {
  bookId: string;
  level: WctStandardLevel;
  sets: readonly WctGeneratedStandardQuizSet[];
};
