import { randomUUID } from "node:crypto";

import type { UserIdentity } from "@/lib/types";
import type { WctQuizStore } from "@/lib/wct-quiz-store/contract";
import {
  cloneMemoryWctPopQuizAttempts,
  commitMemoryWctPopQuizAttempts,
  invalidateMemoryWctPopQuizAttempt
} from "@/lib/wct-pop-quiz-store/memory-store";
import {
  parseWctStandardQuizBookSyncs
} from "@/lib/wct-quiz-store/standard-sync-validation";
import { stableStringify } from "@/lib/wct/normalization";
import type {
  WctQuizAttemptResult,
  WctQuizSet,
  WctQuizSetCreateInput,
  WctStandardQuizBookSync,
  WctStandardQuizSyncResult,
  WctQuizSubmission,
  WctQuizSummary
} from "@/lib/wct/quiz/types";
import {
  wctQuizSetCreateSchema,
  wctQuizSubmissionSchema
} from "@/lib/wct/quiz/validation";

type WctQuizProgress = {
  quizSetId: string;
  userId: string;
  latestScore: number;
  completedAt: string;
};

type MemoryWctQuizState = {
  sets: Map<string, WctQuizSet>;
  progress: Map<string, WctQuizProgress>;
  standardBookIds: Map<string, string>;
};

const memoryWctQuizStateKey = Symbol.for("english-app.memory-wct-quiz-store");

function getState(): MemoryWctQuizState {
  const globalState = globalThis as typeof globalThis & {
    [memoryWctQuizStateKey]?: MemoryWctQuizState;
  };
  const state = (globalState[memoryWctQuizStateKey] ??= {
    sets: new Map(),
    progress: new Map(),
    standardBookIds: new Map()
  });
  state.standardBookIds ??= new Map();
  return state;
}

function setKey(ownerId: string, lessonKey: string) {
  return `${ownerId}:${lessonKey}`;
}

