import { describe, expect, it } from "vitest";

import { pushSubscriptionToRow } from "@/lib/push/subscriptions";

describe("push subscription persistence mapping", () => {
  it("maps browser subscription JSON to an owner-scoped database row", () => {
    const row = pushSubscriptionToRow(
      { id: "user-a" },
      {
        endpoint: "https://push.example/subscription/1",
        expirationTime: Date.parse("2026-06-01T00:00:00.000Z"),
        keys: {
          p256dh: "p256dh-key",
          auth: "auth-secret"
        }
      },
      "test-agent"
    );

    expect(row).toMatchObject({
      user_id: "user-a",
      endpoint: "https://push.example/subscription/1",
      p256dh: "p256dh-key",
      auth: "auth-secret",
      expiration_time: "2026-06-01T00:00:00.000Z",
      user_agent: "test-agent",
      is_active: true,
      disabled_at: null
    });
    expect(Date.parse(row.last_seen_at)).not.toBeNaN();
    expect(Date.parse(row.updated_at)).not.toBeNaN();
  });
});
