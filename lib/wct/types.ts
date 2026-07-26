export const WCT_SOURCE_KINDS = ["book", "ai_supplement"] as const;
export type WctSourceKind = (typeof WCT_SOURCE_KINDS)[number];

export const WCT_DUPLICATE_ACTIONS = ["create", "replace", "merge", "skip"] as const;
export type WctDuplicateAction = (typeof WCT_DUPLICATE_ACTIONS)[number];

export type WctExample = {
  id: string;
  englishText: string;
  meaningKo: string | null;
  sourcePage: number | null;
  sourceNeedsReview: boolean;
  sortOrder: number;
};

export type WctPattern = {
  id: string;
  patternText: string;
  meaningKo: string | null;
  usageNote: string | null;
  usageSource: WctSourceKind;
  sourcePage: number | null;
  sourceNeedsReview: boolean;
  sortOrder: number;
  examples: WctExample[];
};

export type WctConcept = {
  id: string;
  text: string;
  sourceKind: WctSourceKind;
  sortOrder: number;
};

export type WctImportantNote = {
  id: string;
  patternId: string | null;
  noteText: string;
  sourcePage: number | null;
  sortOrder: number;
};

export type WctPracticePrompt = {
  id: string;
  patternId: string | null;
  promptText: string;
  meaningKo: string | null;
  sourcePage: number | null;
  sortOrder: number;
};

export type WctDaySummary = {
  id: string;
  bookId: string;
  dayNumber: number;
  shortLabel: string;
  displayLabel: string;
  sourcePageStart: number | null;
  sourcePageEnd: number | null;
  sourceNeedsReview: boolean;
};

export type WctDay = WctDaySummary & {
  learningSummary: string | null;
  concepts: WctConcept[];
  patterns: WctPattern[];
  importantNotes: WctImportantNote[];
  practicePrompts: WctPracticePrompt[];
};

export type WctBookSummary = {
  id: string;
  title: string;
  levelLabel: string | null;
  dayCount: number;
  sortOrder: number;
};

export type WctBook = WctBookSummary & {
  days: WctDaySummary[];
};

export type WctImportDayInput = {
  dayNumber: number;
  shortLabel: string;
  learningSummary?: string | null;
  sourcePageStart?: number | null;
  sourcePageEnd?: number | null;
  sourceNeedsReview?: boolean;
  duplicateAction: WctDuplicateAction;
  concepts: Array<{ text: string; sourceKind: WctSourceKind }>;
  patterns: Array<{
    patternText: string;
    meaningKo?: string | null;
    usageNote?: string | null;
    usageSource: WctSourceKind;
    sourcePage?: number | null;
    sourceNeedsReview?: boolean;
    examples: Array<{
      englishText: string;
      meaningKo?: string | null;
      sourcePage?: number | null;
      sourceNeedsReview?: boolean;
    }>;
  }>;
  importantNotes: Array<{
    patternIndex?: number | null;
    noteText: string;
    sourcePage?: number | null;
  }>;
  practicePrompts: Array<{
    patternIndex?: number | null;
    promptText: string;
    meaningKo?: string | null;
    sourcePage?: number | null;
  }>;
};

export type WctApprovedImportInput = {
  idempotencyKey: string;
  payloadHash: string;
  book: { title: string; levelLabel?: string | null; sortOrder?: number };
  days: WctImportDayInput[];
};

export type WctImportOperation = {
  dayNumber: number;
  action: "created" | "replaced" | "merged" | "skipped";
  dayId: string;
};

export type WctImportResult = {
  bookId: string;
  receiptId: string;
  replayed: boolean;
  operations: WctImportOperation[];
  bookUrl: string;
  dayUrls: string[];
};
