export type ExpressionTopicLabelInput = {
  title: string;
  day_date?: string | null;
  folder_path?: string[] | string | null;
  folderPath?: string | null;
  folder?: {
    path?: string | null;
    name?: string | null;
  } | null;
  created_at?: string | null;
};

export function getExpressionTopicDisplayLabel(day: ExpressionTopicLabelInput) {
  const folderPath = getExpressionTopicFolderPath(day);
  const title = formatExpressionTopicTitle(day.title, day.day_date);
  return folderPath ? `${folderPath} / ${title}` : title;
}

export function getExpressionTopicDepth(day: ExpressionTopicLabelInput) {
  const path = getExpressionTopicFolderPath(day);
  if (!path) return 0;
  const separators = path.split("/");
  if (!separators[0]) return 0;
  return Math.max(0, separators.length - 1);
}

export function sortExpressionTopicsByFolder<T extends ExpressionTopicLabelInput>(topics: T[]) {
  return [...topics].sort(compareExpressionTopicsByFolder);
}

function compareExpressionTopicsByFolder<T extends ExpressionTopicLabelInput>(a: T, b: T) {
  const folderDelta = compareNullableText(getExpressionTopicFolderPath(a), getExpressionTopicFolderPath(b));
  if (folderDelta !== 0) return folderDelta;

  const dateDelta = compareNullableDateDesc(a.day_date, b.day_date);
  if (dateDelta !== 0) return dateDelta;

  const createdAtDelta = compareNullableDateDesc(a.created_at, b.created_at);
  if (createdAtDelta !== 0) return createdAtDelta;

  return textCollator.compare(a.title, b.title);
}

function getExpressionTopicFolderPath(day: ExpressionTopicLabelInput): string | null {
  if (Array.isArray(day.folder_path)) return day.folder_path.filter(Boolean).join(" / ");
  return day.folder_path ?? day.folderPath ?? day.folder?.path ?? day.folder?.name ?? null;
}

const textCollator = new Intl.Collator("ko-KR", { numeric: true, sensitivity: "base" });

function compareNullableText(a: string | null, b: string | null) {
  if (a && !b) return -1;
  if (!a && b) return 1;
  if (!a && !b) return 0;
  return textCollator.compare(a ?? "", b ?? "");
}

function compareNullableDateDesc(a?: string | null, b?: string | null) {
  const aTime = a ? Date.parse(a) : Number.NaN;
  const bTime = b ? Date.parse(b) : Number.NaN;
  const aHasDate = Number.isFinite(aTime);
  const bHasDate = Number.isFinite(bTime);
  if (aHasDate && !bHasDate) return -1;
  if (!aHasDate && bHasDate) return 1;
  if (!aHasDate && !bHasDate) return 0;
  return bTime - aTime;
}

function formatExpressionTopicTitle(title: string, dayDate?: string | null) {
  const trimmedTitle = title.trim();
  const compactDate = getCompactTopicDate(dayDate);
  if (!compactDate) return trimmedTitle;
  if (new RegExp(`\\(${compactDate}\\)\\s*$`).test(trimmedTitle)) return trimmedTitle;
  return `${trimmedTitle} (${compactDate})`;
}

function getCompactTopicDate(dayDate?: string | null) {
  const digits = dayDate?.replaceAll(/\D/g, "");
  if (!digits) return null;
  if (/^\d{8}$/.test(digits)) return digits.slice(2);
  if (/^\d{6}$/.test(digits)) return digits;
  return null;
}
