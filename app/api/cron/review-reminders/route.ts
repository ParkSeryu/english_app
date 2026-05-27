import { NextResponse } from "next/server";

import { sendDueReviewReminders } from "@/lib/push/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authorization = request.headers.get("authorization");
  if (authorization === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const result = await sendDueReviewReminders();
  return NextResponse.json({ ok: true, result });
}
