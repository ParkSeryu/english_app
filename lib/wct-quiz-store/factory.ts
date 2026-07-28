import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import { isE2EMemoryMode } from "@/lib/test-mode";
import type { UserIdentity } from "@/lib/types";
import type { WctQuizStore } from "@/lib/wct-quiz-store/contract";
import { MemoryWctQuizStore } from "@/lib/wct-quiz-store/memory-store";
import { SupabaseWctQuizStore } from "@/lib/wct-quiz-store/supabase-store";

export function getWctQuizStore(user: UserIdentity): WctQuizStore {
  if (isE2EMemoryMode()) return new MemoryWctQuizStore(user);
  return new SupabaseWctQuizStore(user);
}

export function getAdminWctQuizStore(user: UserIdentity): WctQuizStore {
  if (isE2EMemoryMode()) return new MemoryWctQuizStore(user, true);
  return new SupabaseWctQuizStore(
    user,
    createServiceRoleSupabaseClient,
    true
  );
}
