"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ExpressionReviewStats } from "@/components/ExpressionReviewStats";
import { ExpressionSearchBox } from "@/components/ExpressionSearchBox";
import { PronunciationButton } from "@/components/PronunciationButton";
import { TopicFilterSelect } from "@/components/TopicFilterSelect";
import { getExpressionDueLabel } from "@/lib/expression-due-label";
import { sortExpressionsByPriority } from "@/lib/expression-priority";
import { filterExpressionDaysByQuery } from "@/lib/expression-search";
import { getExpressionTopicDepth, getExpressionTopicDisplayLabel } from "@/lib/expression-topic-label";
import type { ExpressionDay } from "@/lib/types";

type ExpressionBrowserProps = {
  days: ExpressionDay[];
  selectedTopicId: string | null;
  requestedTopicBlocked: boolean;
  initialQuery: string;
};

export function ExpressionBrowser({ days, selectedTopicId, requestedTopicBlocked, initialQuery }: ExpressionBrowserProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeTopicId, setActiveTopicId] = useState(selectedTopicId);
  const normalizedQuery = query.trim();
  const isSearching = normalizedQuery.length > 0;
  const selectedDay = days.find((day) => day.id === activeTopicId) ?? null;
  const topicOptions = days.map((day) => ({
    id: day.id,
    label: getExpressionTopicDisplayLabel(day),
    depth: getExpressionTopicDepth(day)
  }));
  const visibleDays = useMemo(
    () => isSearching
      ? filterExpressionDaysByQuery(days, normalizedQuery).map((day) => ({
          ...day,
          expressions: sortExpressionsByPriority(day.expressions)
        }))
      : selectedDay
        ? [{ ...selectedDay, expressions: sortExpressionsByPriority(selectedDay.expressions) }]
        : [],
    [days, isSearching, normalizedQuery, selectedDay]
  );
  const resultCount = visibleDays.reduce((count, day) => count + day.expressions.length, 0);
  useEffect(() => {
    setActiveTopicId(selectedTopicId);

    function syncTopicFromUrl() {
      const topicId = new URL(window.location.href).searchParams.get("topic");
      setActiveTopicId(topicId && days.some((day) => day.id === topicId) ? topicId : selectedTopicId);
    }

    window.addEventListener("popstate", syncTopicFromUrl);
    return () => window.removeEventListener("popstate", syncTopicFromUrl);
  }, [days, selectedTopicId]);

  function selectTopic(topicId: string) {
    setActiveTopicId(topicId);
    const url = new URL(window.location.href);
    url.searchParams.set("topic", topicId);
    url.searchParams.delete("day");
    url.searchParams.delete("q");
    window.history.pushState(window.history.state, "", `${url.pathname}${url.search}`);
  }

  return (
    <div className="space-y-5">
      <ExpressionSearchBox query={query} onQueryChange={setQuery} selectedTopicId={activeTopicId} />
      {isSearching ? <p className="text-sm font-semibold text-slate-600" role="status"><span className="font-black text-ink">{normalizedQuery}</span> 검색 결과 {resultCount}개</p> : null}
      {!isSearching && requestedTopicBlocked && activeTopicId === selectedTopicId ? (
        <p className="text-sm text-amber-700" role="status" aria-live="polite">요청한 토픽에는 접근할 수 없어서 첫 번째 토픽으로 이동했습니다.</p>
      ) : null}
      {!isSearching && activeTopicId ? <TopicFilterSelect options={topicOptions} selectedId={activeTopicId} onSelect={selectTopic} /> : null}
      {isSearching && visibleDays.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-black text-ink">일치하는 표현이 없습니다</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">다른 영어 또는 한국어 검색어를 입력해 보세요.</p>
        </div>
      ) : null}
      {visibleDays.map((day) => (
        <section key={day.id} className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wide text-teal-700">{day.day_date ?? "날짜 없음"}</p><h2 className="mt-1 text-2xl font-black text-ink">{day.title}</h2><p className="mt-1 text-sm text-slate-600">{day.source_note ?? "학습 노트"}</p></div>
            <Link href={`/memorize?topic=${day.id}`} className="btn-primary w-full shrink-0 sm:w-auto">이 날짜 표현 테스트</Link>
          </div>
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
      <Link href={activeTopicId ? `/expressions/new?topic=${activeTopicId}` : "/expressions/new"} aria-label="현재 학습 토픽에 표현 추가" className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-3xl font-black text-white shadow-xl shadow-teal-900/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200">+</Link>
    </div>
  );
}
