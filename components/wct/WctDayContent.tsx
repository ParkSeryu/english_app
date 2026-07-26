import { WctPatternCard } from "@/components/wct/WctPatternCard";
import { WctSourceBadge } from "@/components/wct/WctSourceBadge";
import type { WctDay } from "@/lib/wct/types";

export function WctDayContent({ day }: { day: WctDay }) {
  return (
    <div className="space-y-7">
      {day.sourceNeedsReview ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          원문 확인 필요
        </p>
      ) : null}

      {day.concepts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl font-black text-ink">핵심 개념</h2>
          <div className="space-y-2">
            {day.concepts.map((concept) => (
              <div key={concept.id} className="rounded-2xl bg-teal-50 p-4 text-sm leading-6 text-slate-700">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p>{concept.text}</p>
                  <WctSourceBadge source={concept.sourceKind} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-xl font-black text-ink">핵심 패턴</h2>
        {day.patterns.length > 0 ? day.patterns.map((pattern) => (
          <WctPatternCard key={pattern.id} pattern={pattern} />
        )) : <p className="text-sm text-slate-500">정리된 핵심 패턴이 없습니다.</p>}
      </section>

      {day.importantNotes.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl font-black text-ink">중요 메모</h2>
          <div className="space-y-2">
            {day.importantNotes.map((note) => (
              <div key={note.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm leading-6 text-slate-700">{note.noteText}</p>
                {note.sourcePage ? <p className="mt-2 text-xs font-bold text-slate-500">교재 {note.sourcePage}쪽</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {day.practicePrompts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl font-black text-ink">핵심 연습</h2>
          <ol className="space-y-2">
            {day.practicePrompts.map((prompt, index) => (
              <li key={prompt.id} className="rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-700">
                <span className="mr-2 font-black text-teal-700">{index + 1}.</span>
                {prompt.promptText}
                {prompt.meaningKo ? <p className="mt-1 pl-5 text-slate-500">{prompt.meaningKo}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
