import type { UserIdentity } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import { pushSubscriptionInputSchema, type PushSubscriptionInput, type PushSubscriptionRow } from "@/lib/push/types";

function normalizeUserAgent(userAgent: string | null | undefined) {
  const trimmed = (userAgent ?? "").trim();
  return trimmed ? trimmed.slice(0, 500) : null;
}

export function parsePushSubscription(input: unknown): PushSubscriptionInput {
  return pushSubscriptionInputSchema.parse(input);
}

export async function listPushSubscriptionsForUser(user: UserIdentity): Promise<PushSubscriptionRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PushSubscriptionRow[];
}

export async function savePushSubscriptionForUser(user: UserIdentity, input: unknown, userAgent?: string | null) {
  const subscription = parsePushSubscription(input);
  const now = new Date().toISOString();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: normalizeUserAgent(userAgent),
        enabled: true,
        disabled_at: null,
        last_error: null,
        updated_at: now
      },
      { onConflict: "user_id,endpoint" }
    );
  if (error) throw new Error(error.message);
}

export async function disablePushSubscriptionForUser(user: UserIdentity, endpoint?: string | null) {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  let query = supabase
    .from("push_subscriptions")
    .update({ enabled: false, disabled_at: now, updated_at: now })
    .eq("user_id", user.id)
    .eq("enabled", true);
  if (endpoint) query = query.eq("endpoint", endpoint);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function listEnabledPushSubscriptionsForCron(): Promise<PushSubscriptionRow[]> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("enabled", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PushSubscriptionRow[];
}

export async function listEnabledPushSubscriptionsForUserByServiceRole(user: UserIdentity): Promise<PushSubscriptionRow[]> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PushSubscriptionRow[];
}

export async function markPushSubscriptionNotified(id: string, notifiedAt: Date) {
  const supabase = createServiceRoleSupabaseClient();
  const now = notifiedAt.toISOString();
  const { error } = await supabase
    .from("push_subscriptions")
    .update({ last_notified_at: now, last_error: null, updated_at: now })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markPushSubscriptionError(id: string, errorMessage: string) {
  const supabase = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("push_subscriptions")
    .update({ last_error: errorMessage.slice(0, 500), updated_at: now })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function disablePushSubscriptionById(id: string, errorMessage?: string) {
  const supabase = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("push_subscriptions")
    .update({ enabled: false, disabled_at: now, last_error: errorMessage?.slice(0, 500) ?? null, updated_at: now })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
