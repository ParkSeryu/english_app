import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { isExplicitLessonSaveApproval } from "@/lib/ingestion/approval";
import { authenticateIngestionRequest } from "@/lib/ingestion/request-auth";
import { getAdminWctQuizStore } from "@/lib/wct-quiz-store";
import { ensureImportedWctQuizzes } from "@/lib/wct/quiz/ensure";
import { stableStringify } from "@/lib/wct/normalization";
import { wctImportRequestSchema } from "@/lib/wct/validation";
import { getAdminWctStore } from "@/lib/wct-store";

export async function POST(request: Request) {
  const ownerOrResponse = authenticateIngestionRequest(request);
  if (ownerOrResponse instanceof NextResponse) return ownerOrResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = wctImportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid WCT import payload" }, { status: 400 });
  }
  if (!isExplicitLessonSaveApproval(parsed.data.approvalText)) {
    return NextResponse.json({ error: "Explicit save approval required" }, { status: 409 });
  }

  const payload = { book: parsed.data.book, days: parsed.data.days };
  const payloadHash = createHash("sha256").update(stableStringify(payload)).digest("hex");
  let sourceImportCommitted = false;
  try {
    const wctStore = getAdminWctStore(ownerOrResponse);
    const result = await wctStore.importApprovedBatch({
      idempotencyKey: parsed.data.idempotencyKey,
      payloadHash,
      ...payload
    });
    sourceImportCommitted = true;
    const quizSync = await ensureImportedWctQuizzes(
      wctStore,
      getAdminWctQuizStore(ownerOrResponse),
      result
    );
    return NextResponse.json(
      { ...result, quizSync },
      { status: result.replayed ? 200 : 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "WCT import failed";
    const status = message.includes("Idempotency key") || message.includes("already exists") ? 409 : 500;
    return NextResponse.json({
      error: message,
      ...(sourceImportCommitted ? {
        sourceImportCommitted: true,
        quizSyncRollbackSafe: true,
        retryable: true
      } : {})
    }, { status });
  }
}
