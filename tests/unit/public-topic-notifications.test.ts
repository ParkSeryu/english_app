import { describe, expect, it } from "vitest";

import { evaluateTopicNotificationEligibility } from "@/lib/push/topic-notifications";

const baseTopic = {
  id: "topic-1",
  owner_id: "admin-user",
  title: "여행 영어",
  created_by: "llm" as const,
  folder_id: "folder-1",
  folder: {
    id: "folder-1",
    name: "공통",
    slug: "legacy-root",
    parent_id: null,
    path_names: ["공통"]
  }
};

const sharedCard = { id: "card-1", owner_id: "admin-user", english: "Can I get a receipt?", source_order: 0 };
const privateLearnerCard = { id: "card-2", owner_id: "learner-user", english: "Can I add this?", source_order: 1 };

describe("public topic push notification eligibility", () => {
  it("allows shared LLM topics and excludes learner-owned private cards", () => {
    const result = evaluateTopicNotificationEligibility({
      topic: baseTopic,
      folderReadableByAll: true,
      cards: [sharedCard, privateLearnerCard]
    });

    expect(result.eligible).toBe(true);
    if (!result.eligible) throw new Error(result.reason);
    expect(result.publicCards).toEqual([sharedCard]);
    expect(result.targetUrl).toBe("/expressions?topic=topic-1");
    expect(result.body).toContain("1개");
  });

  it("rejects user-created private topics", () => {
    const result = evaluateTopicNotificationEligibility({
      topic: { ...baseTopic, created_by: "user" },
      folderReadableByAll: true,
      cards: [sharedCard]
    });

    expect(result).toMatchObject({ eligible: false, reason: "Only LLM/shared topics can be notified." });
  });

  it("rejects restricted folders", () => {
    const result = evaluateTopicNotificationEligibility({
      topic: { ...baseTopic, folder: { ...baseTopic.folder, slug: "language-exchange" } },
      folderReadableByAll: true,
      cards: [sharedCard]
    });

    expect(result).toMatchObject({ eligible: false, reason: "Restricted topic folders cannot be notified." });
  });

  it("rejects folders that are not readable by all authenticated users", () => {
    const result = evaluateTopicNotificationEligibility({
      topic: baseTopic,
      folderReadableByAll: false,
      cards: [sharedCard]
    });

    expect(result).toMatchObject({ eligible: false, reason: "Topic folder is not readable by all authenticated users." });
  });
});
