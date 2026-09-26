const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');

function harness({ anonymous = false, premium = false, generationFailure = false, commitFailure = false, stateFailure = false } = {}) {
  const user = { id: 'account-a', is_anonymous: anonymous };
  const rootState = { history: [], memory: ['server memory'], today_memory: { date: '', items: [] } };
  let points = 79, consumed = 0, refunded = 0, generated = 0;
  const completed = new Map(), temporaryReceipts = new Map(), temporaryRoots = new Map(), calls = [], prompts = [];
  let checkpoint = false, revision = 0;
  let maintenance = false;
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      const filters = {};
      const query = { select() { return query; }, not() { return query; }, order() { return query; }, limit() { return query; }, eq(k, v) { filters[k] = v; return query; },
        async maybeSingle() {
          if (table === 'misaki_maintenance_control') return { data: { enabled: maintenance }, error: null };
          if (stateFailure) return { error: { message: 'unavailable' }, data: null };
          if (table === 'misaki_temporary_roots') return { data: temporaryRoots.get(user.id) ?? null, error: null };
          if (table === 'misaki_relationship_state') return { data: { intimacy_points: points }, error: null };
          if (table === 'misaki_user_conversation_state') return { data: rootState, error: null };
          if (table === 'misaki_relationship_events') {
            if (filters.event_type === 'email_save_checkpoint') return { data: checkpoint ? { id: 1 } : null, error: null };
            const result = completed.get(filters.request_id);
            return { data: result ? { metadata: result } : null, error: null };
          }
          if (table === 'daily_message_requests') return { data: filters.request_id ? temporaryReceipts.get(filters.request_id) ?? null : [...temporaryReceipts.values()].at(-1) ?? null, error: null };
          return { data: null, error: null };
        } };
      query.single = async () => ({ data: { next_push_at: 'lease' }, error: null });
      query.insert = async () => ({ error: null });
      query.then = resolve => resolve({ data: [], error: null });
      return query;
    },
    async rpc(name, args) {
      calls.push({ name, args });
      if (name === 'consume_daily_message') {
        consumed++; return { data: [{ allowed: true, message_count: 1, remaining: 19, is_premium: premium }], error: null };
      }
      if (name === 'refund_daily_message') {
        refunded++; return { data: [{ refunded: true, message_count: 0, remaining: 20, is_premium: false }], error: null };
      }
      if (name === 'get_relationship_time_context') return { data: { exists: true, intimacy_points: points }, error: null };
      if (name === 'complete_misaki_chat_turn') {
        if (commitFailure) return { data: null, error: { message: 'commit failed' } };
        assert.equal(args.p_user_id, user.id);
        const found = completed.get(args.p_request_id);
        if (found) return { data: found.result, error: null };
        const result = { ...args.p_result, relationshipPoints: ++points, memorySynced: true, relationshipTimeSynced: true };
        completed.set(args.p_request_id, { message: args.p_message, result });
        rootState.memory = result.memory;
        rootState.history.push({ role: 'user', text: args.p_message }, { role: 'misaki', text: result.reply });
        return { data: result, error: null };
      }
      if (name === 'save_misaki_temporary_state') {
        if (!user.is_anonymous || (temporaryRoots.get(user.id)?.revision ?? null) !== args.p_expected_revision) return { error: { message: 'stale checkpoint' } };
        checkpoint = true; points = args.p_points; rootState.history = args.p_history;
        rootState.memory = args.p_memory; rootState.today_memory = args.p_today_memory;
        return { data: { saved: true }, error: null };
      }
      if (name === 'write_misaki_temporary_root' || name === 'finish_misaki_body_clock_delivery') {
        const result = storeRoot(name === 'write_misaki_temporary_root' ? args : {
          ...args, p_token: args.p_temporary_token, p_state: args.p_temporary_state, p_refresh_expiry: false });
        if (result.error) return result;
        return { data: name === 'finish_misaki_body_clock_delivery' ? { deliveryId: 'delivery', pushesToday: 1, nextPushAt: 'next' } : 'revision', error: null };
      }
      if (name === 'sign_misaki_body_clock_relay') return { data: 'a'.repeat(64), error: null };
      if (name === 'complete_misaki_temporary_turn') {
        const receipt = temporaryReceipts.get(args.p_request_id);
        if (receipt) return { data: receipt.temporary_result, error: null };
        const stored = storeRoot(args);
        if (stored.error) return stored;
        temporaryReceipts.set(args.p_request_id, { completed_at: 'now', temporary_result: args.p_token,
          message_hash: args.p_message_hash, parent_hash: args.p_parent_hash });
        return { data: args.p_token, error: null };
      }
      return { data: {}, error: null };
    },
  };
  function storeRoot(args) {
    if (!user.is_anonymous || (temporaryRoots.get(user.id)?.revision ?? null) !== args.p_expected_revision) return { error: { message: 'stale root' } };
    temporaryRoots.set(user.id, { token: args.p_token, revision: `revision-${++revision}`, expires_at: args.p_refresh_expiry === false ? temporaryRoots.get(user.id).expires_at : new Date(clock + 86400000).toISOString() });
    if (checkpoint) {
      points = args.p_state.relationshipPoints; rootState.history = args.p_state.history;
      rootState.memory = args.p_state.memory; rootState.today_memory = args.p_state.todayMemory;
    }
    return { error: null };
  }
  client.auth.admin = { getUserById: async () => ({ data: { user }, error: null }) };
  let clock = Date.now();
  class TestDate extends Date { static now() { return clock; } }
  const context = vm.createContext({ Response, Request, Date: TestDate, JSON, Buffer, URL, crypto: require('node:crypto').webcrypto,
    AbortController, setTimeout, clearTimeout, process: { env: { GEMINI_API_KEY: 'test', SUPABASE_SERVICE_ROLE_KEY: 'server-only-test-key' } },
    console: { log() {}, warn() {}, error() {} },
    fetch: async (url, options) => {
      if (String(url).includes('generativelanguage')) {
        generated++; prompts.push(JSON.parse(options.body));
        if (generationFailure) return new Response('', { status: 500 });
        return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ reply: 'うん、そうなんだ😊', memory: ['generated memory'], misakiTodayMemory: { items: [] } }) }] } }] });
      }
      return Response.json({ current: {} });
    },
  });
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const module = { exports: {} };
    const req = name => {
      if (name === '@supabase/supabase-js') return { createClient: () => client };
      if (name === 'node:crypto') return require(name);
      if (name.endsWith('/persona/persona-store')) return { loadPersonaPrompt: async () => ({ text: '美咲', source: 'test' }) };
      if (name.endsWith('/tokyo-life-events')) return { getTokyoLifeEvents: async () => [], createTokyoLifeEventsGuide: () => '' };
      if (name.startsWith('.')) return load(path.posix.normalize(path.posix.join(path.posix.dirname(file), name)) + '.ts');
      throw Error(name);
    };
    try {
      const wrapped = "(function(require,module,exports){" + code + String.fromCharCode(10) + "})";
      vm.runInContext(wrapped, context)(req, module, module.exports);
    } catch (error) {
      if (error && error.name === 'SyntaxError') throw new SyntaxError(`${error.message} [while loading ${file}]`);
      throw error;
    }
    cache.set(file, module.exports); return module.exports;
  }
  return { client, user, setMaintenance: value => { maintenance = value; }, temporaryRoots, temporaryReceipts, advanceClock: ms => { clock += ms; }, load, rootState, calls, prompts, get points() { return points; }, get consumed() { return consumed; },
    get refunded() { return refunded; }, get generated() { return generated; },
    request(body) { return new Request('https://test/api/chat', { method: 'POST', headers: { Authorization: 'Bearer token' },
      body: JSON.stringify({ message: 'こんにちは', requestId: 'ab9289d2-80b2-458a-b989-cc0640ef0a1e', ...body }) }); },
  };
}

