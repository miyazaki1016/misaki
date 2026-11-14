import { activeAnonymousHistory } from "./anonymous-history-expiry.ts";

export const ANONYMOUS_MEMORY_TTL_MS = 24 * 60 * 60 * 1000;
export type AnonymousEvidence = {
  requestId: string;
  origin: "user";
  sentAt: number;
  expiresAt: number;
};

export type MemoryTimes = Array<[text: string, evidenceAt: number, sources?: AnonymousEvidence[]]>;

type AnonymousMemoryState = {
  history?: unknown;
  memory: unknown;
  todayMemory: { date: string; items: string[] };
  memoryTimes?: MemoryTimes;
  todayMemoryTimes?: MemoryTimes;
  relationshipEvidenceAt?: number;
  relationshipPoints: number;
  relationshipEngine?: unknown;
  temporaryRelationship?: unknown;
};

export function activeAnonymousMemory(items: unknown, times: MemoryTimes | undefined, now: number): string[] {
  if (!Array.isArray(items)) return [];
  const created = new Map(times?.map(([text, at]) => [text, at]));
  return items.filter((text): text is string => {
    const at = created.get(text);
    return typeof text === "string" && Number.isFinite(at) && at! <= now && at! > now - ANONYMOUS_MEMORY_TTL_MS;
  });
}

export function advanceAnonymousMemory(
  items: string[], previous: string[], times: MemoryTimes | undefined,
  evidence: Map<string, AnonymousEvidence[]>, now: number,
) {
  const retained = new Set(previous);
  const existing = new Map(times?.map(row => [row[0], row]));
  const nextTimes: MemoryTimes = [];
  for (const text of new Set(items)) {
    const old = retained.has(text) ? existing.get(text) : undefined;
    if (old && activeAnonymousMemory([text], [old], now).length) {
      nextTimes.push(old);
      continue;
    }
    const sources = evidence.get(text);
    if (!sources?.length || sources.some(source => source.sentAt > now || source.expiresAt <= now)) continue;
    nextTimes.push([text, Math.min(...sources.map(source => source.sentAt)), sources]);
  }
  return { items: nextTimes.map(([text]) => text), times: nextTimes };
}

export function anonymousInferenceState<T extends AnonymousMemoryState>(state: T, now: number) {
  const history = activeAnonymousHistory(state.history, now);
  const evidenceAt = state.relationshipEvidenceAt ??
    (Array.isArray(state.history) && state.history.length === history.length
      ? Math.min(...history.map(row => Date.parse((row as { sentAt: string }).sentAt))) : NaN);
  const relationshipActive = Number.isFinite(evidenceAt) && evidenceAt <= now && evidenceAt > now - ANONYMOUS_MEMORY_TTL_MS;
  return {
    ...state,
    relationshipEvidenceAt: relationshipActive ? evidenceAt : undefined,
    relationshipPoints: relationshipActive ? state.relationshipPoints : 0,
    relationshipEngine: relationshipActive ? state.relationshipEngine as T["relationshipEngine"] : undefined,
    temporaryRelationship: relationshipActive ? state.temporaryRelationship as T["temporaryRelationship"] : undefined,
    history,
    memory: activeAnonymousMemory(state.memory, state.memoryTimes, now),
    todayMemory: {
      ...state.todayMemory,
      items: activeAnonymousMemory(state.todayMemory?.items, state.todayMemoryTimes, now),
    },
  };
}

export function anonymousCheckpointState<T extends AnonymousMemoryState>(state: T, now: number) {
  const active = anonymousInferenceState(state, now);
  return {
    ...active,
    temporaryRelationship: {
      emotionPrimary: "neutral", emotionIntensity: 0, actionState: "NORMAL", events: [],
      ...(active.temporaryRelationship as object | undefined),
      anonymousExpiry: {
        memory: state.memoryTimes?.filter(([text]) => active.memory.includes(text)).map(([text, at]) => [text, at]) ?? [],
        today: state.todayMemoryTimes?.filter(([text]) => active.todayMemory.items.includes(text)).map(([text, at]) => [text, at]) ?? [],
        relationship: active.relationshipEvidenceAt,
      },
    },
  };
}
