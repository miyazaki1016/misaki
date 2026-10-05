const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const rootPath = path.resolve(__dirname, '..');

function harness({ failure = false, outside = false, importRace = false, expiredRoot = false, permanent } = {}) {
  const turn = { requestId: 'turn-3', message: '美咲、体調は大丈夫？', reply: 'ありがとう', savedAt: '2026-10-03T00:00:00Z' };
  let root; let models = 0; let writes = 0; let imports = 0; let failed = failure; let attempts = 0;
  const evidence = { type: 'care', axis: 'affection', polarity: 1, strength: 70, confidence: .95, interpretation: 'direct', subject: 'user_to_misaki', supportingTurn: '体調は大丈夫' };
  const cache = new Map();
  const canonical = {
    async loadTemporaryRoot(user) { if (user !== 'owner') throw Error('wrong_owner'); return structuredClone(root); },
    async editTemporaryRoot(user, state) { assert.equal(user, 'owner'); assert.equal(state.temporaryRevision, root.temporaryRevision); root = { ...state, temporaryRevision: String(Number(root.temporaryRevision) + 1) }; writes++; },
    openTemporaryState: () => ({ state: structuredClone(root) }),
    createServerSupabase: () => ({
      from(table) { const q = { select() { return q; }, eq() { return q; }, async maybeSingle() {
        return { data: table === 'misaki_relationship_temporary_v1_imports' ? (imports ? { user_id: 'owner' } : null) : { token: 'verified-root', revision: root.temporaryRevision, expires_at: expiredRoot ? '2020-01-01T00:00:00Z' : '2099-10-05T00:00:00Z' }, error: null };
      } }; return q; },
      async rpc(name, args) { if (importRace) { assert.equal(name, 'import_misaki_temporary_relationship_v2'); assert.equal(args.p_lease_token, 'live'); return { error: { code: 'P0001', message: 'relationship_processing_lease_required' } }; } assert.equal(name, 'import_misaki_temporary_relationship_v2'); assert.equal(args.p_source_revision, root.temporaryRevision); assert.equal(args.p_request_id, 'turn-3'); assert.equal(args.p_processing_version, 'relationship-v1.1'); assert.equal(args.p_lease_token, 'live'); assert.equal(args.p_affection, 1); assert.equal(args.p_payload.pending.length, 0); imports++; return { error: null }; },
    }),
  };
  const context = vm.createContext({ process: { env: { MISAKI_RELATIONSHIP_ENGINE_VERSION: 'relationship-v1.1', MISAKI_RELATIONSHIP_ENGINE_START_AT: '2026-10-03T00:00:00Z' } }, console: { error() {} }, Date, JSON, Map, Set, Object, Number, Promise });
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const code = ts.transpileModule(fs.readFileSync(path.join(rootPath, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const module = { exports: {} }; cache.set(file, module.exports);
    const req = name => {
      if (name === 'node:crypto') return require(name);
      if (name === './canonical-state') return canonical;
      if (name === './gemini-usage-telemetry-server') return { createGeminiTelemetrySink: () => () => {} };
      if (permanent && name === './relationship-processing-v1') return {
        CanonicalRelationshipStore: class { async rows(table) { return table === 'misaki_relationship_processing' ? [] : [turn, { ...turn, requestId: 'later' }].map(t => ({ request_id: t.requestId, created_at: t.savedAt })); } },
        async processRelationshipTurn() { attempts++; if (permanent === 'failure') throw Error('DB failure'); return { status: 'deferred', reason: permanent }; },
      };
      if (name.startsWith('./relationship-analyzer-v1')) return {
        criticalCandidates: () => [], validateCriticalEvent: async () => false,
        analyzeRelationshipEvidence: async () => { models++; if (failed) throw Error('timeout'); return [evidence]; },
      };
      if (name.startsWith('.')) return load(path.posix.normalize(path.posix.join(path.posix.dirname(file), name.replace(/\.ts$/, ''))) + '.ts');
      throw Error(name);
    };
    vm.runInContext('(function(require,module,exports){' + code + '\n})', context)(req, module, module.exports);
    cache.set(file, module.exports); return module.exports;
  }
  const engine = load('lib/relationship-engine-v1.ts');
  root = { history: outside ? [] : [{ role: 'user', text: turn.message, requestId: turn.requestId }, { role: 'misaki', text: turn.reply, requestId: turn.requestId }], memory: [], todayMemory: { date: '', items: [] }, relationshipPoints: 160, temporaryRevision: '1', relationshipEngine: {
    state: load('lib/relationship-acting-guide.ts').createLegacyRelationshipActingState(160), version: 0,
    episodes: [1, 2].map(day => engine.episodeFor(evidence, { ...turn, requestId: String(day), savedAt: `2026-10-0${day}T00:00:00Z` })),
    appliedPatterns: [], processed: [], pending: [turn],
  } };
  return { runtime: load('lib/relationship-runtime-v1.ts'), clearFailure() { failed = false; }, get root() { return root; }, get models() { return models; }, get writes() { return writes; }, get imports() { return imports; }, get attempts() { return attempts; } };
}

test('anonymous saved root analysis uses encrypted CAS writer and replay cannot grow twice', async () => {
  const h = harness(); await h.runtime.resumeRelationshipProcessing('owner', true);
  assert.equal(h.root.relationshipEngine.state.affection, 1); assert.equal(h.writes, 1); assert.equal(h.imports, 0);
  await h.runtime.resumeRelationshipProcessing('owner', true); assert.equal(h.models, 1); assert.equal(h.writes, 1);
});
test('anonymous failed analysis preserves encrypted pending turn then safely resumes', async () => {
  const h = harness({ failure: true }); await h.runtime.resumeRelationshipProcessing('owner', true);
  assert.equal(h.root.relationshipEngine.pending.length, 1); assert.equal(h.writes, 0);
  h.clearFailure(); await h.runtime.resumeRelationshipProcessing('owner', true);
  assert.equal(h.root.relationshipEngine.state.affection, 1); assert.equal(h.root.relationshipEngine.pending.length, 0);
});
test('anonymous checkpoint boundary rejects missing canonical supporting pair before model/write', async () => {
  const h = harness({ outside: true }); await h.runtime.resumeRelationshipProcessing('owner', true);
  assert.equal(h.models, 0); assert.equal(h.writes, 0); assert.equal(h.root.relationshipEngine.pending.length, 1);
});
test('another anonymous owner cannot consume this root', async () => {
  const h = harness(); await h.runtime.resumeRelationshipProcessing('another-user', true); assert.equal(h.models, 0); assert.equal(h.writes, 0);
});
test('permanence imports newest verified frozen root once, including pending analysis, without anonymous writer', async () => {
  const h = harness(); await h.runtime.importPermanentRelationship('owner', 'turn-3', 'live', async () => {}); assert.equal(h.imports, 1); assert.equal(h.writes, 0);
  await h.runtime.importPermanentRelationship('owner', 'turn-3', 'live', async () => {}); assert.equal(h.imports, 1); assert.equal(h.models, 1);
});
test('expired anonymous checkpoint is ignored and cannot poison permanent relationship processing', async () => {
  const h = harness({ expiredRoot: true });
  await h.runtime.importPermanentRelationship('owner', 'turn-3', 'live', async () => {});
  assert.equal(h.imports, 0); assert.equal(h.models, 0); assert.equal(h.writes, 0);
});
test('permanence analyzer failure cannot import an incomplete snapshot; retry uses latest verified root', async () => {
  const h = harness({ failure: true }); await assert.rejects(h.runtime.importPermanentRelationship('owner', 'turn-3', 'live', async () => {}));
  assert.equal(h.imports, 0); h.clearFailure(); await h.runtime.importPermanentRelationship('owner', 'turn-3', 'live', async () => {}); assert.equal(h.imports, 1);
});

for (const reason of ['lease_busy', 'out_of_order', 'lease_lost', 'failure']) {
  test(`permanent after-save runner stops on ${reason} and preserves successful chat`, async () => {
    const h = harness({ permanent: reason });
    await h.runtime.resumeRelationshipProcessing('owner', false);
    assert.equal(h.attempts, 1); assert.equal(h.models, 0); assert.equal(h.imports, 0);
  });
}
test('permanence import rechecks ownership before model and atomic materialization', async () => {
  const h = harness(); let checks = 0;
  await assert.rejects(h.runtime.importPermanentRelationship('owner', 'turn-3', 'live', async () => { if (++checks === 3) throw Error('lease_lost'); }));
  assert.equal(h.models, 1); assert.equal(h.imports, 0); assert.equal(h.writes, 0);
});

test('TOCTOU: permanent import is rejected by DB after application guard succeeds', async () => {
  const h = harness({ importRace: true }); let checks = 0;
  await assert.rejects(h.runtime.importPermanentRelationship('owner', 'turn-3', 'live', async () => { checks++; }), /relationship_processing_lease_required/);
  assert.ok(checks >= 4); assert.equal(h.imports, 0); assert.equal(h.writes, 0);
});
