"use client";

import Link from "next/link";
import { useState } from "react";

import {
  completeWctPopQuizAction,
  confirmWctPopQuizAnswerAction,
  startWctPopQuizAction
} from "@/app/lessons/books/[bookId]/pop-quiz/actions";
import { WctQuizQuestionStep } from "@/components/wct/WctQuizQuestionStep";
import type {
  WctPopQuizAnswer,
  WctPopQuizAttempt,
  WctPopQuizConfirmResult,
  WctPopQuizResult
} from "@/lib/wct/pop-quiz/types";

export function WctPopQuizRunner({ attempt, returnHref }: { attempt: WctPopQuizAttempt; returnHref: string }) {
  const total = attempt.questions.length;
  const [questionIndex, setQuestionIndex] = useState(attempt.currentIndex);
  const [answers, setAnswers] = useState<WctPopQuizAnswer[]>(attempt.answers);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [confirmation, setConfirmation] = useState<WctPopQuizConfirmResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [result, setResult] = useState<WctPopQuizResult | null>(
    attempt.status === "completed" && attempt.latestScore !== null && attempt.completedAt
      ? { score: attempt.latestScore, total, incorrectDays: attempt.incorrectDays, completedAt: attempt.completedAt }
      : null
  );
  const questionEntry = attempt.questions[questionIndex];
  const question = questionEntry?.question;
  const isFinalQuestion = questionIndex === total - 1;

  function selectChoice(choiceId: string) {
    if (isAnswerConfirmed || saving) return;
    setSelectedChoiceId(choiceId);
  }

  async function saveAnswer() {
    if (!question || !selectedChoiceId || saving || answers.some((answer) => answer.questionId === question.id)) return;
    setSaving(true);
    setSaveError(null);
    const actionResult = await confirmWctPopQuizAnswerAction({
      bookId: attempt.bookId,
      attemptId: attempt.attemptId,
      questionId: question.id,
      choiceId: selectedChoiceId
    });
    setSaving(false);
    if (!actionResult.ok) {
      setSaveError(actionResult.message);
      return;
    }
    setConfirmation(actionResult.data);
    setAnswers((current) => current.some((answer) => answer.questionId === actionResult.data.answer.questionId)
      ? current
      : [...current, actionResult.data.answer]);
  }

  function confirmAnswer() {
    if (!selectedChoiceId || isAnswerConfirmed || saving) return;
    setIsAnswerConfirmed(true);
    void saveAnswer();
  }

  function nextQuestion() {
    if (!confirmation || saving) return;
    setQuestionIndex(confirmation.currentIndex);
    setSelectedChoiceId(null);
    setIsAnswerConfirmed(false);
    setConfirmation(null);
    setSaveError(null);
  }

  async function completeAttempt() {
    if ((!confirmation && questionIndex !== total) || saving) return;
    setSaving(true);
    setSaveError(null);
    const actionResult = await completeWctPopQuizAction({ bookId: attempt.bookId, attemptId: attempt.attemptId });
    setSaving(false);
    if (!actionResult.ok) {
      setSaveError(actionResult.message);
      return;
    }
    setResult(actionResult.data);
  }

  async function retake() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    const actionResult = await startWctPopQuizAction({ bookId: attempt.bookId, mode: "retake" });
    if (actionResult && !actionResult.ok) {
      setSaveError(actionResult.message);
      setSaving(false);
    }
  }

  if (result) {
    const incorrectDays = Array.from(new Map(result.incorrectDays.map((day) => [day.dayId, day])).values());
    return (
      <section aria-label="Pop Quiz 결과" className="mx-auto flex w-full max-w-xl flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">WCT Pop Quiz 결과</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-0.04em] text-ink">{result.score} / {result.total}</h1>
        {incorrectDays.length ? (
          <div className="mt-7 w-full rounded-2xl bg-amber-50 p-4 text-left">
            <p className="font-black text-amber-900">다시 복습할 Day</p>
            <div className="mt-3 grid gap-2">
              {incorrectDays.map((day) => (
                <Link key={day.dayId} href={`${returnHref}/days/${day.dayId}`} className="rounded-xl bg-white px-4 py-3 font-bold text-teal-700">
                  Day {day.dayNumber} 복습
                </Link>
              ))}
            </div>
          </div>
        ) : <p className="mt-5 text-sm font-bold text-teal-700">모든 문제를 맞혔어요.</p>}
        {saveError ? <p role="alert" className="mt-4 text-sm font-bold text-rose-700">{saveError}</p> : null}
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <button type="button" onClick={retake} disabled={saving} className="flex-1 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-ink disabled:opacity-60">다시 풀기</button>
          <Link href={returnHref} className="flex-1 rounded-2xl bg-teal-700 px-5 py-3 font-black text-white">책으로 돌아가기</Link>
        </div>
      </section>
    );
  }

  if (!questionEntry) {
    return (
      <section className="mx-auto w-full max-w-xl">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">WCT Pop Quiz</p>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">{total} / {total}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-7">
          <h1 className="text-3xl font-black text-ink">{total} / {total}</h1>
          <p className="mt-3 text-sm font-medium text-slate-600">모든 답안을 저장했어요. 결과를 확인해 보세요.</p>
          <button type="button" onClick={completeAttempt} disabled={saving} className="mt-6 w-full rounded-2xl bg-teal-700 px-5 py-3 font-black text-white disabled:opacity-50">결과 보기</button>
          {saveError ? (
            <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-left text-sm font-bold text-rose-700">
              <p>{saveError}</p>
              <button type="button" onClick={completeAttempt} disabled={saving} className="mt-3 rounded-full bg-rose-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60">저장 다시 시도</button>
            </div>
          ) : null}
        </div>
      </section>
    );
  }
  const canAdvance = Boolean(confirmation) && !saving;
  return (
    <section className="mx-auto w-full max-w-xl">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">WCT Pop Quiz</p>
        <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">{questionIndex + 1} / {total}</p>
      </div>
      <WctQuizQuestionStep
        question={questionEntry.question}
        selectedChoiceId={selectedChoiceId}
        isAnswerConfirmed={isAnswerConfirmed}
        onSelectChoice={selectChoice}
        onConfirm={confirmAnswer}
        confirmDisabled={!selectedChoiceId || saving}
        nextLabel={isFinalQuestion ? "결과 보기" : "다음 문제"}
        onNext={isFinalQuestion ? completeAttempt : nextQuestion}
        nextDisabled={!canAdvance}
        feedbackContext={questionEntry.dayTopic
          ? `Day ${questionEntry.dayNumber} · ${questionEntry.dayTopic}`
          : questionEntry.dayLabel}
      />
      {isAnswerConfirmed && saveError ? (
        <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">
          <p>{saveError}</p>
          <button type="button" onClick={confirmation ? completeAttempt : saveAnswer} disabled={saving} className="mt-3 rounded-full bg-rose-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60">저장 다시 시도</button>
        </div>
      ) : null}
    </section>
  );
}
