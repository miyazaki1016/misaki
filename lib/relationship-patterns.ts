import type { RelationshipPatternContext } from "./relationship-emotion-reducer";

type RelationshipEventLike = {
  event_type?: string | null;
  metadata?: unknown;
  created_at?: string | null;
};

type SignalSummary = { name?: string; strength?: number; confidence?: number };

export type RelationshipStoryState = {
  unresolvedHurt: number;
  repairStage: "none" | "hurt" | "repair_attempted" | "rebuilding";
  meaning: "none" | "unresolved_hurt" | "repair_in_progress" | "repair_demonstrated" | "repeated_harm";
  lastMeaningfulAt: string | null;
};

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

function orderedEvents(events: RelationshipEventLike[]) {
  return events.slice(0, 40).sort((a,b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0;
    const tb = b.created_at ? Date.parse(b.created_at) : 0;
    return ta - tb;
  });
}

/**
 * Read the same persisted relationship events as a small story trajectory.
 * This deliberately stores meaning, not a verbatim grievance: hurt may become
 * "we repaired this" after later evidence, while repeated harm stays cautionary.
 */
export function deriveRelationshipStory(events: RelationshipEventLike[]): RelationshipStoryState {
  let unresolvedHurt = 0;
  let repairStage: RelationshipStoryState["repairStage"] = "none";
  let meaning: RelationshipStoryState["meaning"] = "none";
  let lastMeaningfulAt: string | null = null;
  let harmCount = 0;

  for (const event of orderedEvents(events)) {
    const signals = signalsOf(event);
    const harm = signals.filter(s => String(s.name) === "hurtful").reduce((n,s)=>n+weight(s),0);
    const repair = signals.filter(s => String(s.name) === "repair").reduce((n,s)=>n+weight(s),0);
    const demonstratedCare = signals.filter(s => ["care","trust"].includes(String(s.name))).reduce((n,s)=>n+weight(s),0);

    if (harm >= .45) {
      harmCount += 1;
      unresolvedHurt = Math.min(3, unresolvedHurt + harm);
      repairStage = "hurt";
      meaning = harmCount >= 2 ? "repeated_harm" : "unresolved_hurt";
      lastMeaningfulAt = event.created_at ?? lastMeaningfulAt;
      continue;
    }

    if (repair >= .5 && unresolvedHurt > 0) {
      repairStage = "repair_attempted";
      meaning = "repair_in_progress";
      unresolvedHurt = Math.max(.15, unresolvedHurt - repair * .35);
      lastMeaningfulAt = event.created_at ?? lastMeaningfulAt;
    }

    if (demonstratedCare >= .55 && repairStage === "repair_attempted") {
      repairStage = "rebuilding";
      unresolvedHurt = Math.max(0, unresolvedHurt - demonstratedCare * .75);
      meaning = unresolvedHurt <= .2 ? "repair_demonstrated" : "repair_in_progress";
      lastMeaningfulAt = event.created_at ?? lastMeaningfulAt;
    } else if (demonstratedCare >= .55 && repairStage === "rebuilding") {
      unresolvedHurt = Math.max(0, unresolvedHurt - demonstratedCare * .5);
      if (unresolvedHurt <= .2) meaning = "repair_demonstrated";
      lastMeaningfulAt = event.created_at ?? lastMeaningfulAt;
    }
  }

  return {
    unresolvedHurt: Math.round(unresolvedHurt * 100) / 100,
    repairStage,
    meaning,
    lastMeaningfulAt,
  };
}

/**
 * Derive conservative relationship-learning counters from persisted events.
 * These are evidence summaries, not permanent labels about the user.
 */
