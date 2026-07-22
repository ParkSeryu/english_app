"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { MemorizeCard } from "@/components/MemorizeCard";
import { isAgainReviewResult } from "@/lib/review-result";
import { nextExpressionReviewSchedule } from "@/lib/scheduling";
import type { ExpressionCard, ExpressionReviewResult } from "@/lib/types";

const DEFAULT_STORAGE_KEY = "english:memorize-session:v1";
const EMPTY_DEFERRED_IDS: string[] = [];
const KOREA_TIME_OFFSET_MS = 9 * 60 * 60 * 1000;

type OptimisticUnknownCounts = Record<string, number>;

type QueueState = {
  signature: string;
  queueIds: string[];
  activeId: string | null;
  deferredIds: string[];
  optimisticUnknownCounts: OptimisticUnknownCounts;
};

type StoredQueueState = {
  queueIds?: unknown;
  activeId?: unknown;
  deferredIds?: unknown;
  savedAt?: unknown;
};

type MemorizeQueueEmptyState = {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
};

type MemorizeQueueProps = {
  expressions: ExpressionCard[];
  deferredIds?: string[];
  storageKey?: string;
  heading?: string;
  description?: string;
  remainingLabel?: string;
  emptyState?: MemorizeQueueEmptyState;
  returnTo?: string;
  clearStoredStateOnComplete?: boolean;
};

function appendDeferredId(ids: string[], id: string) {
  return [...removeDeferredId(ids, id), id];
}

function removeDeferredId(ids: string[], id: string) {
  return ids.filter((deferredId) => deferredId !== id);
}

function normalizeDeferredIds(ids: string[], expressions: ExpressionCard[]) {
  const queueIds = new Set(expressions.map((expression) => expression.id));
  return [...new Set(ids)].filter((id) => queueIds.has(id));
}

function queueSignature(expressions: ExpressionCard[], deferredIds: string[]) {
  return `${expressions.map((expression) => expression.id).join("\u0000")}::${deferredIds.join("\u0000")}`;
}

function orderedExpressions(expressions: ExpressionCard[], queueIds: string[]) {
  if (queueIds.length === 0) return [];
  const byId = new Map(expressions.map((expression) => [expression.id, expression]));
  const ordered = queueIds.flatMap((id) => {
    const expression = byId.get(id);
    return expression ? [expression] : [];
  });
  const orderedIds = new Set(ordered.map((expression) => expression.id));
  return [...ordered, ...expressions.filter((expression) => !orderedIds.has(expression.id))];
}

function withOptimisticUnknownCounts(expressions: ExpressionCard[], optimisticUnknownCounts: OptimisticUnknownCounts) {
  return expressions.map((expression) => {
    const optimisticUnknownCount = optimisticUnknownCounts[expression.id];
    if (!optimisticUnknownCount || optimisticUnknownCount <= expression.unknown_count) return expression;
    return { ...expression, unknown_count: optimisticUnknownCount };
  });
}

function defaultQueueState(signature: string, expressions: ExpressionCard[], deferredIds: string[]): QueueState {
  const queueIds = expressions.map((expression) => expression.id);
  return {
    signature,
    queueIds,
    activeId: queueIds[0] ?? null,
    deferredIds: normalizeDeferredIds(deferredIds, expressions),
    optimisticUnknownCounts: {}
  };
}

function unknownArrayToStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function koreanDateKey(date: Date) {
  return new Date(date.getTime() + KOREA_TIME_OFFSET_MS).toISOString().slice(0, 10);
}

function isStoredQueueStateFresh(savedAt: unknown, now = new Date()) {
  if (typeof savedAt !== "string") return false;
  const savedDate = new Date(savedAt);
  return Number.isFinite(savedDate.getTime()) && koreanDateKey(savedDate) === koreanDateKey(now);
}

function readStoredQueueState(storageKey: string): StoredQueueState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredQueueState;
    if (!parsed || typeof parsed !== "object") return null;
    if (!isStoredQueueStateFresh(parsed.savedAt)) {
      window.localStorage.removeItem(storageKey);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

function writeStoredQueueState(storageKey: string, state: QueueState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      queueIds: state.queueIds,
      activeId: state.activeId,
      deferredIds: state.deferredIds,
      savedAt: new Date().toISOString()
    })
  );
}

