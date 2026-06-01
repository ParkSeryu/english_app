import type { SupabaseClient } from "@supabase/supabase-js";

import type { BrowserPushSubscriptionInput } from "@/lib/push/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserIdentity } from "@/lib/types";

function expirationTimeToIso(expirationTime: number | null | undefined) {
  if (!expirationTime) return null;
  const date = new Date(expirationTime);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function pushSubscriptionToRow(user: Pick<UserIdentity, "id">, subscription: BrowserPushSubscriptionInput, userAgent: string | null) {
  const timestamp = new Date().toISOString();
  return {
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    expiration_time: expirationTimeToIso(subscription.expirationTime),
    user_agent: userAgent,
    is_active: true,
    disabled_at: null,
    last_seen_at: timestamp,
    updated_at: timestamp
  };
}

export async function savePushSubscription(
  user: Pick<UserIdentity, "id">,
  subscription: BrowserPushSubscriptionInput,
  userAgent: string | null,
  createClient: () => Promise<SupabaseClient> = createServerSupabaseClient
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(pushSubscriptionToRow(user, subscription, userAgent), { onConflict: "endpoint" });

  if (error) throw error;
}

export async function deletePushSubscription(
  user: Pick<UserIdentity, "id">,
  endpoint: string,
  createClient: () => Promise<SupabaseClient> = createServerSupabaseClient
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .update({ is_active: false, disabled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) throw error;
}
