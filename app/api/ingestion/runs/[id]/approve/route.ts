import { NextResponse } from "next/server";

import { authenticateIngestionRequest } from "@/lib/ingestion/request-auth";
import { getAdminExpressionStore } from "@/lib/lesson-store";
import {
  buildLanguageExchangeNotificationCopy,
  createOwnerTopicNotificationSend,
  drainTopicNotificationDeliveries,
  isWebPushConfigured
} from "@/lib/push/topic-notifications";
import type { ExpressionDay } from "@/lib/types";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  const userOrResponse = authenticateIngestionRequest(request);
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const body = (await request.json()) as { approvalText?: unknown };
  const approvalText = String(body.approvalText ?? "").trim();
  const { id } = await params;

  try {
    const store = getAdminExpressionStore(userOrResponse);
    const draft = await store.getIngestionRun(id);
    const result = await store.approveDraft(id, approvalText);
    const notification = await maybeNotifyLanguageExchangeTopic(result.expressionDay, draft?.normalized_payload.expressions.length ?? result.expressionDay.expressions.length, userOrResponse);
    return NextResponse.json({ expressionDay: result.expressionDay, expressionUrls: result.expressionUrls, notification });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to approve expression day" }, { status: 400 });
  }
}

async function maybeNotifyLanguageExchangeTopic(
  expressionDay: ExpressionDay,
  addedCardCount: number,
  requestedBy: { id: string }
) {
  if (expressionDay.folder?.slug !== "language-exchange") return { skipped: "not-language-exchange" };

  const copy = buildLanguageExchangeNotificationCopy(expressionDay.title, addedCardCount);
  try {
    const sendResult = await createOwnerTopicNotificationSend({
      topicId: expressionDay.id,
      ownerId: expressionDay.owner_id,
      requestedBy,
      title: copy.title,
      body: copy.body
    });
    const drain = isWebPushConfigured()
      ? await drainTopicNotificationDeliveries({ sendId: sendResult.send.id })
      : { processed: 0, sent: 0, failed: 0, skipped: "web-push-env-missing" };

    return { send: sendResult.send, queuedDeliveries: sendResult.queuedDeliveries, drain };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to send language exchange notification." };
  }
}