function reconcileQueueState(signature: string, expressions: ExpressionCard[], deferredIds: string[], stored: StoredQueueState | null): QueueState {
  const fallback = defaultQueueState(signature, expressions, deferredIds);
  if (!stored) return fallback;

  const validIds = new Set(fallback.queueIds);
  const storedQueueIds = unknownArrayToStrings(stored.queueIds).filter((id) => validIds.has(id));
  const storedQueueIdSet = new Set(storedQueueIds);
  const queueIds = [...storedQueueIds, ...fallback.queueIds.filter((id) => !storedQueueIdSet.has(id))];
  const activeId = typeof stored.activeId === "string" && queueIds.includes(stored.activeId) ? stored.activeId : (queueIds[0] ?? null);
  const storedDeferredIds = unknownArrayToStrings(stored.deferredIds);
  const normalizedDeferredIds = normalizeDeferredIds([...fallback.deferredIds, ...storedDeferredIds], expressions);

  return {
    signature,
    queueIds,
    activeId,
    deferredIds: normalizedDeferredIds,
    optimisticUnknownCounts: {}
  };
}

function reconcileCurrentQueueState(signature: string, expressions: ExpressionCard[], deferredIds: string[], current: QueueState): QueueState {
  const fallback = defaultQueueState(signature, expressions, deferredIds);
  const validIds = new Set(fallback.queueIds);
  const currentQueueIds = current.queueIds.filter((id) => validIds.has(id));
  const currentQueueIdSet = new Set(currentQueueIds);
  const queueIds = [...currentQueueIds, ...fallback.queueIds.filter((id) => !currentQueueIdSet.has(id))];
  const activeId = current.activeId && queueIds.includes(current.activeId) ? current.activeId : (queueIds[0] ?? null);
  const normalizedDeferredIds = normalizeDeferredIds([...fallback.deferredIds, ...current.deferredIds], expressions);
  const optimisticUnknownCounts = Object.fromEntries(Object.entries(current.optimisticUnknownCounts).filter(([id]) => validIds.has(id)));

  return {
    signature,
    queueIds,
    activeId,
    deferredIds: normalizedDeferredIds,
    optimisticUnknownCounts
  };
}

function advanceQueue(queueIds: string[], activeId: string, shouldDefer: boolean) {
  const activeIndex = Math.max(queueIds.indexOf(activeId), 0);
  const withoutActive = queueIds.filter((id) => id !== activeId);

  if (shouldDefer) {
    const nextQueueIds = [...withoutActive, activeId];
    return {
      queueIds: nextQueueIds,
      activeId: withoutActive[activeIndex] ?? withoutActive[0] ?? activeId
    };
  }

  return {
    queueIds: withoutActive,
    activeId: withoutActive[activeIndex] ?? withoutActive[0] ?? null
  };
}

function shouldDeferReviewedCard(expression: ExpressionCard, result: ExpressionReviewResult, now = new Date()) {
  if (isAgainReviewResult(result)) return true;

  const schedule = nextExpressionReviewSchedule(expression, result, now);
  if (!schedule.dueAt) return true;

  const dueAt = Date.parse(schedule.dueAt);
  return Number.isFinite(dueAt) && dueAt <= now.getTime();
}

