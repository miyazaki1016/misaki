import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { AXES, PROCESSING_VERSION, parseEvidence, episodeFor, patternsFor, boundedDelta, applyTemporaryEvidence, canonicalActingState, type Evidence, type Turn, type Snapshot } from "../lib/relationship-engine-v1.ts";
import { processRelationshipTurn, CanonicalRelationshipStore } from "../lib/relationship-processing-v1.ts";
import { criticalCandidates } from "../lib/relationship-analyzer-v1.ts";
import { createLegacyRelationshipActingState, createRelationshipActingGuide } from "../lib/relationship-acting-guide.ts";
import { generateGeminiJson } from "../lib/gemini-json-generator.ts";

const turn: Turn = { requestId: "turn-3", message: "美咲、体調は大丈夫？", reply: "ありがとう", savedAt: "2026-10-03T00:00:00Z" };
const evidence: Evidence = { type: "care", axis: "affection", polarity: 1, strength: 70, confidence: .95, interpretation: "direct", subject: "user_to_misaki", supportingTurn: "体調は大丈夫" };
function snapshot(): Snapshot { return { state: createLegacyRelationshipActingState(160), version: 0, episodes: [], appliedPatterns: [], processed: [], pending: [] }; }

class Store {
  state = snapshot().state; status: any; last_error: string; writes: string[] = []; calls: string[] = [];
  fail: string; failed = false; applies = new Set<string>(); evidenceRows: any[] = []; episodeRows: any[] = []; patternRows: any[] = []; used: string[] = []; eventRows: any[] = []; pendingRows = new Map<string, any>();
  constructor(fail = "") {
    this.fail = fail;
    this.episodeRows = [1, 2].map(day => { const t = { ...turn, requestId: `turn-${day}`, savedAt: `2026-10-0${day}T00:00:00Z` }; const e = episodeFor(evidence, t)!; return { id: `episode-${day}`, episode_key: e.key, summary: { episode: e } }; });
  }
  hit(name: string) { this.calls.push(name); if (this.fail === name && !this.failed) { this.failed = true; throw Error(`failure:${name}`); } }
  async claim() { return { claimed: true, replayed: false, leaseToken: "token" }; }
  async renew() {}
  async release() {}
  async turn(userId: string, requestId: string) { this.hit("turn"); if (userId !== "owner" || requestId !== turn.requestId) throw Error("canonical_chat_turn_required"); return turn; }
  async ledger() { return this.status ? { status: this.status, last_error: this.last_error } : null; }
  async advance(_u: string, _r: string, phase: string, error?: string) { this.hit(phase); this.status = phase; this.last_error = error; }
  async evidence() { return this.evidenceRows; }
  async saveEvidence(_u: string, _t: Turn, key: string, e: Evidence) { this.hit("saveEvidence"); if (!this.evidenceRows.some(x => x.evidence_key === key)) { this.evidenceRows.push({ id: "evidence-3", evidence_key: key, payload: { candidate: e } }); this.writes.push("evidence"); } }
  async episodes() { return this.episodeRows; }
  async saveEpisode(_u: string, e: any) { this.hit("saveEpisode"); if (!this.episodeRows.some(x => x.episode_key === e.key)) { this.episodeRows.push({ id: "episode-3", episode_key: e.key, summary: { episode: e } }); this.writes.push("episode"); } }
  async patterns() { return this.patternRows; }
  async appliedPatterns() { return this.used; }
  async savePattern(_u: string, key: string) { this.hit("savePattern"); this.patternRows.push({ id: key, pattern_key: key }); this.writes.push("pattern"); }
  async apply(_u: string, r: string, ids: string[], delta: any) { this.hit("apply"); if (!this.applies.has(r)) { this.applies.add(r); this.used.push(...ids); for (const axis of AXES) this.state[axis] += delta[axis]; this.writes.push("state"); } }
  async events() { return this.eventRows; }
  async pending(_u: string, _t: Turn, type: string) { const p = this.pendingRows.get(type) ?? { status: "pending" }; this.pendingRows.set(type, p); return p; }
  async advancePending(_u: string, _t: Turn, type: string, status: string) { this.pendingRows.get(type).status = status; }
  async applyCritical(_u: string, t: Turn, type: string) { this.eventRows.push({ request_id: t.requestId, event_type: type }); if (type === "romantic_acceptance") this.state.relationshipStatus = "romantic_partner"; if (type === "relationship_end") this.state.relationshipStatus = "none"; this.pendingRows.delete(type); }
}

