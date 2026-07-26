import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetMemoryWctStoreForTests } from "@/lib/wct-store/memory-store";

const OWNER_ID = "00000000-0000-4000-8000-000000000001";
const validBody = {
  approvalText: "저장해",
  idempotencyKey: "wct-pre-novice-day-1-v1",
  book: { title: "WCT Pattern book Prenovice", levelLabel: "Pre Novice" },
  days: [{
    dayNumber: 1,
    shortLabel: "수동태",
    duplicateAction: "create",
    concepts: [],
    patterns: [{
      patternText: "be + p.p.",
      usageSource: "book",
      examples: [{ englishText: "It is made of wood." }]
    }],
    importantNotes: [],
    practicePrompts: []
  }]
};

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
    vi.stubEnv("INGESTION_API_TOKEN", "test-token");
    vi.stubEnv("INGESTION_OWNER_ID", OWNER_ID);
    vi.stubEnv("E2E_MEMORY_STORE", "1");
    vi.stubEnv("E2E_FAKE_USER_ID", OWNER_ID);
    resetMemoryWctStoreForTests();
  });

  it("rejects a request without the configured bearer token", async () => {
    const { POST } = await import("@/app/api/wct/import/route");
    const response = await POST(request("/api/wct/import", validBody, false));
    expect(response.status).toBe(401);
  });

  it("rejects feedback that is not an explicit save approval", async () => {
    const { POST } = await import("@/app/api/wct/import/route");
    const response = await POST(request("/api/wct/import", {
      ...validBody,
      approvalText: "검토해줘"
    }));
    expect(response.status).toBe(409);
  });

  it("rejects a client-supplied owner field", async () => {
    const { POST } = await import("@/app/api/wct/import/route");
    const response = await POST(request("/api/wct/import", {
      ...validBody,
      ownerId: "00000000-0000-4000-8000-000000000002"
    }));
    expect(response.status).toBe(400);
  });

  it("imports once and reports an exact replay without duplicating content", async () => {
    const { POST } = await import("@/app/api/wct/import/route");
    const first = await POST(request("/api/wct/import", validBody));
    const replay = await POST(request("/api/wct/import", validBody));

    expect(first.status).toBe(201);
    expect(await first.json()).toMatchObject({
      replayed: false,
      bookUrl: expect.stringMatching(/^\/lessons\/books\//),
      dayUrls: [expect.stringMatching(/\/days\//)]
    });
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({ replayed: true });
  });

  it("preflights duplicate Days for the server-configured owner", async () => {
    const importRoute = await import("@/app/api/wct/import/route");
    const preflightRoute = await import("@/app/api/wct/import/preflight/route");
    await importRoute.POST(request("/api/wct/import", validBody));

    const response = await preflightRoute.POST(request("/api/wct/import/preflight", {
      bookTitle: "  wct pattern book PRENOVICE ",
      dayNumbers: [1, 2]
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      duplicates: [{
        dayNumber: 1,
        existingDayId: expect.any(String),
        existingDisplayLabel: "Day 1 (수동태)"
      }]
    });
  });
});
