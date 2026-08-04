import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserIdentity } from "@/lib/types";
import type { WctPopQuizStore } from "@/lib/wct-pop-quiz-store/contract";
import {
  mapWctPopQuizAttempt,
  mapWctPopQuizConfirmResult,
  mapWctPopQuizResult,
  mapWctPopQuizSummary
} from "@/lib/wct-pop-quiz-store/mappers";
import type {
  WctPopQuizAttempt,
  WctPopQuizCompleteInput,
  WctPopQuizConfirmInput,
  WctPopQuizConfirmResult,
  WctPopQuizResult,
  WctPopQuizStartInput,
  WctPopQuizSummary
} from "@/lib/wct/pop-quiz/types";
import { wctPopQuizQuestionsSchema } from "@/lib/wct/pop-quiz/validation";

type SupabaseLike = Awaited<ReturnType<typeof createServerSupabaseClient>>;

const ATTEMPT_SELECT =
  "attempt_id,book_id,seed,questions,answers,current_index,status,latest_score,incorrect_days,started_at,completed_at";

export class SupabaseWctPopQuizStore implements WctPopQuizStore {
  constructor(
    private readonly user: UserIdentity,
    private readonly createClient:
      () => Promise<SupabaseLike> | SupabaseLike = createServerSupabaseClient
  ) {}

  private async client() {
    return this.createClient();
  }

  async getSummary(bookId: string): Promise<WctPopQuizSummary | null> {
    const { data, error } = await (await this.client())
      .from("wct_pop_quiz_progress")
      .select("attempt_id,status,current_index,latest_score,completed_at,questions")
      .eq("owner_id", this.user.id)
      .eq("book_id", bookId)
      .maybeSingle();
    if (error) throw new Error(`WCT Pop Quiz summary query failed: ${error.message}`);
    return data ? mapWctPopQuizSummary(data) : null;
  }

  async getAttempt(bookId: string): Promise<WctPopQuizAttempt | null> {
    const { data, error } = await (await this.client())
      .from("wct_pop_quiz_progress")
      .select(ATTEMPT_SELECT)
      .eq("owner_id", this.user.id)
      .eq("book_id", bookId)
      .maybeSingle();
    if (error) throw new Error(`WCT Pop Quiz attempt query failed: ${error.message}`);
    return data ? mapWctPopQuizAttempt(data) : null;
  }

  async startAttempt(input: WctPopQuizStartInput): Promise<WctPopQuizAttempt> {
    const questions = wctPopQuizQuestionsSchema.parse(input.questions);
    const { data, error } = await (await this.client()).rpc(
      "start_wct_pop_quiz",
      {
        p_book_id: input.bookId,
        p_seed: input.seed,
        p_questions: questions
      }
    );
    if (error) throw new Error(`WCT Pop Quiz start failed: ${error.message}`);
    return mapWctPopQuizAttempt(data);
  }

  async confirmAnswer(
    input: WctPopQuizConfirmInput
  ): Promise<WctPopQuizConfirmResult> {
    const { data, error } = await (await this.client()).rpc(
      "confirm_wct_pop_quiz_answer",
      {
        p_book_id: input.bookId,
        p_attempt_id: input.attemptId,
        p_question_id: input.questionId,
        p_choice_id: input.choiceId
      }
    );
    if (error) {
      throw new Error(`WCT Pop Quiz answer confirmation failed: ${error.message}`);
    }
    return mapWctPopQuizConfirmResult(data);
  }

  async completeAttempt(input: WctPopQuizCompleteInput): Promise<WctPopQuizResult> {
    const { data, error } = await (await this.client()).rpc(
      "complete_wct_pop_quiz",
      {
        p_book_id: input.bookId,
        p_attempt_id: input.attemptId
      }
    );
    if (error) throw new Error(`WCT Pop Quiz completion failed: ${error.message}`);
    return mapWctPopQuizResult(data);
  }
}
