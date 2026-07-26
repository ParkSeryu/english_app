import type {
  WctApprovedImportInput,
  WctBook,
  WctBookSummary,
  WctDay,
  WctImportResult
} from "@/lib/wct/types";

export type WctDuplicate = {
  dayNumber: number;
  existingDayId: string;
  existingDisplayLabel: string;
};

export interface WctStore {
  listBooks(): Promise<WctBookSummary[]>;
  getBook(bookId: string): Promise<WctBook | null>;
  getDay(dayId: string): Promise<WctDay | null>;
  findDuplicateDays(bookTitle: string, dayNumbers: number[]): Promise<WctDuplicate[]>;
  importApprovedBatch(input: WctApprovedImportInput): Promise<WctImportResult>;
}
