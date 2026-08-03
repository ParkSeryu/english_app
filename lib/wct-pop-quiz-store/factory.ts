import type { UserIdentity } from "@/lib/types";
import type { WctPopQuizStore } from "@/lib/wct-pop-quiz-store/contract";
import { MemoryWctPopQuizStore } from "@/lib/wct-pop-quiz-store/memory-store";

export function getWctPopQuizStore(user: UserIdentity): WctPopQuizStore {
  return new MemoryWctPopQuizStore(user);
}