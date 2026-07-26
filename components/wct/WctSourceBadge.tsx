import type { WctSourceKind } from "@/lib/wct/types";

export function WctSourceBadge({ source }: { source: WctSourceKind }) {
  if (source !== "ai_supplement") return null;
  return (
    <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-700">
      AI 보완
    </span>
  );
}
