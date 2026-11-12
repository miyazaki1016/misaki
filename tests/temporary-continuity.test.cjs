const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { harness } = require('./helpers/canonical-harness.cjs');

function bodyClock(h, reply = '自発メッセージを送ったよ') {
  const cache = new Map();
  class EdgeDate extends Date {
    constructor(...args) { super(...(args.length ? args : [h.now()])); }
    static now() { return h.now(); }
  }
  const context = vm.createContext({ Date: EdgeDate, JSON, Math, URL, Request, Response, AbortSignal,
    crypto: require('node:crypto').webcrypto, TextEncoder, TextDecoder, atob, btoa, Uint8Array, console,
    Deno: { env: { get: () => 'server-only-test-key' }, serve() {} },
    fetch: async (url, options) => {
      if (String(url).includes('generativelanguage')) {
        h.prompts.push(JSON.parse(options.body));
        return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ reply }) }] } }] });
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
      : name === './persona-store.ts' ? { loadPersonaPrompt: async () => ({ text: '美咲' }) } : load(path.posix.normalize(path.posix.join(path.posix.dirname(file), name)));
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(req, module, module.exports);
    cache.set(file, module.exports); return module.exports;
  }
  return { load, send: () => load('index.ts').processUser(h.client, 'test', { user_id: h.user.id, notifications_enabled: true }) };
}
async function chat(h, message, token, extra = {}) {
  const response = await h.load('app/api/chat/route.ts').POST(h.request({ message,
    requestId: require('node:crypto').randomUUID(), temporaryState: token, ...extra }));
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
  assert.equal(state.relationshipPoints, 0);
  assert.ok(state.history.some(item => item.text === 'メール失敗後の追加会話'));
  assert.equal((await h.load('app/api/persona/history/route.ts').POST(h.request({ saveAnonymous: true,
    expectedUserId: h.user.id, temporaryState: first.temporaryState }))).status, 409);
  assert.equal(h.points, 0);
});

test('pending confirmation -> conversation -> resave -> permanent account retains newest pair', async () => {
  const h = harness({ anonymous: true }), first = await chat(h, '確認メール前');
  await save(h, first.temporaryState);
  const second = await chat(h, '確認待ち中の会話', first.temporaryState);
  await save(h, second.temporaryState);
  h.user.is_anonymous = false;
  assert.equal(h.rootState.history.length, 4); assert.equal(h.points, 0);
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
  assert.deepEqual(a, b); assert.equal(a.relationshipPoints, 0); assert.equal(a.history.length, 6);
  assert.equal(a.history.filter(item => item.text === '自発メッセージを送ったよ').length, 2);
  assert.equal(h.consumed, 2); assert.equal(h.refunded, 0);
});

test('chat and Body Clock after checkpoint remain saved even without another save request', async () => {
  const h = harness({ anonymous: true }), first = await chat(h, '保存前');
  await save(h, first.temporaryState);
  await chat(h, '保存後', first.temporaryState); await bodyClock(h).send();
  h.user.is_anonymous = false;
  assert.equal(h.points, 0); assert.equal(h.rootState.history.length, 5);
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
  assert.equal(h.points, 0);
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
  assert.equal(h.consumed, 1); assert.equal((await response.json()).relationshipPoints, 0);
});

test('Body Clock skips a missing shared root even when old replay receipts remain', async () => {
  const h = harness({ anonymous: true }); await chat(h, '古い応答');
  h.temporaryRoots.clear();
  assert.equal((await bodyClock(h).send()).skipped, 'temporary_state_unavailable');
});

test('anonymous chat omits expired history from inference but retains it for display', async () => {
  const h = harness({ anonymous: true });
  const canonical = h.load('lib/canonical-state.ts');
  const history = [
    { role: 'user', text: 'old-anonymous-context', sentAt: new Date(Date.now() - 25 * 3600000).toISOString() },
    { role: 'user', text: 'active-anonymous-context', sentAt: new Date(Date.now() - 3600000).toISOString() },
    { role: 'user', text: 'untimed-anonymous-context' },
  ];
  const token = canonical.sealTemporaryState({
    history, memory: [], todayMemory: { date: '', items: [] }, relationshipPoints: 0,
  }, 'prior-turn');

  const result = await chat(h, '今日も話そう', token);
  const prompt = JSON.stringify(h.prompts);
  assert.match(prompt, /active-anonymous-context/);
  assert.doesNotMatch(prompt, /old-anonymous-context|untimed-anonymous-context/);
  const saved = canonical.openTemporaryState(result.temporaryState).state.history;
  assert.equal(saved[0].text, 'old-anonymous-context');
  assert.equal(saved[0].sentAt, history[0].sentAt);
});

