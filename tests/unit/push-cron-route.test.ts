import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendDueReviewReminders: vi.fn()
}));

vi.mock("@/lib/push/send", () => ({
  sendDueReviewReminders: mocks.sendDueReviewReminders
}));

describe("review reminder cron route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
  });

  it("rejects requests without the cron secret", async () => {
    const { GET } = await import("@/app/api/cron/review-reminders/route");

    const response = await GET(new Request("https://english.example/api/cron/review-reminders"));

    expect(response.status).toBe(401);
    expect(mocks.sendDueReviewReminders).not.toHaveBeenCalled();
  });

  it("runs due reminder sending with a valid bearer secret", async () => {
    mocks.sendDueReviewReminders.mockResolvedValue({ considered: 1, sent: 1, skipped: 0, disabled: 0, failed: 0 });
    const { GET } = await import("@/app/api/cron/review-reminders/route");

    const response = await GET(new Request("https://english.example/api/cron/review-reminders", { headers: { authorization: "Bearer cron-secret" } }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, result: { sent: 1 } });
    expect(mocks.sendDueReviewReminders).toHaveBeenCalled();
  });
});
