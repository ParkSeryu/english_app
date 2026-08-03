import { beforeEach, describe, expect, it } from "vitest";

import {
  ensureImportedWctQuizzes,
  ensurePremiumWctQuiz
} from "@/lib/wct/quiz/ensure";
import { premiumWctLessonKey, standardWctLessonKey } from "@/lib/wct/quiz/keys";
import type { WctQuizStore } from "@/lib/wct-quiz-store/contract";
import {
  MemoryWctQuizStore,
  resetMemoryWctQuizStoreForTests
} from "@/lib/wct-quiz-store/memory-store";
import type {
  WctQuizSetCreateInput
} from "@/lib/wct/quiz/types";
import {
  MemoryWctStore,
  resetMemoryWctStoreForTests
} from "@/lib/wct-store/memory-store";
import { getWctPremiumLesson } from "@/lib/wct/premium-lessons";
import type { WctApprovedImportInput } from "@/lib/wct/types";

const USER_ID = "00000000-0000-4000-8000-000000000001";

function importInput(): WctApprovedImportInput {
  return {
    idempotencyKey: "quiz-ensure-v1",
    payloadHash: "quiz-ensure-hash-v1",
    book: { title: "WCT Prenovice", levelLabel: "Prenovice" },
    days: [{
      dayNumber: 1,
      shortLabel: "요청",
      duplicateAction: "create",
      concepts: [],
      patterns: [{
        patternText: "I want to + verb",
        meaningKo: "~하고 싶어요",
        usageSource: "book",
        examples: [
          { englishText: "I want to book a table.", meaningKo: "테이블을 예약하고 싶어요." },
          { englishText: "I want to change my seat.", meaningKo: "자리를 바꾸고 싶어요." }
        ]
      }, {
        patternText: "Could you + verb?",
        meaningKo: "~해 주시겠어요?",
        usageSource: "book",
        examples: [
          { englishText: "Could you open the window?", meaningKo: "창문을 열어 주시겠어요?" },
          { englishText: "Could you speak slowly?", meaningKo: "천천히 말해 주시겠어요?" }
        ]
      }],
      importantNotes: [],
      practicePrompts: []
    }, {
      dayNumber: 2,
      shortLabel: "계획",
      duplicateAction: "create",
      concepts: [],
      patterns: [{
        patternText: "I'm going to + verb",
        meaningKo: "~할 예정이에요",
        usageSource: "book",
        examples: [
          { englishText: "I'm going to call her.", meaningKo: "그녀에게 전화할 예정이에요." },
          { englishText: "I'm going to leave early.", meaningKo: "일찍 떠날 예정이에요." }
        ]
      }],
      importantNotes: [],
      practicePrompts: []
    }]
  };
}

class FailOnceQuizStore implements WctQuizStore {
  attempts = 0;

  constructor(private readonly delegate: WctQuizStore) {}

  getSetByLessonKey(lessonKey: string) {
    return this.delegate.getSetByLessonKey(lessonKey);
  }

  getSummaryByLessonKey(lessonKey: string) {
    return this.delegate.getSummaryByLessonKey(lessonKey);
  }
  listSetsByLessonKeys(lessonKeys: string[]) {
    return this.delegate.listSetsByLessonKeys(lessonKeys);
  }

  createSetIfMissing(input: WctQuizSetCreateInput) {
    this.attempts += 1;
    if (this.attempts === 1) {
      return Promise.reject(new Error("temporary quiz failure"));
    }
    return this.delegate.createSetIfMissing(input);
  }

  submitAttempt: WctQuizStore["submitAttempt"] = (input) => (
    this.delegate.submitAttempt(input)
  );
}

describe("WCT quiz ensure", () => {
  beforeEach(() => {
    resetMemoryWctStoreForTests();
    resetMemoryWctQuizStoreForTests();
  });

  it("ensures every imported operation and reuses sets on exact replay", async () => {
    const wctStore = new MemoryWctStore({ id: USER_ID });
    const quizStore = new MemoryWctQuizStore({ id: USER_ID }, true);
    const input = importInput();
    const firstResult = await wctStore.importApprovedBatch(input);

    await ensureImportedWctQuizzes(wctStore, quizStore, firstResult);
    const firstSet = await quizStore.getSetByLessonKey(
      standardWctLessonKey(input.book.title, 1)
    );
    const secondSet = await quizStore.getSetByLessonKey(
      standardWctLessonKey(input.book.title, 2)
    );
    expect(firstSet).not.toBeNull();
    expect(secondSet).not.toBeNull();

    const replayResult = await wctStore.importApprovedBatch(input);
    await ensureImportedWctQuizzes(wctStore, quizStore, replayResult);
    await expect(quizStore.getSetByLessonKey(
      standardWctLessonKey(input.book.title, 1)
    )).resolves.toEqual(firstSet);
  });

  it("adds Day context to a transient failure and succeeds on retry", async () => {
    const wctStore = new MemoryWctStore({ id: USER_ID });
    const result = await wctStore.importApprovedBatch(importInput());
    const quizStore = new FailOnceQuizStore(
      new MemoryWctQuizStore({ id: USER_ID }, true)
    );

    await expect(ensureImportedWctQuizzes(wctStore, quizStore, result))
      .rejects.toThrow("Day 1");
    await expect(ensureImportedWctQuizzes(wctStore, quizStore, result))
      .resolves.toBeUndefined();
    expect(quizStore.attempts).toBe(3);
  });

  it("creates one immutable Premium set on repeated ensure", async () => {
    const lesson = getWctPremiumLesson("day-1");
    expect(lesson).not.toBeNull();
    if (!lesson) return;
    const quizStore = new MemoryWctQuizStore({ id: USER_ID }, true);

    const first = await ensurePremiumWctQuiz(quizStore, lesson);
    const replay = await ensurePremiumWctQuiz(quizStore, lesson);

    expect(replay).toEqual(first);
    expect(first.lessonKey).toBe(premiumWctLessonKey(lesson.id));
  });
});
