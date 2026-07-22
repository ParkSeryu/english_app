import { EmptyState } from "@/components/EmptyState";
import { MemorizeQueue } from "@/components/MemorizeQueue";
import { requireCurrentUser } from "@/lib/auth";
import { getExpressionStore } from "@/lib/lesson-store";
import { sortExpressionsByPriority } from "@/lib/expression-priority";
import type { ExpressionCard, ExpressionDay } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ defer?: string; topic?: string }>;

export default async function MemorizePage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const store = getExpressionStore(user);
  const topic = params.topic ? await store.getExpressionDay(params.topic) : null;
  const isTopicTest = Boolean(params.topic);
  const queue = topic
    ? sortExpressionsByPriority(withDayContext(topic))
    : isTopicTest
      ? []
      : await store.getMemorizationQueue({ limit: 300 });
  const deferredIds = parseDeferredIds(params.defer);
  const displayQueue = moveDeferredExpressionsToEnd(queue, deferredIds);
  const topicReturnHref = topic ? `/expressions?topic=${topic.id}` : "/expressions";

  return (
    <div className="space-y-5">
      {displayQueue.length > 0 ? (
        <MemorizeQueue
          expressions={displayQueue}
          deferredIds={deferredIds}
          storageKey={isTopicTest ? `english:topic-test-session:${user.id}:${topic?.id}:v1` : `english:memorize-session:${user.id}:v1`}
          heading={isTopicTest ? "날짜별 표현 테스트" : undefined}
          description={topic ? [topic.day_date, topic.title].filter(Boolean).join(" · ") : undefined}
          remainingLabel={isTopicTest ? "남은 표현" : undefined}
          emptyState={isTopicTest ? {
            title: "이 날짜의 표현 테스트를 마쳤습니다",
            body: "결과가 암기 기록에 반영되었습니다. 표현 목록에서 언제든 다시 테스트할 수 있습니다.",
            actionHref: topicReturnHref,
            actionLabel: "표현 목록으로 돌아가기"
          } : undefined}
          returnTo={isTopicTest ? `/memorize?topic=${topic?.id}` : undefined}
          clearStoredStateOnComplete={isTopicTest}
        />
      ) : (
        <>
          <header>
            <h1 className="text-3xl font-black leading-tight tracking-[-0.03em] text-ink">{isTopicTest ? "날짜별 표현 테스트" : "오늘의 복습"}</h1>
          </header>
          {isTopicTest ? (
            <EmptyState title="테스트할 표현을 찾을 수 없습니다" body="이 날짜 묶음이 비어 있거나 현재 계정에서 볼 수 없습니다." actionHref="/expressions" actionLabel="표현 모아보기" />
          ) : (
            <EmptyState title="암기할 표현이 없습니다" body="배운 표현이 생기면 한국어 힌트로 바로 복습할 수 있습니다." actionHref="/expressions" actionLabel="표현 모아보기" />
          )}
        </>
      )}
    </div>
  );
}

function withDayContext(day: ExpressionDay): ExpressionCard[] {
  const daySummary = {
    id: day.id,
    owner_id: day.owner_id,
    title: day.title,
    source_note: day.source_note,
    day_date: day.day_date,
    created_at: day.created_at,
    created_by: day.created_by,
    folder_id: day.folder_id,
    folder: day.folder,
    folder_path: day.folder_path
  };

  return day.expressions.map((expression) => ({ ...expression, day: daySummary }));
}

function parseDeferredIds(value?: string) {
  if (!value) return [];
  return [...new Set(value.split(",").map((id) => id.trim()).filter(Boolean))];
}

function moveDeferredExpressionsToEnd<T extends { id: string }>(queue: T[], deferredIds: string[]) {
  if (deferredIds.length === 0) return queue;
  const deferredSet = new Set(deferredIds);
  const active = queue.filter((expression) => !deferredSet.has(expression.id));
  const deferred = deferredIds.flatMap((id) => queue.filter((expression) => expression.id === id));
  return [...active, ...deferred];
}
