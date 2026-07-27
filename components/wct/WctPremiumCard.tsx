import Link from "next/link";

export function WctPremiumCard() {
  return (
    <Link
      href="/lessons/premium"
      aria-label="WCT Premium"
      className="block rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm transition hover:border-violet-300 hover:shadow-card"
    >
      <p className="text-xl font-black text-ink">WCT Premium</p>
      <p className="mt-4 text-sm font-bold text-violet-700">Day 1</p>
    </Link>
  );
}
