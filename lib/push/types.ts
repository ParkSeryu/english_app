import type { ExpressionCard, ExpressionDay } from "@/lib/types";

export type BrowserPushSubscriptionInput = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  expiration_time: string | null;
  user_agent: string | null;
  is_active: boolean;
};

export type TopicNotificationSendRow = {
  id: string;
  expression_day_id: string;
  requested_by: string;
  title: string;
  body: string;
  target_url: string;
  status: "pending" | "processing" | "completed" | "failed";
};

export type TopicNotificationDeliveryRow = {
  send_id: string;
  subscription_id: string;
  user_id: string;
  status: "pending" | "sent" | "failed";
  attempt_count: number;
};

export type TopicNotificationEligibility =
  | {
      eligible: true;
      topic: Pick<ExpressionDay, "id" | "owner_id" | "title" | "created_by" | "folder_id" | "folder">;
      publicCards: Array<Pick<ExpressionCard, "id" | "owner_id" | "english" | "source_order">>;
      title: string;
      body: string;
      targetUrl: string;
    }
  | {
      eligible: false;
      reason: string;
    };
