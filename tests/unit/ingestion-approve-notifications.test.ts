import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  approveDraft: vi.fn(),
  authenticateIngestionRequest: vi.fn(),
  createOwnerTopicNotificationSend: vi.fn(),
  drainTopicNotificationDeliveries: vi.fn(),
  getAdminExpressionStore: vi.fn(),
  getIngestionRun: vi.fn(),
  isWebPushConfigured: vi.fn()
}));

vi.mock("@/lib/ingestion/request-auth", () => ({
  authenticateIngestionRequest: mocks.authenticateIngestionRequest
}));

vi.mock("@/lib/lesson-store", () => ({
  getAdminExpressionStore: mocks.getAdminExpressionStore
}));

vi.mock("@/lib/push/topic-notifications", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/push/topic-notifications")>();
  return {
    ...actual,
    createOwnerTopicNotificationSend: mocks.createOwnerTopicNotificationSend,
    drainTopicNotificationDeliveries: mocks.drainTopicNotificationDeliveries,
    isWebPushConfigured: mocks.isWebPushConfigured
  };
});

const languageExchangeDay = {
  id: "topic-1",
  owner_id: "owner-1",
  title: "with Keyri",
  raw_input: "raw",
  source_note: "언어교환 표현",
  day_date: "2026-06-01",
  folder_id: "folder-1",
  folder: { id: "folder-1", name: "언어교환", slug: "language-exchange", parent_id: null, path_names: ["언어교환"] },
  folder_path: ["언어교환"],
  created_by: "llm" as const,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
  expressions: []
};

async function callApproveRoute() {
  const { POST } = await import("@/app/api/ingestion/runs/[id]/approve/route");
  return POST(
    new Request("https://english.example/api/ingestion/runs/run-1/approve", {
      method: "POST",
      body: JSON.stringify({ approvalText: "이대로 앱에 넣어줘" })
    }),
    { params: Promise.resolve({ id: "run-1" }) }
  );
}

describe("ingestion approval notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateIngestionRequest.mockReturnValue({ id: "owner-1" });
    mocks.getAdminExpressionStore.mockReturnValue({
      approveDraft: mocks.approveDraft,
      getIngestionRun: mocks.getIngestionRun
    });
    mocks.getIngestionRun.mockResolvedValue({ normalized_payload: { expressions: [{ english: "A" }, { english: "B" }] } });
    mocks.approveDraft.mockResolvedValue({ expressionDay: languageExchangeDay, expressionUrls: ["/expressions/card-1"] });
    mocks.createOwnerTopicNotificationSend.mockResolvedValue({
      send: { id: "send-1", expression_day_id: "topic-1", requested_by: "owner-1", title: "title", body: "body", target_url: "/expressions?topic=topic-1", status: "pending" },
      queuedDeliveries: 1
    });
    mocks.isWebPushConfigured.mockReturnValue(true);
    mocks.drainTopicNotificationDeliveries.mockResolvedValue({ processed: 1, sent: 1, failed: 0 });
  });

  it("sends language-exchange approval notifications only to the topic owner", async () => {
    const response = await callApproveRoute();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.createOwnerTopicNotificationSend).toHaveBeenCalledWith({
      topicId: "topic-1",
      ownerId: "owner-1",
      requestedBy: { id: "owner-1" },
      title: "새 언어교환 표현이 추가됐어요",
      body: "with Keyri에 새 표현 2개가 추가됐어요."
    });
    expect(mocks.drainTopicNotificationDeliveries).toHaveBeenCalledWith({ sendId: "send-1" });
    expect(body.notification).toMatchObject({ queuedDeliveries: 1, drain: { sent: 1, failed: 0 } });
  });

  it("does not send owner-only notifications for non-language-exchange topics", async () => {
    mocks.approveDraft.mockResolvedValueOnce({
      expressionDay: { ...languageExchangeDay, folder: { ...languageExchangeDay.folder, slug: "legacy-root" } },
      expressionUrls: ["/expressions/card-1"]
    });

    const response = await callApproveRoute();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.createOwnerTopicNotificationSend).not.toHaveBeenCalled();
    expect(body.notification).toEqual({ skipped: "not-language-exchange" });
  });
});
