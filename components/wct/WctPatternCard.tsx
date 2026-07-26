import type { WctPattern } from "@/lib/wct/types";
import { WctSourceBadge } from "@/components/wct/WctSourceBadge";

export function WctPatternCard({ pattern }: { pattern: WctPattern }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-ink">{pattern.patternText}</h3>
          {pattern.meaningKo ? <p className="mt-1 text-sm text-slate-600">{pattern.meaningKo}</p> : null}
        </div>
        <WctSourceBadge source={pattern.usageSource} />
      </div>
      {pattern.usageNote ? (
        <p className="mt-4 rounded-2xl bg-violet-50 p-4 text-sm leading-6 text-slate-700">
          {pattern.usageNote}
        </p>
      ) : null}
      {pattern.examples.length > 0 ? (
        <div className="mt-5 space-y-3">
          <h4 className="text-sm font-black text-slate-500">교재 예문</h4>
          {pattern.examples.map((example) => (
            <div key={example.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-bold text-ink">{example.englishText}</p>
              {example.meaningKo ? <p className="mt-1 text-sm text-slate-600">{example.meaningKo}</p> : null}
              {example.sourcePage ? (
                <p className="mt-2 text-xs font-bold text-slate-500">교재 {example.sourcePage}쪽</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