test('anonymous memory expires per item across renewal, replacement auth ID and email save', async () => {
  const h = harness({ anonymous: true });
  const canonical = h.load('lib/canonical-state.ts');
  h.setOpenaiPayload({ reply: 'うん', memory: ['最初の情報'] });
  const first = await chat(h, '最初の情報');
  const old = canonical.openTemporaryState(first.temporaryState).state;
  h.advanceClock(60 * 60 * 1000);
  h.setOpenaiPayload({ reply: 'うん', memory: [...old.memory, 'newer fact'], misakiTodayMemory: { items: [] } });
  const second = await chat(h, 'newer fact', first.temporaryState);
  h.advanceClock(23 * 60 * 60 * 1000 - 1000);
  h.user.id = 'safari-replacement';
  const resumed = await canonical.loadTemporaryRoot(h.user.id, second.temporaryState);
  const { anonymousInferenceState } = h.load('supabase/functions/_shared/anonymous-memory-expiry.ts');
  assert.deepEqual(Array.from(anonymousInferenceState(resumed, h.now()).memory), [...old.memory, 'newer fact']);
  h.advanceClock(1000);
  const active = anonymousInferenceState(resumed, h.now());
  assert.deepEqual(Array.from(active.memory), ['newer fact']);
  assert.equal(active.relationshipPoints, 0);
  const reconnect = await h.load('app/api/persona/history/route.ts').POST(
    h.request({ action: 'load', temporaryState: second.temporaryState }));
  assert.equal(reconnect.status, 200);
  const view = await reconnect.json();
  assert.deepEqual(view.memory, ['newer fact']);
  assert.equal(view.memoryCount, 1);
  assert.equal(view.relationshipPoints, 0);
  assert.ok(view.history.some(item => item.text === '最初の情報'));
  await save(h, second.temporaryState);
  assert.deepEqual(Array.from(h.rootState.memory), ['newer fact']);
});

test('anonymous replay cannot return expired relationship points through either receipt path', async () => {
  const h = harness({ anonymous: true });
  const canonical = h.load('lib/canonical-state.ts');
  const oldEvidence = h.now() - 23 * 3600000;
  const parent = canonical.sealTemporaryState({
    history: [], memory: [], todayMemory: { date: '', items: [] },
    relationshipPoints: 40, relationshipEvidenceAt: oldEvidence,
  }, 'previous-turn');
  const api = h.load('app/api/chat/route.ts');
  const requestId = require('node:crypto').randomUUID();
  const message = '今日は晴れだね';
  const send = temporaryState => api.POST(h.request({ message, requestId, temporaryState }));
  const first = await send(parent);
  assert.equal(first.status, 200);
  const result = await first.json();
  assert.ok(result.relationshipPoints > 0);
  h.advanceClock(3600000);
  for (const token of [parent, result.temporaryState]) {
    const replay = await send(token);
    assert.equal(replay.status, 200);
    assert.equal((await replay.json()).relationshipPoints, 0);
  }
  assert.equal(h.consumed, 1);
});

test('anonymous paraphrase and summary cannot cite expired or Body Clock-authored history', async () => {
  const h = harness({ anonymous: true });
  const canonical = h.load('lib/canonical-state.ts');
  const expired = h.now() - 86400000;
  const token = canonical.sealTemporaryState({
    history: [
      { role: 'user', requestId: 'expired', text: '通勤はいつも電車', sentAt: new Date(expired).toISOString() },
      { role: 'misaki', requestId: 'assistant', text: '職場へは鉄道で通う', sentAt: new Date(h.now() - 1000).toISOString() },
    ],
    memory: ['通勤はいつも電車'], memoryTimes: [['通勤はいつも電車', expired]],
    todayMemory: { date: '', items: [] }, relationshipPoints: 0,
  }, 'previous');
  const paraphrase = '職場へは鉄道で通う';
  h.setOpenaiPayload({ reply: 'うん', memory: [paraphrase],
    misakiTodayMemory: { items: [paraphrase] } });
  let checkedSources;
  h.setMemoryEvidenceJudge(input => {
    checkedSources = input.sources.map(source => source.text);
    return { rows: input.rows.map((_, index) => ({ index, supported: true,
      sources: [{ requestId: 'expired', quote: '通勤はいつも電車' }] })) };
  });
  const blocked = await chat(h, 'おはよう', token);
  assert.deepEqual(checkedSources, ['おはよう']);
  assert.deepEqual(blocked.memory, []);
  assert.deepEqual(blocked.misakiTodayMemory.items, []);
  const before = h.prompts.length;
  await bodyClock(h, paraphrase).send();
  const clockPrompt = JSON.stringify(h.prompts.slice(before));
  assert.doesNotMatch(clockPrompt, /通勤はいつも電車/);

  let afterClockSources;
  h.setMemoryEvidenceJudge(input => {
    afterClockSources = input.sources;
    return { rows: input.rows.map((_, index) => ({ index, supported: false, sources: [] })) };
  });
  const afterClock = await chat(h, 'こんにちは', blocked.temporaryState);
  assert.deepEqual(afterClock.memory, []);
  assert.ok(afterClockSources.every(source => source.text !== paraphrase));

  h.setMemoryEvidenceJudge(input => {
    assert.ok(input.sources.every(source => !['expired', 'assistant'].includes(source.requestId)));
    const source = input.sources.find(row => row.text === '今も電車で通勤している');
    assert.ok(source);
    return { rows: input.rows.map((_, index) => ({ index, supported: true,
      sources: [{ requestId: source.requestId, quote: source.text }] })) };
  });
  const requestId = require('node:crypto').randomUUID();
  const api = h.load('app/api/chat/route.ts');
  const message = '今も電車で通勤している';
  const send = temporaryState => api.POST(h.request({ message, requestId, temporaryState }));
  const response = await send(afterClock.temporaryState);
  assert.equal(response.status, 200);
  const relearned = await response.json();
  assert.deepEqual(relearned.memory, [paraphrase]);
  const state = canonical.openTemporaryState(relearned.temporaryState).state;
  assert.deepEqual(JSON.parse(JSON.stringify(state.memoryTimes)), [
    [paraphrase, h.now(), [{ requestId, origin: 'user', sentAt: h.now(), expiresAt: h.now() + 86400000 }]],
  ]);
  const usage = h.consumed;
  for (const parent of [afterClock.temporaryState, relearned.temporaryState]) {
    const replay = await send(parent);
    assert.equal(replay.status, 200);
    assert.deepEqual((await replay.json()).memory, [paraphrase]);
  }
  assert.equal(h.consumed, usage);
});