export function MemorizeQueue({
  expressions,
  deferredIds,
  storageKey = DEFAULT_STORAGE_KEY,
  heading = "오늘의 복습",
  description,
  remainingLabel = "복습할 표현",
  emptyState = {
    title: "암기할 표현이 없습니다",
    body: "배운 표현이 생기면 한국어 힌트로 바로 복습할 수 있습니다.",
    actionHref: "/expressions",
    actionLabel: "표현 모아보기"
  },
  returnTo = "/memorize",
  clearStoredStateOnComplete = false
}: MemorizeQueueProps) {
  const deferredIdInput = deferredIds ?? EMPTY_DEFERRED_IDS;
  const initialDeferredIds = useMemo(() => normalizeDeferredIds(deferredIdInput, expressions), [deferredIdInput, expressions]);
  const propsSignature = useMemo(() => queueSignature(expressions, initialDeferredIds), [expressions, initialDeferredIds]);
  const fallbackState = useMemo(() => defaultQueueState(propsSignature, expressions, initialDeferredIds), [propsSignature, expressions, initialDeferredIds]);
  const [sessionState, setSessionState] = useState<QueueState>(fallbackState);
  const hasUserInteractedRef = useRef(false);
  const activeState = useMemo(
    () => sessionState.signature === propsSignature ? sessionState : reconcileCurrentQueueState(propsSignature, expressions, initialDeferredIds, sessionState),
    [expressions, initialDeferredIds, propsSignature, sessionState]
  );
  const queue = withOptimisticUnknownCounts(orderedExpressions(expressions, activeState.queueIds), activeState.optimisticUnknownCounts);
  const remainingCount = activeState.queueIds.length;
  const activeExpression = queue.find((expression) => expression.id === activeState.activeId) ?? queue[0];

  useEffect(() => {
    setSessionState((current) => {
      if (hasUserInteractedRef.current) return reconcileCurrentQueueState(propsSignature, expressions, initialDeferredIds, current);
      return reconcileQueueState(propsSignature, expressions, initialDeferredIds, readStoredQueueState(storageKey));
    });
  }, [expressions, initialDeferredIds, propsSignature, storageKey]);

  useEffect(() => {
    if (sessionState.signature !== propsSignature) return;
    if (clearStoredStateOnComplete && sessionState.queueIds.length === 0) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    writeStoredQueueState(storageKey, sessionState);
  }, [clearStoredStateOnComplete, propsSignature, sessionState, storageKey]);

  if (!activeExpression) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <MemorizeQueueHeader heading={heading} description={description} remainingLabel={remainingLabel} remainingCount={remainingCount} />
        <EmptyState {...emptyState} />
      </div>
    );
  }

  function handleReveal() {
    hasUserInteractedRef.current = true;
  }

  function handleReviewSubmit(result: ExpressionReviewResult) {
    hasUserInteractedRef.current = true;
    const shouldDefer = shouldDeferReviewedCard(activeExpression, result);
    setSessionState((current) => {
      const currentState = current.signature === propsSignature ? current : reconcileCurrentQueueState(propsSignature, expressions, initialDeferredIds, current);
      const nextQueue = advanceQueue(currentState.queueIds, activeExpression.id, shouldDefer);
      return {
        signature: propsSignature,
        queueIds: nextQueue.queueIds,
        activeId: nextQueue.activeId,
        deferredIds: shouldDefer ? appendDeferredId(currentState.deferredIds, activeExpression.id) : removeDeferredId(currentState.deferredIds, activeExpression.id),
        optimisticUnknownCounts:
          isAgainReviewResult(result)
            ? {
                ...currentState.optimisticUnknownCounts,
                [activeExpression.id]: Math.max(currentState.optimisticUnknownCounts[activeExpression.id] ?? activeExpression.unknown_count, activeExpression.unknown_count) + 1
              }
            : currentState.optimisticUnknownCounts
      };
    });
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <MemorizeQueueHeader heading={heading} description={description} remainingLabel={remainingLabel} remainingCount={remainingCount} />
      <MemorizeCard
        key={activeExpression.id}
        expression={activeExpression}
        returnTo={returnTo}
        onReveal={handleReveal}
        onReviewSubmit={handleReviewSubmit}
      />
    </div>
  );
}

function MemorizeQueueHeader({ heading, description, remainingLabel, remainingCount }: { heading: string; description?: string; remainingLabel: string; remainingCount: number }) {
  return (
    <header className="flex items-end justify-between gap-3 sm:block">
      <div>
        <h1 className="text-2xl font-black leading-tight tracking-[-0.03em] text-ink sm:text-3xl">{heading}</h1>
        {description ? <p className="mt-1 text-sm font-semibold text-slate-600">{description}</p> : null}
      </div>
      <p className="shrink-0 text-sm font-semibold text-slate-500 sm:mt-2">{remainingLabel} {remainingCount}개</p>
    </header>
  );
}
