import { createServerSupabase, loadTemporaryRoot, editTemporaryRoot, openTemporaryState, type RootState } from "./canonical-state";
import { createLegacyRelationshipActingState } from "./relationship-acting-guide";
import { engineEnabled, PROCESSING_VERSION, applyTemporaryEvidence, AXES, type Snapshot, type Turn } from "./relationship-engine-v1";
import { analyzeRelationshipEvidence, criticalCandidates, validateCriticalEvent } from "./relationship-analyzer-v1";
import { CanonicalRelationshipStore, processRelationshipTurn } from "./relationship-processing-v1";
import { createGeminiTelemetrySink } from "./gemini-usage-telemetry-server";
import { resolveRelationshipIdentity, type IdentityState, type RelationshipIdentity, type RelationshipConstraint } from "./relationship-identity-resolver";

const IDENTITY_RESOLVER_VERSION = "relationship-identity-v1";

// Local deduplication is an optimization; DB leases serialize distributed workers.
const running = new Map<string, Promise<void>>();
export function enqueueTemporaryTurn(root: RootState, turn: Turn): Snapshot | undefined {
  if (!engineEnabled()) return root.relationshipEngine;
  const snapshot = root.relationshipEngine ?? { state: createLegacyRelationshipActingState(root.relationshipPoints), version: 0, episodes: [], appliedPatterns: [], processed: [], pending: [], criticalEvents: [] };
  return snapshot.processed.includes(turn.requestId) || snapshot.pending.some(t => t.requestId === turn.requestId)
    ? snapshot : { ...snapshot, pending: [...snapshot.pending, turn] };
}

async function analyzeTemporarySnapshot(root: RootState, save?: (snapshot: Snapshot) => Promise<void>, check?: () => Promise<void>, telemetryUserId: string | null = null) {
  let snapshot = root.relationshipEngine!;
  for (const turn of snapshot.pending) {
    const history = root.history as any[];
    if (!history?.some(t => t.requestId === turn.requestId && t.role === "user" && t.text === turn.message) ||
      !history.some(t => t.requestId === turn.requestId && t.role === "misaki" && t.text === turn.reply)) throw new Error("temporary_canonical_turn_required");
    // Pending turn remains encrypted/durable if validation or analysis fails.
    for (const type of criticalCandidates(turn.message)) {
      const events = snapshot.criticalEvents ?? [];
      if (events.some(e => e.request_id === turn.requestId && e.event_type === type)) continue;
      await check?.();
      const confirmed = await validateCriticalEvent(turn, type, events, createGeminiTelemetrySink("critical_validator", telemetryUserId, turn.requestId));
      await check?.();
      if (confirmed) {
        snapshot = { ...snapshot, state: { ...snapshot.state,
          relationshipStatus: type === "romantic_acceptance" ? "romantic_partner" : type === "relationship_end" ? "none" : snapshot.state.relationshipStatus },
          version: snapshot.version + 1, criticalEvents: [...events, { request_id: turn.requestId, event_type: type }] };
      }
    }
    await check?.();
    const evidence = await analyzeRelationshipEvidence(turn, createGeminiTelemetrySink("relationship_analyzer", telemetryUserId, turn.requestId));
    await check?.();
    const beforeIdentityVersion = snapshot.version;
    snapshot = applyTemporaryEvidence(snapshot, turn, evidence);
    if (snapshot.version !== beforeIdentityVersion) {
      const latestCritical = snapshot.criticalEvents?.filter(e => e.request_id === turn.requestId).at(-1)?.event_type ?? null;
      const resolved = resolveRelationshipIdentity({
        relationshipStateVersion: snapshot.version,
        state: snapshot.state,
        current: snapshot.identity,
        criticalEvent: latestCritical
      });
      snapshot = { ...snapshot, identity: {
        primaryIdentity: resolved.primaryIdentity,
        candidateIdentity: resolved.candidateIdentity,
        candidateConfirmations: resolved.candidateConfirmations,
        candidateSourceVersion: resolved.candidateSourceVersion,
        constraint: resolved.constraint,
        constraintAnchorVersion: resolved.constraintAnchorVersion,
        preRomanticIdentity: resolved.preRomanticIdentity
      } };
    }
    if (save) await save(snapshot);
  }
  return snapshot;
}

async function runAnonymous(userId: string) {
  let root = await loadTemporaryRoot(userId, null);
  if (!root.relationshipEngine) return;
  await analyzeTemporarySnapshot(root, async snapshot => {
    await editTemporaryRoot(userId, { ...root, relationshipEngine: snapshot }, "relationship-analysis");
    root = await loadTemporaryRoot(userId, null);
  }, undefined, userId);
}

