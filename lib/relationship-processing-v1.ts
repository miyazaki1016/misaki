import { PROCESSING_VERSION, hash, episodeFor, patternsFor, boundedDelta, type Evidence, type Turn, type Episode, type CriticalType } from "./relationship-engine-v1.ts";
import { analyzeRelationshipEvidence, criticalCandidates, validateCriticalEvent } from "./relationship-analyzer-v1.ts";

const phases = ["pending", "analyzing", "evidence_saved", "episode_saved", "pattern_saved", "applied"] as const;
export type ProcessingResult = { status: "completed" } | { status: "deferred"; reason: string };
export interface RelationshipStore {
  claim(userId: string, requestId: string): Promise<{ claimed: boolean; replayed?: boolean; leaseToken?: string; reason?: string }>;
  renew(userId: string, requestId: string, token: string): Promise<void>;
  release(userId: string, requestId: string, token: string): Promise<void>;
  setLeaseGuard?(check?: () => Promise<void>): void;
  turn(userId: string, requestId: string): Promise<Turn>;
  ledger(userId: string, requestId: string): Promise<any>;
  advance(userId: string, requestId: string, phase: string, error?: string): Promise<void>;
  evidence(userId: string, requestId: string): Promise<Array<{ id: string; evidence_key: string; payload: { candidate: Evidence } }>>;
  saveEvidence(userId: string, turn: Turn, key: string, e: Evidence): Promise<void>;
  episodes(userId: string): Promise<Array<{ id: string; episode_key: string; summary: { episode: Episode } }>>;
  saveEpisode(userId: string, episode: Episode, evidenceIds: string[]): Promise<void>;
  patterns(userId: string): Promise<Array<{ id: string; pattern_key: string }>>;
  appliedPatterns(userId: string): Promise<string[]>;
  savePattern(userId: string, key: string, episodes: Array<{ id: string; episode: Episode }>): Promise<void>;
  apply(userId: string, requestId: string, patternIds: string[], delta: ReturnType<typeof boundedDelta>, token: string): Promise<void>;
  events(userId: string): Promise<any[]>;
  pending(userId: string, turn: Turn, type: CriticalType): Promise<any>;
  advancePending(userId: string, turn: Turn, type: CriticalType, status: string): Promise<void>;
  applyCritical(userId: string, turn: Turn, type: CriticalType, token: string): Promise<void>;
}

function compact(evidence: Evidence[]) {
  return evidence.map(e => [e.type, e.axis, e.polarity, e.strength, e.confidence, e.interpretation, e.subject, e.supportingTurn]);
}
function expand(rows: any[][]): Evidence[] {
  return rows.map(([type, axis, polarity, strength, confidence, interpretation, subject, supportingTurn]) => ({ type, axis, polarity, strength, confidence, interpretation, subject, supportingTurn } as Evidence));
}

