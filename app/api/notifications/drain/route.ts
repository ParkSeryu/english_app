import { NextResponse } from "next/server";

import { authenticateIngestionRequest } from "@/lib/ingestion/request-auth";
import { drainTopicNotificationDeliveries, isWebPushConfigured } from "@/lib/push/topic-notifications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userOrResponse = authenticateIngestionRequest(request);
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  if (!isWebPushConfigured()) {
    return NextResponse.json({ error: "Web Push is not configured." }, { status: 503 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "25");
  const sendId = url.searchParams.get("sendId") ?? undefined;
  const result = await drainTopicNotificationDeliveries({ sendId, limit: Number.isFinite(limit) ? limit : 25 });
  return NextResponse.json(result);
}