async function runPermanent(userId: string) {
  // Import and ordinary processing share the claimed per-user lease.
  const store = new CanonicalRelationshipStore(createServerSupabase());
  // Scan saved canonical turns chronologically; one failed predecessor stops later application.
  const turns = await store.rows("misaki_relationship_events", userId, q => q.eq("event_type", "chat_turn_completed").order("id", { ascending: true }));
  const ledgers = await store.rows("misaki_relationship_processing", userId, q => q.eq("processing_version", PROCESSING_VERSION));
  // Do not analyze pre-cutover history with a new model/version.
  const boundary = process.env.MISAKI_RELATIONSHIP_ENGINE_START_AT;
  if (!boundary || !Number.isFinite(Date.parse(boundary))) throw new Error("relationship_start_boundary_required");
  let count = 0;
  for (const turn of turns) {
    if (Date.parse(turn.created_at) < Date.parse(boundary)) continue;
    if (ledgers.some(l => l.request_id === turn.request_id && l.status === "applied")) continue;
    if (++count > 3) break;
    const result = await processRelationshipTurn(store, userId, turn.request_id,
      t => analyzeRelationshipEvidence(t, createGeminiTelemetrySink("relationship_analyzer", userId, t.requestId)),
      (t, type, events) => validateCriticalEvent(t, type, events, createGeminiTelemetrySink("critical_validator", userId, t.requestId)),
      (check, token) => importPermanentRelationship(userId, turn.request_id, token, check));
    if (result.status === "deferred") break;
    await processPermanentIdentity(userId);
  }
  // Applied Relationship turns may have been skipped above while Identity previously failed.
  await processPermanentIdentity(userId);
}

/** Called via Next after(): never changes an already-successful chat/quota receipt. */
export async function resumeRelationshipProcessing(userId: string, anonymous: boolean) {
  if (!engineEnabled()) return;
  const key = `${userId}:${anonymous}`;
  if (running.has(key)) return running.get(key);
  const task = (anonymous ? runAnonymous(userId) : runPermanent(userId))
    .catch(() => { console.error("RELATIONSHIP V1 PROCESSING RETRY REQUIRED"); })
    .finally(() => running.delete(key));
  running.set(key, task);
  return task;
}

export async function importPermanentRelationship(userId: string, requestId: string, token: string, check: () => Promise<void>) {
  if (!engineEnabled()) return;
  await check();
  const db = createServerSupabase();
  const { data: imported, error: importError } = await db.from("misaki_relationship_temporary_v1_imports").select("user_id").eq("user_id", userId).maybeSingle();
  if (importError) throw new Error("relationship_import_read_failed");
  if (imported) return;
  const { data: root, error } = await db.from("misaki_temporary_roots").select("token,revision,expires_at").eq("user_id", userId).maybeSingle();
  if (error) throw new Error("relationship_import_root_read_failed");
  if (!root) return;
  // An expired anonymous checkpoint is no longer importable and must not poison
  // permanent Relationship processing. Invalid/unverifiable live roots still fail closed.
  if (Date.parse(root.expires_at) <= Date.now()) return;
  const verified = openTemporaryState(root.token);
  if (!verified) throw new Error("relationship_import_root_invalid");
  let snapshot = verified.state.relationshipEngine;
  if (!snapshot) return;
  // Once auth is permanent the temporary writer rejects writes. Finish the frozen
  // verified trajectory in memory and materialize atomically through the import RPC.
  if (snapshot.pending.length) snapshot = await analyzeTemporarySnapshot(verified.state, undefined, check, userId);
  await check();
  const identity = snapshot.identity ?? resolveRelationshipIdentity({
    relationshipStateVersion: snapshot.version,
    state: snapshot.state
  });
  const { error: rpcError } = await db.rpc("import_misaki_temporary_relationship_v3", { p_user_id: userId, p_request_id: requestId, p_processing_version: PROCESSING_VERSION, p_lease_token: token, p_source_revision: root.revision,
    ...Object.fromEntries(AXES.map(axis => [`p_${axis}`, snapshot.state[axis]])), p_relationship_status: snapshot.state.relationshipStatus ?? "none",
    p_engine_version: PROCESSING_VERSION, p_payload: snapshot,
    p_primary_identity: identity.primaryIdentity, p_candidate_identity: identity.candidateIdentity ?? null,
    p_candidate_confirmations: identity.candidateConfirmations ?? 0, p_candidate_source_version: identity.candidateSourceVersion ?? null,
    p_constraint_state: identity.constraint ?? "none", p_constraint_anchor_version: identity.constraintAnchorVersion ?? null, p_pre_romantic_identity: identity.preRomanticIdentity ?? null,
    p_resolver_version: IDENTITY_RESOLVER_VERSION });
  if (rpcError) throw new Error(`relationship_import_failed:${rpcError.code ?? ""}:${rpcError.message ?? ""}`);
}

