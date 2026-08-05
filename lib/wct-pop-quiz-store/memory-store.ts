import { randomUUID } from "node:crypto";

import type { UserIdentity } from "@/lib/types";
import type { WctPopQuizStore } from "@/lib/wct-pop-quiz-store/contract";
import {
  type WctPopQuizAnswer,
  type WctPopQuizAttempt,
  type WctPopQuizCompleteInput,
  type WctPopQuizConfirmInput,
  type WctPopQuizConfirmResult,
  type WctPopQuizIncorrectDay,
  type WctPopQuizResult,
  type WctPopQuizStartInput,
  type WctPopQuizSummary
} from "@/lib/wct/pop-quiz/types";
import { wctPopQuizQuestionsSchema } from "@/lib/wct/pop-quiz/validation";

type MemoryWctPopQuizState = {
  attempts: Map<string, WctPopQuizAttempt>;
};

export type MemoryWctPopQuizAttempts = Map<string, WctPopQuizAttempt>;

const memoryWctPopQuizStateKey = Symbol.for("english-app.memory-wct-pop-quiz-store");

function getState(): MemoryWctPopQuizState {
  const globalState = globalThis as typeof globalThis & {
    [memoryWctPopQuizStateKey]?: MemoryWctPopQuizState;
  };
  return (globalState[memoryWctPopQuizStateKey] ??= {
    attempts: new Map()
  });
}

function attemptKey(ownerId: string, bookId: string) {
  return `${ownerId}:${bookId}`;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function cloneMemoryWctPopQuizAttempts(): MemoryWctPopQuizAttempts {
  return clone(getState().attempts);
}

export function invalidateMemoryWctPopQuizAttempt(
  attempts: MemoryWctPopQuizAttempts,
  ownerId: string,
  bookId: string
) {
  return attempts.delete(attemptKey(ownerId, bookId));
}

export function commitMemoryWctPopQuizAttempts(
  attempts: MemoryWctPopQuizAttempts
) {
  getState().attempts = attempts;
}

function resultFor(
  attempt: WctPopQuizAttempt,
  answer: WctPopQuizAnswer
): WctPopQuizConfirmResult {
  const question = attempt.questions.find((item) => item.question.id === answer.questionId);
  if (!question) throw new Error("WCT Pop Quiz question not found");
  return {
    answer: clone(answer),
    isCorrect: question.question.correctChoiceId === answer.choiceId,
    correctChoiceId: question.question.correctChoiceId,
    currentIndex: attempt.currentIndex
  };
}

function completedResult(attempt: WctPopQuizAttempt): WctPopQuizResult {
  if (attempt.latestScore === null || !attempt.completedAt) {
    throw new Error("WCT Pop Quiz attempt is not completed");
  }
  return {
    score: attempt.latestScore,
    total: attempt.questions.length,
    incorrectDays: clone(attempt.incorrectDays),
    completedAt: attempt.completedAt
  };
}

export function resetMemoryWctPopQuizStoreForTests() {
  getState().attempts.clear();
}

export class MemoryWctPopQuizStore implements WctPopQuizStore {
  constructor(private readonly user: UserIdentity) {}

  async getSummary(bookId: string): Promise<WctPopQuizSummary | null> {
    const attempt = getState().attempts.get(attemptKey(this.user.id, bookId));
    if (!attempt) return null;
    return clone({
      attemptId: attempt.attemptId,
      status: attempt.status,
      currentIndex: attempt.currentIndex,
      latestScore: attempt.latestScore,
      completedAt: attempt.completedAt,
      total: attempt.questions.length
    });
  }

  async getAttempt(bookId: string): Promise<WctPopQuizAttempt | null> {
    const attempt = getState().attempts.get(attemptKey(this.user.id, bookId));
    return attempt ? clone(attempt) : null;
  }

  async startAttempt(input: WctPopQuizStartInput): Promise<WctPopQuizAttempt> {
    const key = attemptKey(this.user.id, input.bookId);
    const existing = getState().attempts.get(key);
    if (existing?.status === "in_progress") return clone(existing);

    const created: WctPopQuizAttempt = {
      attemptId: randomUUID(),
      bookId: input.bookId,
      seed: input.seed,
      questions: wctPopQuizQuestionsSchema.parse(input.questions),
      answers: [],
      currentIndex: 0,
      status: "in_progress",
      latestScore: null,
      incorrectDays: [],
      startedAt: new Date().toISOString(),
      completedAt: null
    };
    getState().attempts.set(key, created);
    return clone(created);
  }

  async confirmAnswer(
    input: WctPopQuizConfirmInput
  ): Promise<WctPopQuizConfirmResult> {
    const key = attemptKey(this.user.id, input.bookId);
    const attempt = getState().attempts.get(key);
    if (!attempt || attempt.attemptId !== input.attemptId) {
      throw new Error("WCT Pop Quiz attempt not found");
    }

    const existingAnswer = attempt.answers.find((answer) => answer.questionId === input.questionId);
    if (existingAnswer) {
      if (existingAnswer.choiceId !== input.choiceId) {
        throw new Error("WCT Pop Quiz answer is already confirmed");
      }
      return resultFor(attempt, existingAnswer);
    }

    if (attempt.status !== "in_progress") {
      throw new Error("WCT Pop Quiz attempt is completed");
    }
    const question = attempt.questions[attempt.currentIndex];
    if (!question || question.question.id !== input.questionId) {
      throw new Error("WCT Pop Quiz question is not current");
    }
    if (!question.question.choices.some((choice) => choice.id === input.choiceId)) {
      throw new Error("Unknown WCT Pop Quiz question or choice");
    }

    const answer: WctPopQuizAnswer = {
      questionId: input.questionId,
      choiceId: input.choiceId,
      confirmedAt: new Date().toISOString()
    };
    attempt.answers.push(answer);
    attempt.currentIndex += 1;
    return resultFor(attempt, answer);
  }

  async completeAttempt(input: WctPopQuizCompleteInput): Promise<WctPopQuizResult> {
    const attempt = getState().attempts.get(attemptKey(this.user.id, input.bookId));
    if (!attempt || attempt.attemptId !== input.attemptId) {
      throw new Error("WCT Pop Quiz attempt not found");
    }
    if (attempt.status === "completed") return completedResult(attempt);
    if (attempt.currentIndex !== attempt.questions.length) {
      throw new Error("WCT Pop Quiz answers are incomplete");
    }

    const incorrectDays: WctPopQuizIncorrectDay[] = [];
    let score = 0;
    for (const question of attempt.questions) {
      const answer = attempt.answers.find((item) => item.questionId === question.question.id);
      if (answer?.choiceId === question.question.correctChoiceId) {
        score += 1;
      } else if (!incorrectDays.some((day) => day.dayId === question.dayId)) {
        incorrectDays.push({
          dayId: question.dayId,
          dayNumber: question.dayNumber,
          dayLabel: question.dayLabel
        });
      }
    }

    attempt.status = "completed";
    attempt.latestScore = score;
    attempt.incorrectDays = incorrectDays;
    attempt.completedAt = new Date().toISOString();
    return completedResult(attempt);
  }
}
