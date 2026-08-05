import type {
  WctStandardLevel,
  WctStandardQuestionCandidate
} from "./types.ts";

export type WctStandardDayOverride = {
  level: WctStandardLevel;
  dayNumber: number;
  expectedSourceHash: string;
  questions: readonly WctStandardQuestionCandidate[];
};

export const STANDARD_WCT_DAY_OVERRIDES = [] satisfies readonly WctStandardDayOverride[];
