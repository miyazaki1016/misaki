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
  let repairAwaitingOutcome = false;
  let lastHarmAt: number | null = null;
  let lastCareAt: number | null = null;
  const now = Date.now();
  // Events are loaded newest-first. Learn trajectories oldest -> newest so a
  // repair only earns trust after later evidence shows the relationship held.
  const ordered = events.slice(0, 40).sort((a,b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0;
    const tb = b.created_at ? Date.parse(b.created_at) : 0;
    return ta - tb;
  });

  for (const event of ordered) {
    const signals = signalsOf(event);
    // A boundary or a rejection can be healthy and must not teach Misaki that
    // the user is harmful. Repeated-harm learning is reserved for hurtful evidence.
    const harm = signals.filter(s => String(s.name) === "hurtful").reduce((n,s)=>n+weight(s),0);
    const repair = signals.filter(s => ["repair"].includes(String(s.name))).reduce((n,s)=>n+weight(s),0);
    const care = signals.filter(s => ["care","trust","warmth"].includes(String(s.name))).reduce((n,s)=>n+weight(s),0);
    const at = event.created_at ? Date.parse(event.created_at) : NaN;
    const ageDays = Number.isFinite(at) ? Math.max(0, (now - at) / 86400000) : 0;
    const recency = ageDays <= 30 ? 1 : ageDays <= 90 ? .6 : ageDays <= 180 ? .3 : .1;

    if (harm >= .45) {
      const clustered = lastHarmAt !== null && Number.isFinite(at) && at - lastHarmAt <= 14 * 86400000;
      // Recurrence after a repair attempt matters most; repeated harm in a short
      // period also forms a pattern, but old isolated incidents should not pile up forever.
      const recurrence = repairAwaitingOutcome ? 1.35 : clustered ? 1.15 : 1;
      repeatedHarm += recency * recurrence;
      if (Number.isFinite(at)) lastHarmAt = at;
      repairAwaitingOutcome = false;
    }
    if (repair >= .5 && harm < .45) repairAwaitingOutcome = true;
    if (care >= .55 && harm < .45) {
      const sustained = lastCareAt !== null && Number.isFinite(at) && at - lastCareAt <= 30 * 86400000;
      sustainedCare += recency * (sustained ? 1.1 : 1);
      if (Number.isFinite(at)) lastCareAt = at;
      // Repair becomes reliable only when a later turn supplies positive evidence.
      if (repairAwaitingOutcome) {
        reliableRepair += recency;
        repairAwaitingOutcome = false;
      }
    }
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
