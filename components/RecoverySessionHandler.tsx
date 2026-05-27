"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type RecoveryStatus = "checking" | "failed";

function recoverySessionFromHash(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const type = params.get("type");
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (type !== "recovery" || !accessToken || !refreshToken) return null;
  return { access_token: accessToken, refresh_token: refreshToken };
}

export function RecoverySessionHandler() {
  const router = useRouter();
  const [status, setStatus] = useState<RecoveryStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    const recoverySession = recoverySessionFromHash(window.location.hash);

    if (!recoverySession) {
      setStatus("failed");
      return;
    }

    async function establishRecoverySession(session: { access_token: string; refresh_token: string }) {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.setSession(session);
      if (cancelled) return;

      if (error) {
        setStatus("failed");
        return;
      }

      router.replace("/auth/update-password");
      router.refresh();
    }

    void establishRecoverySession(recoverySession);

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "checking") {
    return (
      <section className="mx-auto max-w-sm rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-card sm:px-6" aria-label="비밀번호 재설정 링크 확인">
        <p className="text-sm font-bold text-teal-700">비밀번호 재설정</p>
        <h1 className="mt-1 text-2xl font-black text-ink">재설정 링크 확인 중…</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">메일 링크의 인증 정보를 확인하고 있습니다. 잠시만 기다려 주세요.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-sm rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-card sm:px-6" aria-label="비밀번호 재설정 링크 오류">
      <p className="text-sm font-bold text-red-700">비밀번호 재설정</p>
      <h1 className="mt-1 text-2xl font-black text-ink">링크 확인이 필요합니다</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">재설정 링크가 만료되었거나 세션을 확인할 수 없습니다. 메일의 비밀번호 재설정 링크를 다시 열어 주세요.</p>
      <Link href="/login" className="btn-primary mt-5 w-full">
        로그인 화면으로 돌아가기
      </Link>
    </section>
  );
}
