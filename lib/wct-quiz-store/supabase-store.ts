import { z } from "zod";

import type { UserIdentity } from "@/lib/types";
import type { WctQuizStore } from "@/lib/wct-quiz-store/contract";
import {
  parseWctStandardQuizBookSyncs
} from "@/lib/wct-quiz-store/standard-sync-validation";
import {
  mapWctQuizAttemptResult,
  mapWctQuizSet
} from "@/lib/wct-quiz-store/mappers";
import type {
  WctQuizAttemptResult,
  WctQuizSet,
  WctQuizSetCreateInput,
  WctStandardQuizBookSync,
  WctStandardQuizSyncResult,
  WctQuizSubmission,
  WctQuizSummary
} from "@/lib/wct/quiz/types";
import {
  wctQuizSetCreateSchema,
  wctQuizSubmissionSchema
} from "@/lib/wct/quiz/validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";

type SupabaseLike =
  | Awaited<ReturnType<typeof createServerSupabaseClient>>
  | ReturnType<typeof createServiceRoleSupabaseClient>;

const QUIZ_SET_SELECT =
  "id,owner_id,lesson_key,source_kind,source_id,generator_version,source_hash,questions,created_at";

const standardSyncResultSchema = z.object({
  createdCount: z.number().int().nonnegative(),
  updatedCount: z.number().int().nonnegative(),
  unchangedCount: z.number().int().nonnegative(),
  resetQuizProgressCount: z.number().int().nonnegative(),
  resetPopProgressCount: z.number().int().nonnegative()
}).strict();

export class SupabaseWctQuizStore implements WctQuizStore {
  constructor(
    private readonly user: UserIdentity,
    private readonly createClient:
      () => Promise<SupabaseLike> | SupabaseLike = createServerSupabaseClient,
    private readonly admin = false
  ) {}

  private async client() {
    return this.createClient();
  }

  private async selectSetByLessonKey(
    lessonKey: string
  ): Promise<WctQuizSet | null> {
    const { data, error } = await (await this.client())
      .from("wct_quiz_sets")
      .select(QUIZ_SET_SELECT)
      .eq("owner_id", this.user.id)
      .eq("lesson_key", lessonKey)
      .maybeSingle();
    if (error) throw new Error(`WCT quiz set query failed: ${error.message}`);
    return data ? mapWctQuizSet(data) : null;
  }

  async getSetById(id: string): Promise<WctQuizSet | null> {
    const { data, error } = await (await this.client())
      .from("wct_quiz_sets")
      .select(QUIZ_SET_SELECT)
      .eq("owner_id", this.user.id)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`WCT quiz set query failed: ${error.message}`);
    return data ? mapWctQuizSet(data) : null;
  }

  async getSetByLessonKey(lessonKey: string): Promise<WctQuizSet | null> {
    return this.selectSetByLessonKey(lessonKey);
  }

  async listSetsByLessonKeys(lessonKeys: string[]): Promise<WctQuizSet[]> {
    if (lessonKeys.length === 0) return [];
    const { data, error } = await (await this.client())
      .from("wct_quiz_sets")
      .select(QUIZ_SET_SELECT)
      .eq("owner_id", this.user.id)
      .in("lesson_key", lessonKeys);
    if (error) throw new Error(`WCT quiz set query failed: ${error.message}`);
    return (data ?? []).map(mapWctQuizSet);
  }
  async getSummaryByLessonKey(
    lessonKey: string
  ): Promise<WctQuizSummary | null> {
    const set = await this.selectSetByLessonKey(lessonKey);
    if (!set) return null;
    const { data, error } = await (await this.client())
      .from("wct_quiz_progress")
      .select("latest_score,completed_at")
      .eq("quiz_set_id", set.id)
      .eq("user_id", this.user.id)
      .maybeSingle();
    if (error) {
      throw new Error(`WCT quiz progress query failed: ${error.message}`);
    }
    return {
      quizSetId: set.id,
      questionCount: 5,
      latestScore: data ? Number(data.latest_score) : null,
      completedAt: data ? String(data.completed_at) : null
    };
  }

  async createSetIfMissing(
    input: WctQuizSetCreateInput
  ): Promise<WctQuizSet> {
    if (!this.admin) {
      throw new Error("WCT quiz creation requires an admin store");
    }
    const parsed = wctQuizSetCreateSchema.parse(input);
    const { error } = await (await this.client())
      .from("wct_quiz_sets")
      .upsert({
        owner_id: this.user.id,
        lesson_key: parsed.lessonKey,
        source_kind: parsed.sourceKind,
        source_id: parsed.sourceId,
        generator_version: parsed.generatorVersion,
        source_hash: parsed.sourceHash,
        questions: parsed.questions
      }, {
        onConflict: "owner_id,lesson_key",
        ignoreDuplicates: true
      });
    if (error) throw new Error(`WCT quiz creation failed: ${error.message}`);

    const stored = await this.selectSetByLessonKey(parsed.lessonKey);
    if (!stored) throw new Error("WCT quiz creation did not return a set");
    return stored;
  }

  async syncStandardSets(
    books: WctStandardQuizBookSync[]
  ): Promise<WctStandardQuizSyncResult> {
    if (!this.admin) {
      throw new Error("WCT standard quiz synchronization requires an admin store");
    }
    const parsedBooks = parseWctStandardQuizBookSyncs(books);
    const { data, error } = await (await this.client()).rpc(
      "sync_wct_standard_quiz_sets",
      { p_owner_id: this.user.id, p_books: parsedBooks }
    );
    if (error) {
      throw new Error(`WCT standard quiz synchronization failed: ${error.message}`);
    }
    const result = standardSyncResultSchema.safeParse(data);
    if (!result.success) {
      throw new Error("Invalid WCT standard quiz synchronization result", {
        cause: result.error
      });
    }
    return result.data;
  }

  async submitAttempt(
    input: WctQuizSubmission
  ): Promise<WctQuizAttemptResult> {
    const parsed = wctQuizSubmissionSchema.parse(input);
    const { data, error } = await (await this.client()).rpc(
      "submit_wct_quiz_attempt",
      {
        p_quiz_set_id: parsed.quizSetId,
        p_answers: parsed.answers
      }
    );
    if (error) throw new Error(`WCT quiz submission failed: ${error.message}`);
    return mapWctQuizAttemptResult(data);
  }
}
