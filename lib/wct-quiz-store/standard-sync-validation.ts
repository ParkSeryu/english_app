import type {
  WctStandardQuizBookSync
} from "@/lib/wct/quiz/types";
import {
  wctStandardQuizSetCreateSchema
} from "@/lib/wct/quiz/validation";

export function parseWctStandardQuizBookSyncs(
  books: WctStandardQuizBookSync[]
): WctStandardQuizBookSync[] {
  if (books.length === 0 || books.length > 100) {
    throw new Error("WCT standard quiz synchronization requires 1 to 100 books");
  }
  const seenBooks = new Set<string>();
  const seenLessonKeys = new Set<string>();
  const seenSourceIds = new Set<string>();
  return books.map((book) => {
    const bookId = book.bookId.trim();
    if (!bookId || bookId.length > 240 || seenBooks.has(bookId)) {
      throw new Error("WCT standard quiz synchronization has an invalid book");
    }
    seenBooks.add(bookId);
    if (book.sets.length === 0) {
      throw new Error("WCT standard quiz synchronization requires complete book sets");
    }
    const sets = book.sets.map((set) => {
      const parsed = wctStandardQuizSetCreateSchema.parse(set);
      if (seenLessonKeys.has(parsed.lessonKey)) {
        throw new Error("WCT standard quiz synchronization has duplicate lesson keys");
      }
      if (seenSourceIds.has(parsed.sourceId)) {
        throw new Error("WCT standard quiz synchronization has duplicate source IDs");
      }
      seenLessonKeys.add(parsed.lessonKey);
      seenSourceIds.add(parsed.sourceId);
      return parsed;
    });
    return { bookId, sets };
  });
}
