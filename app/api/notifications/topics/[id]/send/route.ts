import { NextResponse } from "next/server";

import { authenticateIngestionRequest } from "@/lib/ingestion/request-auth";
import { createTopicNotificationSend, drainTopicNotificationDeliveries, isWebPushConfigured } from "@/lib/push/topic-notifications";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  const userOrResponse = authenticateIngestionRequest(request);
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const { id } = await params;
  const result = await createTopicNotificationSend(id, userOrResponse);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });

  const drainResult = isWebPushConfigured()
    ? await drainTopicNotificationDeliveries({ sendId: result.send.id })
    : { processed: 0, sent: 0, failed: 0, skipped: "web-push-env-missing" };

  return NextResponse.json({ send: result.send, queuedDeliveries: result.queuedDeliveries, drain: drainResult }, { status: 202 });
}
