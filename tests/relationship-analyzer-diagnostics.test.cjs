const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const turn = { requestId: 'saved-turn', message: 'private-user-message', reply: 'private-assistant-reply', savedAt: '2026-10-03T00:00:00Z' };
const apiKey = 'private-test-api-key';
function harness(response) {
  const calls = [], logs = [];
  const module = { exports: {} };
  const context = vm.createContext({ process: { env: { GEMINI_API_KEY: apiKey } }, console: { error(...args) { logs.push(args); } }, Error });
  const requireStub = name => {
    if (name === './gemini-json-generator.ts') return { async generateGeminiJson(request) { calls.push(request); return response; } };
    if (name === './relationship-engine-v1.ts') return { CRITICAL_TYPES: ['romantic_acceptance'], EVIDENCE_TYPES: ['care'], parseEvidence: value => value.evidence };
    throw Error(`unexpected import: ${name}`);
  };
  const source = fs.readFileSync(path.join(__dirname, '../lib/relationship-analyzer-v1.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText;
  vm.runInContext('(function(require,module,exports){' + code + '\n})', context)(requireStub, module, module.exports);
  return { analyzer: module.exports, calls, logs, detail() { return JSON.parse(JSON.stringify(logs[0][1])); } };
}

test('Analyzer HTTP failure logs only status and Google error fields, retaining error/schema/budget', async () => {
  const message = 'Invalid responseSchema.properties.evidence.items.properties.polarity.enum';
  const h = harness({ ok: false, status: 400, text: 'must not parse', data: { error: { code: 400, message, details: [apiKey, turn] }, responsePayload: 'private-response' } });
  await assert.rejects(h.analyzer.analyzeRelationshipEvidence(turn), /relationship_analyzer_unavailable/);
  assert.equal(h.logs.length, 1);
  assert.deepEqual(h.detail(), { status: 400, error: { code: 400, message } });
  const logged = JSON.stringify(h.logs);
  for (const value of [apiKey, turn.message, turn.reply, turn.requestId, 'private-response', 'details']) assert.ok(!logged.includes(value));
  assert.equal(h.calls.length, 1);
  assert.deepEqual(Array.from(h.calls[0].responseSchema.properties.evidence.items.properties.polarity.enum), [-1, 1]);
  assert.equal(h.calls[0].timeoutMs, 10000);
  assert.equal(h.calls[0].transientRetryDelaysMs.length, 0);
  assert.equal(h.calls[0].timeoutRetryDelaysMs.length, 0);
});
test('Analyzer text=null logs status with null Google error fields without response content', async () => {
  const h = harness({ ok: true, status: 200, text: null, data: { candidates: [], promptFeedback: { secret: turn.message } } });
  await assert.rejects(h.analyzer.analyzeRelationshipEvidence(turn), /relationship_analyzer_unavailable/);
  assert.deepEqual(h.detail(), { status: 200, error: { code: null, message: null } });
});
test('malformed Google error fields cannot log nested objects or full response', async () => {
  const h = harness({ ok: false, status: 500, text: null, data: { error: { code: { secret: apiKey }, message: { secret: turn.message } } } });
  await assert.rejects(h.analyzer.analyzeRelationshipEvidence(turn), /relationship_analyzer_unavailable/);
  assert.deepEqual(h.detail(), { status: 500, error: { code: null, message: null } });
});
test('provider messages that echo key or raw/JSON-escaped conversation text are redacted', async () => {
  const privateTurn = { ...turn, message: 'private-user-message\nnext"' };
  const message = `Invalid schema; key=${apiKey}; user=${JSON.stringify(privateTurn.message).slice(1, -1)}; reply=${turn.reply}`;
  const h = harness({ ok: false, status: 400, text: null, data: { error: { code: 400, message } } });
  await assert.rejects(h.analyzer.analyzeRelationshipEvidence(privateTurn), /relationship_analyzer_unavailable/);
  assert.deepEqual(h.detail(), { status: 400, error: { code: 400, message: 'Invalid schema; key=[REDACTED]; user=[REDACTED]; reply=[REDACTED]' } });
});
test('successful Analyzer emits no diagnostic log', async () => {
  const h = harness({ ok: true, status: 200, text: '{"evidence":[]}', data: { secret: apiKey } });
  assert.equal((await h.analyzer.analyzeRelationshipEvidence(turn)).length, 0);
  assert.equal(h.logs.length, 0);
});
test('critical validator failure uses the same allowlist without changing its error', async () => {
  const h = harness({ ok: false, status: 400, text: null, data: { error: { code: 400, message: 'Invalid validator schema' } } });
  await assert.rejects(h.analyzer.validateCriticalEvent(turn, 'romantic_acceptance', []), /relationship_validator_unavailable/);
  assert.equal(h.logs.length, 1);
  assert.deepEqual(h.detail(), { status: 400, error: { code: 400, message: 'Invalid validator schema' } });
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].timeoutMs, 10000);
  assert.equal(h.calls[0].transientRetryDelaysMs.length, 0);
  assert.equal(h.calls[0].timeoutRetryDelaysMs.length, 0);
});
test('successful critical validator emits no diagnostic log', async () => {
  const h = harness({ ok: true, status: 200, text: '{"confirmed":false,"supportingTurn":""}', data: null });
  assert.equal(await h.analyzer.validateCriticalEvent(turn, 'romantic_acceptance', []), false);
  assert.equal(h.logs.length, 0);
});
