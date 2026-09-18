const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { harness } = require('./server-canonical.test.cjs');

for (const anonymous of [false, true]) for (const premium of [false, true]) {
  test(`maintenance OFF -> ON -> OFF preserves ${anonymous ? 'anonymous' : 'permanent'} ${premium ? 'Premium' : 'Free'} chat`, async () => {
    const h = harness({ anonymous, premium }), route = h.load('app/api/chat-proxy/route.ts');
    const first = await route.POST(h.request());
    assert.equal(first.status, 200);
    const saved = await first.json();
    const before = { points: h.points, consumed: h.consumed, refunded: h.refunded, generated: h.generated,
      state: JSON.stringify(h.rootState), roots: JSON.stringify([...h.temporaryRoots]), calls: h.calls.length };
    h.setMaintenance(true);
    const blocked = await route.POST(h.request({ requestId: require('node:crypto').randomUUID(), temporaryState: saved.temporaryState }));
    assert.equal(blocked.status, 503); assert.equal(blocked.headers.get('cache-control'), 'no-store');
    assert.equal(blocked.headers.get('retry-after'), '60');
    const body = await blocked.json(); assert.equal(body.code, 'MAINTENANCE'); assert.equal(body.reply, undefined); assert.equal(body.usage, undefined);
    assert.deepEqual({ points: h.points, consumed: h.consumed, refunded: h.refunded, generated: h.generated,
      state: JSON.stringify(h.rootState), roots: JSON.stringify([...h.temporaryRoots]), calls: h.calls.length }, before);
    h.setMaintenance(false);
    assert.equal((await route.POST(h.request({ requestId: require('node:crypto').randomUUID(), temporaryState: saved.temporaryState }))).status, 200);
    assert.equal(h.consumed, before.consumed + 1);
  });
}
for (const anonymous of [false, true]) test(`maintenance blocks all state POST operations (${anonymous ? 'anonymous' : 'permanent'})`, async () => {
  const h = harness({ anonymous }); h.setMaintenance(true);
  const api = h.load('app/api/persona/history/route.ts');
  for (const operation of [{ action: 'load' }, { action: 'clearHistory' }, { action: 'clearMemory' },
    { action: 'deleteMemory', value: 'server memory' }, { saveAnonymous: true, expectedUserId: h.user.id }]) {
    assert.equal((await api.POST(h.request(operation))).status, 503);
  }
  assert.equal(h.calls.length, 0); assert.equal(h.generated, 0); assert.equal(h.consumed, 0);
  assert.equal(h.rootState.memory[0], 'server memory');
});
test('missing/unreadable maintenance control fails closed before chat work', async () => {
  const h = harness(); h.client.from = () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: null, error: null }) });
  const response = await h.load('app/api/chat/route.ts').POST(h.request({ maintenance: false }));
  assert.equal(response.status, 503); assert.equal((await response.json()).code, 'MAINTENANCE_UNAVAILABLE');
  assert.equal(h.generated, 0); assert.equal(h.consumed, 0); assert.equal(h.calls.length, 0);
});

// Run the actual sendMessage body, including optimistic history and finally.
for (const reuse of [false, true]) test(`client maintenance keeps history and draft without a Misaki reply (retry=${reuse})`, async () => {
  const h = harness(), classifier = h.load('lib/maintenance-result.ts');
  const id = 'ab9289d2-80b2-458a-b989-cc0640ef0a1e';
  const history = [{ role: 'user', text: 'existing' }, { role: 'misaki', text: 'saved reply' }];
  const values = new Map();
  if (reuse) values.set('misaki-pending-chat-turn', JSON.stringify({ requestId: id, message: 'draft', owner: h.user.id, temporaryState: null }));
  let messages = [...history], draft = 'draft', error = '', usage = 0;
  const context = vm.createContext({ message: draft, loading: false, loaded: true, accountLoaded: true, isPremium: false,
    usageCountToday: 0, FREE_DAILY_LIMIT: 20, MAX_MESSAGES: 60, TEMPORARY_STATE_KEY: 'temporary', misakiTodayMemory: { date: '', items: [] }, memory: [],
    getJapanDateKey: () => 'today', getJapanCurrentTime: () => '', getAccessToken: async () => 'token',
    supabase: { auth: { getSession: async () => ({ data: { session: { user: h.user } } }) } },
    sessionStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) },
    crypto: { randomUUID: () => id }, JSON, Error, console, messages, maintenanceMessage: classifier.maintenanceMessage,
    setMessages: next => { messages = typeof next === 'function' ? next(messages) : next; }, setMessage: next => { draft = next; },
    setSendError: next => { error = next; }, setLoading() {}, setShowPremium() {}, applyApiUsage: () => { usage++; },
    fetch: async () => Response.json({ code: 'MAINTENANCE', maintenance: true, error: 'メンテナンス中です。' }, { status: 503 }),
  });
  const source = fs.readFileSync(require('node:path').join(__dirname, '../app/chat/page.tsx'), 'utf8');
  const start = source.indexOf('  async function sendMessage()');
  const end = source.indexOf('\n  return (', start);
  vm.runInContext(ts.transpileModule(source.slice(start, end), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText, context);
  await context.sendMessage();
  assert.equal(messages.filter(item => item.role === 'misaki').length, 1);
  assert.equal(JSON.stringify(messages.slice(0, 2)), JSON.stringify(history)); assert.equal(draft, 'draft'); assert.equal(error, 'メンテナンス中です。'); assert.equal(usage, 0);
  assert.equal(values.has('misaki-pending-chat-turn'), reuse);
  assert.equal(messages.length, reuse ? 3 : 2);
});
