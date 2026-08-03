import { isE2EMemoryMode } from "@/lib/test-mode";
import type { UserIdentity } from "@/lib/types";
import type { WctPopQuizStore } from "@/lib/wct-pop-quiz-store/contract";
import { MemoryWctPopQuizStore } from "@/lib/wct-pop-quiz-store/memory-store";
import { SupabaseWctPopQuizStore } from "@/lib/wct-pop-quiz-store/supabase-store";

export function getWctPopQuizStore(user: UserIdentity): WctPopQuizStore {
  if (isE2EMemoryMode()) return new MemoryWctPopQuizStore(user);
  return new SupabaseWctPopQuizStore(user);
}
