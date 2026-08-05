import { beforeEach, describe, expect, it, vi } from "vitest";

import * as wctQuizStores from "@/lib/wct-quiz-store";
import {
  resetMemoryWctQuizStoreForTests
} from "@/lib/wct-quiz-store/memory-store";
import { standardWctLessonKey } from "@/lib/wct/quiz/keys";
import {
  MemoryWctStore,
  resetMemoryWctStoreForTests
} from "@/lib/wct-store/memory-store";

const OWNER_ID = "00000000-0000-4000-8000-000000000001";

function completeBody() {
  return {
    approvalText: "저장해",
    idempotencyKey: "wct-pre-novice-complete-v1",
    book: {
      title: "WCT Pattern Book Prenovice",
      levelLabel: "Pre Novice"
    },
    days: Array.from({ length: 16 }, (_, dayIndex) => {
      const dayNumber = dayIndex + 1;
      return {
        dayNumber,
        shortLabel: `가능성 연습 ${dayNumber}`,
        duplicateAction: "create",
        concepts: [],
        patterns: Array.from({ length: 5 }, (_, patternIndex) => {
          const letter = String.fromCharCode(65 + patternIndex);
          return {
            patternText: `can + base verb (${letter})`,
            meaningKo: `가능 표현 ${dayNumber}-${letter}`,
            usageNote: "Use can before a base verb.",
            usageSource: "book",
            examples: [{
              englishText: `I can finish task ${dayNumber}-${letter} today.`,
              meaningKo: `나는 오늘 과제 ${dayNumber}-${letter}를 끝낼 수 있다.`
            }]
          };
        }),
        importantNotes: [],
        practicePrompts: []
      };
    })
  };
}

function request(path: string, body: unknown, authorized = true) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(authorized ? { authorization: "Bearer test-token" } : {})
    },
    body: JSON.stringify(body)
  });
}

