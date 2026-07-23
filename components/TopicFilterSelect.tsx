"use client";

export type TopicFilterOption = {
  id: string;
  label: string;
  /**
   * Optional folder nesting depth for nested-topic display.
   */
  depth?: number;
};

export function TopicFilterSelect({ options, selectedId, onSelect }: { options: TopicFilterOption[]; selectedId: string; onSelect: (topicId: string) => void }) {
  if (options.length === 0) return null;

  return (
    <label className="block rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">토픽 선택</span>
      <select
        value={selectedId}
        onChange={(event) => onSelect(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-black text-ink outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
        aria-label="표현 토픽 선택"
      >
        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
            style={{ paddingLeft: `${Math.max(0, option.depth ?? 0) * 1.25}rem` }}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
