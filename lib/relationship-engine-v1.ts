import { createHash } from "node:crypto";
import type { RelationshipActingState } from "./relationship-acting-guide.ts";
import type { IdentityState } from "./relationship-identity-resolver.ts";

export const PROCESSING_VERSION = "relationship-v1.1";
export const AXES = ["friendship", "trust", "playfulness", "affection", "romance"] as const;
export const EVIDENCE_TYPES = ["care", "disclosure", "repair", "playful_reciprocity", "harm", "romantic_declaration"] as const;
export const CRITICAL_TYPES = ["romantic_proposal", "romantic_acceptance", "romantic_rejection", "relationship_end", "boundary_event", "reconciliation"] as const;
export type Axis = typeof AXES[number];
export type CriticalType = typeof CRITICAL_TYPES[number];
export type Evidence = {
  type: typeof EVIDENCE_TYPES[number]; axis: Axis; polarity: -1 | 1;
  strength: number; confidence: number;
  interpretation: "direct" | "ambiguous" | "hypothetical" | "quoted" | "third_party" | "negated";
  subject: "user_to_misaki" | "misaki_to_user" | "third_party";
  supportingTurn: string;
};
export type Turn = { requestId: string; message: string; reply: string; savedAt: string };
export type Episode = { key: string; type: string; axis: Axis; polarity: -1 | 1; day: string; requestId: string };
export type Pattern = { key: string; episodes: Episode[]; axis: Axis; polarity: -1 | 1 };
export type Snapshot = {
  state: RelationshipActingState; version: number; episodes: Episode[]; appliedPatterns: string[];
  processed: string[]; pending: Turn[];
  criticalEvents?: Array<{ request_id: string; event_type: CriticalType }>;
  identity?: IdentityState;
};
export function engineEnabled() { return process.env.MISAKI_RELATIONSHIP_ENGINE_VERSION === PROCESSING_VERSION; }
export function identityEnabled() { return engineEnabled() && process.env.MISAKI_RELATIONSHIP_IDENTITY_VERSION === "relationship-identity-v1"; }
export function hash(text: string) { return createHash("sha256").update(text).digest("hex"); }

/** Fail closed: the model supplies observations, never score/status/delta. */
export function parseEvidence(value: unknown, turn: Turn): Evidence[] {
  if (!value || typeof value !== "object" || Object.keys(value).some(k => k !== "evidence")) throw new Error("invalid_analyzer_schema");
  const items = (value as { evidence?: unknown }).evidence;
  if (!Array.isArray(items) || items.length > 5) throw new Error("invalid_evidence_count");
  const seen = new Set<string>();
  return items.map((e: any) => {
    if (!e || Object.keys(e).some(k => !["type", "axis", "polarity", "strength", "confidence", "interpretation", "subject", "supportingTurn"].includes(k)) ||
      !EVIDENCE_TYPES.includes(e.type) || !AXES.includes(e.axis) || ![-1, 1].includes(e.polarity) ||
      !Number.isInteger(e.strength) || e.strength < 1 || e.strength > 100 ||
      typeof e.confidence !== "number" || !Number.isFinite(e.confidence) || e.confidence < 0 || e.confidence > 1 ||
      !["direct", "ambiguous", "hypothetical", "quoted", "third_party", "negated"].includes(e.interpretation) ||
      !["user_to_misaki", "misaki_to_user", "third_party"].includes(e.subject) ||
      typeof e.supportingTurn !== "string" || !e.supportingTurn.trim() || e.supportingTurn.length > 96 || !turn.message.includes(e.supportingTurn)) {
      throw new Error("invalid_evidence_candidate");
    }
    const key = `${e.type}:${e.axis}:${e.polarity}`;
    if (seen.has(key)) throw new Error("duplicate_evidence_candidate");
    seen.add(key);
    return e as Evidence;
  });
}

export function episodeFor(e: Evidence, turn: Turn): Episode | null {
  if (e.subject !== "user_to_misaki" || e.interpretation !== "direct" || e.confidence < .8 || e.strength < 50) return null;
  const day = new Date(turn.savedAt).toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
  // One intention/day at most; declarations stay one episode across paraphrases/days.
  const scope = e.type === "romantic_declaration" ? "declaration" : day;
  return { key: `${e.type}:${e.axis}:${e.polarity}:${scope}`, type: e.type, axis: e.axis, polarity: e.polarity, day, requestId: turn.requestId };
}

/** Conservative initial policy: three independent days, never raw message count. */
export function patternsFor(episodes: Episode[], applied: string[]): Pattern[] {
  const groups = new Map<string, Episode[]>();
  for (const e of episodes) {
    const key = `${e.type}:${e.axis}:${e.polarity}`;
    const group = groups.get(key) ?? [];
    if (!group.some(x => x.key === e.key)) group.push(e);
    groups.set(key, group);
  }
  const result: Pattern[] = [];
  for (const [group, entries] of groups) {
    entries.sort((a, b) => a.day.localeCompare(b.day) || a.key.localeCompare(b.key));
    for (let i = 0; i + 2 < entries.length; i += 3) {
      const batch = entries.slice(i, i + 3);
      if (new Set(batch.map(e => e.day)).size !== 3) continue;
      const key = hash(`${PROCESSING_VERSION}:${group}:${batch.map(e => e.key).join("|")}`);
      if (!applied.includes(key)) result.push({ key, episodes: batch, axis: batch[0].axis, polarity: batch[0].polarity });
    }
  }
  return result;
}

export function boundedDelta(patterns: Pattern[]): Record<Axis, number> {
  const delta = Object.fromEntries(AXES.map(axis => [axis, 0])) as Record<Axis, number>;
  for (const p of patterns) delta[p.axis] += p.polarity;
  for (const axis of AXES) delta[axis] = Math.max(-3, Math.min(3, delta[axis]));
  return delta;
}

export function canonicalActingState(row: any, intimacyStage: RelationshipActingState["intimacyStage"]): RelationshipActingState {
  if (!row || !AXES.every(axis => Number.isInteger(row[`${axis}_score`]) && row[`${axis}_score`] >= 0 && row[`${axis}_score`] <= 100) ||
    !["none", "romantic_partner"].includes(row.relationship_status)) throw new Error("invalid_canonical_relationship_state");
  return { intimacyStage, ...Object.fromEntries(AXES.map(axis => [axis, row[`${axis}_score`]])), relationshipStatus: row.relationship_status } as RelationshipActingState;
}

export function applyTemporaryEvidence(snapshot: Snapshot, turn: Turn, evidence: Evidence[]): Snapshot {
  if (snapshot.processed.includes(turn.requestId)) return snapshot;
  const episodes = [...snapshot.episodes];
  for (const e of evidence) {
    const episode = episodeFor(e, turn);
    if (episode && !episodes.some(x => x.key === episode.key)) episodes.push(episode);
  }
  const patterns = patternsFor(episodes, snapshot.appliedPatterns);
  const delta = boundedDelta(patterns);
  const state = { ...snapshot.state };
  for (const axis of AXES) state[axis] = Math.max(0, Math.min(100, state[axis] + delta[axis]));
  return { ...snapshot, state, version: snapshot.version + (patterns.length ? 1 : 0), episodes,
    appliedPatterns: [...snapshot.appliedPatterns, ...patterns.map(p => p.key)],
    processed: [...snapshot.processed, turn.requestId], pending: snapshot.pending.filter(t => t.requestId !== turn.requestId) };
}