test("saved conversation → evidence → episode → pattern → bounded state → Interpreter → shared Gemini", async () => {
  const store = new Store();
  await processRelationshipTurn(store as any, "owner", turn.requestId, async () => [evidence]);
  assert.deepEqual(store.writes, ["evidence", "episode", "pattern", "state"]);
  assert.equal(store.state.affection, 1); assert.equal(store.status, "applied");
  const oldFetch = globalThis.fetch;
  let instruction = "";
  globalThis.fetch = async (_url, options) => { instruction = JSON.parse(options!.body as string).systemInstruction.parts[0].text; return Response.json({ candidates: [{ content: { parts: [{ text: '{"reply":"ありがとう"}' }] } }] }); };
  try { const response = await generateGeminiJson({ apiKey: "test", systemInstruction: createRelationshipActingGuide(store.state), contents: [], userText: turn.message }); assert.equal(JSON.parse(response.text!).reply, "ありがとう"); assert.match(instruction, /台詞ではなく/); }
  finally { globalThis.fetch = oldFetch; }
});

for (const failure of ["analyzing", "saveEvidence", "evidence_saved", "saveEpisode", "episode_saved", "savePattern", "pattern_saved", "apply", "applied"]) {
  test(`retry after ${failure} failure resumes safely without duplicate state`, async () => {
    const store = new Store(failure); let analyses = 0;
    const analyze = async () => { analyses++; return [evidence]; };
    await assert.rejects(processRelationshipTurn(store as any, "owner", turn.requestId, analyze));
    await processRelationshipTurn(store as any, "owner", turn.requestId, analyze);
    await processRelationshipTurn(store as any, "owner", turn.requestId, analyze);
    assert.equal(store.state.affection, 1); assert.equal(store.writes.filter(x => x === "state").length, 1);
    assert.equal(store.evidenceRows.length, 1); assert.equal(store.patternRows.length, 1);
    assert.equal(analyses, 1);
  });
}

