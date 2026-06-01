import { z } from "zod";

export const pushSubscriptionInputSchema = z.object({
  endpoint: z.string().trim().url().max(2_000),
  expirationTime: z.number().int().positive().nullable().optional(),
  keys: z.object({
    p256dh: z.string().trim().min(1).max(500),
    auth: z.string().trim().min(1).max(500)
  })
});

export const deletePushSubscriptionSchema = z.object({
  endpoint: z.string().trim().url().max(2_000)
});

export function parsePushSubscriptionInput(input: unknown) {
  return pushSubscriptionInputSchema.safeParse(input);
}

export function parseDeletePushSubscriptionInput(input: unknown) {
  return deletePushSubscriptionSchema.safeParse(input);
}
