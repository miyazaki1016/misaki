const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '../..');
function harness({ anonymous = false, premium = false, generationFailure = false, commitFailure = false, stateFailure = false, initialPoints = 79 } = {}) {
  const user = { id: 'account-a', is_anonymous: anonymous };
  const rootState = { history: [], memory: ['server memory'], today_memory: { date: '', items: [] } };
  let points = initialPoints, consumed = 0, refunded = 0, generated = 0;
  const completed = new Map(), temporaryReceipts = new Map(), temporaryRoots = new Map(), calls = [], prompts = [];
  let checkpoint = false, revision = 0;
  let openaiPayload = null;
  let maintenance = false; const forgetPayloads = new Map(); let semanticJudge = null;
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      const filters = {};
      const query = { select() { return query; }, not() { return query; }, in(k, v) { filters[k] = v; return query; }, order() { return query; }, limit() { return query; }, eq(k, v) { filters[k] = v; return query; },
        async maybeSingle() {
          if (table === 'misaki_forget_controls') return { data: forgetPayloads.has(user.id) ? { payload: forgetPayloads.get(user.id) } : null, error: null };
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
        const delta = Math.max(-2, Math.min(2, Number(args.p_result.relationshipPointDelta) || 0));
        points = Math.max(0, points + delta);
        forgetPayloads.set(user.id, args.p_result.forgetControlPayload);
        const { forgetControlPayload, ...savedResult } = args.p_result;
        const result = { ...savedResult, relationshipPoints: points, relationshipPointDelta: delta, memorySynced: true, relationshipTimeSynced: true };
        completed.set(args.p_request_id, { message: args.p_message, result });
        rootState.memory = result.memory;
        rootState.history.push({ role: 'user', text: args.p_message, requestId:args.p_request_id, sentAt:args.p_user_message_at }, { role: 'misaki', text: result.reply, requestId:args.p_request_id, sentAt:new Date().toISOString() });
        return { data: result, error: null };
      }
      if (name === 'edit_misaki_conversation_state') {
        if (commitFailure) return {error:{message:'commit failed'}};
        forgetPayloads.set(user.id,args.p_forget_payload);
        if (args.p_action==='clearHistory') rootState.history=[];
        else rootState.memory=args.p_action==='clearMemory'?[]:rootState.memory.filter(x=>x!==args.p_value);
        return {data:{},error:null};
      }
      if (name === 'save_misaki_temporary_state') {
        if (!user.is_anonymous || (temporaryRoots.get(user.id)?.revision ?? null) !== args.p_expected_revision) return { error: { message: 'stale checkpoint' } };
        forgetPayloads.set(user.id, args.p_forget_payload); checkpoint = true; points = args.p_points; rootState.history = args.p_history;
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
      forgetPayloads.set(user.id, args.p_state.forgetControlPayload); rootState.memory = args.p_state.memory; rootState.today_memory = args.p_state.todayMemory;
    }
    return { error: null };
  }
  client.auth.admin = { getUserById: async () => ({ data: { user }, error: null }) };
  let clock = Date.now();
  class TestDate extends Date { static now() { return clock; } }
  const context = vm.createContext({ Response, Request, Date: TestDate, JSON, Buffer, URL, crypto: require('node:crypto').webcrypto,
    AbortController, AbortSignal, TextEncoder, TextDecoder, Uint8Array, atob, btoa, structuredClone, performance, setTimeout, clearTimeout, process: { env: { GEMINI_API_KEY: 'test', SUPABASE_SERVICE_ROLE_KEY: 'server-only-test-key' } },
    console: { log() {}, warn() {}, error() {} },
    fetch: async (url, options) => {
      if (String(url).includes('generativelanguage')) {
        const payload = JSON.parse(options.body);
        let task; try { task = JSON.parse(payload.contents?.[0]?.parts?.[0]?.text); } catch {}
        if (task?.task && !semanticJudge) {
          if (task.task === 'target') return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ ambiguous:false, targets:task.input.candidates.map((c,i)=>({subject:'user',predicate:'fixture',value:c.text,scope:'fact',evidenceIndex:i,evidence:c.text})) }) }] } }] });
          if (task.task === 'mask') return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ rows:task.input.rows.map((r,index)=>({index,uncertain:false,spans:task.input.targets.filter(t=>r.text===t.value).map(t=>t.value)})) }) }] } }] });
          if (task.task === 'reoffer') return Response.json({ candidates: [{ content: { parts: [{ text:'{"ambiguous":false,"offers":[]}' }] } }] });
        }
        if (task?.task && semanticJudge) return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(await semanticJudge(task.task, task.input)) }] } }] });
        generated++; prompts.push(payload);
        if (generationFailure) return new Response('', { status: 500 });
        return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(openaiPayload ?? { reply: 'うん、そうなんだ😊', memory: ['generated memory'], misakiTodayMemory: { items: [] } }) }] } }] });
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
      if (name === 'next/server') return { after: task => task() };
      if (name.endsWith('/gemini-usage-telemetry-server')) return { createGeminiTelemetrySink: () => () => {} };
      if (name.endsWith('/relationship-runtime-v1')) return { enqueueTemporaryTurn: () => undefined, resumeRelationshipProcessing: async () => {}, pendingRelationshipGuide: () => '' };
      if (name.endsWith('/persona/persona-store')) return { loadPersonaPrompt: async () => ({ text: '美咲', source: 'test' }) };
      if (name.endsWith('/tokyo-life-events')) return { getTokyoLifeEvents: async () => [], createTokyoLifeEventsGuide: () => '' };
      if (name.startsWith('.')) return load(path.posix.normalize(path.posix.join(path.posix.dirname(file), name.replace(/\.ts$/, ''))) + '.ts');
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
  return { client, user, forgetPayloads, setSemanticJudge: value => { semanticJudge = value; }, setMaintenance: value => { maintenance = value; }, temporaryRoots, temporaryReceipts, advanceClock: ms => { clock += ms; }, load, rootState, calls, prompts, get points() { return points; }, get consumed() { return consumed; },
    get refunded() { return refunded; }, get generated() { return generated; },
    setOpenaiPayload(value) { openaiPayload = value; },
    request(body) { return new Request('https://test/api/chat', { method: 'POST', headers: { Authorization: 'Bearer token' },
      body: JSON.stringify({ message: 'こんにちは', requestId: 'ab9289d2-80b2-458a-b989-cc0640ef0a1e', ...body }) }); },
  };
}


module.exports = { harness };