function progressKey(userId: string, quizSetId: string) {
  return `${userId}:${quizSetId}`;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function resetMemoryWctQuizStoreForTests() {
  const state = getState();
  state.sets.clear();
  state.progress.clear();
  state.standardBookIds.clear();
}

export class MemoryWctQuizStore implements WctQuizStore {
  constructor(
    private readonly user: UserIdentity,
    private readonly admin = false
  ) {}

  async getSetById(id: string): Promise<WctQuizSet | null> {
    const set = [...getState().sets.values()].find((candidate) => (
      candidate.id === id && candidate.ownerId === this.user.id
    ));
    return set ? clone(set) : null;
  }

  async getSetByLessonKey(lessonKey: string): Promise<WctQuizSet | null> {
    const set = getState().sets.get(setKey(this.user.id, lessonKey));
    return set ? clone(set) : null;
  }

  async listSetsByLessonKeys(lessonKeys: string[]): Promise<WctQuizSet[]> {
    const requested = new Set(lessonKeys);
    return [...getState().sets.values()]
      .filter((set) => set.ownerId === this.user.id && requested.has(set.lessonKey))
      .map(clone);
  }
  async getSummaryByLessonKey(
    lessonKey: string
  ): Promise<WctQuizSummary | null> {
    const set = getState().sets.get(setKey(this.user.id, lessonKey));
    if (!set) return null;
    const progress = getState().progress.get(progressKey(this.user.id, set.id));
    return clone({
      quizSetId: set.id,
      questionCount: 5,
      latestScore: progress?.latestScore ?? null,
      completedAt: progress?.completedAt ?? null
    });
  }

  async createSetIfMissing(
    input: WctQuizSetCreateInput
  ): Promise<WctQuizSet> {
    if (!this.admin) {
      throw new Error("WCT quiz creation requires an admin store");
    }
    const parsed = wctQuizSetCreateSchema.parse(input);
    if (parsed.generatorVersion === "wct-review-v2") {
      throw new Error("WCT v2 standard sets must use atomic synchronization");
    }
    const key = setKey(this.user.id, parsed.lessonKey);
    const existing = getState().sets.get(key);
    if (existing) return clone(existing);

    const created: WctQuizSet = {
      ...clone(parsed),
      id: randomUUID(),
      ownerId: this.user.id,
      createdAt: new Date().toISOString()
    };
    getState().sets.set(key, created);
    return clone(created);
  }

  async syncStandardSets(
    books: WctStandardQuizBookSync[]
  ): Promise<WctStandardQuizSyncResult> {
    if (!this.admin) {
      throw new Error("WCT standard quiz synchronization requires an admin store");
    }
    const parsedBooks = parseWctStandardQuizBookSyncs(books);

    const state = getState();
    for (const book of parsedBooks) {
      for (const set of book.sets) {
        const key = setKey(this.user.id, set.lessonKey);
        const existing = state.sets.get(key);
        const recordedBookId = state.standardBookIds.get(key);
        if (
          existing?.generatorVersion === "wct-review-v2"
          && recordedBookId !== book.bookId
        ) {
          throw new Error(
            `WCT quiz generator/version integrity collision for ${set.lessonKey}`
          );
        }
        if (
          existing
          && existing.generatorVersion === set.generatorVersion
          && existing.sourceHash === set.sourceHash
          && (
            existing.lessonKey !== set.lessonKey
            || existing.sourceKind !== set.sourceKind
            || existing.sourceId !== set.sourceId
            || stableStringify(existing.questions) !== stableStringify(set.questions)
          )
        ) {
          throw new Error(
            `WCT quiz generator/version integrity collision for ${set.lessonKey}`
          );
        }
      }
    }

    const sets = clone(state.sets);
    const progress = clone(state.progress);
    const standardBookIds = clone(state.standardBookIds);
    const popAttempts = cloneMemoryWctPopQuizAttempts();
    const result: WctStandardQuizSyncResult = {
      createdCount: 0,
      updatedCount: 0,
      unchangedCount: 0,
      resetQuizProgressCount: 0,
      resetPopProgressCount: 0
    };

    for (const book of parsedBooks) {
      let bookChanged = false;
      for (const set of book.sets) {
        const key = setKey(this.user.id, set.lessonKey);
        const existing = sets.get(key);
        standardBookIds.set(key, book.bookId);
        if (!existing) {
          sets.set(key, {
            ...clone(set),
            id: randomUUID(),
            ownerId: this.user.id,
            createdAt: new Date().toISOString()
          });
          result.createdCount += 1;
          bookChanged = true;
          continue;
        }
        if (
          existing.generatorVersion === set.generatorVersion
          && existing.sourceHash === set.sourceHash
        ) {
          result.unchangedCount += 1;
          continue;
        }

        sets.set(key, { ...existing, ...clone(set) });
        result.updatedCount += 1;
        bookChanged = true;
        for (const [key, storedProgress] of progress) {
          if (storedProgress.quizSetId === existing.id) {
            progress.delete(key);
            result.resetQuizProgressCount += 1;
          }
        }
      }
      if (
        bookChanged
        && invalidateMemoryWctPopQuizAttempt(
          popAttempts,
          this.user.id,
          book.bookId
        )
      ) {
        result.resetPopProgressCount += 1;
      }
    }

    state.sets = sets;
    state.progress = progress;
    state.standardBookIds = standardBookIds;
    commitMemoryWctPopQuizAttempts(popAttempts);
    return result;
  }

  async submitAttempt(
    input: WctQuizSubmission
  ): Promise<WctQuizAttemptResult> {
    const parsed = wctQuizSubmissionSchema.parse(input);
    const set = [...getState().sets.values()].find((candidate) => (
      candidate.id === parsed.quizSetId
      && candidate.ownerId === this.user.id
    ));
    if (!set) throw new Error("WCT quiz not found");

    const correctByQuestion = new Map(
      set.questions.map((question) => [question.id, question.correctChoiceId])
    );
    for (const answer of parsed.answers) {
      const question = set.questions.find((candidate) => (
        candidate.id === answer.questionId
      ));
      if (!question?.choices.some((choice) => choice.id === answer.choiceId)) {
        throw new Error("Unknown WCT quiz question or choice");
      }
    }

    const score = parsed.answers.filter((answer) => (
      correctByQuestion.get(answer.questionId) === answer.choiceId
    )).length;
    const completedAt = new Date().toISOString();
    getState().progress.set(progressKey(this.user.id, set.id), {
      quizSetId: set.id,
      userId: this.user.id,
      latestScore: score,
      completedAt
    });
    return { score, total: 5, completedAt };
  }
}
