const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const nodeCrypto = require('node:crypto');
const directory = path.join(__dirname, '../supabase/functions/body-clock');

async function verifyBodyClock({ anonymous = false, expired = false, tampered = false } = {}) {
  const calls = [], prompts = [];
  const iv = nodeCrypto.randomBytes(12);
  const cipher = nodeCrypto.createCipheriv('aes-256-gcm', nodeCrypto.createHash('sha256').update('misaki-temporary-state-v1:test').digest(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ expires: Date.now() + (expired ? -1000 : 60000),
    result: { reply: 'ok' }, state: { relationshipPoints: 80, history: [{ role: 'user', text: 'canonical history' }], memory: ['canonical memory'] } })), cipher.final()]);
  const bytes = Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
  if (tampered) bytes[40] ^= 1;
  const token = bytes.toString('base64url');
  const client = {
    auth: { admin: { getUserById: async () => ({ data: { user: { is_anonymous: anonymous } }, error: null }) } },
    from(table) {
      const query = { select() { return query; }, eq() { return query; }, not() { return query; }, order() { return query; },
        single: async () => ({ data: { next_push_at: 'lease' }, error: null }),
        maybeSingle: async () => ({ data: table === 'misaki_temporary_roots' ? { token, revision: 'root-generation', expires_at: new Date(Date.now() + 60000).toISOString() } : table === 'daily_message_requests' ? { temporary_result: token } : table === 'misaki_relationship_state'
          ? { intimacy_points: anonymous ? 999 : 80, intimacy_level: anonymous ? 'very_intimate' : 'intimate', action_state: 'NORMAL', emotion_state: { primary: 'happy', intensity: 34 } }
          : { history: [{ role: 'user', text: 'canonical history' }], memory: ['canonical memory'] }, error: null }),
        limit() { return query; }, then(resolve) { resolve({ data: [], error: null }); },
        insert: async item => { calls.push({ event: item }); return { error: null }; },
      };
      return query;
    },
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (name === 'sign_misaki_body_clock_relay') return { data: 'a'.repeat(64), error: null };
      return { data: { deliveryId: 'delivery', pushesToday: 1, nextPushAt: 'next' }, error: null };
    },
  };
  const context = vm.createContext({ Date, JSON, Math, URL, Request, Response, AbortSignal,
    crypto: nodeCrypto.webcrypto, TextEncoder, TextDecoder, atob, btoa, Uint8Array,
    console, Deno: { env: { get: () => 'test' }, serve() {} },
    fetch: async (url, options) => {
      if (String(url).includes('generativelanguage')) {
        prompts.push(JSON.parse(options.body));
        return Response.json({ candidates: [{ content: { parts: [{ text: '{"reply":"今日はいい感じ😊"}' }] } }] });
      }
      calls.push({ push: JSON.parse(options.body) }); return Response.json({ sent: 1, failed: 0 });
    },
  });
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    let code = ts.transpileModule(fs.readFileSync(path.join(directory, file), 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    if (file === 'index.ts') code += '\nmodule.exports.processUser = processUser;';
    const module = { exports: {} };
    const req = name => {
      if (name.startsWith('npm:')) return { createClient: () => client };
      if (name === './persona-store.ts') return { loadPersonaPrompt: async () => ({ text: '美咲' }) };
      return load(name.replace('./', ''));
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(req, module, module.exports);
    cache.set(file, module.exports); return module.exports;
  }
  const result = await load('index.ts').processUser(client, 'test', { user_id: 'account', relationship_points: 999,
    recent_history: [{ role: 'user', text: 'forged history' }], long_term_memory: ['forged memory'], notifications_enabled: true });
  if (expired || tampered) {
    assert.equal(result.skipped, 'temporary_state_unavailable');
    assert.equal(prompts.length, 0); assert.equal(calls.length, 0); return;
  }
  const prompt = JSON.stringify(prompts);
  assert.ok(prompt.includes('関係性ポイント: 80')); assert.ok(prompt.includes('canonical memory')); assert.ok(prompt.includes('canonical history'));
  assert.ok(!prompt.includes('forged')); assert.ok(!prompt.includes('999'));
  const delivery = calls.find(call => call.name === 'finish_misaki_body_clock_delivery').args;
  assert.equal(delivery.p_photo_context.relationshipPoints, 80);
  assert.equal(delivery.p_photo_context.intimacyLevel, 2);
  assert.equal(delivery.p_photo_context.selectorVersion, 4);
  assert.equal(delivery.p_photo_context.emotion, 'happy');
  assert.ok(delivery.p_delay_minutes >= 55 && delivery.p_delay_minutes <= 210);
  assert.equal(calls.find(call => call.push).push.deliveryId, 'delivery');
  assert.ok(!calls.some(call => call.name === 'complete_misaki_chat_turn'));
}
test('Body Clock uses canonical history/memory/points for decision, photo, delivery and push', () => verifyBodyClock());
test('anonymous Body Clock decodes the shared server root and uses the same temporary points', () => verifyBodyClock({ anonymous: true }));
test('anonymous Body Clock skips expired temporary state before generation or delivery', () => verifyBodyClock({ anonymous: true, expired: true }));
test('anonymous Body Clock rejects tampered temporary receipts', () => verifyBodyClock({ anonymous: true, tampered: true }));
