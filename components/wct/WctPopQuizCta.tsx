"use client";

import { useState } from "react";

import { startWctPopQuizAction } from "@/app/lessons/books/[bookId]/pop-quiz/actions";
import type { WctPopQuizSummary } from "@/lib/wct/pop-quiz/types";

export function WctPopQuizCta({
  bookId,
  summary,
  isEligible = true
}: {
  bookId: string;
  summary: WctPopQuizSummary | null;
  isEligible?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!isEligible) return null;

  const mode = summary?.status === "completed" ? "retake" : "start";
  const label = summary?.status === "in_progress"
    ? `이어 풀기 · ${summary.currentIndex}/20`
    : summary?.latestScore != null
      ? `다시 풀기 · 최근 ${summary.latestScore}/20`
      : "Pop Quiz · 20문제";

  async function startQuiz() {
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await startWctPopQuizAction({ bookId, mode });
    if (result && !result.ok) setError(result.message);
    setPending(false);
  }

  return (
    <section className="rounded-3xl border border-teal-100 bg-teal-50 p-5 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">WCT Pop Quiz</p>
      <p className="mt-2 text-sm font-medium text-slate-700">책 전체를 20문제로 복습해 보세요.</p>
      <button
        type="button"
        onClick={startQuiz}
        disabled={pending}
        className="mt-4 w-full rounded-2xl bg-teal-700 px-5 py-3 font-black text-white disabled:opacity-60"
      >
        {label}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm font-bold text-rose-700">{error}</p> : null}
    </section>
  );
}
