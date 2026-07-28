import { randomUUID } from "node:crypto";

import type { UserIdentity } from "@/lib/types";
import type { WctQuizStore } from "@/lib/wct-quiz-store/contract";
import type {
  WctQuizAttemptResult,
  WctQuizSet,
  WctQuizSetCreateInput,
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
};

const memoryWctQuizStateKey = Symbol.for("english-app.memory-wct-quiz-store");

function getState(): MemoryWctQuizState {
  const globalState = globalThis as typeof globalThis & {
    [memoryWctQuizStateKey]?: MemoryWctQuizState;
  };
  return (globalState[memoryWctQuizStateKey] ??= {
    sets: new Map(),
    progress: new Map()
  });
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
}

export class MemoryWctQuizStore implements WctQuizStore {
  constructor(
    private readonly user: UserIdentity,
    private readonly admin = false
  ) {}

  async getSetByLessonKey(lessonKey: string): Promise<WctQuizSet | null> {
    const set = getState().sets.get(setKey(this.user.id, lessonKey));
    return set ? clone(set) : null;
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
