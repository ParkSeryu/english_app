import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PushNotificationSettings } from "@/components/PushNotificationSettings";

describe("PushNotificationSettings", () => {
  it("shows an unsupported state when no VAPID public key is configured", async () => {
    render(<PushNotificationSettings publicKey="" />);

    await waitFor(() => expect(screen.getByText(/Web Push를 사용할 수 없습니다/)).toBeInTheDocument());
    expect(screen.getByRole("switch", { name: "새 공통 토픽 알림 받기" })).toBeDisabled();
  });
});
