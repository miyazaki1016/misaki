// Offline-only prompt context packing. No network, Gemini calls, or persisted user data.
const MAX_RECENT = 16;
const MAX_MEMORY = 12;
const MAX_EVENTS = 5;
const clip = (value, limit) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, limit);
const safeArray = value => Array.isArray(value) ? value : [];
export function packMisakiContext({recentTurns=[], memory=[], events=[], topic=null}={}) {
  // Preserve the most recent messages verbatim: conversational nuance matters.
  const recent = safeArray(recentTurns).slice(-MAX_RECENT).map(turn => ({
    role: turn?.role === 'assistant' ? 'assistant' : 'user',
    content: String(turn?.content ?? ''),
  }));
  // These entries are *already verified* memories. Never infer a new memory here.
  const selectedMemory = safeArray(memory)
    .filter(item => item?.verified === true && item?.relevant !== false)
    .slice(0, MAX_MEMORY)
    .map(item => ({kind: clip(item.kind, 24), fact: clip(item.fact, 180),
      ...(item.source ? {source: clip(item.source, 60)} : {})}));
  // Only explicitly selected events are passed. Preserve freshness and failure status.
  const selectedEvents = safeArray(events)
    .filter(event => event?.selected === true)
    .slice(0, MAX_EVENTS)
    .map(event => ({
      type: clip(event.type, 30), detail: clip(event.detail, 180),
      observedAt: clip(event.observedAt, 48), source: clip(event.source, 70),
      status: clip(event.status ?? 'unknown', 24),
    }));
  return {topic: topic ? clip(topic, 100) : null,
    memory: selectedMemory, events: selectedEvents, recentTurns: recent};
}
export function estimateContextSize(value) {
  // Character count is a proxy, NOT actual Gemini tokenizer output.
  return JSON.stringify(value).length;
}
