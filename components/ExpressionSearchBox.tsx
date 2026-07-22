"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const URL_SYNC_DEBOUNCE_MS = 180;

type ExpressionSearchBoxProps = {
  query: string;
  onQueryChange: (query: string) => void;
  selectedTopicId: string | null;
};

export function ExpressionSearchBox({ query, onQueryChange, selectedTopicId }: ExpressionSearchBoxProps) {
  const pathname = usePathname();
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (isComposing) return;

    const timeout = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const nextQuery = query.trim();
      if (selectedTopicId) url.searchParams.set("topic", selectedTopicId);
      if (nextQuery) url.searchParams.set("q", nextQuery);
      else url.searchParams.delete("q");

      const nextUrl = `${pathname}${url.search}`;
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (nextUrl !== currentUrl) window.history.replaceState(window.history.state, "", nextUrl);
    }, URL_SYNC_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [isComposing, pathname, query, selectedTopicId]);

  return (
    <div role="search" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="block" htmlFor="expression-search">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">전체 표현 검색</span>
        <span className="sr-only">영어 또는 한국어로 검색</span>
      </label>
      <div className="relative mt-2">
        <input
          id="expression-search"
          name="q"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="영어 또는 한국어를 입력하세요"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-base font-semibold text-ink outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
        />
        {query ? (
          <button type="button" onClick={() => onQueryChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-100 hover:text-teal-700" aria-label="검색어 지우기">
            지우기
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">입력하는 즉시 결과가 바뀝니다.</p>
    </div>
  );
}