/** Successful conversation is the only entry boundary. Every write is delegated to canonical RPCs. */
export async function processRelationshipTurn(store: RelationshipStore, userId: string, requestId: string,
  analyze = analyzeRelationshipEvidence, validate = validateCriticalEvent,
  prepare?: (check: () => Promise<void>) => Promise<void>) {
  const owner = store;
  const claim = await owner.claim(userId, requestId);
  // A replayed claim carries another invocation's token, not new ownership.
  // Lost claim responses safely wait for expiry rather than adopting that token.
  if (!claim.claimed || claim.replayed) return { status: "deferred", reason: claim.reason ?? "lease_busy" } as ProcessingResult;
  if (!claim.leaseToken) throw new Error("relationship_claim_token_required");
  const token = claim.leaseToken;
  let lost = false;
  const check = async () => {
    if (lost) throw new Error("relationship_processing_lease_lost");
    try { await owner.renew(userId, requestId, token); }
    catch { lost = true; throw new Error("relationship_processing_lease_lost"); }
  };
  // All reads/writes are fenced at the application boundary. The final v2 RPCs
  // independently validate ownership in the DB transaction.
  store = new Proxy(owner, { get(target, key) {
    const value = Reflect.get(target, key);
    if (typeof value !== "function") return value;
    return async (...args: unknown[]) => { await check(); return value.apply(target, args); };
  } });
  const guardedExternal = async <T>(work: () => Promise<T>) => {
    await check();
    const result = await work();
    await check();
    return result;
  };
  owner.setLeaseGuard?.(check);
  let stage = "pending";
  let candidates: Evidence[] | undefined;
  try {
    const turn = await store.turn(userId, requestId); // Reject unsaved/cross-user turns before any model/write.
    const ledger = await store.ledger(userId, requestId);
    if (ledger?.status === "applied") return { status: "completed" } as ProcessingResult;
    stage = ledger?.status ?? "pending";
    if (prepare) await guardedExternal(() => prepare(check));
    if (stage === "failed") {
      const journal = JSON.parse(ledger.last_error ?? "{}");
      stage = phases.includes(journal.stage) ? journal.stage : "analyzing";
      candidates = journal.evidence ? expand(journal.evidence) : undefined;
      await store.advance(userId, requestId, "analyzing");
      // The control RPC restarts at analyzing; recover completed stages without re-running them.
      for (const phase of phases.slice(2, phases.indexOf(stage as any) + 1)) await store.advance(userId, requestId, phase);
    }
    if (stage === "pending") { await store.advance(userId, requestId, "analyzing"); stage = "analyzing"; }
    // Pending is durable BEFORE the external validator. Evidence cannot manufacture critical events.
    const events = await store.events(userId);
    for (const type of criticalCandidates(turn.message)) {
      if (events.some(e => e.request_id === requestId && e.event_type === type)) continue;
      const pending = await store.pending(userId, turn, type);
      if (["resolved", "dismissed"].includes(pending.status)) continue;
      await store.advancePending(userId, turn, type, "processing");
      try {
        if (await guardedExternal(() => validate(turn, type, events))) await store.applyCritical(userId, turn, type, token);
        else await store.advancePending(userId, turn, type, "dismissed");
      } catch (error) {
        if (lost || /relationship_processing_lease_(lost|required)/.test(String(error))) throw error;
        await store.advancePending(userId, turn, type, "failed");
        throw error;
      }
    }
    if (stage === "analyzing") {
      candidates ??= await guardedExternal(() => analyze(turn));
      const saved = await store.evidence(userId, requestId);
      for (const e of candidates) {
        const key = hash(`${e.type}:${e.axis}:${e.polarity}`);
        if (!saved.some(x => x.evidence_key === key)) await store.saveEvidence(userId, turn, key, e);
      }
      await store.advance(userId, requestId, "evidence_saved"); stage = "evidence_saved";
    }
    if (stage === "evidence_saved") {
      const saved = await store.evidence(userId, requestId);
      for (const item of saved) {
        const episode = episodeFor(item.payload.candidate, turn);
        if (episode) await store.saveEpisode(userId, episode, [item.id]);
      }
      await store.advance(userId, requestId, "episode_saved"); stage = "episode_saved";
    }
    if (stage === "episode_saved") {
      const episodes = await store.episodes(userId);
      const existing = await store.patterns(userId);
      const patterns = patternsFor(episodes.map(e => e.summary.episode), await store.appliedPatterns(userId));
      for (const p of patterns) {
        if (!existing.some(x => x.pattern_key === p.key)) await store.savePattern(userId, p.key,
          p.episodes.map(e => ({ id: episodes.find(x => x.episode_key === e.key)!.id, episode: e })));
      }
      await store.advance(userId, requestId, "pattern_saved"); stage = "pattern_saved";
    }
    if (stage === "pattern_saved") {
      const episodes = await store.episodes(userId);
      const patterns = patternsFor(episodes.map(e => e.summary.episode), await store.appliedPatterns(userId));
      const saved = await store.patterns(userId);
      if (patterns.length) await store.apply(userId, requestId, patterns.map(p => {
        const id = saved.find(x => x.pattern_key === p.key)?.id;
        if (!id) throw new Error("canonical_pattern_missing");
        return id;
      }), boundedDelta(patterns), token);
      // No Pattern means no State RPC, including no version-only mutation.
      await store.advance(userId, requestId, "applied");
    }
    return { status: "completed" } as ProcessingResult;
  } catch (error) {
    if (lost || /relationship_processing_lease_(lost|required)/.test(String(error))) return { status: "deferred", reason: "lease_lost" } as ProcessingResult;
    const journal = JSON.stringify({ stage, evidence: candidates ? compact(candidates) : undefined, error: "relationship_processing_failed" });
    if (journal.length > 1900) throw new Error("relationship_retry_journal_too_large");
    try { await store.advance(userId, requestId, "failed", journal); }
    catch (failure) { if (lost) return { status: "deferred", reason: "lease_lost" } as ProcessingResult; throw failure; }
    throw error;
  } finally {
    owner.setLeaseGuard?.();
    // Token-specific release cannot remove a reclaimed successor's lease.
    try { await owner.release(userId, requestId, token); }
    catch { console.error("RELATIONSHIP LEASE RELEASE RETRY REQUIRED"); }
  }
}

