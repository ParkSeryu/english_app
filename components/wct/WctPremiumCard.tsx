import Link from "next/link";

export function WctPremiumCard() {
  return (
    <Link
      href="/lessons/premium"
      aria-label="WCT Premium"
      className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-card"
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">WCT</p>
      <h2 className="mt-2 text-xl font-black text-ink">WCT Premium</h2>
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
        <span>Day 1개</span>
      </div>
    </Link>
  );
}
