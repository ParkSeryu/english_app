import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(() => ({ auth: {} })),
  createServerClient: vi.fn(),
  getSupabaseEnv: vi.fn(() => ({
    publishableKey: "anon-key",
    url: "https://supabase.example"
  }))
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient
}));

vi.mock("@/lib/env", () => ({
  getSupabaseEnv: mocks.getSupabaseEnv
}));

describe("Supabase server clients", () => {
  it("uses implicit auth for password recovery emails so reset links carry URL hash tokens", async () => {
    const { createPasswordRecoverySupabaseClient } = await import("@/lib/supabase/server");

    const client = createPasswordRecoverySupabaseClient();

    expect(client).toEqual({ auth: {} });
    expect(mocks.createClient).toHaveBeenCalledWith("https://supabase.example", "anon-key", {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: "implicit",
        persistSession: false
      }
    });
  });
});
