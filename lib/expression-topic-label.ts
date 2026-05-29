export type ExpressionTopicLabelInput = {
  title: string;
  day_date?: string | null;
  folder_path?: string[] | string | null;
  folderPath?: string | null;
  folder?: {
    path?: string | null;
    name?: string | null;
  } | null;
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

function getExpressionTopicFolderPath(day: ExpressionTopicLabelInput): string | null {
  if (Array.isArray(day.folder_path)) return day.folder_path.filter(Boolean).join(" / ");
  return day.folder_path ?? day.folderPath ?? day.folder?.path ?? day.folder?.name ?? null;
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
