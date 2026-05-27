import { describe, expect, it } from "vitest";

import { pushSubscriptionInputSchema } from "@/lib/push/types";
import { wasNotifiedToday } from "@/lib/push/send";

describe("push notification helpers", () => {
  it("validates browser push subscription payloads", () => {
    expect(pushSubscriptionInputSchema.parse({ endpoint: "https://push.example/sub", keys: { p256dh: "key", auth: "auth" } })).toMatchObject({
      endpoint: "https://push.example/sub",
      keys: { p256dh: "key", auth: "auth" }
    });
    expect(() => pushSubscriptionInputSchema.parse({ endpoint: "not-a-url", keys: { p256dh: "key", auth: "auth" } })).toThrow();
  });

  it("throttles automatic reminders by Korean calendar day", () => {
    const now = new Date("2026-05-27T01:00:00.000Z");
    expect(wasNotifiedToday("2026-05-26T15:30:00.000Z", now)).toBe(true);
    expect(wasNotifiedToday("2026-05-26T14:59:00.000Z", now)).toBe(false);
    expect(wasNotifiedToday(null, now)).toBe(false);
  });
});
