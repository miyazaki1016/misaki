// Exercise the actual client components and API with controlled auth/storage.
// Run: node --test tests/account-conversation.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const history = [{ role: 'user', text: 'hello' }, { role: 'misaki', text: 'hi' }];
const ownerKey = 'misaki-device-user-id';
const pendingKey = 'misaki-email-save-user-id';
function storage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return { get length() { return map.size; }, key: i => [...map.keys()][i] ?? null,
    getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: k => map.delete(k) };
}
async function flush() { for (let i = 0; i < 12; i++) await new Promise(setImmediate); }
function harness(user = { id: 'a', is_anonymous: true }, initial = {}, sessionInitial = {}) {
  const localStorage = storage({ [ownerKey]: 'a', 'misaki-chat-history': JSON.stringify(history),
    'misaki-long-term-memory': '["remember"]', 'misaki-auth-kind': 'anonymous', ...initial });
  const sessionStorage = storage(sessionInitial);
  const states = [], effects = [], cleanups = [], calls = [], listeners = [];
  let cursor = 0, mounted = false, currentUser = user;
  const react = { useState: value => {
    const i = cursor++;
    if (!(i in states)) states[i] = value;
    return [states[i], next => { states[i] = typeof next === 'function' ? next(states[i]) : next; }];
  }, useEffect: fn => { if (!mounted) effects.push(fn); }, useLayoutEffect: fn => { if (!mounted) effects.push(fn); } };
  const client = { auth: {
    getSession: async () => ({ data: { session: currentUser ? { user: currentUser, access_token: 'token' } : null }, error: null }),
    getUser: async () => ({ data: { user: currentUser }, error: null }),
    signOut: async () => { calls.push('signOut'); currentUser = null; return { error: null }; },
    signInAnonymously: async () => { calls.push('signIn'); currentUser = { id: 'new', is_anonymous: true }; return { data: { user: currentUser }, error: null }; },
    updateUser: async () => { calls.push('email'); return { error: null }; },
    onAuthStateChange: fn => { listeners.push(fn); return { data: { subscription: { unsubscribe() {} } } }; },
  }, rpc: async (name, args) => { calls.push({ name, args }); return { data: { saved: true }, error: null }; } };
  const context = vm.createContext({ localStorage, sessionStorage, Response, Request, Date, JSON,
    console: { error() {} }, fetch: (...args) => h.fetch(...args),
    window: { location: { origin: 'https://example.test', reload: () => calls.push('reload') },
      setInterval() {}, clearInterval() {}, setTimeout: fn => fn(), addEventListener() {}, removeEventListener() {} },
    document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} } });
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 }
    }).outputText;
    const module = { exports: {} };
    const req = name => {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'fragment' };
      if (name === '@supabase/supabase-js') return { createClient: () => client };
      if (name.endsWith('/supabase')) return { supabase: client };
      if (name.endsWith('/device-conversation')) return load('lib/device-conversation.ts');
      throw Error(name);
    };
    vm.runInContext(`(function(require,module,exports){${output}\n})`, context)(req, module, module.exports);
    cache.set(file, module.exports);
    return module.exports;
  }
  const h = { localStorage, sessionStorage, states, calls, client, load,
    fetch: async () => Response.json({ exists: true, history, memory: ['remember'] }),
    setUser: u => { currentUser = u; }, emit: (event, u) => listeners.forEach(fn => fn(event, u ? { user: u } : null)),
    render(file, props = {}) { cursor = 0; const tree = load(file).default(props); mounted = true; return tree; },
    async mount(file, props) { const tree = this.render(file, props); effects.splice(0).forEach(fn => { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); }); await flush(); return tree; },
    unmount() { cleanups.forEach(fn => fn()); } };
  return h;
}
function find(tree, text) {
  if (!tree || typeof tree !== 'object') return null;
  if (tree.type === 'button' && tree.props.children === text) return tree;
  for (const child of [tree.props?.children].flat(Infinity)) { const match = find(child, text); if (match) return match; }
  return null;
}
test('email save checkpoints history and memory before updateUser', async () => {
  const h = harness();
  h.fetch = async (_url, options) => { h.calls.push('save');
    const body = JSON.parse(options.body);
    assert.equal(body.expectedUserId, 'a'); assert.equal(body.saveAnonymous, true);
    assert.deepEqual(body.history, history); assert.deepEqual(body.memory, ['remember']);
    return Response.json({ synced: true }); };
  await h.mount('app/account/page.tsx'); h.states[2] = 'test@example.test';
  await find(h.render('app/account/page.tsx'), 'メールで保存する').props.onClick();
  assert.deepEqual(h.calls, ['save', 'email']); assert.equal(h.localStorage.getItem(pendingKey), 'a');
});
test('failed checkpoint never sends confirmation email', async () => {
  const h = harness(); h.fetch = async () => new Response('', { status: 500 });
  await h.mount('app/account/page.tsx'); h.states[2] = 'test@example.test';
  await find(h.render('app/account/page.tsx'), 'メールで保存する').props.onClick();
  assert.ok(!h.calls.includes('email')); assert.equal(h.localStorage.getItem(pendingKey), null);
});
test('account switch during checkpoint never updates another user email', async () => {
  const h = harness(); h.fetch = async () => { h.setUser({ id: 'b', is_anonymous: true }); return Response.json({}); };
  await h.mount('app/account/page.tsx'); h.states[2] = 'test@example.test';
  await find(h.render('app/account/page.tsx'), 'メールで保存する').props.onClick();
  assert.ok(!h.calls.includes('email'));
});
test('confirmation in a fresh tab preserves same-user cache and gates chat hydration', async () => {
  const h = harness({ id: 'a', is_anonymous: false });
  const tree = await h.mount('app/chat/anonymous-session-guard.tsx', { children: 'chat' });
  assert.equal(tree.type, 'main'); assert.equal(h.states[0], true);
  assert.deepEqual(JSON.parse(h.localStorage.getItem('misaki-chat-history')), history);
  assert.deepEqual(h.calls, []);
});
test('pending email save keeps the anonymous user when a fresh tab opens', async () => {
  const h = harness(undefined, { [pendingKey]: 'a' });
  await h.mount('app/chat/anonymous-session-guard.tsx', { children: 'chat' });
  assert.deepEqual(h.calls, []); assert.equal(h.localStorage.getItem(ownerKey), 'a');
});
test('ordinary expired anonymous browser session still clears all misaki caches', async () => {
  const h = harness(undefined, { 'misaki-today-memory': 'old', unrelated: 'keep' });
  await h.mount('app/chat/anonymous-session-guard.tsx');
  assert.deepEqual(h.calls, ['signOut', 'signIn']);
  assert.equal(h.localStorage.getItem('misaki-chat-history'), null);
  assert.equal(h.localStorage.getItem('misaki-today-memory'), null);
  assert.equal(h.localStorage.getItem('unrelated'), 'keep'); assert.equal(h.localStorage.getItem(ownerKey), 'new');
});
test('legacy ownerless Safari cache is discarded before binding current user', async () => {
  const h = harness({ id: 'legacy-anon', is_anonymous: true }, { [ownerKey]: '', 'misaki-auth-kind': '', 'misaki-today-memory': 'old', unrelated: 'keep' }, { 'misaki-browser-session': '1' });
  await h.mount('app/chat/anonymous-session-guard.tsx', { children: 'chat' });
  assert.equal(h.localStorage.getItem('misaki-chat-history'), null);
  assert.equal(h.localStorage.getItem('misaki-long-term-memory'), null);
  assert.equal(h.localStorage.getItem('misaki-today-memory'), null);
  assert.equal(h.localStorage.getItem('unrelated'), 'keep');
  assert.equal(h.localStorage.getItem(ownerKey), 'legacy-anon');
});
test('different permanent user clears previous conversation and memory', async () => {
  const h = harness({ id: 'b', is_anonymous: false }, { [pendingKey]: 'a' });
  await h.mount('app/chat/anonymous-session-guard.tsx');
  assert.equal(h.localStorage.getItem('misaki-chat-history'), null);
  assert.equal(h.localStorage.getItem('misaki-long-term-memory'), null);
  assert.equal(h.localStorage.getItem(pendingKey), null); assert.equal(h.localStorage.getItem(ownerKey), 'b');
});
test('logout clears caches in both storage areas and remounts mounted chat', async () => {
  const h = harness({ id: 'a', is_anonymous: false }, {}, { 'misaki-browser-session': '1', 'misaki-test': 'secret' });
  await h.mount('app/chat/anonymous-session-guard.tsx'); h.emit('SIGNED_OUT', null);
  assert.equal(h.localStorage.getItem('misaki-chat-history'), null);
  assert.equal(h.localStorage.getItem('misaki-long-term-memory'), null);
  assert.equal(h.localStorage.getItem(ownerKey), null);
  assert.equal(h.sessionStorage.length, 0); assert.ok(h.calls.includes('reload'));
});
test('transient anonymous sign-out preserves live browser conversation and reauthenticates', async () => {
  const h = harness({ id: 'a', is_anonymous: true }, {}, { 'misaki-browser-session': '1' });
  await h.mount('app/chat/anonymous-session-guard.tsx');
  h.setUser(null);
  h.emit('SIGNED_OUT', null);
  await flush();
  assert.deepEqual(JSON.parse(h.localStorage.getItem('misaki-chat-history')), history);
  assert.equal(h.localStorage.getItem('misaki-long-term-memory'), '["remember"]');
  assert.equal(h.localStorage.getItem(ownerKey), 'new');
  assert.ok(h.calls.includes('signIn'));
  assert.ok(!h.calls.includes('reload'));
});
test('anonymous session replacement rebinds owner without clearing live conversation', async () => {
  const h = harness({ id: 'a', is_anonymous: true }, {}, { 'misaki-browser-session': '1' });
  await h.mount('app/chat/anonymous-session-guard.tsx');
  h.emit('SIGNED_IN', { id: 'b', is_anonymous: true });
  assert.deepEqual(JSON.parse(h.localStorage.getItem('misaki-chat-history')), history);
  assert.equal(h.localStorage.getItem('misaki-long-term-memory'), '["remember"]');
  assert.equal(h.localStorage.getItem(ownerKey), 'b');
  assert.ok(!h.calls.includes('reload'));
});
test('server response after user switch cannot write old account history', async () => {
  const h = harness({ id: 'a', is_anonymous: false });
  h.fetch = async () => { h.setUser({ id: 'b', is_anonymous: false }); return Response.json({ exists: true, history: [], memory: [] }); };
  await h.mount('app/chat/conversation-history-sync.tsx');
  assert.deepEqual(JSON.parse(h.localStorage.getItem('misaki-chat-history')), history); assert.deepEqual(h.calls, []);
});
test('missing or malformed saved server state cannot erase checkpoint cache', async () => {
  for (const server of [{ exists: false, history: [], memory: [] }, {}]) {
    const h = harness({ id: 'a', is_anonymous: false }, { [pendingKey]: 'a' });
    h.fetch = async () => Response.json(server);
    await h.mount('app/chat/conversation-history-sync.tsx');
    assert.deepEqual(JSON.parse(h.localStorage.getItem('misaki-chat-history')), history);
    assert.equal(h.localStorage.getItem(pendingKey), 'a');
  }
});
test('API rejects foreign expected user ID and accepts memory-only explicit save', async () => {
  const h = harness(); const route = h.load('app/api/persona/history/route.ts');
  const request = body => new Request('https://example.test/api/persona/history', {
    method: 'POST', headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await route.POST(request({ saveAnonymous: true, expectedUserId: 'b', history, memory: [] }))).status, 409);
  assert.equal(h.calls.length, 0);
  assert.equal((await route.POST(request({ saveAnonymous: true, expectedUserId: 'a', history: [], memory: ['remember'] }))).status, 200);
  assert.equal(h.calls[0].name, 'save_anonymous_conversation_state');
  h.setUser({ id: 'a', is_anonymous: false });
  assert.equal((await route.POST(request({ saveAnonymous: true, expectedUserId: 'a', history, memory: [] }))).status, 409);
});