test('anonymous multiple roots require every cited assertion to be active and expire at the earliest root', async () => {
  const h = harness({ anonymous: true });
  const canonical = h.load('lib/canonical-state.ts');
  const old = h.now() - 86400000;
  const fresh = h.now() - 3600000;
  const history = [
    { role: 'user', requestId: 'expired', text: '自転車を使う', sentAt: new Date(old).toISOString() },
    { role: 'user', requestId: 'active', text: '通勤は電車', sentAt: new Date(fresh).toISOString() },
  ];
  const token = canonical.sealTemporaryState({
    history, memory: [], todayMemory: { date: '', items: [] }, relationshipPoints: 0,
  }, 'previous');
  const mixed = '電車と自転車を利用する';
  const valid = '職場へは鉄道で通い、駅まで徒歩';
  h.setOpenaiPayload({ reply: 'うん', memory: [mixed, valid] });
  h.setMemoryEvidenceJudge(input => {
    assert.equal(input.sources.length, 2);
    const current = input.sources.find(row => row.text === '駅までは歩く');
    assert.ok(current);
    const refs = {
      [mixed]: [{ requestId: 'expired', quote: history[0].text }, { requestId: 'active', quote: history[1].text }],
      [valid]: [{ requestId: 'active', quote: history[1].text }, { requestId: current.requestId, quote: current.text }],
    };
    return { rows: input.rows.map((text, index) => ({ index, supported: true, sources: refs[text] })) };
  });
  const result = await chat(h, '駅までは歩く', token);
  assert.deepEqual(result.memory, [valid]);
  const state = canonical.openTemporaryState(result.temporaryState).state;
  assert.equal(state.memoryTimes[0][1], fresh);
  assert.equal(state.memoryTimes[0][2].length, 2);
  h.advanceClock(23 * 3600000);
  const response = await h.load('app/api/persona/history/route.ts').POST(
    h.request({ action: 'load', temporaryState: result.temporaryState }));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).memory, []);
});

test('anonymous life facts and summaries require grounded sources, and a verifier outage preserves chat', async () => {
  const h = harness({ anonymous: true });
  h.setOpenaiPayload({ reply: 'うん', misakiTodayMemory: { items: ['今日は仕事'] } });
  h.setMemoryEvidenceJudge(() => { throw new Error('unavailable'); });
  const context = { currentTime: new Date(h.now()).toISOString() };
  const blocked = await chat(h, '今日は休みだよ', undefined, context);
  assert.deepEqual(blocked.memory, []);
  assert.deepEqual(blocked.misakiTodayMemory.items, []);

  h.setMemoryEvidenceJudge(input => {
    const source = input.sources.find(row => row.text === '今日は休みだよ');
    assert.ok(source);
    return { rows: input.rows.map((text, index) => ({ index,
      supported: text.startsWith('[life:v1]') && text.includes('今日は休み'),
      sources: [{ requestId: source.requestId, quote: source.text }],
    })) };
  });
  const saved = await chat(h, '別の話にしよう', blocked.temporaryState);
  assert.deepEqual(saved.memory, []); // Life extraction itself only uses the current user turn.
  const grounded = await chat(h, '今日は休みだよ', saved.temporaryState, context);
  assert.equal(grounded.memory.length, 1);
  assert.match(grounded.memory[0], /\[life:v1\].*今日は休み/);
  assert.deepEqual(grounded.misakiTodayMemory.items, []);
});
