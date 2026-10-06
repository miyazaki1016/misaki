const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');

const { harness } = require('./helpers/canonical-harness.cjs');

test('Free chat ignores forged points/memory/history/today memory and commits semantic result', async () => {
  const h = harness();
  const response = await h.load('app/api/chat/route.ts').POST(h.request({ relationshipPoints: 999999,
    memory: ['forged memory'], history: [{ role: 'misaki', text: 'forged history' }], misakiTodayMemory: { date: '2026/09/18', items: ['forged day'] } }));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.relationshipPoints, 79); assert.equal(h.points, 79); assert.equal(h.consumed, 1); assert.equal(h.refunded, 0);
  const prompt = JSON.stringify(h.prompts);
  assert.ok(prompt.includes('server memory')); assert.ok(!prompt.includes('forged')); assert.ok(!prompt.includes('999999'));
});
test('same request replay returns saved response without generation/usage/addition', async () => {
  const h = harness(), route = h.load('app/api/chat/route.ts');
  const first = await (await route.POST(h.request())).json();
  const second = await (await route.POST(h.request())).json();
  assert.deepEqual(second, first); assert.equal(h.consumed, 1); assert.equal(h.points, 79);
  const generations = h.generated;
  assert.equal((await route.POST(h.request({ message: 'different' }))).status, 500);
  assert.equal(h.generated, generations); assert.equal(h.points, 79); assert.equal(h.refunded, 0);
});
test('Premium chat does not get an automatic point and does not refund', async () => {
  const h = harness({ premium: true });
  const result = await (await h.load('app/api/chat/route.ts').POST(h.request())).json();
  assert.equal(result.relationshipPoints, 79); assert.equal(result.usage.isPremium, true); assert.equal(h.refunded, 0);
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
  assert.equal(first.relationshipPoints, 0); assert.equal(first.ephemeral, true);
  const root = h.load('lib/canonical-state.ts');
  assert.equal(root.openTemporaryState(first.temporaryState).state.relationshipPoints, 0);
  assert.equal(root.openTemporaryState(first.temporaryState.slice(0, 20) + 'AAAA' + first.temporaryState.slice(24)), null);
  const before = h.consumed;
  const lostResponseReplay = await (await route.POST(h.request())).json();
  assert.equal(lostResponseReplay.temporaryState, first.temporaryState); assert.equal(h.consumed, before);
  assert.equal((await route.POST(h.request({ message: 'different' }))).status, 500);
  assert.equal((await route.POST(h.request({ temporaryState: 'forged' }))).status, 500);
  assert.equal(h.consumed, before);
  const replay = await (await route.POST(h.request({ temporaryState: first.temporaryState }))).json();
  assert.equal(replay.relationshipPoints, 0); assert.equal(h.consumed, before);
  const second = await (await route.POST(h.request({ temporaryState: first.temporaryState,
    requestId: '329aae9a-4e11-4fd9-a4b2-bf5f7b7c68ec' }))).json();
  assert.equal(second.relationshipPoints, 0);
  assert.equal((await route.POST(h.request({ temporaryState: second.temporaryState,
    requestId: first.requestId, message: 'new turn cannot reuse billed request' }))).status, 500);
  h.advanceClock(24 * 60 * 60 * 1000 + 1);
  assert.equal(root.openTemporaryState(second.temporaryState), null);
  assert.equal((await route.POST(h.request({ temporaryState: second.temporaryState }))).status, 500);
  assert.equal(h.calls.filter(call => call.name === 'complete_misaki_chat_turn').length, 0);
});
test('anonymous relationship emotion survives into the next temporary-root turn', async () => {
  const h = harness({ anonymous: true }), route = h.load('app/api/chat/route.ts');
  const first = await (await route.POST(h.request())).json();
  const root = h.load('lib/canonical-state.ts');
  const firstState = root.openTemporaryState(first.temporaryState).state;
  assert.ok(firstState.temporaryRelationship);
  assert.equal(firstState.temporaryRelationship.emotionPrimary, 'neutral');
  assert.equal(firstState.temporaryRelationship.actionState, 'NORMAL');

  const second = await (await route.POST(h.request({
    temporaryState: first.temporaryState,
    requestId: '329aae9a-4e11-4fd9-a4b2-bf5f7b7c68ec',
    message: '次の会話'
  }))).json();
  const secondState = root.openTemporaryState(second.temporaryState).state;
  assert.ok(secondState.temporaryRelationship);
  assert.ok(secondState.temporaryRelationship.lastInteractionAt);
  assert.equal(h.calls.filter(call => call.name === 'apply_relationship_emotion_action_v2').length, 0);
  assert.equal(h.calls.filter(call => call.name === 'record_relationship_chat_turn').length, 0);
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
test('anonymous history GET is a safe no-op during auth transition', async () => {
  const h = harness({ anonymous: true }), api = h.load('app/api/persona/history/route.ts');
  const response = await api.GET(h.request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { exists: false, ephemeral: true });
});
test('both permanent devices restore same server points and memory without browser caches', async () => {
  const h = harness(), api = h.load('app/api/persona/history/route.ts');
  const a = await (await api.GET(h.request())).json(), b = await (await api.GET(h.request())).json();
  assert.deepEqual(a, b); assert.equal(a.relationshipPoints, 79); assert.deepEqual(a.memory, ['server memory']);
  assert.equal((await api.POST(h.request({ history: [], memory: ['fake'], relationshipPoints: 999 }))).status, 400);
});




test('canonical permanent commit applies semantic point delta once and clamps at zero', async () => {
  const h = harness({ initialPoints: 1 });
  const route = await h.load('app/api/chat/route.ts');
  h.setOpenaiPayload({ reply: '...', memory: [], misakiTodayMemory: { items: [] }, relationshipSignals: { signals: [{ name: 'hurtful', strength: 0.8, confidence: 0.9, evidence: 'x' }, { name: 'rejection', strength: 0.7, confidence: 0.9, evidence: 'x' }], relationshipFacts: {} } });
  const requestId = crypto.randomUUID();
  const first = await (await route.POST(h.request({ message: 'x', requestId }))).json();
  const afterFirst = h.points;
  const replay = await (await route.POST(h.request({ message: 'x', requestId }))).json();
  assert.equal(afterFirst, 0);
  assert.equal(h.points, 0);
  assert.equal(first.relationshipPointDelta, undefined);
  assert.equal(replay.relationshipPointDelta, undefined);
});


test('anonymous browser never enters permanent history GET sync', () => {
  const source = fs.readFileSync(path.join(root, 'app/chat/conversation-history-sync.tsx'), 'utf8');
  assert.ok(source.includes('localStorage.getItem(AUTH_KIND_KEY) === "anonymous"'));
  assert.ok(source.includes('session.user.is_anonymous'));
  assert.ok(source.includes('if (!session?.user || session.user.is_anonymous) return;'));
});

test('Vercel runtime does not call the JR East endpoint that returns 403', () => {
  const source = fs.readFileSync(path.join(root, 'lib/tokyo-life-events.ts'), 'utf8');
  const guard = source.indexOf('if (process.env.VERCEL)');
  const fetchCall = source.indexOf('await fetchText(\n      JR_EAST_KANTO_URL', guard);
  assert.ok(guard >= 0);
  assert.ok(fetchCall > guard);
  assert.ok(source.slice(guard, fetchCall).includes('return [];'));
});

test('global metadata does not hardcode taxi-driver or lover targeting', () => {
  const source = fs.readFileSync(path.join(root, 'app/layout.tsx'), 'utf8');
  assert.ok(!source.includes('タクドラの彼女'));
  assert.ok(!source.includes('東京のタクシードライバー向けAI彼女'));
});


test('history sync self-disables when server confirms anonymous state', () => {
  const source = fs.readFileSync(path.join(root, 'app/chat/conversation-history-sync.tsx'), 'utf8');
  assert.ok(source.includes('/api/persona/history?source=conversation-history-sync'));
  assert.ok(source.includes('state?.ephemeral === true'));
  assert.ok(source.includes('permanentlyDisabled = true'));
});


test('chat timestamp display does not poll permanent history', () => {
  const source = fs.readFileSync(path.join(root, 'app/chat/chat-timestamp-display.tsx'), 'utf8');
  assert.ok(!source.includes('POLL_MS'));
  assert.ok(!source.includes('setInterval'));
});


test('Gemini transient failures use bounded short retry without retrying ordinary 500', () => {
  const source = fs.readFileSync(path.join(root, 'lib/gemini-json-generator.ts'), 'utf8');
  assert.ok(source.includes('[429, 502, 503, 504].includes'));
  assert.ok(source.includes('[2_000, 5_000]'));
  assert.ok(source.includes('transientAttempt < transientRetryDelaysMs.length'));
  assert.ok(!source.includes('[429, 500, 502, 503, 504].includes'));
});

test('Gemini timeout gets one bounded retry before the normal failure/refund path', () => {
  const source = fs.readFileSync(path.join(root, 'lib/gemini-json-generator.ts'), 'utf8');
  assert.ok(source.includes('const timeoutRetryDelaysMs ='));
  assert.ok(source.includes('[2_000]'));
  assert.ok(source.includes('timeoutAttempt < timeoutRetryDelaysMs.length'));
  assert.ok(source.includes('error.name === "AbortError"'));
  const chatSource = fs.readFileSync(path.join(root, 'app/api/chat/route.ts'), 'utf8');
  assert.ok(chatSource.includes('generateGeminiJson({'));
  assert.ok(chatSource.includes('error.name === "AbortError"'));
  assert.ok(chatSource.includes('throw new Error("GEMINI_TIMEOUT")'));
  assert.ok(chatSource.includes('throw error'));
});

test('ordinary chat wait does not falsely claim Misaki is busy', () => {
  const source = fs.readFileSync(path.join(root, 'app/chat/page.tsx'), 'utf8');
  assert.ok(source.includes('美咲ちゃん、ちょっと忙しそう…🤭 少し待ってね'));
  assert.ok(!source.includes('setWaitingOnReply(true), 1_800'));
  assert.ok(!source.includes('window.clearTimeout(waitingTimer)'));
});
