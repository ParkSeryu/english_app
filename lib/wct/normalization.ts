export function normalizeWctIdentity(value: string) {
  return value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
}

export function formatWctDayLabel(dayNumber: number, shortLabel: string) {
  return `Day ${dayNumber} (${shortLabel.trim()})`;
}

export function stableStringify(value: unknown) {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonValue);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, sortJsonValue(item)])
  );
}