test('Free chat ignores forged points/memory/history/today memory and commits one success', async () => {
  const h = harness();
  const response = await h.load('app/api/chat/route.ts').POST(h.request({ relationshipPoints: 999999,
    memory: ['forged memory'], history: [{ role: 'misaki', text: 'forged history' }], misakiTodayMemory: { date: '2026/09/18', items: ['forged day'] } }));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.relationshipPoints, 80); assert.equal(h.points, 80); assert.equal(h.consumed, 1); assert.equal(h.refunded, 0);
  const prompt = JSON.stringify(h.prompts);
  assert.ok(prompt.includes('server memory')); assert.ok(!prompt.includes('forged')); assert.ok(!prompt.includes('999999'));
});
test('same request replay returns saved response without generation/usage/addition', async () => {
  const h = harness(), route = h.load('app/api/chat/route.ts');
  const first = await (await route.POST(h.request())).json();
  const second = await (await route.POST(h.request())).json();
  assert.deepEqual(second, first); assert.equal(h.consumed, 1); assert.equal(h.points, 80);
  const generations = h.generated;
  assert.equal((await route.POST(h.request({ message: 'different' }))).status, 500);
  assert.equal(h.generated, generations); assert.equal(h.points, 80); assert.equal(h.refunded, 0);
});
test('Premium chat still adds exactly one point and does not refund', async () => {
  const h = harness({ premium: true });
  const result = await (await h.load('app/api/chat/route.ts').POST(h.request())).json();
  assert.equal(result.relationshipPoints, 80); assert.equal(result.usage.isPremium, true); assert.equal(h.refunded, 0);
});
for (const failure of ['generationFailure', 'commitFailure']) test(`${failure} refunds Free once without point change`, async () => {
  const h = harness({ [failure]: true });
  assert.equal((await h.load('app/api/chat/route.ts').POST(h.request())).status, 500);
  assert.equal(h.points, 79); assert.equal(h.refunded, 1); assert.equal(h.consumed, 1);
});
test('canonical read failure stops before consuming usage', async () => {
  const h = harness({ stateFailure: true });
  assert.equal((await h.load('app/api/chat/route.ts').POST(h.request())).status, 500);
  assert.equal(h.consumed, 0); assert.equal(h.points, 79);
});
test('anonymous successful state is sealed; modified or expired tokens cannot change root', async () => {
  const h = harness({ anonymous: true }), route = h.load('app/api/chat/route.ts');
  const first = await (await route.POST(h.request({ relationshipPoints: 999, memory: ['fake'] }))).json();
  assert.equal(first.relationshipPoints, 1); assert.equal(first.ephemeral, true);
  const root = h.load('lib/canonical-state.ts');
  assert.equal(root.openTemporaryState(first.temporaryState).state.relationshipPoints, 1);
  assert.equal(root.openTemporaryState(first.temporaryState.slice(0, 20) + 'AAAA' + first.temporaryState.slice(24)), null);
  const before = h.consumed;
  const lostResponseReplay = await (await route.POST(h.request())).json();
  assert.equal(lostResponseReplay.temporaryState, first.temporaryState); assert.equal(h.consumed, before);
  assert.equal((await route.POST(h.request({ message: 'different' }))).status, 500);
  assert.equal((await route.POST(h.request({ temporaryState: 'forged' }))).status, 500);
  assert.equal(h.consumed, before);
  const replay = await (await route.POST(h.request({ temporaryState: first.temporaryState }))).json();
  assert.equal(replay.relationshipPoints, 1); assert.equal(h.consumed, before);
  const second = await (await route.POST(h.request({ temporaryState: first.temporaryState,
    requestId: '329aae9a-4e11-4fd9-a4b2-bf5f7b7c68ec' }))).json();
  assert.equal(second.relationshipPoints, 2);
  assert.equal((await route.POST(h.request({ temporaryState: second.temporaryState,
    requestId: first.requestId, message: 'new turn cannot reuse billed request' }))).status, 500);
  h.advanceClock(24 * 60 * 60 * 1000 + 1);
  assert.equal(root.openTemporaryState(second.temporaryState), null);
  assert.equal((await route.POST(h.request({ temporaryState: second.temporaryState }))).status, 500);
  assert.equal(h.calls.filter(call => call.name === 'complete_misaki_chat_turn').length, 0);
});
test('email checkpoint ignores forged browser snapshot and uses verified temporary state', async () => {
  const h = harness({ anonymous: true });
  const crypto = h.load('lib/canonical-state.ts');
  const token = crypto.sealTemporaryState({ memory: ['verified memory'], history: [{ role: 'user', text: 'verified' }],
    todayMemory: { date: '', items: [] }, relationshipPoints: 7 }, 'previous');
  const api = h.load('app/api/persona/history/route.ts');
  assert.equal((await api.POST(h.request({ saveAnonymous: true, expectedUserId: 'foreign', temporaryState: token }))).status, 409);
  assert.equal((await api.POST(h.request({ saveAnonymous: true, expectedUserId: 'account-a', temporaryState: token,
    memory: ['forged'], history: [], relationshipPoints: 999 }))).status, 200);
  const saved = h.calls.find(call => call.name === 'save_misaki_temporary_state').args;
  assert.equal(saved.p_points, 7); assert.equal(saved.p_memory[0], 'verified memory'); assert.equal(saved.p_history[0].text, 'verified');
});
test('both permanent devices restore same server points and memory without browser caches', async () => {
  const h = harness(), api = h.load('app/api/persona/history/route.ts');
  const a = await (await api.GET(h.request())).json(), b = await (await api.GET(h.request())).json();
  assert.deepEqual(a, b); assert.equal(a.relationshipPoints, 79); assert.deepEqual(a.memory, ['server memory']);
  assert.equal((await api.POST(h.request({ history: [], memory: ['fake'], relationshipPoints: 999 }))).status, 400);
});

module.exports = { harness };