test("analyzer failure is ledger retryable and creates no state", async () => {
  const store = new Store(); await assert.rejects(processRelationshipTurn(store as any, "owner", turn.requestId, async () => { throw Error("timeout"); }));
  assert.equal(store.status, "failed"); assert.deepEqual(store.writes, []);
  await processRelationshipTurn(store as any, "owner", turn.requestId, async () => [evidence]); assert.equal(store.state.affection, 1);
});
test("without Pattern no State RPC or version change", async () => {
  const store = new Store(); store.episodeRows = [];
  await processRelationshipTurn(store as any, "owner", turn.requestId, async () => [evidence]);
  assert.equal(store.state.affection, 0); assert.ok(!store.calls.includes("apply"));
});
test("same request/version replay does not invoke analyzer or writes", async () => {
  const store = new Store(); await processRelationshipTurn(store as any, "owner", turn.requestId, async () => [evidence]);
  const before = store.writes.length;
  await processRelationshipTurn(store as any, "owner", turn.requestId, async () => { throw Error("must not analyze"); });
  assert.equal(store.writes.length, before);
});
for (const [user, request] of [["another-user", turn.requestId], ["owner", "unsaved-turn"]]) {
  test(`canonical boundary rejects ${user}/${request} before analyzer/writes`, async () => {
    const store = new Store(); await assert.rejects(processRelationshipTurn(store as any, user, request, async () => { throw Error("model must not run"); }), /canonical_chat_turn_required/); assert.deepEqual(store.writes, []);
  });
}
test("model cannot emit State/status/delta or fabricated supporting text", () => {
  assert.throws(() => parseEvidence({ evidence: [evidence], romance: 100 }, turn));
  assert.throws(() => parseEvidence({ evidence: [{ ...evidence, delta: 50 }] }, turn));
  assert.throws(() => parseEvidence({ evidence: [{ ...evidence, supportingTurn: "存在しない" }] }, turn));
});
for (const interpretation of ["ambiguous", "hypothetical", "quoted", "third_party", "negated"] as const) {
  test(`${interpretation} observation cannot produce an Episode`, () => assert.equal(episodeFor({ ...evidence, interpretation }, turn), null));
}
test("Misaki generated affection is not independent user evidence", () => assert.equal(episodeFor({ ...evidence, subject: "misaki_to_user" }, turn), null));
test("confession paraphrases never farm episodes or Patterns across days", () => {
  const e: Evidence = { ...evidence, type: "romantic_declaration", axis: "romance" };
  const episodes = Array.from({ length: 10 }, (_, day) => episodeFor(e, { ...turn, requestId: String(day), savedAt: `2026-10-${String(day + 1).padStart(2, "0")}T00:00:00Z` })!);
  assert.equal(new Set(episodes.map(x => x.key)).size, 1); assert.deepEqual(patternsFor(episodes, []), []);
});
test("delta stays within ±3 for any number of Patterns", () => {
  for (const polarity of [-1, 1] as const) assert.equal(boundedDelta(Array.from({ length: 100 }, () => ({ axis: "trust", polarity } as any))).trust, polarity * 3);
});
test("explicit acceptance/breakup use pending → validator → critical RPC, score never changes status", async () => {
  const original = turn.message;
  try {
    turn.message = "美咲、付き合おう";
    const store = new Store(); store.state.romance = 100; assert.equal(store.state.relationshipStatus, "none");
    await processRelationshipTurn(store as any, "owner", turn.requestId, async () => [], async () => { assert.equal(store.pendingRows.get("romantic_acceptance").status, "processing"); return true; });
    assert.equal(store.state.relationshipStatus, "romantic_partner");
    turn.message = "美咲、別れよう"; store.status = undefined;
    await processRelationshipTurn(store as any, "owner", turn.requestId, async () => [], async () => true);
    assert.equal(store.state.relationshipStatus, "none"); assert.equal(store.state.romance, 100);
  } finally { turn.message = original; }
});
test("failed validator leaves pending visible and retryable", async () => {
  const original = turn.message; turn.message = "美咲、付き合おう";
  try { const store = new Store(); await assert.rejects(processRelationshipTurn(store as any, "owner", turn.requestId, async () => [], async () => { throw Error("timeout"); })); assert.equal(store.pendingRows.get("romantic_acceptance").status, "failed"); assert.equal(store.state.relationshipStatus, "none"); }
  finally { turn.message = original; }
});
test("ordinary romance, third-party, quoted and hypothetical text is not a Critical Event", () => {
  for (const text of ["好き", "もし付き合ってと言ったら？", "彼女に別れようと言った", "「別れよう」"]) assert.deepEqual(criticalCandidates(text), []);
});
test("anonymous encrypted trajectory is idempotent; no score-inferred status", () => {
  let s = snapshot(); for (let day = 1; day <= 3; day++) s = applyTemporaryEvidence(s, { ...turn, requestId: String(day), savedAt: `2026-10-0${day}T00:00:00Z` }, [evidence]);
  assert.equal(s.state.affection, 1); assert.equal(s.state.relationshipStatus, "none"); const version = s.version;
  s = applyTemporaryEvidence(s, { ...turn, requestId: "3" }, [evidence]); assert.equal(s.state.affection, 1); assert.equal(s.version, version);
});
test("six-month silence and empty evidence preserve long-term axes without inventing feelings", () => {
  const s = snapshot(); s.state.trust = 90; s.state.friendship = 90;
  const next = applyTemporaryEvidence(s, { ...turn, savedAt: "2027-04-03T00:00:00Z" }, []);
  assert.deepEqual(next.state, s.state); assert.equal(next.version, s.version);
  assert.match(createRelationshipActingGuide(next.state), /時間が経ったことだけを理由に/);
});
test("rejection preserves friendship/trust; reconciliation cannot restore partner status", async () => {
  const original = turn.message;
  try {
    turn.message = "美咲、恋愛じゃない";
    const store = new Store(); store.state.friendship = 90; store.state.trust = 90;
    await processRelationshipTurn(store as any, "owner", turn.requestId, async () => [], async () => true);
    assert.equal(store.state.friendship, 90); assert.equal(store.state.trust, 90); assert.equal(store.state.relationshipStatus, "none");
    turn.message = "美咲、仲直りしよう"; store.status = undefined;
    await processRelationshipTurn(store as any, "owner", turn.requestId, async () => [], async () => true);
    assert.equal(store.state.relationshipStatus, "none");
  } finally { turn.message = original; }
});
test("canonical row supplies five axes directly while legacy points supply only intimacy", () => {
  const row = { ...Object.fromEntries(AXES.map(axis => [`${axis}_score`, axis === "romance" ? 100 : 0])), relationship_status: "none" };
  const s = canonicalActingState(row, 5); assert.equal(s.romance, 100); assert.equal(s.friendship, 0); assert.match(createRelationshipActingGuide(s), /交際は成立していない/);
});
test("explicit partner status takes precedence even with zero romance", () => {
  const state = { ...snapshot().state, romance: 0, relationshipStatus: "romantic_partner" as const };
  const guide = createRelationshipActingGuide(state);
  assert.match(guide, /交際も会話上成立済み/); assert.doesNotMatch(guide, /交際は成立していない|恋愛方向は弱い/);
});
test("Lab keeps synthetic supply, shared Interpreter/generator, and writes:false", () => {
  const source = fs.readFileSync(new URL("../app/api/acting-lab/route.ts", import.meta.url), "utf8");
  assert.match(source, /writes: false/); assert.match(source, /createRelationshipActingGuide/); assert.match(source, /generateGeminiJson/); assert.doesNotMatch(source, /relationship-processing|relationship-runtime|\.rpc\(|\.insert\(|\.update\(/);
});
test("all new permanent writes use named canonical RPCs", async () => {
  const calls: any[] = []; const store = new CanonicalRelationshipStore({ rpc: async (name: string, args: any) => { calls.push({ name, args }); return { data: {}, error: null }; } });
  await store.advance("owner", "turn", "analyzing");
  await store.saveEvidence("owner", turn, "key", evidence);
  assert.equal(calls[0].name, "advance_misaki_relationship_processing_v1"); assert.equal(calls[0].args.p_processing_version, PROCESSING_VERSION); assert.equal(calls[1].name, "record_misaki_relationship_evidence_v1");
});

// Separate store instances share only the simulated DB, never a local task map.
class DistributedDB {
  now = 0; sequence = 0; lease?: { request: string; token: string; until: number };
  turns = [turn]; stores = new Map<string, Store>(); releases = 0;
  store(request: string) { if (!this.stores.has(request)) this.stores.set(request, new Store()); return this.stores.get(request)!; }
  assertLease(request: string, token: string) {
    if (!this.lease || this.lease.request !== request || this.lease.token !== token || this.lease.until <= this.now) throw Error("relationship_processing_lease_required");
  }
  worker() {
    const db = this;
    return {
      async claim(user: string, request: string) {
        if (user !== "owner" || !db.turns.some(t => t.requestId === request)) throw Error("canonical_chat_turn_required");
        if (db.lease && db.lease.until > db.now) return db.lease.request === request
          ? { claimed: true, replayed: true, leaseToken: db.lease.token }
          : { claimed: false, reason: "lease_busy" };
        const head = db.turns.find(t => db.store(t.requestId).status !== "applied");
        if (!head) return { claimed: false, reason: "nothing_to_process" };
        if (head.requestId !== request) return { claimed: false, reason: "out_of_order" };
        db.lease = { request, token: String(++db.sequence), until: db.now + 120 };
        return { claimed: true, replayed: false, leaseToken: db.lease.token };
      },
      async renew(_u: string, r: string, token: string) { db.assertLease(r, token); db.lease!.until = db.now + 120; },
      async release(_u: string, r: string, token: string) { db.releases++; if (db.lease?.request === r && db.lease.token === token) db.lease = undefined; },
      async turn(_u: string, r: string) { return db.turns.find(t => t.requestId === r)!; },
      async ledger(_u: string, r: string) { return db.store(r).ledger(); },
      async advance(u: string, r: string, phase: string, error?: string) { return db.store(r).advance(u, r, phase, error); },
      async evidence(_u: string, r: string) { return db.store(r).evidence(); },
      async saveEvidence(u: string, t: Turn, key: string, e: Evidence) { return db.store(t.requestId).saveEvidence(u, t, key, e); },
      async episodes() { return db.store(turn.requestId).episodes(); },
      async saveEpisode(u: string, e: any) { return db.store(turn.requestId).saveEpisode(u, e); },
      async patterns() { return db.store(turn.requestId).patterns(); },
      async appliedPatterns() { return db.store(turn.requestId).appliedPatterns(); },
      async savePattern(u: string, key: string) { return db.store(turn.requestId).savePattern(u, key); },
      async apply(u: string, r: string, ids: string[], delta: any, token: string) {
        db.assertLease(r, token);
        const state = db.store(turn.requestId);
        if (state.applies.has(r)) return;
        if (ids.some(id => state.used.includes(id))) throw Error("relationship_pattern_already_consumed");
        return state.apply(u, r, ids, delta);
      },
      async events() { return db.store(turn.requestId).events(); },
      async pending(u: string, t: Turn, type: string) { return db.store(t.requestId).pending(u, t, type); },
      async advancePending(u: string, t: Turn, type: string, status: string) { return db.store(t.requestId).advancePending(u, t, type, status); },
      async applyCritical(u: string, t: Turn, type: string, token: string) { db.assertLease(t.requestId, token); return db.store(turn.requestId).applyCritical(u, t, type); },
    };
  }
}
function barrier() {
  let enter!: () => void, finish!: () => void;
  const entered = new Promise<void>(r => enter = r), released = new Promise<void>(r => finish = r);
  return { entered, finish, async wait() { enter(); await released; } };
}
test("multi-worker: same user and same request defer while owner analyzes; no token adoption/release", async () => {
  const db = new DistributedDB(), pause = barrier(); const first = db.worker(), second = db.worker();
  const task = processRelationshipTurn(first as any, "owner", turn.requestId, async () => { await pause.wait(); return [evidence]; });
  await pause.entered;
  assert.deepEqual(await processRelationshipTurn(second as any, "owner", turn.requestId, async () => { throw Error("must not run"); }), { status: "deferred", reason: "lease_busy" });
  assert.equal(db.releases, 0); pause.finish(); await task;
  assert.equal(db.store(turn.requestId).state.affection, 1); assert.equal(db.releases, 1);
});
test("multi-worker: later request cannot pass oldest unfinished turn, including active lease", async () => {
  const db = new DistributedDB(), pause = barrier(); const later = { ...turn, requestId: "later" }; db.turns.push(later);
  assert.equal((await processRelationshipTurn(db.worker() as any, "owner", later.requestId)).status, "deferred");
  assert.equal(db.store(later.requestId).status, undefined);
  const task = processRelationshipTurn(db.worker() as any, "owner", turn.requestId, async () => { await pause.wait(); return [evidence]; }); await pause.entered;
  assert.deepEqual(await processRelationshipTurn(db.worker() as any, "owner", later.requestId), { status: "deferred", reason: "lease_busy" });
  pause.finish(); await task;
  await processRelationshipTurn(db.worker() as any, "owner", later.requestId, async () => []);
  assert.equal(db.store(later.requestId).status, "applied"); assert.equal(db.store(turn.requestId).state.affection, 1);
});
test("multi-worker: expiry/reclaim halts stale analyzer without Evidence or failed ledger writes", async () => {
  const db = new DistributedDB(), pause = barrier(), stale = db.worker();
  const task = processRelationshipTurn(stale as any, "owner", turn.requestId, async () => { await pause.wait(); return [evidence]; }); await pause.entered;
  const oldToken = db.lease!.token; db.now = 121;
  const fresh = db.worker(), claim = await fresh.claim("owner", turn.requestId);
  assert.notEqual(claim.leaseToken, oldToken); pause.finish();
  assert.deepEqual(await task, { status: "deferred", reason: "lease_lost" });
  assert.equal(db.store(turn.requestId).status, "analyzing"); assert.deepEqual(db.store(turn.requestId).writes, []);
  assert.equal(db.lease!.token, claim.leaseToken); // stale release cannot remove replacement
  await assert.rejects(stale.apply("owner", turn.requestId, ["pattern"], boundedDelta([]), oldToken), /lease_required/);
  await assert.rejects(stale.applyCritical("owner", turn, "romantic_acceptance", oldToken), /lease_required/);
  await fresh.release("owner", turn.requestId, claim.leaseToken!);
  await processRelationshipTurn(db.worker() as any, "owner", turn.requestId, async () => [evidence]);
  assert.equal(db.store(turn.requestId).state.affection, 1);
});
test("multi-worker: one Pattern cannot be consumed across different request IDs", async () => {
  const db = new DistributedDB(); await processRelationshipTurn(db.worker() as any, "owner", turn.requestId, async () => [evidence]);
  const later = { ...turn, requestId: "later" }; db.turns.push(later); const worker = db.worker(), claim = await worker.claim("owner", later.requestId);
  const state = db.store(turn.requestId), id = state.used[0];
  await assert.rejects(worker.apply("owner", later.requestId, [id], { ...boundedDelta([]), affection: 1 }, claim.leaseToken!), /pattern_already_consumed/);
  assert.equal(state.state.affection, 1); assert.equal(state.applies.size, 1);
});
test("multi-worker: competing critical validators cannot double-apply explicit transition", async () => {
  const db = new DistributedDB(); db.turns = [{ ...turn, message: "美咲、付き合おう" }]; const pause = barrier();
  const task = processRelationshipTurn(db.worker() as any, "owner", turn.requestId, async () => [], async () => { await pause.wait(); return true; }); await pause.entered;
  assert.equal((await processRelationshipTurn(db.worker() as any, "owner", turn.requestId, async () => [], async () => { throw Error("second validator"); })).status, "deferred");
  pause.finish(); await task; assert.equal(db.store(turn.requestId).eventRows.length, 1); assert.equal(db.store(turn.requestId).state.relationshipStatus, "romantic_partner");
});
test("multi-worker: critical validator lease loss does not update pending or status", async () => {
  const db = new DistributedDB(); db.turns = [{ ...turn, message: "美咲、付き合おう" }];
  const result = await processRelationshipTurn(db.worker() as any, "owner", turn.requestId, async () => [], async () => { db.now += 121; return true; });
  assert.equal(result.status, "deferred"); assert.equal(db.store(turn.requestId).pendingRows.get("romantic_acceptance").status, "processing"); assert.equal(db.store(turn.requestId).eventRows.length, 0);
});
test("lease renewal failure stops before any permanent work and release errors stay nonfatal", async () => {
  const store = new Store(); store.renew = async () => { throw Error("network"); }; store.release = async () => { throw Error("network"); };
  assert.equal((await processRelationshipTurn(store as any, "owner", turn.requestId)).status, "deferred"); assert.deepEqual(store.calls, []);
});
test("canonical adapter uses claim/renew/release and exclusively token-fenced v2 final RPCs", async () => {
  const calls: any[] = []; const store = new CanonicalRelationshipStore({ rpc: async (name: string, args: any) => { calls.push({ name, args }); return { data: {}, error: null }; } });
  const previous = process.env.MISAKI_RELATIONSHIP_ENGINE_START_AT; process.env.MISAKI_RELATIONSHIP_ENGINE_START_AT = "2026-10-03T00:00:00Z";
  try { await store.claim("owner", turn.requestId); await store.renew("owner", turn.requestId, "live"); await store.apply("owner", turn.requestId, ["p"], boundedDelta([]), "live"); await store.applyCritical("owner", turn, "relationship_end", "live"); await store.release("owner", turn.requestId, "live"); }
  finally { if (previous === undefined) delete process.env.MISAKI_RELATIONSHIP_ENGINE_START_AT; else process.env.MISAKI_RELATIONSHIP_ENGINE_START_AT = previous; }
  assert.deepEqual(calls.map(c => c.name), ["claim_misaki_relationship_processing_v1", "renew_misaki_relationship_processing_lease_v1", "apply_misaki_relationship_state_v2", "apply_misaki_relationship_critical_event_v2", "release_misaki_relationship_processing_lease_v1"]);
  for (const call of calls.slice(1)) { assert.equal(call.args.p_lease_token, "live"); assert.equal(call.args.p_processing_version, PROCESSING_VERSION); }
  const source = fs.readFileSync(new URL("../lib/relationship-processing-v1.ts", import.meta.url), "utf8"); assert.doesNotMatch(source, /["']apply_misaki_relationship_(state|critical_event)_v1["']/);
});

test("permanent import preparation runs only after a new claim, with renewed live ownership", async () => {
  const store = new Store(); let prepared = 0, renewed = 0;
  store.renew = async () => { renewed++; };
  await processRelationshipTurn(store as any, "owner", turn.requestId, async () => [], undefined, async check => { assert.ok(renewed > 0); await check(); prepared++; });
  assert.equal(prepared, 1);
  store.claim = async () => ({ claimed: false, replayed: false, leaseToken: "" });
  await processRelationshipTurn(store as any, "owner", turn.requestId, undefined, undefined, async () => { prepared++; });
  assert.equal(prepared, 1);
});
test("aborted ordinary processing releases its own lease before safe retry", async () => {
  const db = new DistributedDB();
  await assert.rejects(processRelationshipTurn(db.worker() as any, "owner", turn.requestId, async () => { throw Error("timeout"); }));
  assert.equal(db.lease, undefined); assert.equal(db.releases, 1); assert.equal(db.store(turn.requestId).status, "failed");
  await processRelationshipTurn(db.worker() as any, "owner", turn.requestId, async () => [evidence]); assert.equal(db.store(turn.requestId).state.affection, 1);
});
test("v2 final lease rejection is deferred without failed-ledger mutation", async () => {
  const store = new Store(); store.apply = async () => { throw Error("relationship_processing_lease_required"); };
  assert.deepEqual(await processRelationshipTurn(store as any, "owner", turn.requestId, async () => [evidence]), { status: "deferred", reason: "lease_lost" });
  assert.equal(store.status, "pattern_saved"); assert.ok(!store.calls.includes("failed"));
});
test("competing explicit acceptance and breakup preserve canonical request ordering", async () => {
  const db = new DistributedDB(); const breakup = { ...turn, requestId: "breakup", message: "美咲、別れよう" };
  db.turns = [{ ...turn, message: "美咲、付き合おう" }, breakup];
  assert.deepEqual(await processRelationshipTurn(db.worker() as any, "owner", breakup.requestId, async () => [], async () => true), { status: "deferred", reason: "out_of_order" });
  await processRelationshipTurn(db.worker() as any, "owner", turn.requestId, async () => [], async () => true);
  await processRelationshipTurn(db.worker() as any, "owner", breakup.requestId, async () => [], async () => true);
  assert.deepEqual(db.store(turn.requestId).eventRows.map(e => e.event_type), ["romantic_acceptance", "relationship_end"]);
  assert.equal(db.store(turn.requestId).state.relationshipStatus, "none");
});