describe("WCT import API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("INGESTION_API_TOKEN", "test-token");
    vi.stubEnv("INGESTION_OWNER_ID", OWNER_ID);
    vi.stubEnv("E2E_MEMORY_STORE", "1");
    vi.stubEnv("E2E_FAKE_USER_ID", OWNER_ID);
    resetMemoryWctStoreForTests();
    resetMemoryWctQuizStoreForTests();
  });

  it("rejects a request without the configured bearer token", async () => {
    const { POST } = await import("@/app/api/wct/import/route");
    const response = await POST(request("/api/wct/import", completeBody(), false));
    expect(response.status).toBe(401);
  });

  it("rejects feedback that is not an explicit save approval", async () => {
    const { POST } = await import("@/app/api/wct/import/route");
    const response = await POST(request("/api/wct/import", {
      ...completeBody(),
      approvalText: "검토해줘"
    }));
    expect(response.status).toBe(409);
  });

  it("rejects a client-supplied owner field", async () => {
    const { POST } = await import("@/app/api/wct/import/route");
    const response = await POST(request("/api/wct/import", {
      ...completeBody(),
      ownerId: "00000000-0000-4000-8000-000000000002"
    }));
    expect(response.status).toBe(400);
  });

  it("imports a complete book once and reports an exact v2 replay", async () => {
    const body = completeBody();
    const { POST } = await import("@/app/api/wct/import/route");
    const first = await POST(request("/api/wct/import", body));
    const replay = await POST(request("/api/wct/import", body));

    expect(first.status).toBe(201);
    expect(await first.json()).toMatchObject({
      replayed: false,
      bookUrl: expect.stringMatching(/^\/lessons\/books\//),
      dayUrls: expect.arrayContaining([expect.stringMatching(/\/days\//)]),
      quizSync: {
        status: "synced",
        createdCount: 16,
        updatedCount: 0,
        unchangedCount: 0
      }
    });
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({
      replayed: true,
      quizSync: {
        status: "synced",
        createdCount: 0,
        updatedCount: 0,
        unchangedCount: 16
      }
    });

    const book = (await new MemoryWctStore({ id: OWNER_ID }).listBooks())[0];
    const quizStore = wctQuizStores.getWctQuizStore({ id: OWNER_ID });
    await expect(quizStore.getSetByLessonKey(
      standardWctLessonKey(book.title, 1)
    )).resolves.toMatchObject({ generatorVersion: "wct-review-v2" });
  });

  it("updates only a replaced Day in place and clears only its quiz progress", async () => {
    const body = completeBody();
    const { POST } = await import("@/app/api/wct/import/route");
    const firstResponse = await POST(request("/api/wct/import", body));
    expect(firstResponse.status).toBe(201);
    const wctStore = new MemoryWctStore({ id: OWNER_ID });
    const book = (await wctStore.listBooks())[0];
    const quizStore = wctQuizStores.getWctQuizStore({ id: OWNER_ID });
    const firstSet = await quizStore.getSetByLessonKey(
      standardWctLessonKey(book.title, 1)
    );
    const secondSet = await quizStore.getSetByLessonKey(
      standardWctLessonKey(book.title, 2)
    );
    if (!firstSet || !secondSet) throw new Error("missing generated fixture sets");
    await quizStore.submitAttempt({
      quizSetId: firstSet.id,
      answers: firstSet.questions.map((question) => ({
        questionId: question.id,
        choiceId: question.correctChoiceId
      }))
    });

    const replacement = {
      ...body,
      idempotencyKey: "wct-pre-novice-replace-day-1-v2",
      days: [{
        ...body.days[0],
        duplicateAction: "replace",
        shortLabel: "변경된 가능성 연습"
      }]
    };
    const replaced = await POST(request("/api/wct/import", replacement));

    expect(replaced.status).toBe(201);
    expect(await replaced.json()).toMatchObject({
      quizSync: {
        status: "synced",
        createdCount: 0,
        updatedCount: 1,
        unchangedCount: 15,
        resetQuizProgressCount: 1
      }
    });
    const firstAfter = await quizStore.getSetByLessonKey(firstSet.lessonKey);
    const secondAfter = await quizStore.getSetByLessonKey(secondSet.lessonKey);
    expect(firstAfter).toMatchObject({ id: firstSet.id });
    expect(firstAfter?.sourceHash).not.toBe(firstSet.sourceHash);
    expect(secondAfter).toEqual(secondSet);
    await expect(quizStore.getSummaryByLessonKey(firstSet.lessonKey))
      .resolves.toMatchObject({ latestScore: null });
  });

  it("reports a retryable atomic quiz failure while keeping source and quiz state", async () => {
    const body = completeBody();
    const { POST } = await import("@/app/api/wct/import/route");
    const firstResponse = await POST(request("/api/wct/import", body));
    expect(firstResponse.status).toBe(201);
    const wctStore = new MemoryWctStore({ id: OWNER_ID });
    const book = (await wctStore.listBooks())[0];
    const realAdmin = wctQuizStores.getAdminWctQuizStore({ id: OWNER_ID });
    const learner = wctQuizStores.getWctQuizStore({ id: OWNER_ID });
    const firstSet = await learner.getSetByLessonKey(
      standardWctLessonKey(book.title, 1)
    );
    if (!firstSet) throw new Error("missing generated fixture set");
    await learner.submitAttempt({
      quizSetId: firstSet.id,
      answers: firstSet.questions.map((question) => ({
        questionId: question.id,
        choiceId: question.correctChoiceId
      }))
    });
    vi.spyOn(wctQuizStores, "getAdminWctQuizStore").mockReturnValue({
      getSetById: (id) => realAdmin.getSetById(id),
      getSetByLessonKey: (key) => realAdmin.getSetByLessonKey(key),
      listSetsByLessonKeys: (keys) => realAdmin.listSetsByLessonKeys(keys),
      getSummaryByLessonKey: (key) => realAdmin.getSummaryByLessonKey(key),
      createSetIfMissing: (input) => realAdmin.createSetIfMissing(input),
      submitAttempt: (input) => realAdmin.submitAttempt(input),
      syncStandardSets: async () => {
        throw new Error("Day 1 forced synchronization failure");
      }
    });
    const replacement = {
      ...body,
      idempotencyKey: "wct-pre-novice-failing-replace-v2",
      days: [{
        ...body.days[0],
        duplicateAction: "replace",
        shortLabel: "실패 후에도 남는 새 소스"
      }]
    };

    const failed = await POST(request("/api/wct/import", replacement));

    expect(failed.status).toBe(500);
    expect(await failed.json()).toMatchObject({
      error: expect.stringMatching(/Day 1 forced synchronization failure/),
      sourceImportCommitted: true,
      quizSyncRollbackSafe: true,
      retryable: true
    });
    const storedBook = await wctStore.getBook(book.id);
    const storedDay = storedBook ? await wctStore.getDay(storedBook.days[0].id) : null;
    expect(storedDay).toMatchObject({ shortLabel: "실패 후에도 남는 새 소스" });
    await expect(learner.getSetByLessonKey(firstSet.lessonKey))
      .resolves.toEqual(firstSet);
    await expect(learner.getSummaryByLessonKey(firstSet.lessonKey))
      .resolves.toMatchObject({ latestScore: 5 });
  });

  it("preflights duplicate Days for the server-configured owner", async () => {
    const importRoute = await import("@/app/api/wct/import/route");
    const preflightRoute = await import("@/app/api/wct/import/preflight/route");
    await importRoute.POST(request("/api/wct/import", completeBody()));

    const response = await preflightRoute.POST(request("/api/wct/import/preflight", {
      bookTitle: "  wct pattern book PRENOVICE ",
      dayNumbers: [1, 17]
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      duplicates: [{
        dayNumber: 1,
        existingDayId: expect.any(String),
        existingDisplayLabel: "Day 1 (가능성 연습 1)"
      }]
    });
  });
});
