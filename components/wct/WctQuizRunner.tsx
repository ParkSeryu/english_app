"use client";

import Link from "next/link";
import { useState } from "react";

import { submitWctQuizAttemptAction } from "@/app/lessons/quiz-actions";
import { WctQuizQuestionStep } from "@/components/wct/WctQuizQuestionStep";
import type {
  WctQuizActionResult,
  WctQuizAnswer,
  WctQuizSet,
  WctQuizSourceContext
} from "@/lib/wct/quiz/types";

const saveFailureMessage = "결과를 저장하지 못했어요. 다시 시도해 주세요.";

export function WctQuizRunner({
  quizSet,
  returnHref,
  sourceContext
}: {
  quizSet: WctQuizSet;
  returnHref: string;
  sourceContext?: WctQuizSourceContext;
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [answers, setAnswers] = useState<WctQuizAnswer[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Extract<WctQuizActionResult, { ok: true }> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const question = quizSet.questions[questionIndex];
  const localScore = answers.filter((answer) => quizSet.questions.find((candidate) => candidate.id === answer.questionId)?.correctChoiceId === answer.choiceId).length;

  function selectChoice(choiceId: string) {
    if (isAnswerConfirmed || saving || result) return;
    setSelectedChoiceId(choiceId);
  }

  function confirmAnswer() {
    if (!selectedChoiceId || isAnswerConfirmed || saving || result) return;
    setAnswers((current) => [...current, { questionId: question.id, choiceId: selectedChoiceId }]);
    setIsAnswerConfirmed(true);
  }

  function nextQuestion() {
    if (!isAnswerConfirmed || questionIndex >= quizSet.questions.length - 1) return;
    setQuestionIndex((current) => current + 1);
    setSelectedChoiceId(null);
    setIsAnswerConfirmed(false);
  }

  async function showAndSaveResult() {
    if (answers.length !== 5 || saving) return;
    setShowResult(true);
    setSaving(true);
    setSaveError(null);
    const actionResult = await submitWctQuizAttemptAction({
      quizSetId: quizSet.id,
      answers,
      ...(sourceContext ? { sourceContext } : {})
    });
    setSaving(false);
    if (actionResult.ok) {
      setResult(actionResult);
      setSaveError(null);
    } else {
      setSaveError(actionResult.message || saveFailureMessage);
    }
  }

  function restart() {
    setQuestionIndex(0);
    setSelectedChoiceId(null);
    setIsAnswerConfirmed(false);
    setAnswers([]);
    setShowResult(false);
    setSaving(false);
    setResult(null);
    setSaveError(null);
  }

  if (showResult) {
    const displayedScore = result?.score ?? localScore;
    return (
      <section aria-label="퀴즈 결과" className="mx-auto flex w-full max-w-xl flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">WCT 복습 결과</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-0.04em] text-ink">{displayedScore} / 5</h1>
        <p aria-live="polite" className={`mt-4 text-sm font-bold ${saveError ? "text-rose-700" : "text-slate-600"}`}>
          {saving ? "결과를 저장하고 있어요" : result ? "저장됐어요" : "저장되지 않았어요"}
        </p>
        {saveError ? (
          <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            <p>{saveError}</p>
            <button type="button" onClick={showAndSaveResult} disabled={saving} className="mt-3 rounded-full bg-rose-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60">저장 다시 시도</button>
          </div>
        ) : null}
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <button type="button" onClick={restart} disabled={saving} className="flex-1 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-ink disabled:opacity-60">다시 풀기</button>
          <Link href={returnHref} className="flex-1 rounded-2xl bg-teal-700 px-5 py-3 font-black text-white">Day로 돌아가기</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-xl">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">WCT 복습</p>
        <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">{questionIndex + 1} / {quizSet.questions.length}</p>
      </div>
      <WctQuizQuestionStep
        question={question}
        selectedChoiceId={selectedChoiceId}
        isAnswerConfirmed={isAnswerConfirmed}
        onSelectChoice={selectChoice}
        onConfirm={confirmAnswer}
        confirmDisabled={!selectedChoiceId}
        nextLabel={questionIndex === quizSet.questions.length - 1 ? "결과 보기" : "다음 문제"}
        onNext={questionIndex === quizSet.questions.length - 1 ? showAndSaveResult : nextQuestion}
      />
    </section>
  );
}
