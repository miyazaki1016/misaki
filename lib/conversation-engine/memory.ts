/**
 * Pure, side-effect-free normalization matching the existing production chat
 * route's safeMemory and safeTodayMemory behavior.
 *
 * This helper is NOT wired into production yet.
 */
export type TodayMemorySnapshot = {
  date: string;
  items: string[];
};

export function sanitizeLongTermMemory(
  memory: unknown,
  maxMemory = 30,
): string[] {
  if (!Number.isInteger(maxMemory) || maxMemory < 0) {
    throw new Error("invalid memory limit");
  }
  if (!Array.isArray(memory)) return [];
  return memory
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(maxMemory === 0 ? Infinity : -maxMemory);
}

/**
 * Mirrors production: keep only nonblank string items, take the last 12,
 * and reset the items when the stored date differs from currentDate.
 * currentDate is an explicit input: this module never reads the clock.
 */
export function sanitizeTodayMemory(
  memory: unknown,
  currentDate: string,
  maxTodayMemory = 12,
): TodayMemorySnapshot {
  if (!Number.isInteger(maxTodayMemory) || maxTodayMemory < 0) {
    throw new Error("invalid today memory limit");
  }
  const source =
    memory && typeof memory === "object"
      ? (memory as Record<string, unknown>)
      : {};
  const date =
    typeof source.date === "string" ? source.date : currentDate;
  const items = Array.isArray(source.items)
    ? source.items
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(maxTodayMemory === 0 ? Infinity : -maxTodayMemory)
    : [];
  return date === currentDate
    ? { date, items }
    : { date: currentDate, items: [] };
}
