import { z } from "zod";

export const pushSubscriptionInputSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  })
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionInputSchema>;

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  enabled: boolean;
  disabled_at: string | null;
  last_notified_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type PushSendSummary = {
  considered: number;
  sent: number;
  skipped: number;
  disabled: number;
  failed: number;
};
