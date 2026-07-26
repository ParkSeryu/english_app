import { normalizeWctIdentity } from "@/lib/wct/normalization";
import type {
  WctApprovedImportInput,
  WctBook,
  WctBookSummary,
  WctDay,
  WctImportResult
} from "@/lib/wct/types";
import type { UserIdentity } from "@/lib/types";
import type { WctDuplicate, WctStore } from "@/lib/wct-store/contract";
import {
  mapWctBook,
  mapWctBookSummary,
  mapWctDay,
  mapWctDaySummary
} from "@/lib/wct-store/mappers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";

type SupabaseLike =
  | Awaited<ReturnType<typeof createServerSupabaseClient>>
  | ReturnType<typeof createServiceRoleSupabaseClient>;

const DAY_SUMMARY_SELECT =
  "id,book_id,day_number,short_label,source_page_start,source_page_end,source_needs_review";

export class SupabaseWctStore implements WctStore {
  constructor(
    private readonly user: UserIdentity,
    private readonly createClient: () => Promise<SupabaseLike> | SupabaseLike = createServerSupabaseClient,
    private readonly admin = false
  ) {}

  private async client() {
    return this.createClient();
  }

  async listBooks(): Promise<WctBookSummary[]> {
    const { data, error } = await (await this.client())
      .from("wct_books")
      .select("id,title,level_label,sort_order,wct_days(id)")
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });
    if (error) throw new Error(`WCT books query failed: ${error.message}`);
    return (data ?? []).map((row) => mapWctBookSummary(row));
  }

  async getBook(bookId: string): Promise<WctBook | null> {
    const { data, error } = await (await this.client())
      .from("wct_books")
      .select(`id,title,level_label,sort_order,wct_days(${DAY_SUMMARY_SELECT})`)
      .eq("id", bookId)
      .maybeSingle();
    if (error) throw new Error(`WCT book query failed: ${error.message}`);
    return data ? mapWctBook(data) : null;
  }

  async getDay(dayId: string): Promise<WctDay | null> {
    const { data, error } = await (await this.client())
      .from("wct_days")
      .select(`
        id,book_id,day_number,short_label,learning_summary,
        source_page_start,source_page_end,source_needs_review,
        wct_day_concepts(id,text,source_kind,sort_order),
        wct_patterns(
          id,pattern_text,meaning_ko,usage_note,usage_source,
          source_page,source_needs_review,sort_order,
          wct_examples(id,english_text,meaning_ko,source_page,source_needs_review,sort_order)
        ),
        wct_important_notes(id,pattern_id,note_text,source_page,sort_order),
        wct_practice_prompts(id,pattern_id,prompt_text,meaning_ko,source_page,sort_order)
      `)
      .eq("id", dayId)
      .maybeSingle();
    if (error) throw new Error(`WCT Day query failed: ${error.message}`);
    return data ? mapWctDay(data) : null;
  }

  async findDuplicateDays(bookTitle: string, dayNumbers: number[]): Promise<WctDuplicate[]> {
    let query = (await this.client())
      .from("wct_books")
      .select(`id,wct_days(${DAY_SUMMARY_SELECT})`)
      .eq("normalized_title", normalizeWctIdentity(bookTitle));
    if (this.admin) query = query.eq("owner_id", this.user.id);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(`WCT duplicate query failed: ${error.message}`);
    const requested = new Set(dayNumbers);
    return data
      ? ((data.wct_days ?? []) as Record<string, unknown>[])
        .map(mapWctDaySummary)
        .filter((day) => requested.has(day.dayNumber))
        .sort((left, right) => left.dayNumber - right.dayNumber)
        .map((day) => ({
          dayNumber: day.dayNumber,
          existingDayId: day.id,
          existingDisplayLabel: day.displayLabel
        }))
      : [];
  }

  async importApprovedBatch(input: WctApprovedImportInput): Promise<WctImportResult> {
    if (!this.admin) throw new Error("WCT import requires an admin store");
    const { data, error } = await (await this.client()).rpc("import_wct_batch", {
      p_owner_id: this.user.id,
      p_idempotency_key: input.idempotencyKey,
      p_payload_hash: input.payloadHash,
      p_payload: { book: input.book, days: input.days }
    });
    if (error) throw new Error(`WCT import failed: ${error.message}`);

    const result = data as {
      bookId: string;
      receiptId: string;
      replayed: boolean;
      operations: Array<{ dayNumber: number; action: WctImportResult["operations"][number]["action"]; dayId: string }>;
    };
    return {
      ...result,
      bookUrl: `/lessons/books/${result.bookId}`,
      dayUrls: result.operations.map(({ dayId }) => `/lessons/books/${result.bookId}/days/${dayId}`)
    };
  }
}
