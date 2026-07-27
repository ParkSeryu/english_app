import type {
  WctPremiumContentBlock,
  WctPremiumLesson
} from "@/lib/wct/premium-lessons";

function PremiumBlock({ block }: { block: WctPremiumContentBlock }) {
  switch (block.kind) {
    case "paragraph":
      return <p className="text-sm leading-7 text-slate-700">{block.text}</p>;
    case "subheading":
      return <h3 className="pt-2 text-base font-black text-ink">{block.text}</h3>;
    case "example":
      return (
        <div className="space-y-1 rounded-2xl bg-slate-50 p-4 font-mono text-sm leading-6 text-ink">
          {block.lines.map((line) => <p key={line}>{line}</p>)}
        </div>
      );
    case "rule":
      return (
        <div className="space-y-2 rounded-2xl bg-teal-50 p-4 text-sm font-bold leading-6 text-slate-700">
          {block.lines.map((line) => <p key={line}>{line}</p>)}
        </div>
      );
    case "list":
      return (
        <ul className="space-y-2">
          {block.items.map((item) => (
            <li key={item} className="rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      );
  }
}

export function WctPremiumDayContent({ lesson }: { lesson: WctPremiumLesson }) {
  return (
    <div className="space-y-7">
      {lesson.sections.map((section) => (
        <section key={section.id} className="space-y-3">
          <h2 className="text-xl font-black text-ink">{section.title}</h2>
          {section.blocks.map((block) => <PremiumBlock key={block.id} block={block} />)}
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="text-xl font-black text-ink">핵심 패턴</h2>
        <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {lesson.patterns.map((pattern) => (
            <p key={pattern} className="text-sm font-bold leading-6 text-slate-700">{pattern}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
