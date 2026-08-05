import { describe, expect, it, vi } from "vitest";

import { SupabaseWctPopQuizStore } from "@/lib/wct-pop-quiz-store/supabase-store";
import { WctPopQuizRestartRequiredError } from "@/lib/wct/pop-quiz/types";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const BOOK_ID = "22222222-2222-4222-8222-222222222222";
const ATTEMPT_ID = "33333333-3333-4333-8333-333333333333";

function storeWithRpcError(error: { code: string; message: string }) {
  const rpc = vi.fn().mockResolvedValue({ data: null, error });
  return new SupabaseWctPopQuizStore(
    { id: OWNER_ID },
    () => ({ rpc } as never)
  );
}

function complete(store: SupabaseWctPopQuizStore) {
  return store.completeAttempt({ bookId: BOOK_ID, attemptId: ATTEMPT_ID });
}

describe("SupabaseWctPopQuizStore restart error contract", () => {
  it("maps only the exact dedicated RPC code and message to the typed restart error", async () => {
    const store = storeWithRpcError({
      code: "P0001",
      message: "WCT_POP_QUIZ_RESTART_REQUIRED"
    });

    await expect(complete(store)).rejects.toBeInstanceOf(
      WctPopQuizRestartRequiredError
    );
  });

  it("keeps an unrelated PostgreSQL P0002 error unexpected", async () => {
    const store = storeWithRpcError({
      code: "P0002",
      message: "no_data_found in another operation"
    });

    await expect(complete(store)).rejects.toThrow(
      "WCT Pop Quiz completion failed: no_data_found in another operation"
    );
    await expect(complete(store)).rejects.not.toBeInstanceOf(
      WctPopQuizRestartRequiredError
    );
  });

  it("keeps a substring-similar marker unexpected", async () => {
    const store = storeWithRpcError({
      code: "P0001",
      message: "prefix WCT_POP_QUIZ_RESTART_REQUIRED suffix"
    });

    await expect(complete(store)).rejects.toThrow(
      "WCT Pop Quiz completion failed: prefix WCT_POP_QUIZ_RESTART_REQUIRED suffix"
    );
    await expect(complete(store)).rejects.not.toBeInstanceOf(
      WctPopQuizRestartRequiredError
    );
  });
});
