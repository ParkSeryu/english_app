import { NextResponse } from "next/server";

import { authenticateIngestionRequest } from "@/lib/ingestion/request-auth";
import { wctPreflightRequestSchema } from "@/lib/wct/validation";
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
  const parsed = wctPreflightRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid WCT preflight payload" }, { status: 400 });
  }

  try {
    const duplicates = await getAdminWctStore(ownerOrResponse).findDuplicateDays(
      parsed.data.bookTitle,
      parsed.data.dayNumbers
    );
    return NextResponse.json({ duplicates });
  } catch {
    return NextResponse.json({ error: "WCT preflight failed" }, { status: 500 });
  }
}
