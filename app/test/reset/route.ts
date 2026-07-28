import { NextResponse } from "next/server";

import { resetMemoryExpressionStoreForTests } from "@/lib/lesson-store";
import { isE2EMemoryMode } from "@/lib/test-mode";
import { resetMemoryWctQuizStoreForTests } from "@/lib/wct-quiz-store/memory-store";
import { resetMemoryWctStoreForTests } from "@/lib/wct-store/memory-store";

export async function POST() {
  if (!isE2EMemoryMode()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  resetMemoryExpressionStoreForTests();
  resetMemoryWctQuizStoreForTests();
  resetMemoryWctStoreForTests();
  return NextResponse.json({ ok: true });
}
