import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/AuthPanel";
import { getCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { safeSameOriginRedirectPath } from "@/lib/safe-redirect";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ next?: string | string[] }>;

function firstSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const params = await searchParams;
  const next = safeSameOriginRedirectPath(firstSearchParam(params.next) ?? null);

  return (
    <div className="space-y-6">
      {!hasSupabaseEnv() ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Supabase 환경 변수가 없습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 추가하세요.
        </div>
      ) : null}
      <AuthPanel next={next} />
    </div>
  );
}
