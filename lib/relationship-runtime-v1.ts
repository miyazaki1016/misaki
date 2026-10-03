import { createServerSupabase, loadTemporaryRoot, editTemporaryRoot, openTemporaryState, type RootState } from "./canonical-state";
import { createLegacyRelationshipActingState } from "./relationship-acting-guide";
import { engineEnabled, PROCESSING_VERSION, applyTemporaryEvidence, AXES, type Snapshot, type Turn } from "./relationship-engine-v1";
import { analyzeRelationshipEvidence, criticalCandidates, validateCriticalEvent } from "./relationship-analyzer-v1";
import { CanonicalRelationshipStore, processRelationshipTurn } from "./relationship-processing-v1";

// Within one runtime, concurrent retries share a task. DB request/version uniqueness is the final replay guard.
const running = new Map<string, Promise<void>>();
export function enqueueTemporaryTurn(root: RootState, turn: Turn): Snapshot | undefined {
  if (!engineEnabled()) return root.relationshipEngine;
  const snapshot = root.relationshipEngine ?? { state: createLegacyRelationshipActingState(root.relationshipPoints), version: 0, episodes: [], appliedPatterns: [], processed: [], pending: [], criticalEvents: [] };
  return snapshot.processed.includes(turn.requestId) || snapshot.pending.some(t => t.requestId === turn.requestId)
    ? snapshot : { ...snapshot, pending: [...snapshot.pending, turn] };
}

async function analyzeTemporarySnapshot(root: RootState, save?: (snapshot: Snapshot) => Promise<void>) {
  let snapshot = root.relationshipEngine!;
  for (const turn of snapshot.pending) {
    const history = root.history as any[];
    if (!history?.some(t => t.requestId === turn.requestId && t.role === "user" && t.text === turn.message) ||
      !history.some(t => t.requestId === turn.requestId && t.role === "misaki" && t.text === turn.reply)) throw new Error("temporary_canonical_turn_required");
    // Pending turn remains encrypted/durable if validation or analysis fails.
    for (const type of criticalCandidates(turn.message)) {
      const events = snapshot.criticalEvents ?? [];
      if (events.some(e => e.request_id === turn.requestId && e.event_type === type)) continue;
      if (await validateCriticalEvent(turn, type, events)) {
        snapshot = { ...snapshot, state: { ...snapshot.state,
          relationshipStatus: type === "romantic_acceptance" ? "romantic_partner" : type === "relationship_end" ? "none" : snapshot.state.relationshipStatus },
          version: snapshot.version + 1, criticalEvents: [...events, { request_id: turn.requestId, event_type: type }] };
      }
    }
    snapshot = applyTemporaryEvidence(snapshot, turn, await analyzeRelationshipEvidence(turn));
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
  });
}

async function runPermanent(userId: string) {
  // No permanent application may race ahead of the one-time encrypted import.
  await importPermanentRelationship(userId);
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
    await processRelationshipTurn(store, userId, turn.request_id);
  }
}

/** Called via Next after(): never changes an already-successful chat/quota receipt. */
export async function resumeRelationshipProcessing(userId: string, anonymous: boolean) {
  if (!engineEnabled()) return;
  const key = `${userId}:${anonymous}`;
  if (running.has(key)) return running.get(key);
  const task = (anonymous ? runAnonymous(userId) : runPermanent(userId))
    .catch(() => { console.error("RELATIONSHIP V1 PROCESSING RETRY REQUIRED", { userId }); })
    .finally(() => running.delete(key));
  running.set(key, task);
  return task;
}

export async function importPermanentRelationship(userId: string) {
  if (!engineEnabled()) return;
  const db = createServerSupabase();
  const { data: imported, error: importError } = await db.from("misaki_relationship_temporary_v1_imports").select("user_id").eq("user_id", userId).maybeSingle();
  if (importError) throw new Error("relationship_import_read_failed");
  if (imported) return;
  const { data: root, error } = await db.from("misaki_temporary_roots").select("token,revision,expires_at").eq("user_id", userId).maybeSingle();
  if (error) throw new Error("relationship_import_root_read_failed");
  if (!root) return;
  const verified = openTemporaryState(root.token);
  if (!verified || Date.parse(root.expires_at) <= Date.now()) throw new Error("relationship_import_root_expired");
  let snapshot = verified.state.relationshipEngine;
  if (!snapshot) return;
  // Once auth is permanent the temporary writer rejects writes. Finish the frozen
  // verified trajectory in memory and materialize atomically through the import RPC.
  if (snapshot.pending.length) snapshot = await analyzeTemporarySnapshot(verified.state);
  const { error: rpcError } = await db.rpc("import_misaki_temporary_relationship_v1", { p_user_id: userId, p_source_revision: root.revision,
    ...Object.fromEntries(AXES.map(axis => [`p_${axis}`, snapshot.state[axis]])), p_relationship_status: snapshot.state.relationshipStatus ?? "none",
    p_engine_version: PROCESSING_VERSION, p_payload: snapshot });
  if (rpcError) throw new Error("relationship_import_failed");
}

export function pendingRelationshipGuide(root: RootState) {
  return root.relationshipCriticalPending || root.relationshipEngine?.pending.some(t => criticalCandidates(t.message).length)
    ? "【未解決の明示的関係イベント】直近の関係変更は検証待ち。成立・継続・復縁を断定せず、現在のユーザーの境界を優先してください。" : "";
}