export class CanonicalRelationshipStore implements RelationshipStore {
  private db: any;
  private leaseGuard?: () => Promise<void>;
  setLeaseGuard(check?: () => Promise<void>) { this.leaseGuard = check; }
  constructor(db: any) { this.db = db; }
  async rpc(name: string, args: Record<string, unknown>) {
    if (!/^(claim_misaki_relationship_processing_v1|renew_misaki_relationship_processing_lease_v1|release_misaki_relationship_processing_lease_v1)$/.test(name)) await this.leaseGuard?.();
    const { data, error } = await this.db.rpc(name, args);
    if (error) throw new Error(`${name}_failed:${error.code ?? ""}:${error.message ?? ""}`);
    return data;
  }
  async claim(userId: string, requestId: string) {
    const boundary = process.env.MISAKI_RELATIONSHIP_ENGINE_START_AT;
    if (!boundary || !Number.isFinite(Date.parse(boundary))) throw new Error("relationship_start_boundary_required");
    return this.rpc("claim_misaki_relationship_processing_v1", { p_user_id: userId, p_request_id: requestId,
      p_processing_version: PROCESSING_VERSION, p_start_at: boundary, p_lease_seconds: 120 });
  }
  async renew(userId: string, requestId: string, token: string) {
    await this.rpc("renew_misaki_relationship_processing_lease_v1", { p_user_id: userId, p_request_id: requestId,
      p_processing_version: PROCESSING_VERSION, p_lease_token: token, p_lease_seconds: 120 });
  }
  async release(userId: string, requestId: string, token: string) {
    await this.rpc("release_misaki_relationship_processing_lease_v1", { p_user_id: userId, p_request_id: requestId,
      p_processing_version: PROCESSING_VERSION, p_lease_token: token });
  }
  async rows(table: string, userId: string, configure: (query: any) => any = q => q) {
    const rows: any[] = [];
    const key = table === "misaki_relationship_pattern_consumptions" ? "pattern_id" : table === "misaki_relationship_episode_evidence" ? "evidence_id" : ["misaki_relationship_processing", "misaki_relationship_state_applications"].includes(table) ? "request_id" : "id";
    for (let offset = 0; ; offset += 500) {
      await this.leaseGuard?.();
      const { data, error } = await configure(this.db.from(table).select("*").eq("user_id", userId)).order(key, { ascending: true }).range(offset, offset + 499);
      if (error) throw new Error(`${table}_read_failed`);
      rows.push(...(data ?? []));
      if (!data || data.length < 500) return rows;
    }
  }
  async turn(userId: string, requestId: string): Promise<Turn> {
    const rows = await this.rows("misaki_relationship_events", userId, q => q.eq("request_id", requestId).eq("event_type", "chat_turn_completed"));
    const e = rows[0];
    if (!e || typeof e.metadata?.message !== "string" || typeof e.metadata?.result?.reply !== "string") throw new Error("canonical_chat_turn_required");
    return { requestId, message: e.metadata.message, reply: e.metadata.result.reply, savedAt: e.created_at };
  }
  async ledger(userId: string, requestId: string) {
    return (await this.rows("misaki_relationship_processing", userId, q => q.eq("request_id", requestId).eq("processing_version", PROCESSING_VERSION)))[0];
  }
  async advance(userId: string, requestId: string, phase: string, error?: string) {
    await this.rpc("advance_misaki_relationship_processing_v1", { p_user_id: userId, p_request_id: requestId, p_processing_version: PROCESSING_VERSION, p_status: phase, p_last_error: error ?? null });
  }
  evidence(userId: string, requestId: string) {
    return this.rows("misaki_relationship_evidence", userId, q => q.eq("request_id", requestId).eq("analyzer_version", PROCESSING_VERSION));
  }
  async saveEvidence(userId: string, turn: Turn, key: string, e: Evidence) {
    await this.rpc("record_misaki_relationship_evidence_v1", { p_user_id: userId, p_request_id: turn.requestId, p_evidence_key: key,
      p_axis: e.axis, p_direction: e.polarity, p_strength: e.strength, p_interpretation: e.interpretation, p_subject: e.subject,
      p_payload: { candidate: e, supporting_request_id: turn.requestId, evidence_type: e.type, confidence: e.confidence }, p_analyzer_version: PROCESSING_VERSION });
  }
  episodes(userId: string) { return this.rows("misaki_relationship_episodes", userId, q => q.eq("analyzer_version", PROCESSING_VERSION)); }
  async saveEpisode(userId: string, episode: Episode, evidenceIds: string[]) {
    const existing = (await this.episodes(userId)).find(x => x.episode_key === episode.key);
    const links = existing ? await this.rows("misaki_relationship_episode_evidence", userId, q => q.eq("episode_id", existing.id)) : [];
    if (evidenceIds.every(id => links.some(x => x.evidence_id === id))) return;
    await this.rpc("upsert_misaki_relationship_episode_v1", { p_user_id: userId, p_episode_key: episode.key, p_episode_type: episode.type,
      p_analyzer_version: PROCESSING_VERSION, p_first_request_id: existing?.first_request_id ?? episode.requestId, p_last_request_id: episode.requestId,
      p_evidence_ids: evidenceIds, p_summary: { episode: existing?.summary?.episode ?? episode } });
  }
  patterns(userId: string) { return this.rows("misaki_relationship_patterns", userId, q => q.eq("pattern_version", PROCESSING_VERSION)); }
  async appliedPatterns(userId: string) {
    const applications = await this.rows("misaki_relationship_pattern_consumptions", userId, q => q.eq("processing_version", PROCESSING_VERSION));
    const ids = new Set(applications.map(a => a.pattern_id));
    return (await this.patterns(userId)).filter(p => ids.has(p.id)).map(p => p.pattern_key);
  }
  async savePattern(userId: string, key: string, episodes: Array<{ id: string; episode: Episode }>) {
    await this.rpc("upsert_misaki_relationship_pattern_v1", { p_user_id: userId, p_pattern_key: key, p_pattern_type: episodes[0].episode.type,
      p_pattern_version: PROCESSING_VERSION, p_episode_ids: episodes.map(e => e.id), p_first_request_id: episodes[0].episode.requestId,
      p_last_request_id: episodes[episodes.length - 1].episode.requestId, p_summary: { policy: "three_distinct_days_v1", axis: episodes[0].episode.axis, polarity: episodes[0].episode.polarity } });
  }
  async apply(userId: string, requestId: string, patternIds: string[], delta: ReturnType<typeof boundedDelta>, token: string) {
    await this.rpc("apply_misaki_relationship_state_v2", { p_user_id: userId, p_request_id: requestId, p_processing_version: PROCESSING_VERSION,
      p_lease_token: token, p_pattern_ids: patternIds, ...Object.fromEntries(Object.entries(delta).map(([axis, value]) => [`p_${axis}_delta`, value])) });
  }
  events(userId: string) { return this.rows("misaki_relationship_events", userId, q => q.in("event_type", ["romantic_proposal", "romantic_acceptance", "romantic_rejection", "relationship_end", "boundary_event", "reconciliation"]).order("id", { ascending: true })); }
  pending(userId: string, turn: Turn, type: CriticalType) {
    return this.rpc("upsert_misaki_relationship_critical_pending_v1", { p_user_id: userId, p_request_id: turn.requestId, p_candidate_type: type, p_context: { source: "canonical_turn", request_id: turn.requestId }, p_validator_version: PROCESSING_VERSION });
  }
  async advancePending(userId: string, turn: Turn, type: CriticalType, status: string) {
    await this.rpc("advance_misaki_relationship_critical_pending_v1", { p_user_id: userId, p_request_id: turn.requestId, p_candidate_type: type, p_status: status, p_validator_version: PROCESSING_VERSION, p_last_error: status === "failed" ? "validator_failed" : null });
  }
  async applyCritical(userId: string, turn: Turn, type: CriticalType, token: string) {
    await this.rpc("apply_misaki_relationship_critical_event_v2", { p_processing_version: PROCESSING_VERSION, p_lease_token: token, p_user_id: userId, p_request_id: turn.requestId, p_event_type: type, p_validator_version: PROCESSING_VERSION, p_reason: "explicit_event_validated", p_metadata: { processing_version: PROCESSING_VERSION } });
  }
}
