import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { savePushSubscription, deletePushSubscription } from "@/lib/push/subscriptions";
import { parseDeletePushSubscriptionInput, parsePushSubscriptionInput } from "@/lib/push/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = parsePushSubscriptionInput(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid push subscription", details: parsed.error.flatten() }, { status: 400 });
  }

  const userAgent = (await headers()).get("user-agent");
  await savePushSubscription(user, parsed.data, userAgent);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = parseDeletePushSubscriptionInput(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid push subscription", details: parsed.error.flatten() }, { status: 400 });
  }

  await deletePushSubscription(user, parsed.data.endpoint);
  return NextResponse.json({ ok: true });
}
