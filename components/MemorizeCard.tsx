"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Fragment, useState, useTransition } from "react";

import { deletePersonalExpressionAction, recordExpressionReviewAction, recordExpressionReviewInPlaceAction } from "@/app/actions";
import { PronunciationButton } from "@/components/PronunciationButton";
import { nextExpressionReviewSchedule } from "@/lib/scheduling";
import { isAgainReviewResult } from "@/lib/review-result";
import type { ExpressionCard, ExpressionReviewResult } from "@/lib/types";

type MemorizeCardProps = {
  expression: ExpressionCard;
  returnTo?: string;
  onReveal?: () => void;
  onReviewSubmit?: (result: ExpressionReviewResult) => void;
  reviewNow?: Date;
};

export function MemorizeCard({ expression, returnTo = "/memorize", onReveal, onReviewSubmit, reviewNow = new Date() }: MemorizeCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [, startTransition] = useTransition();
  const topicContext = formatTopicContext(expression);
  const hardSchedule = nextExpressionReviewSchedule(expression, "hard", reviewNow);
  const okaySchedule = nextExpressionReviewSchedule(expression, "okay", reviewNow);
  const easySchedule = nextExpressionReviewSchedule(expression, "easy", reviewNow);

  function revealAnswer() {
    onReveal?.();
    setRevealed(true);
  }

  function handleReview(result: ExpressionReviewResult) {
    if (isAgainReviewResult(result)) {
      setRevealed(false);
      if (onReviewSubmit) {
        onReviewSubmit(result);
        startTransition(() => {
          void recordExpressionReviewInPlaceAction(expression.id, result).catch(reportReviewSaveFailure);
        });
        return;
      }
    }

    if (onReviewSubmit) {
      onReviewSubmit(result);
      startTransition(() => {
        void recordExpressionReviewInPlaceAction(expression.id, result).catch(reportReviewSaveFailure);
      });
      return;
    }

    startTransition(() => {
      void recordExpressionReviewAction(expression.id, result, returnTo);
    });
  }

  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-card sm:rounded-[2rem] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex flex-1 items-start gap-2">
          {topicContext ? (
            <div className="inline-flex min-w-0 w-fit max-w-full items-start rounded-2xl border border-teal-100 bg-teal-50/80 px-3 py-1.5 sm:rounded-full">
              <span className="min-w-0 whitespace-normal break-words text-xs font-black leading-snug text-ink sm:text-sm">{topicContext}</span>
            </div>
          ) : (
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-600">암기 카드</p>
          )}
          <MemorizeCardActions expressionId={expression.id} canEdit={Boolean(expression.can_edit)} canDelete={Boolean(expression.can_delete)} />
        </div>
        <div className="grid shrink-0 grid-cols-2 justify-items-end gap-x-2 gap-y-0.5 text-right text-[11px] font-bold leading-4 text-slate-500 sm:gap-x-3 sm:text-xs">
          <span>다시 {expression.unknown_count}회</span>
          <span>어려움 {expression.hard_count}회</span>
          <span>알긴암 {expression.okay_count}회</span>
          <span>쉬움 {expression.easy_count}회</span>
        </div>
      </div>

      {!revealed ? (
        <div className="mt-4 rounded-[1.5rem] bg-ink p-4 text-white shadow-lg shadow-slate-200 sm:mt-6 sm:rounded-3xl sm:p-5">
          <p className="text-xs font-black text-teal-200 sm:text-sm">한국어를 보고 영어로 말하기</p>
          <h1 className="mt-2 whitespace-pre-wrap text-xl font-black leading-tight sm:mt-3 sm:text-2xl">{expression.korean_prompt}</h1>
          <button type="button" onClick={revealAnswer} className="mt-4 min-h-12 w-full rounded-full bg-teal-600 px-5 py-2.5 text-center text-sm font-black text-white transition hover:bg-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-200 sm:mt-5 sm:min-h-14 sm:py-3 sm:text-base" aria-expanded="false">정답 보기</button>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-[1.5rem] bg-gradient-to-br from-ink to-slate-800 p-4 text-white shadow-lg shadow-slate-200 sm:mt-6 sm:rounded-[1.75rem] sm:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-200 sm:text-xs sm:tracking-[0.2em]">영어 정답</p>
            <h1 className="mt-2 whitespace-pre-wrap text-xl font-black leading-tight sm:mt-3 sm:text-2xl">{expression.english}</h1>
            <PronunciationButton text={expression.english} variant="dark" className="mt-3 sm:mt-4" />
            <div className="my-4 h-px bg-white/15 sm:my-5" />
            <p className="whitespace-pre-wrap text-base font-semibold leading-6 text-slate-100 sm:text-lg sm:leading-7">{expression.korean_prompt}</p>
          </div>
          <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4" aria-live="polite">
            {expression.grammar_note ? <Info title="문법/패턴" body={<GrammarPatternNote body={expression.grammar_note} />} /> : null}
            {expression.examples.length > 0 ? (
              <section className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">비슷한 표현</h2>
                <ul className="mt-2 space-y-2">
                  {expression.examples.map((example) => (
                    <li key={example.id} className="rounded-2xl bg-white p-3 text-slate-700">
                      <p>{example.example_text}</p>
                      {example.meaning_ko ? <p className="mt-1 text-sm text-slate-500">{example.meaning_ko}</p> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
              <button type="button" onClick={() => handleReview("again")} className="flex min-h-[3.25rem] w-full flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-1.5 py-2 text-[13px] font-black leading-tight text-rose-700 transition hover:bg-rose-100 sm:min-h-14 sm:rounded-full sm:px-5 sm:py-3 sm:text-base">
                <span>다시</span>
                <span className="mt-0.5 text-[11px] font-black text-rose-500 sm:text-xs">오늘 다시</span>
              </button>
              <button type="button" onClick={() => handleReview("hard")} className="flex min-h-[3.25rem] w-full flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-1.5 py-2 text-[13px] font-black leading-tight text-amber-700 transition hover:bg-amber-100 sm:min-h-14 sm:rounded-full sm:px-5 sm:py-3 sm:text-base">
                <span>어려움</span>
                <span className="mt-0.5 text-[11px] font-black text-amber-500 sm:text-xs">{formatReviewDueLabel(hardSchedule, reviewNow)}</span>
              </button>
              <button type="button" onClick={() => handleReview("okay")} className="flex min-h-[3.25rem] w-full flex-col items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-1.5 py-2 text-[13px] font-black leading-tight text-sky-700 transition hover:bg-sky-100 sm:min-h-14 sm:rounded-full sm:px-5 sm:py-3 sm:text-base">
                <span>알긴암</span>
                <span className="mt-0.5 text-[11px] font-black text-sky-500 sm:text-xs">{formatReviewDueLabel(okaySchedule, reviewNow)}</span>
              </button>
              <button type="button" onClick={() => handleReview("easy")} className="flex min-h-[3.25rem] w-full flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-1.5 py-2 text-[13px] font-black leading-tight text-emerald-700 transition hover:bg-emerald-100 sm:min-h-14 sm:rounded-full sm:px-5 sm:py-3 sm:text-base">
                <span>쉬움</span>
                <span className="mt-0.5 text-[11px] font-black text-emerald-500 sm:text-xs">{formatReviewDueLabel(easySchedule, reviewNow)}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

function reportReviewSaveFailure(error: unknown) {
  // A connection change can reject a server action even though the optimistic
  // queue has already advanced. Keep that expected transport failure out of
  // Next's client-error overlay while leaving a diagnostic breadcrumb.
  console.warn("Failed to record expression review", error);
}

function MemorizeCardActions({ expressionId, canEdit, canDelete }: { expressionId: string; canEdit: boolean; canDelete: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function toggleOpen() {
    setOpen((current) => {
      const nextOpen = !current;
      if (!nextOpen) setConfirmingDelete(false);
      return nextOpen;
    });
  }

  return (
    <div className="relative z-20 mt-0.5 shrink-0">
      <button
        type="button"
        onClick={toggleOpen}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="표현 작업 메뉴"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-base font-black leading-none text-slate-500 shadow-sm transition hover:border-teal-200 hover:bg-white hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100 sm:h-8 sm:w-8 sm:text-lg"
      >
        ⋯
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-20 w-40 rounded-2xl border border-slate-200 bg-white p-1.5 text-sm font-bold shadow-xl shadow-slate-900/10">
          {!canEdit && !canDelete ? <p className="px-3 py-2 text-xs font-bold leading-5 text-slate-500">내가 등록한 표현만 수정/삭제할 수 있어요.</p> : null}
          {canEdit ? (
            <Link href={`/expressions/${expressionId}/edit`} className="block rounded-xl px-3 py-2 text-slate-700 transition hover:bg-teal-50 hover:text-teal-700">
              수정
            </Link>
          ) : null}
          {canDelete ? (
            confirmingDelete ? (
              <div className="space-y-2 rounded-xl bg-red-50 p-2">
                <p className="text-xs font-bold leading-5 text-red-700">이 표현을 삭제할까요?</p>
                <form action={deletePersonalExpressionAction.bind(null, expressionId, "/memorize")} className="grid grid-cols-2 gap-1.5">
                  <button type="button" onClick={() => setConfirmingDelete(false)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-black text-slate-600 transition hover:border-slate-300">
                    취소
                  </button>
                  <button type="submit" className="rounded-lg bg-red-600 px-2 py-1.5 text-xs font-black text-white transition hover:bg-red-700">
                    삭제
                  </button>
                </form>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmingDelete(true)} className="block w-full rounded-xl px-3 py-2 text-left text-red-600 transition hover:bg-red-50">
                삭제
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function formatReviewDueLabel(schedule: { dueAt: string | null; intervalDays: number }, now: Date) {
  if (!schedule.dueAt) return "오늘 다시";

  const dueAt = new Date(schedule.dueAt);
  if (!Number.isFinite(dueAt.getTime())) return `${schedule.intervalDays}일 뒤`;

  const daysUntilDue = koreanCalendarDaysBetween(now, dueAt);
  return daysUntilDue <= 0 ? "오늘 다시" : `${daysUntilDue}일 뒤`;
}

const KOREA_TIME_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function koreanCalendarDaysBetween(from: Date, to: Date) {
  return Math.floor(koreanDayStart(to).getTime() / DAY_MS) - Math.floor(koreanDayStart(from).getTime() / DAY_MS);
}

function koreanDayStart(date: Date) {
  const koreaDate = new Date(date.getTime() + KOREA_TIME_OFFSET_MS);
  return new Date(Date.UTC(koreaDate.getUTCFullYear(), koreaDate.getUTCMonth(), koreaDate.getUTCDate()));
}

function formatTopicContext(expression: ExpressionCard) {
  const day = expression.day;
  if (!day) return null;

  const folderParts = Array.isArray(day.folder_path) ? day.folder_path.filter(Boolean) : [];
  const topicName = folderParts[folderParts.length - 1] ?? "";
  const title = formatTopicTitle(day.title, day.day_date);

  return [topicName, title].filter(Boolean).join(" ");
}

function formatTopicTitle(title: string, dayDate?: string | null) {
  const trimmedTitle = title.trim();
  const compactDate = dayDate?.replaceAll("-", "").slice(2);
  if (!compactDate || !/^\d{6}$/.test(compactDate)) return trimmedTitle;
  if (new RegExp(`\\(${compactDate}\\)\\s*$`).test(trimmedTitle)) return trimmedTitle;
  return `${trimmedTitle} (${compactDate})`;
}

function Info({ title, body }: { title: string; body: ReactNode }) {
  return <section className="rounded-3xl border border-slate-100 bg-slate-50 p-4"><h2 className="text-sm font-black uppercase tracking-wide text-slate-500">{title}</h2><div className="mt-2 whitespace-pre-wrap text-base leading-7 text-slate-700">{body}</div></section>;
}

function GrammarPatternNote({ body }: { body: string }) {
  return body.split("\n").map((line, index) => {
    const labeledLine = line.match(/^([\s★]*)(문법|패턴):(.*)$/u);
    const lineBreak = index > 0 ? "\n" : null;

    if (labeledLine) {
      const [, starPrefix, label, rest] = labeledLine;

      return (
        <Fragment key={`${index}-${line}`}>
          {lineBreak}
          {starPrefix}
          <strong className="rounded-full bg-teal-100 px-2 py-0.5 font-black text-teal-800">{label}</strong>
          {renderMeaningSeparator(rest)}
        </Fragment>
      );
    }

    return <Fragment key={`${index}-${line}`}>{lineBreak}{renderMeaningSeparator(line)}</Fragment>;
  });
}

function renderMeaningSeparator(text: string) {
  const separatedMeaning = text.match(/^(\s*)(.*?) = (.*)$/u);

  if (!separatedMeaning) return text;

  return (
    <>
      {separatedMeaning[1]}
      <span className="inline-flex flex-wrap items-center gap-1.5 align-baseline">
        <span>{separatedMeaning[2]}</span>
        <span className="inline-flex rounded-full bg-slate-200 px-1.5 py-0.5 text-xs font-black leading-none text-slate-500" aria-label="뜻">
          →
        </span>
        <span>{separatedMeaning[3]}</span>
      </span>
    </>
  );
}
