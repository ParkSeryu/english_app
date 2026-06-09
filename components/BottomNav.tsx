"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const bottomNavItems = [
  { href: "/expressions", label: "표현" },
  { href: "/memorize", label: "암기" },
  { href: "/questions", label: "질문거리" }
];

const LAST_EXPRESSIONS_PATH_KEY = "english:last-expressions-path";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function validExpressionsPath(value: string | null) {
  return value?.startsWith("/expressions?") || value === "/expressions" ? value : "/expressions";
}

function readLastExpressionsPath() {
  if (typeof window === "undefined") return "/expressions";
  return validExpressionsPath(window.localStorage.getItem(LAST_EXPRESSIONS_PATH_KEY));
}

function currentPathWithSearch(pathname: string, searchParams: { toString(): string }) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [lastExpressionsPath, setLastExpressionsPath] = useState(readLastExpressionsPath);

  useEffect(() => {
    if (pathname !== "/expressions") return;
    const nextPath = currentPathWithSearch(pathname, searchParams);
    window.localStorage.setItem(LAST_EXPRESSIONS_PATH_KEY, nextPath);
    setLastExpressionsPath(nextPath);
  }, [pathname, searchParams]);

  function hrefFor(item: (typeof bottomNavItems)[number]) {
    if (item.href === "/expressions" && pathname !== "/expressions") return lastExpressionsPath;
    if (item.href === "/expressions" && pathname === "/expressions") return currentPathWithSearch(pathname, searchParams);
    return item.href;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden" aria-label="하단 주요 메뉴">
      <div className="mx-auto grid max-w-3xl grid-cols-3 px-2 py-2 text-center text-xs font-black text-slate-700">
        {bottomNavItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={hrefFor(item)}
              prefetch
              className={`rounded-2xl px-2 py-3 transition ${active ? "bg-teal-50 text-teal-700" : "hover:bg-teal-50 hover:text-teal-700"}`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
