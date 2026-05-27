"use client";

import { useEffect, useState, useTransition } from "react";

import { disablePushSubscriptionAction, savePushSubscriptionAction, sendTestPushNotificationAction } from "@/app/actions";

type SupportState = "checking" | "unsupported" | "denied" | "config-missing" | "ready";

type PushNotificationSettingsProps = {
  vapidPublicKey: string;
  initiallyEnabled: boolean;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

function pushSupportState(vapidPublicKey: string): SupportState {
  if (!vapidPublicKey) return "config-missing";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return "ready";
}

function supportMessage(state: SupportState) {
  switch (state) {
    case "config-missing":
      return "서버에 VAPID 키가 아직 설정되지 않아 알림을 켤 수 없습니다.";
    case "unsupported":
      return "이 브라우저는 웹 푸쉬를 지원하지 않습니다. iPhone은 홈 화면에 추가한 웹앱에서 알림을 켜 주세요.";
    case "denied":
      return "브라우저 알림 권한이 차단되어 있습니다. 브라우저/OS 설정에서 알림을 허용해 주세요.";
    case "checking":
      return "알림 지원 여부를 확인하고 있습니다.";
    default:
      return "하루에 한 번, 복습할 표현이 있을 때만 알려드릴게요.";
  }
}

export function PushNotificationSettings({ vapidPublicKey, initiallyEnabled }: PushNotificationSettingsProps) {
  const [supportState, setSupportState] = useState<SupportState>("checking");
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSupportState(pushSupportState(vapidPublicKey));
  }, [vapidPublicKey]);

  const canUsePush = supportState === "ready";

  const enableNotifications = () => {
    startTransition(async () => {
      try {
        setMessage("");
        const permission = await Notification.requestPermission();
        if (permission === "denied") {
          setSupportState("denied");
          setMessage("브라우저 알림 권한이 차단되었습니다.");
          return;
        }
        if (permission !== "granted") {
          setMessage("알림 권한이 허용되지 않았습니다.");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        const subscription = existingSubscription ?? await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        const result = await savePushSubscriptionAction(subscription.toJSON());
        if (!result.ok) {
          setMessage(result.message ?? "알림 구독 저장에 실패했습니다.");
          return;
        }
        setEnabled(true);
        setMessage(result.message ?? "복습 알림을 켰습니다.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "알림을 켜는 중 문제가 발생했습니다.");
      }
    });
  };

  const disableNotifications = () => {
    startTransition(async () => {
      try {
        setMessage("");
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        const endpoint = subscription?.endpoint ?? null;
        if (subscription) await subscription.unsubscribe();
        const result = await disablePushSubscriptionAction(endpoint);
        if (!result.ok) {
          setMessage(result.message ?? "알림 끄기에 실패했습니다.");
          return;
        }
        setEnabled(false);
        setMessage(result.message ?? "복습 알림을 껐습니다.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "알림을 끄는 중 문제가 발생했습니다.");
      }
    });
  };

  const sendTest = () => {
    startTransition(async () => {
      const result = await sendTestPushNotificationAction();
      setMessage(result.message ?? (result.ok ? "테스트 알림을 보냈습니다." : "테스트 알림에 실패했습니다."));
    });
  };

  return (
    <section className="rounded-[2rem] border border-teal-100 bg-white p-5 shadow-sm" aria-labelledby="push-notification-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-teal-700">Review reminder</p>
          <h2 id="push-notification-heading" className="mt-1 text-xl font-black text-ink">복습 알림</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${enabled ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"}`}>{enabled ? "켜짐" : "꺼짐"}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{supportMessage(supportState)}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">iPhone/iPad는 Safari에서 홈 화면에 추가한 뒤 웹앱으로 열어야 알림 권한을 요청할 수 있습니다.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {!enabled ? (
          <button type="button" className="btn-primary min-h-11 px-4 py-2 text-sm" disabled={!canUsePush || isPending} onClick={enableNotifications}>복습 알림 켜기</button>
        ) : (
          <button type="button" className="btn-secondary min-h-11 px-4 py-2 text-sm" disabled={isPending} onClick={disableNotifications}>알림 끄기</button>
        )}
        <button type="button" className="btn-ghost min-h-11 px-4 py-2 text-sm" disabled={!enabled || isPending} onClick={sendTest}>테스트 보내기</button>
      </div>
      {message ? <p className="mt-3 text-sm font-bold text-teal-800" role="status">{message}</p> : null}
    </section>
  );
}
