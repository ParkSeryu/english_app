import { describe, expect, it } from "vitest";

import { authCallbackRedirectUrl, passwordResetRedirectUrl, resolveAppOrigin } from "@/lib/site-url";

function headers(values: Record<string, string>) {
  return new Headers(values);
}

describe("site URL resolution", () => {
  it("uses configured production site URL before localhost request origins", () => {
    const origin = resolveAppOrigin(headers({ origin: "http://localhost:3000", host: "localhost:3000" }), {
      NEXT_PUBLIC_SITE_URL: "https://english.example",
      SITE_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: undefined,
      VERCEL_URL: undefined
    });

    expect(origin).toBe("https://english.example");
  });

  it("uses forwarded deployment host when no explicit site URL is configured", () => {
    const origin = resolveAppOrigin(headers({ origin: "http://localhost:3000", "x-forwarded-host": "english.example", "x-forwarded-proto": "https" }), {
      NEXT_PUBLIC_SITE_URL: undefined,
      SITE_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: undefined,
      VERCEL_URL: undefined
    });

    expect(origin).toBe("https://english.example");
  });

  it("uses the request origin when Vercel forwards a generated deployment host", () => {
    const origin = resolveAppOrigin(headers({
      origin: "https://study.example",
      "x-forwarded-host": "english-lqgmsm9je-parkseryus-projects.vercel.app",
      "x-forwarded-proto": "https"
    }), {
      NEXT_PUBLIC_SITE_URL: undefined,
      SITE_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: "english-parkseryus-projects.vercel.app",
      VERCEL_URL: "english-lqgmsm9je-parkseryus-projects.vercel.app"
    });

    expect(origin).toBe("https://study.example");
  });

  it("uses Vercel production URL before falling back to localhost", () => {
    const origin = resolveAppOrigin(headers({ origin: "http://localhost:3000", host: "localhost:3000" }), {
      NEXT_PUBLIC_SITE_URL: undefined,
      SITE_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: "english.example",
      VERCEL_URL: "preview.example"
    });

    expect(origin).toBe("https://english.example");
  });

  it("builds password reset URL from the resolved app origin", () => {
    expect(
      passwordResetRedirectUrl(headers({ host: "english.example", "x-forwarded-proto": "https" }), {
        NEXT_PUBLIC_SITE_URL: undefined,
        SITE_URL: undefined,
        VERCEL_PROJECT_PRODUCTION_URL: undefined,
        VERCEL_URL: undefined
      })
    ).toBe("https://english.example/auth/update-password");
  });

  it("builds encoded auth callback URLs for social login next paths", () => {
    expect(
      authCallbackRedirectUrl(headers({ host: "english.example", "x-forwarded-proto": "https" }), "/memorize?defer=card-1", {
        NEXT_PUBLIC_SITE_URL: undefined,
        SITE_URL: undefined,
        VERCEL_PROJECT_PRODUCTION_URL: undefined,
        VERCEL_URL: undefined
      })
    ).toBe("https://english.example/auth/callback?next=%2Fmemorize%3Fdefer%3Dcard-1");
  });

  it("builds auth callback URLs on the visible app origin when forwarded through a generated Vercel host", () => {
    expect(
      authCallbackRedirectUrl(headers({
        origin: "https://study.example",
        "x-forwarded-host": "english-lqgmsm9je-parkseryus-projects.vercel.app",
        "x-forwarded-proto": "https"
      }), "/memorize", {
        NEXT_PUBLIC_SITE_URL: undefined,
        SITE_URL: undefined,
        VERCEL_PROJECT_PRODUCTION_URL: "english-parkseryus-projects.vercel.app",
        VERCEL_URL: "english-lqgmsm9je-parkseryus-projects.vercel.app"
      })
    ).toBe("https://study.example/auth/callback?next=%2Fmemorize");
  });

  it("falls back social login callback next paths to root when unsafe", () => {
    expect(
      authCallbackRedirectUrl(headers({ host: "english.example", "x-forwarded-proto": "https" }), "https://evil.example", {
        NEXT_PUBLIC_SITE_URL: undefined,
        SITE_URL: undefined,
        VERCEL_PROJECT_PRODUCTION_URL: undefined,
        VERCEL_URL: undefined
      })
    ).toBe("https://english.example/auth/callback?next=%2F");
  });
});
