"use client";

import { useActionState, useState } from "react";

import { resetPasswordAction, signInAction, signInWithKakaoAction, signUpAction } from "@/app/actions";

const initialState = { ok: false, message: "" };

type AuthMode = "sign-in" | "sign-up" | "help";

function FeedbackMessage({ ok, message }: { ok: boolean; message?: string }) {
  if (!message) return null;
  return <p className={`mt-3 text-sm leading-6 ${ok ? "text-emerald-700" : "text-red-700"}`}>{message}</p>;
}

export function AuthPanel({ next = "/" }: { next?: string }) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [signInState, signIn, signInPending] = useActionState(signInAction, initialState);
  const [kakaoState, signInWithKakao, kakaoPending] = useActionState(signInWithKakaoAction, initialState);
  const [signUpState, signUp, signUpPending] = useActionState(signUpAction, initialState);
  const [resetState, resetPassword, resetPending] = useActionState(resetPasswordAction, initialState);

  return (
    <section className="mx-auto max-w-sm rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-card sm:px-6" aria-label="인증">
      {mode === "sign-in" ? (
        <>
          <form action={signIn}>
            <h2 className="text-center text-2xl font-black text-ink">로그인</h2>

            <label className="mt-7 block text-sm font-semibold text-slate-700" htmlFor="signin-email">
              이메일
            </label>
            <input id="signin-email" name="email" type="email" autoComplete="email" required className="input" />

            <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="signin-password">
              비밀번호
            </label>
            <input id="signin-password" name="password" type="password" autoComplete="current-password" required className="input" />

            <FeedbackMessage ok={Boolean(signInState.ok)} message={signInState.message} />

            <button type="submit" disabled={Boolean(signInPending)} className="btn-primary mt-5 w-full">
              {signInPending ? "로그인 중…" : "로그인"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <button type="button" onClick={() => setMode("help")} className="font-bold text-slate-500 underline-offset-4 hover:text-teal-700 hover:underline">
              아이디·비밀번호 찾기
            </button>
            <span className="h-3 w-px bg-slate-200" aria-hidden="true" />
            <button type="button" onClick={() => setMode("sign-up")} className="font-black text-teal-700 underline-offset-4 hover:underline">
              회원가입
            </button>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs font-bold text-slate-400">
            <span className="h-px flex-1 bg-slate-100" />
            간편 로그인
            <span className="h-px flex-1 bg-slate-100" />
          </div>

          <form action={signInWithKakao}>
            <input type="hidden" name="next" value={next} />
            <FeedbackMessage ok={Boolean(kakaoState.ok)} message={kakaoState.message} />
            <button
              type="submit"
              disabled={Boolean(kakaoPending)}
              aria-label={kakaoPending ? "카카오로 이동 중…" : "카카오로 시작하기"}
              className="group relative flex min-h-[3.25rem] w-full items-center justify-center overflow-hidden rounded-[1.35rem] border border-[#E2C300] bg-[#FEE500] px-4 py-3 text-center text-[#191919] shadow-[0_12px_24px_rgba(254,229,0,0.30)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#FFE812] hover:shadow-[0_16px_30px_rgba(254,229,0,0.38)] focus:outline-none focus:ring-4 focus:ring-yellow-200 active:translate-y-0 active:scale-[0.98] active:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_12px_24px_rgba(254,229,0,0.30)] disabled:active:scale-100"
            >
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/35 via-white/0 to-black/[0.03]" />
              <span aria-hidden="true" className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#191919] shadow-sm transition duration-200 group-hover:scale-105">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-[#FEE500]">
                  <path d="M12 4.25c-4.7 0-8.5 2.94-8.5 6.58 0 2.35 1.6 4.41 4 5.58l-.55 2.31a.5.5 0 0 0 .74.55l2.88-1.68c.46.06.94.09 1.43.09 4.7 0 8.5-2.94 8.5-6.58S16.7 4.25 12 4.25Z" />
                </svg>
              </span>
              <span className="relative text-[15px] font-black tracking-[-0.01em]">{kakaoPending ? "카카오로 이동 중…" : "카카오로 시작하기"}</span>
            </button>
          </form>

        </>
      ) : null}

      {mode === "sign-up" ? (
        <form action={signUp}>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-ink">회원가입</h2>
            <p className="text-sm leading-6 text-slate-500">이메일과 6자 이상 비밀번호만 있으면 시작할 수 있어요.</p>
          </div>

          <label className="mt-6 block text-sm font-semibold text-slate-700" htmlFor="signup-email">
            이메일
          </label>
          <input id="signup-email" name="email" type="email" autoComplete="email" required className="input" />

          <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="signup-password">
            비밀번호
          </label>
          <input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={6} required className="input" />

          <FeedbackMessage ok={Boolean(signUpState.ok)} message={signUpState.message} />

          <button type="submit" disabled={Boolean(signUpPending)} className="btn-primary mt-5 w-full">
            {signUpPending ? "계정 생성 중…" : "회원가입"}
          </button>

          <p className="mt-5 text-center text-sm text-slate-500">
            이미 계정이 있나요?{" "}
            <button type="button" onClick={() => setMode("sign-in")} className="font-black text-teal-700 underline-offset-4 hover:underline">
              로그인
            </button>
          </p>
        </form>
      ) : null}

      {mode === "help" ? (
        <form action={resetPassword}>
          <div className="space-y-1">
            <p className="text-sm font-bold text-teal-700">계정을 찾고 있나요?</p>
            <h2 className="text-2xl font-black text-ink">아이디·비밀번호 찾기</h2>
            <p className="text-sm leading-6 text-slate-500">이 앱은 이메일을 아이디로 사용해요. 가입한 이메일을 입력하면 비밀번호 재설정 메일을 보내드립니다.</p>
          </div>

          <label className="mt-6 block text-sm font-semibold text-slate-700" htmlFor="reset-email">
            가입한 이메일
          </label>
          <input id="reset-email" name="email" type="email" autoComplete="email" required className="input" />

          <FeedbackMessage ok={Boolean(resetState.ok)} message={resetState.message} />

          <button type="submit" disabled={Boolean(resetPending)} className="btn-primary mt-5 w-full">
            {resetPending ? "메일 보내는 중…" : "비밀번호 재설정 메일 받기"}
          </button>

          <p className="mt-5 text-center text-sm text-slate-500">
            기억났나요?{" "}
            <button type="button" onClick={() => setMode("sign-in")} className="font-black text-teal-700 underline-offset-4 hover:underline">
              로그인으로 돌아가기
            </button>
          </p>
        </form>
      ) : null}
    </section>
  );
}
