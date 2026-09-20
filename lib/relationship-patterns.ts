import type { RelationshipPatternContext } from "./relationship-emotion-reducer";

type RelationshipEventLike = {
  event_type?: string | null;
  metadata?: unknown;
  created_at?: string | null;
};

type SignalSummary = { name?: string; strength?: number; confidence?: number };

function signalsOf(event: RelationshipEventLike): SignalSummary[] {
  const metadata = event.metadata && typeof event.metadata === "object"
    ? event.metadata as Record<string, unknown>
    : {};
  const raw = metadata.signal_summary ?? metadata.signals;
  return Array.isArray(raw) ? raw.filter((item): item is SignalSummary => !!item && typeof item === "object") : [];
}

function weight(signal: SignalSummary) {
  const strength = Number.isFinite(signal.strength) ? Number(signal.strength) : 0;
  const confidence = Number.isFinite(signal.confidence) ? Number(signal.confidence) : 0;
  return strength * confidence;
}

/**
 * Derive conservative relationship-learning counters from persisted events.
 * These are evidence summaries, not permanent labels about the user.
 */
export function deriveRelationshipPatterns(events: RelationshipEventLike[]): RelationshipPatternContext {
  let repeatedHarm = 0;
  let reliableRepair = 0;
  let sustainedCare = 0;
  let sawRecentRepair = false;
  const now = Date.now();

  for (const event of events.slice(0, 40)) {
    const signals = signalsOf(event);
    const harm = signals.filter(s => ["hurtful","rejection","boundary"].includes(String(s.name))).reduce((n,s)=>n+weight(s),0);
    const repair = signals.filter(s => ["repair"].includes(String(s.name))).reduce((n,s)=>n+weight(s),0);
    const care = signals.filter(s => ["care","trust","warmth"].includes(String(s.name))).reduce((n,s)=>n+weight(s),0);
    const at = event.created_at ? Date.parse(event.created_at) : NaN;
    const ageDays = Number.isFinite(at) ? Math.max(0, (now - at) / 86400000) : 0;
    const recency = ageDays <= 30 ? 1 : ageDays <= 90 ? .6 : ageDays <= 180 ? .3 : .1;

    if (harm >= .45) {
      // A fresh recurrence after a repair matters more than an isolated old mistake.
      repeatedHarm += recency * (sawRecentRepair ? 1.35 : 1);
    }
    if (repair >= .5 && harm < .45) {
      reliableRepair += recency;
      sawRecentRepair = true;
    }
    if (care >= .55 && harm < .45) sustainedCare += recency;
  }

  return {
    repeatedHarm: Math.min(Math.round(repeatedHarm * 100) / 100, 3),
    reliableRepair: Math.min(Math.round(reliableRepair * 100) / 100, 3),
    sustainedCare: Math.min(Math.round(sustainedCare * 100) / 100, 3),
  };
}


export async function loadRelationshipPatterns(
  supabase: { from: (table: string) => any },
  isAnonymous: boolean
): Promise<RelationshipPatternContext> {
  if (isAnonymous) return {};

  const { data, error } = await supabase
    .from("misaki_relationship_events")
    .select("event_type,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error("RELATIONSHIP PATTERN LOAD ERROR:", error);
    return {};
  }

  return deriveRelationshipPatterns(Array.isArray(data) ? data : []);
}
