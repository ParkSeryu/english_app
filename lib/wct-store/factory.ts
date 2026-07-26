import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import { isE2EMemoryMode } from "@/lib/test-mode";
import type { UserIdentity } from "@/lib/types";
import type { WctStore } from "@/lib/wct-store/contract";
import { MemoryWctStore } from "@/lib/wct-store/memory-store";
import { SupabaseWctStore } from "@/lib/wct-store/supabase-store";

export function getWctStore(user: UserIdentity): WctStore {
  if (isE2EMemoryMode()) return new MemoryWctStore(user);
  return new SupabaseWctStore(user);
}

export function getAdminWctStore(user: UserIdentity): WctStore {
  if (isE2EMemoryMode()) return new MemoryWctStore(user);
  return new SupabaseWctStore(user, createServiceRoleSupabaseClient, true);
}