export function deriveRelationshipPatterns(events: RelationshipEventLike[]): RelationshipPatternContext {
  let repeatedHarm = 0;
  let reliableRepair = 0;
  let sustainedCare = 0;
  let repairAttemptAt: number | null = null;
  let unresolvedHarmAt: number | null = null;
  let lastHarmAt: number | null = null;
  let lastCareAt: number | null = null;
  let consecutiveHarm = 0;
  let consecutiveCare = 0;
  const now = Date.now();
  const ordered = orderedEvents(events);

  for (const event of ordered) {
    const signals = signalsOf(event);
    const harm = signals.filter(s => String(s.name) === "hurtful").reduce((n,s)=>n+weight(s),0);
    const repair = signals.filter(s => ["repair"].includes(String(s.name))).reduce((n,s)=>n+weight(s),0);
    const care = signals.filter(s => ["care","trust","warmth"].includes(String(s.name))).reduce((n,s)=>n+weight(s),0);
    const at = event.created_at ? Date.parse(event.created_at) : NaN;
    if (!Number.isFinite(at)) continue;
    const ageDays = Math.max(0, (now - at) / 86400000);
    const recency = ageDays <= 30 ? 1 : ageDays <= 90 ? .6 : ageDays <= 180 ? .3 : .1;

    if (harm >= .45) {
      const clustered = lastHarmAt !== null && at - lastHarmAt <= 14 * 86400000;
      const recurrence = repairAttemptAt !== null && at - repairAttemptAt <= 14 * 86400000 ? 1.35 : clustered ? 1.15 : 1;
      consecutiveHarm += 1;
      consecutiveCare = 0;
      repeatedHarm += recency * recurrence * (consecutiveHarm >= 3 ? 1.1 : 1);
      lastHarmAt = at;
      unresolvedHarmAt = at;
      repairAttemptAt = null;
    }
    if (repair >= .5 && harm < .45) {
      const followsRecentHarm = unresolvedHarmAt !== null && at - unresolvedHarmAt <= 30 * 86400000;
      repairAttemptAt = followsRecentHarm ? at : null;
      consecutiveHarm = 0;
    }
    if (care >= .55 && harm < .45) {
      const sustained = lastCareAt !== null && at - lastCareAt <= 30 * 86400000;
      consecutiveCare += 1;
      consecutiveHarm = 0;
      sustainedCare += recency * (sustained ? 1.1 : 1) * (consecutiveCare >= 3 ? 1.05 : 1);
      lastCareAt = at;
      if (repairAttemptAt !== null && at >= repairAttemptAt && at - repairAttemptAt <= 14 * 86400000) {
        reliableRepair += recency;
        repairAttemptAt = null;
        unresolvedHarmAt = null;
      }
    }
  }

  return {
    repeatedHarm: Math.min(Math.round(repeatedHarm * 100) / 100, 3),
    reliableRepair: Math.min(Math.round(reliableRepair * 100) / 100, 3),
    sustainedCare: Math.min(Math.round(sustainedCare * 100) / 100, 3),
  };
}

export async function loadRelationshipHistory(
  supabase: { from: (table: string) => any },
  isAnonymous: boolean
): Promise<{ patterns: RelationshipPatternContext; story: RelationshipStoryState }> {
  if (isAnonymous) return { patterns: {}, story: deriveRelationshipStory([]) };

  const { data, error } = await supabase
    .from("misaki_relationship_events")
    .select("event_type,metadata,created_at")
    .in("event_type", ["emotion_action_v2_after_chat", "temporary_relationship_checkpoint"])
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error("RELATIONSHIP HISTORY LOAD ERROR:", error);
    return { patterns: {}, story: deriveRelationshipStory([]) };
  }

  const events = Array.isArray(data) ? data : [];
  return { patterns: deriveRelationshipPatterns(events), story: deriveRelationshipStory(events) };
}

export async function loadRelationshipPatterns(
  supabase: { from: (table: string) => any },
  isAnonymous: boolean
): Promise<RelationshipPatternContext> {
  return (await loadRelationshipHistory(supabase, isAnonymous)).patterns;
}

export async function loadRelationshipStory(
  supabase: { from: (table: string) => any },
  isAnonymous: boolean
): Promise<RelationshipStoryState> {
  return (await loadRelationshipHistory(supabase, isAnonymous)).story;
}
