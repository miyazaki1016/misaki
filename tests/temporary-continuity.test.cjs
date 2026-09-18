const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { harness } = require('./server-canonical.test.cjs');

function bodyClock(h) {
  const cache = new Map();
  const context = vm.createContext({ Date, JSON, Math, URL, Request, Response, AbortSignal,
    crypto: require('node:crypto').webcrypto, TextEncoder, TextDecoder, atob, btoa, Uint8Array, console,
    Deno: { env: { get: () => 'server-only-test-key' }, serve() {} },
    fetch: async (url, options) => {
      if (String(url).includes('generativelanguage')) {
        h.prompts.push(JSON.parse(options.body));
        return Response.json({ candidates: [{ content: { parts: [{ text: '{"reply":"自発メッセージを送ったよ"}' }] } }] });
      }
      return Response.json({ sent: 1 });
    },
  });
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    let code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../supabase/functions/body-clock', file), 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    if (file === 'index.ts') code += '\nmodule.exports.processUser = processUser;';
    const module = { exports: {} };
    const req = name => name.startsWith('npm:') ? { createClient: () => h.client }
      : name === './persona-store.ts' ? { loadPersonaPrompt: async () => ({ text: '美咲' }) } : load(name.slice(2));
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(req, module, module.exports);
    cache.set(file, module.exports); return module.exports;
  }
  return { load, send: () => load('index.ts').processUser(h.client, 'test', { user_id: h.user.id, notifications_enabled: true }) };
}
async function chat(h, message, token) {
  const response = await h.load('app/api/chat/route.ts').POST(h.request({ message,
    requestId: require('node:crypto').randomUUID(), temporaryState: token }));
  assert.equal(response.status, 200); return response.json();
}
async function save(h, token, pending) {
  const response = await h.load('app/api/persona/history/route.ts').POST(h.request({ saveAnonymous: true,
    expectedUserId: h.user.id, temporaryState: token, pending }));
  assert.equal(response.status, 200); return response.json();
}

test('email send failure -> additional chat -> retry checkpoints latest server state even with old token', async () => {
  const h = harness({ anonymous: true });
  const first = await chat(h, '最初の会話');
  await save(h, first.temporaryState); // Transport email failure cannot undo the checkpoint.
  await chat(h, 'メール失敗後の追加会話', first.temporaryState);
  await save(h, first.temporaryState);
  h.user.is_anonymous = false;
  const state = await h.load('lib/canonical-state.ts').loadCanonicalState(h.user.id);
  assert.equal(state.relationshipPoints, 2);
  assert.ok(state.history.some(item => item.text === 'メール失敗後の追加会話'));
  assert.equal((await h.load('app/api/persona/history/route.ts').POST(h.request({ saveAnonymous: true,
    expectedUserId: h.user.id, temporaryState: first.temporaryState }))).status, 409);
  assert.equal(h.points, 2);
});

test('pending confirmation -> conversation -> resave -> permanent account retains newest pair', async () => {
  const h = harness({ anonymous: true }), first = await chat(h, '確認メール前');
  await save(h, first.temporaryState);
  const second = await chat(h, '確認待ち中の会話', first.temporaryState);
  await save(h, second.temporaryState);
  h.user.is_anonymous = false;
  assert.equal(h.rootState.history.length, 4); assert.equal(h.points, 2);
  assert.ok(h.rootState.history.some(item => item.text === '確認待ち中の会話'));
});

test('chat -> Body Clock -> chat -> Body Clock -> email save -> permanent account is one continuous context', async () => {
  const h = harness({ anonymous: true }), first = await chat(h, '通常会話1'), edge = bodyClock(h);
  await edge.send();
  assert.equal(h.consumed, 1);
  const before = h.prompts.length;
  await chat(h, '自発メッセージへの返事', first.temporaryState); // Browser has not seen the delivery.
  assert.ok(JSON.stringify(h.prompts.slice(before)).includes('自発メッセージを送ったよ'));
  const beforeNext = h.prompts.length;
  await edge.send();
  assert.ok(JSON.stringify(h.prompts.slice(beforeNext)).includes('自発メッセージへの返事'));
  await save(h, first.temporaryState);
  h.user.is_anonymous = false;
  const a = await h.load('lib/canonical-state.ts').loadCanonicalState(h.user.id);
  const b = await h.load('lib/canonical-state.ts').loadCanonicalState(h.user.id);
  assert.deepEqual(a, b); assert.equal(a.relationshipPoints, 2); assert.equal(a.history.length, 6);
  assert.equal(a.history.filter(item => item.text === '自発メッセージを送ったよ').length, 2);
  assert.equal(h.consumed, 2); assert.equal(h.refunded, 0);
});

