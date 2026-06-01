"use client";

import { useEffect, useMemo, useState } from "react";

type PushState = "checking" | "unsupported" | "blocked" | "ready" | "subscribed" | "saving" | "error";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

async function getPushRegistration() {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

async function postSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/push/subscriptions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(subscription.toJSON())
  });
  if (!response.ok) throw new Error("Failed to save push subscription.");
}

async function deleteSubscription(endpoint: string) {
  const response = await fetch("/api/push/subscriptions", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint })
  });
  if (!response.ok) throw new Error("Failed to delete push subscription.");
}

export function PushNotificationSettings({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<PushState>("checking");
  const [message, setMessage] = useState("");
  const canUseConfiguredPush = useMemo(() => publicKey.trim().length > 0, [publicKey]);

  useEffect(() => {
    let alive = true;

    const check = async () => {
      if (!canUseConfiguredPush || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        if (alive) setState("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        if (alive) setState("blocked");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager.getSubscription();
        if (alive) setState(subscription ? "subscribed" : "ready");
      } catch {
        if (alive) setState("ready");
      }
    };

    void check();
    return () => {
      alive = false;
    };
  }, [canUseConfiguredPush]);

  const subscribe = async () => {
    setState("saving");
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setState("blocked");
        return;
      }
      if (permission !== "granted") {
        setState("ready");
        return;
      }

      const registration = await getPushRegistration();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      await postSubscription(subscription);
      setState("subscribed");
      setMessage("새 공통 토픽 알림을 받을 준비가 됐습니다.");
    } catch {
      setState("error");
      setMessage("알림 구독을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const unsubscribe = async () => {
    setState("saving");
    setMessage("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await deleteSubscription(endpoint);
      }
      setState("ready");
      setMessage("알림 구독을 해지했습니다.");
    } catch {
      setState("error");
      setMessage("알림 구독을 해지하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const disabled = state === "checking" || state === "saving" || state === "unsupported" || state === "blocked";

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-black text-teal-700">PWA 푸시 알림</p>
        <h1 className="text-2xl font-black text-ink">새 공통 토픽 알림</h1>
        <p className="text-sm leading-6 text-slate-600">앱을 설치하고 알림을 허용하면 새 공통 표현 묶음이 준비됐을 때 알림을 받을 수 있습니다.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-black text-ink">알림 받기</p>
            <p className="text-sm leading-6 text-slate-600">
              {state === "subscribed" ? "현재 브라우저에서 알림을 받고 있습니다." : "이 브라우저를 새 토픽 알림 대상으로 등록합니다."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state === "subscribed"}
            disabled={disabled}
            onClick={state === "subscribed" ? unsubscribe : subscribe}
            className={`relative h-8 w-14 shrink-0 rounded-full transition focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50 ${state === "subscribed" ? "bg-teal-600" : "bg-slate-300"}`}
          >
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${state === "subscribed" ? "left-7" : "left-1"}`} />
            <span className="sr-only">새 공통 토픽 알림 받기</span>
          </button>
        </div>

        {state === "unsupported" ? <p className="mt-4 text-sm font-bold text-amber-700">현재 브라우저나 환경에서는 Web Push를 사용할 수 없습니다. iOS는 홈 화면에 추가한 앱에서 지원됩니다.</p> : null}
        {state === "blocked" ? <p className="mt-4 text-sm font-bold text-red-700">브라우저에서 알림 권한이 차단되어 있습니다. 브라우저 설정에서 권한을 바꾼 뒤 다시 시도해 주세요.</p> : null}
        {message ? <p className="mt-4 text-sm font-bold text-slate-700">{message}</p> : null}
      </div>
    </section>
  );
}
