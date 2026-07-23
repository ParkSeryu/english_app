import { EmptyState } from "@/components/EmptyState";
import { ExpressionBrowser } from "@/components/ExpressionBrowser";
import { requireCurrentUser } from "@/lib/auth";
import { getExpressionStore } from "@/lib/lesson-store";
import { sortExpressionTopicsByFolder } from "@/lib/expression-topic-label";
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
  const query = params.q?.trim() ?? "";

  return (
    <div className="space-y-5">
      <div><p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">표현</p><h1 className="mt-2 text-3xl font-black text-ink">표현 모아보기</h1><p className="mt-3 text-sm leading-6 text-slate-600">토픽을 고르거나 전체 표현에서 영어와 한국어를 검색하세요.</p></div>
      {days.length === 0 ? (
        <EmptyState title="아직 표현이 없습니다" body="배운 표현이 생기면 토픽별로 여기에 쌓입니다." actionHref="/memorize" actionLabel="암기 화면 보기" />
      ) : (
        <ExpressionBrowser days={days} selectedTopicId={selectedTopicId} requestedTopicBlocked={requestedTopicBlocked} initialQuery={query} />
      )}
    </div>
  );
}

function pickSelectedTopicId(days: { id: string }[], requestedId?: string) {
  if (requestedId && days.some((day) => day.id === requestedId)) return requestedId;
  return days[0]?.id ?? null;
}