test('chat and Body Clock after checkpoint remain saved even without another save request', async () => {
  const h = harness({ anonymous: true }), first = await chat(h, '保存前');
  await save(h, first.temporaryState);
  await chat(h, '保存後', first.temporaryState); await bodyClock(h).send();
  h.user.is_anonymous = false;
  assert.equal(h.points, 2); assert.equal(h.rootState.history.length, 5);
  assert.ok(h.rootState.history.some(item => item.text === '自発メッセージを送ったよ'));
});

test('lost-response recovery loads latest root including a subsequent Body Clock delivery', async () => {
  const h = harness({ anonymous: true }), requestId = require('node:crypto').randomUUID();
  assert.equal((await h.load('app/api/chat/route.ts').POST(h.request({ requestId }))).status, 200);
  await bodyClock(h).send();
  const response = await h.load('app/api/persona/history/route.ts').POST(h.request({ action: 'load',
    pending: { requestId, message: 'こんにちは', temporaryState: null } }));
  const recovered = await response.json();
  assert.equal(recovered.recoveredTurn, true); assert.equal(recovered.history.length, 3);
  await save(h, null, { requestId, message: 'こんにちは', temporaryState: null });
  assert.equal(h.rootState.history.length, 3);
});

test('explicit anonymous edit advances shared root and is respected by subsequent chat/Body Clock/save', async () => {
  const h = harness({ anonymous: true }), first = await chat(h, '削除予定の会話');
  const api = h.load('app/api/persona/history/route.ts');
  assert.equal((await api.POST(h.request({ action: 'clearHistory', temporaryState: first.temporaryState }))).status, 200);
  await bodyClock(h).send(); await save(h, first.temporaryState);
  assert.equal(h.rootState.history.length, 1);
  assert.equal(h.points, 1);
});

test('an expired shared root cannot fall back to an older browser snapshot or receipt', async () => {
  const h = harness({ anonymous: true }), first = await chat(h, '期限前');
  h.temporaryRoots.get(h.user.id).expires_at = new Date(0).toISOString();
  await assert.rejects(() => h.load('lib/canonical-state.ts').loadTemporaryRoot(h.user.id, first.temporaryState), /expired/);
  const result = await bodyClock(h).send(); assert.equal(result.skipped, 'temporary_state_unavailable');
});

test('a concurrent root revision prevents stale checkpoints and explicit edits', async () => {
  const h = harness({ anonymous: true }), first = await chat(h, '競合前');
  const canonical = h.load('lib/canonical-state.ts');
  const stale = await canonical.loadTemporaryRoot(h.user.id, first.temporaryState);
  await bodyClock(h).send();
  await assert.rejects(() => canonical.editTemporaryRoot(h.user.id, stale), /commit failed/);
  const rejected = await h.client.rpc('save_misaki_temporary_state', { p_expected_revision: stale.temporaryRevision });
  assert.ok(rejected.error);
  assert.equal((await canonical.loadTemporaryRoot(h.user.id, first.temporaryState)).history.length, 3);
});

test('Body Clock advances history without extending anonymous lifetime', async () => {
  const h = harness({ anonymous: true }), first = await chat(h, '期限を開始');
  const expires = h.temporaryRoots.get(h.user.id).expires_at;
  h.advanceClock(23 * 60 * 60 * 1000);
  await bodyClock(h).send();
  const root = h.temporaryRoots.get(h.user.id);
  assert.equal(root.expires_at, expires);
  assert.equal(h.load('lib/canonical-state.ts').openTemporaryState(root.token).state.history.length, 3);
  h.advanceClock(2 * 60 * 60 * 1000);
  await assert.rejects(() => h.load('lib/canonical-state.ts').loadTemporaryRoot(h.user.id, null), /expired/);
});

test('explicit anonymous load renews live temporary state without adding usage or points', async () => {
  const h = harness({ anonymous: true }), first = await chat(h, 'ロードで更新');
  const before = Date.parse(h.temporaryRoots.get(h.user.id).expires_at);
  h.advanceClock(23 * 60 * 60 * 1000);
  const response = await h.load('app/api/persona/history/route.ts').POST(h.request({ action: 'load', temporaryState: first.temporaryState }));
  assert.equal(response.status, 200);
  assert.ok(Date.parse(h.temporaryRoots.get(h.user.id).expires_at) > before);
  assert.equal(h.consumed, 1); assert.equal((await response.json()).relationshipPoints, 1);
});

test('Body Clock skips a missing shared root even when old replay receipts remain', async () => {
  const h = harness({ anonymous: true }); await chat(h, '古い応答');
  h.temporaryRoots.clear();
  assert.equal((await bodyClock(h).send()).skipped, 'temporary_state_unavailable');
});
