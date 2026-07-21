import Link from "next/link";

import { EmptyState } from "@/components/EmptyState";
import { ExpressionReviewStats } from "@/components/ExpressionReviewStats";
import { PronunciationButton } from "@/components/PronunciationButton";
import { TopicFilterSelect } from "@/components/TopicFilterSelect";
import { requireCurrentUser } from "@/lib/auth";
import { getExpressionDueLabel } from "@/lib/expression-due-label";
import { filterExpressionDaysByQuery } from "@/lib/expression-search";
import { getExpressionStore } from "@/lib/lesson-store";
import { sortExpressionsByPriority } from "@/lib/expression-priority";
import { getExpressionTopicDepth, getExpressionTopicDisplayLabel, sortExpressionTopicsByFolder } from "@/lib/expression-topic-label";
import type { ExpressionDay } from "@/lib/types";

export const dynamic = "force-dynamic";

type ExpressionDayListItem = ExpressionDay & {
  folder_path?: string[] | string | null;
  folderPath?: string | null;
  folder?: {
    path?: string | null;
    name?: string | null;
  };
};

type SearchParams = Promise<{ day?: string; topic?: string; q?: string }>;

export default async function ExpressionsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const days = sortExpressionTopicsByFolder(await getExpressionStore(user).listExpressionDays() as ExpressionDayListItem[]);
  const requestedTopicId = params.topic ?? params.day;
  const requestedTopicBlocked = Boolean(requestedTopicId && !days.some((day) => day.id === requestedTopicId));
  const selectedTopicId = pickSelectedTopicId(days, requestedTopicId);
  const selectedDay = days.find((day) => day.id === selectedTopicId) ?? null;
  const query = params.q?.trim() ?? "";
  const isSearching = query.length > 0;
  const topicOptions = days.map((day) => ({
    id: day.id,
    label: getExpressionTopicDisplayLabel(day),
    depth: getExpressionTopicDepth(day)
  }));
  const visibleDays = isSearching
    ? filterExpressionDaysByQuery(days, query).map((day) => ({
        ...day,
        expressions: sortExpressionsByPriority(day.expressions)
      }))
    : selectedDay
      ? [{ ...selectedDay, expressions: sortExpressionsByPriority(selectedDay.expressions) }]
      : [];
  const resultCount = visibleDays.reduce((count, day) => count + day.expressions.length, 0);

  return (
    <div className="space-y-5">
      <div><p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">표현</p><h1 className="mt-2 text-3xl font-black text-ink">표현 모아보기</h1><p className="mt-3 text-sm leading-6 text-slate-600">토픽을 고르거나 전체 표현에서 영어와 한국어를 검색하세요.</p></div>
      {days.length === 0 ? <EmptyState title="아직 표현이 없습니다" body="배운 표현이 생기면 토픽별로 여기에 쌓입니다." actionHref="/memorize" actionLabel="암기 화면 보기" /> : (
        <div className="space-y-5">
          <form action="/expressions" method="get" role="search" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            {selectedTopicId ? <input type="hidden" name="topic" value={selectedTopicId} /> : null}
            <label className="block" htmlFor="expression-search">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">전체 표현 검색</span>
              <span className="sr-only">영어 또는 한국어로 검색</span>
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="expression-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="영어 또는 한국어를 입력하세요"
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-ink outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
              />
              <button type="submit" className="rounded-2xl bg-teal-600 px-5 py-3 font-black text-white transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200">검색</button>
            </div>
            {isSearching ? (
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <p className="font-semibold text-slate-600" role="status"><span className="font-black text-ink">{query}</span> 검색 결과 {resultCount}개</p>
                <Link href={selectedTopicId ? `/expressions?topic=${selectedTopicId}` : "/expressions"} className="shrink-0 font-bold text-teal-700">검색 지우기</Link>
              </div>
            ) : null}
          </form>
          {!isSearching && requestedTopicBlocked ? (
            <p className="text-sm text-amber-700" role="status" aria-live="polite">요청한 토픽에는 접근할 수 없어서 첫 번째 토픽으로 이동했습니다.</p>
          ) : null}
          {!isSearching && selectedTopicId ? <TopicFilterSelect options={topicOptions} selectedId={selectedTopicId} /> : null}
          {isSearching && visibleDays.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <h2 className="text-xl font-black text-ink">일치하는 표현이 없습니다</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">다른 영어 또는 한국어 검색어를 입력해 보세요.</p>
            </div>
          ) : null}
          {visibleDays.map((day) => (
            <section key={day.id} className="space-y-3">
              <div><p className="text-xs font-bold uppercase tracking-wide text-teal-700">{day.day_date ?? "날짜 없음"}</p><h2 className="mt-1 text-2xl font-black text-ink">{day.title}</h2><p className="mt-1 text-sm text-slate-600">{day.source_note ?? "학습 노트"}</p></div>
              {day.expressions.map((expression) => {
                const dueLabel = getExpressionDueLabel(expression);

                return (
                <article key={expression.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <Link href={`/expressions/${expression.id}`} className="min-w-0">
                          <h3 className="text-xl font-black text-ink">{expression.english}</h3>
                        </Link>
                        <PronunciationButton text={expression.english} className="w-fit shrink-0" />
                      </div>
                    </div>
                    <ExpressionReviewStats expression={expression} variant="stacked" />
                  </div>
                  <Link href={`/expressions/${expression.id}`} className="block">
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{expression.korean_prompt}</p>
                    {dueLabel ? <p className="mt-3 inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">{dueLabel}</p> : null}
                    {expression.grammar_note ? <p className="mt-3 text-sm leading-6 text-slate-700"><span className="font-black text-slate-500">문법/패턴</span> {expression.grammar_note}</p> : null}
                    {expression.examples.length > 0 ? (
                      <div className="mt-3 space-y-1 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                        <p className="font-black text-slate-500">비슷한 표현</p>
                        {expression.examples.map((example) => (
                          <div key={example.id}>
                            <p className="font-semibold text-ink">{example.example_text}</p>
                            {example.meaning_ko ? <p className="text-slate-600">{example.meaning_ko}</p> : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                </article>
                );
              })}
            </section>
          ))}
        </div>
      )}
      <Link href={selectedTopicId ? `/expressions/new?topic=${selectedTopicId}` : "/expressions/new"} aria-label="현재 학습 토픽에 표현 추가" className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-3xl font-black text-white shadow-xl shadow-teal-900/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200">+</Link>
    </div>
  );
}

function pickSelectedTopicId(days: { id: string }[], requestedId?: string) {
  if (requestedId && days.some((day) => day.id === requestedId)) return requestedId;
  return days[0]?.id ?? null;
}
