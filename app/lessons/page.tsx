import { EmptyState } from "@/components/EmptyState";
import { WctBookCard } from "@/components/wct/WctBookCard";
import { WctPremiumPlaceholderCard } from "@/components/wct/WctPremiumPlaceholderCard";
import { requireCurrentUser } from "@/lib/auth";
import { getWctStore } from "@/lib/wct-store";

export const dynamic = "force-dynamic";

export default async function WctLessonsPage() {
  const user = await requireCurrentUser();
  const books = await getWctStore(user).listBooks();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">수업</p>
        <h1 className="mt-2 text-3xl font-black text-ink">WCT 수업</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          학원에서 배운 핵심 패턴을 교재와 Day 순서대로 다시 읽어보세요.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {books.map((book) => <WctBookCard key={book.id} book={book} />)}
        <WctPremiumPlaceholderCard />
      </div>
      {books.length === 0 ? (
        <EmptyState
          title="아직 WCT 교재가 없습니다"
          body="검토하고 승인한 WCT Day가 생기면 이 책장에 표시됩니다."
        />
      ) : null}
    </div>
  );
}
