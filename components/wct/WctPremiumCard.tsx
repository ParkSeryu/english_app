import Link from "next/link";

export function WctPremiumCard() {
  return (
    <Link
      href="/lessons/premium"
      aria-label="WCT Premium"
      className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-card"
    >
      <p className="text-xl font-black text-ink">WCT Premium</p>
      <p className="mt-4 text-sm font-bold text-teal-700">Day 1</p>
    </Link>
  );
}
