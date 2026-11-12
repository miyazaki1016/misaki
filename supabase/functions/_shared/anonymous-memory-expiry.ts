import { activeAnonymousHistory } from "./anonymous-history-expiry.ts";

const TTL_MS = 24 * 60 * 60 * 1000;
export type MemoryTimes = Array<[text: string, createdAt: number]>;

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
  const created = new Map(times);
  return items.filter((text): text is string => {
    const at = created.get(text);
    return typeof text === "string" && Number.isFinite(at) && at! <= now && at! > now - TTL_MS;
  });
}

export function advanceAnonymousMemory(items: string[], previous: unknown, times: MemoryTimes | undefined, now: number) {
  const created = new Map(times);
  const legacy = new Set(Array.isArray(previous) ? previous : []);
  const nextTimes: MemoryTimes = [];
  for (const text of new Set(items)) {
    const at = created.get(text) ?? (legacy.has(text) ? undefined : now);
    if (Number.isFinite(at) && at! <= now && at! > now - TTL_MS) nextTimes.push([text, at!]);
  }
  return { items: nextTimes.map(([text]) => text), times: nextTimes };
}

export function anonymousInferenceState<T extends AnonymousMemoryState>(state: T, now: number) {
  const history = activeAnonymousHistory(state.history, now);
  const evidenceAt = state.relationshipEvidenceAt ??
    (Array.isArray(state.history) && state.history.length === history.length
      ? Math.min(...history.map(row => Date.parse((row as { sentAt: string }).sentAt))) : NaN);
  const relationshipActive = Number.isFinite(evidenceAt) && evidenceAt <= now && evidenceAt > now - TTL_MS;
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
        memory: state.memoryTimes?.filter(([text]) => active.memory.includes(text)) ?? [],
        today: state.todayMemoryTimes?.filter(([text]) => active.todayMemory.items.includes(text)) ?? [],
        relationship: active.relationshipEvidenceAt,
      },
    },
  };
}