export function pendingRelationshipGuide(root: RootState) {
  return root.relationshipCriticalPending || root.relationshipEngine?.pending.some(t => criticalCandidates(t.message).length)
    ? "【未解決の明示的関係イベント】直近の関係変更は検証待ち。成立・継続・復縁を断定せず、現在のユーザーの境界を優先してください。" : "";
}


async function processPermanentIdentity(userId: string) {
  const db = createServerSupabase();
  const { data: relationship, error: relationshipError } = await db.from("misaki_relationship_state")
    .select("friendship_score,trust_score,playfulness_score,affection_score,romance_score,relationship_status,relationship_state_version")
    .eq("user_id",userId).maybeSingle();
  if (relationshipError) throw new Error("relationship_identity_source_read_failed");
  if (!relationship) return;

  const { data: saved, error: identityError } = await db.from("misaki_relationship_identity_state").select("*").eq("user_id",userId).maybeSingle();
  // Migration is intentionally deployable separately from runtime. Until present, retry later.
  if (identityError) throw new Error("relationship_identity_state_read_failed");
  if (saved?.source_relationship_state_version === relationship.relationship_state_version && saved?.resolver_version === IDENTITY_RESOLVER_VERSION) return;

  const { data: eventRows, error: eventError } = await db.from("misaki_relationship_events")
    .select("event_type,after_state,id").eq("user_id",userId)
    .in("event_type",["romantic_acceptance","romantic_rejection","relationship_end","boundary_event","reconciliation"])
    .order("id",{ascending:false}).limit(1);
  if (eventError) throw new Error("relationship_identity_event_read_failed");
  const latestEvent = eventRows?.[0];
  const eventVersion = Number(latestEvent?.after_state?.relationship_state_version);
  const criticalEvent = eventVersion === Number(relationship.relationship_state_version) ? latestEvent.event_type : null;

  const current:IdentityState|undefined = saved ? {
    primaryIdentity:saved.primary_identity as RelationshipIdentity,
    candidateIdentity:saved.candidate_identity as RelationshipIdentity|null,
    candidateConfirmations:Number(saved.candidate_confirmations ?? 0),
    candidateSourceVersion:saved.candidate_source_version == null ? null : Number(saved.candidate_source_version),
    constraint:saved.constraint_state as RelationshipConstraint,
    constraintAnchorVersion:saved.constraint_anchor_version == null ? null : Number(saved.constraint_anchor_version),
    preRomanticIdentity:saved.pre_romantic_identity as Exclude<RelationshipIdentity,"lover">|null
  } : undefined;

  const resolved=resolveRelationshipIdentity({
    relationshipStateVersion:Number(relationship.relationship_state_version),
    state:{
      friendship:Number(relationship.friendship_score),trust:Number(relationship.trust_score),
      playfulness:Number(relationship.playfulness_score),affection:Number(relationship.affection_score),
      romance:Number(relationship.romance_score),relationshipStatus:relationship.relationship_status
    },
    current,criticalEvent
  });

  const { error: applyError } = await db.rpc("apply_misaki_relationship_identity_v1",{
    p_user_id:userId,p_source_relationship_state_version:Number(relationship.relationship_state_version),
    p_resolver_version:IDENTITY_RESOLVER_VERSION,p_primary_identity:resolved.primaryIdentity,
    p_candidate_identity:resolved.candidateIdentity,p_candidate_confirmations:resolved.candidateConfirmations,
    p_candidate_source_version:resolved.candidateSourceVersion,p_constraint_state:resolved.constraint,
    p_constraint_anchor_version:resolved.constraintAnchorVersion,p_pre_romantic_identity:resolved.preRomanticIdentity,p_transition_decision:resolved.transitionDecision,p_reason_code:resolved.reasonCode
  });
  if (applyError) {
    if (/stale_relationship_state_version/.test(applyError.message ?? "")) return; // a newer canonical state won; retry from it later.
    throw new Error(`relationship_identity_apply_failed:${applyError.code ?? ""}:${applyError.message ?? ""}`);
  }
}
