import { NextResponse } from "next/server";

import { resetMemoryExpressionStoreForTests } from "@/lib/lesson-store";
import { isE2EMemoryMode } from "@/lib/test-mode";
import { resetMemoryWctStoreForTests } from "@/lib/wct-store/memory-store";

export async function POST() {
  if (!isE2EMemoryMode()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  resetMemoryExpressionStoreForTests();
  resetMemoryWctStoreForTests();
  return NextResponse.json({ ok: true });
}
