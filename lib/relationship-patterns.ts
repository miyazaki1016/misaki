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

  for (const event of events.slice(0, 40)) {
    const signals = signalsOf(event);
    const harm = signals.filter(s => ["hurtful","rejection","boundary"].includes(String(s.name))).reduce((n,s)=>n+weight(s),0);
    const repair = signals.filter(s => ["repair"].includes(String(s.name))).reduce((n,s)=>n+weight(s),0);
    const care = signals.filter(s => ["care","trust","warmth"].includes(String(s.name))).reduce((n,s)=>n+weight(s),0);

    if (harm >= .45) repeatedHarm += 1;
    if (repair >= .5 && harm < .45) reliableRepair += 1;
    if (care >= .55 && harm < .45) sustainedCare += 1;
  }

  return {
    repeatedHarm: Math.min(repeatedHarm, 3),
    reliableRepair: Math.min(reliableRepair, 3),
    sustainedCare: Math.min(sustainedCare, 3),
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
