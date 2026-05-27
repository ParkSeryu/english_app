import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PushNotificationSettings } from "@/components/PushNotificationSettings";

const actionMocks = vi.hoisted(() => ({
  savePushSubscriptionAction: vi.fn(),
  disablePushSubscriptionAction: vi.fn(),
  sendTestPushNotificationAction: vi.fn()
}));

vi.mock("@/app/actions", () => actionMocks);

const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
const originalNotification = Object.getOwnPropertyDescriptor(globalThis, "Notification");
const originalPushManager = Object.getOwnPropertyDescriptor(window, "PushManager");

class MockNotification {
  static permission: NotificationPermission = "default";
  static requestPermission = vi.fn(async () => "granted" as NotificationPermission);
}

function installPushBrowser(subscriptionOverrides: Partial<PushSubscription> = {}) {
  const toJSON = vi.fn(() => ({ endpoint: "https://push.example/subscription", keys: { p256dh: "key", auth: "auth" } }));
  const unsubscribe = vi.fn(async () => true);
  const subscription = { endpoint: "https://push.example/subscription", toJSON, unsubscribe, ...subscriptionOverrides } as PushSubscription;
  const subscribe = vi.fn(async (): Promise<PushSubscription> => subscription);
  const getSubscription = vi.fn(async (): Promise<PushSubscription | null> => null);

  Object.defineProperty(globalThis, "Notification", { configurable: true, value: MockNotification });
  Object.defineProperty(window, "PushManager", { configurable: true, value: function PushManager() {} });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      ready: Promise.resolve({ pushManager: { getSubscription, subscribe } })
    }
  });

  return { subscription, subscribe, getSubscription, unsubscribe, toJSON };
}

describe("PushNotificationSettings", () => {
  afterEach(() => {
    vi.clearAllMocks();
    MockNotification.permission = "default";
    MockNotification.requestPermission = vi.fn(async () => "granted" as NotificationPermission);

    if (originalServiceWorker) Object.defineProperty(navigator, "serviceWorker", originalServiceWorker);
    else Reflect.deleteProperty(navigator, "serviceWorker");
    if (originalNotification) Object.defineProperty(globalThis, "Notification", originalNotification);
    else Reflect.deleteProperty(globalThis, "Notification");
    if (originalPushManager) Object.defineProperty(window, "PushManager", originalPushManager);
    else Reflect.deleteProperty(window, "PushManager");
  });

  it("shows setup guidance when VAPID public key is missing", () => {
    render(<PushNotificationSettings vapidPublicKey="" initiallyEnabled={false} />);

    expect(screen.getByText(/VAPID 키가 아직 설정되지 않아/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "복습 알림 켜기" })).toBeDisabled();
  });

  it("subscribes the browser and saves the subscription after permission is granted", async () => {
    const user = userEvent.setup();
    const browser = installPushBrowser();
    actionMocks.savePushSubscriptionAction.mockResolvedValue({ ok: true, message: "복습 알림을 켰습니다." });

    render(<PushNotificationSettings vapidPublicKey="dGVzdC1wdWJsaWMta2V5" initiallyEnabled={false} />);

    await user.click(await screen.findByRole("button", { name: "복습 알림 켜기" }));

    await waitFor(() => expect(browser.subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true })));
    await waitFor(() => expect(actionMocks.savePushSubscriptionAction).toHaveBeenCalledWith({ endpoint: "https://push.example/subscription", keys: { p256dh: "key", auth: "auth" } }));
    expect(await screen.findByText("복습 알림을 켰습니다.")).toBeInTheDocument();
  });

  it("unsubscribes locally and disables the server subscription", async () => {
    const user = userEvent.setup();
    const browser = installPushBrowser();
    browser.getSubscription.mockResolvedValue(browser.subscription);
    actionMocks.disablePushSubscriptionAction.mockResolvedValue({ ok: true, message: "복습 알림을 껐습니다." });

    render(<PushNotificationSettings vapidPublicKey="dGVzdC1wdWJsaWMta2V5" initiallyEnabled />);

    await user.click(await screen.findByRole("button", { name: "알림 끄기" }));

    await waitFor(() => expect(browser.unsubscribe).toHaveBeenCalled());
    expect(actionMocks.disablePushSubscriptionAction).toHaveBeenCalledWith("https://push.example/subscription");
    expect(await screen.findByText("복습 알림을 껐습니다.")).toBeInTheDocument();
  });

  it("sends a test notification only when enabled", async () => {
    const user = userEvent.setup();
    installPushBrowser();
    actionMocks.sendTestPushNotificationAction.mockResolvedValue({ ok: true, message: "테스트 알림을 보냈습니다." });

    render(<PushNotificationSettings vapidPublicKey="dGVzdC1wdWJsaWMta2V5" initiallyEnabled />);

    await user.click(await screen.findByRole("button", { name: "테스트 보내기" }));

    await waitFor(() => expect(actionMocks.sendTestPushNotificationAction).toHaveBeenCalled());
    expect(await screen.findByText("테스트 알림을 보냈습니다.")).toBeInTheDocument();
  });
});
