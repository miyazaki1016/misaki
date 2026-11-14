const ANONYMOUS_HISTORY_TTL_MS = 24 * 60 * 60 * 1000;

// Only a timestamp from the server-authenticated root can qualify a message
// for inference. The browser's display cache does not extend its lifetime.
export function activeAnonymousHistory(history: unknown, now: number): unknown[] {
  if (!Array.isArray(history)) return [];

  return history.filter(item => {
    if (typeof item?.sentAt !== "string") return false;
    const sentAt = Date.parse(item.sentAt);
    return sentAt > now - ANONYMOUS_HISTORY_TTL_MS && sentAt <= now;
  });
}
