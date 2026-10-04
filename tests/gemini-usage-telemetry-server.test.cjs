const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function harness(failure) {
  const tasks = []; const inserts = []; const logs = [];
  const context = vm.createContext({ process: { env: { SUPABASE_SERVICE_ROLE_KEY: 'SERVER SECRET' } },
    console: { error: (...args) => logs.push(args) }, Promise, Object, Number, AbortSignal,
    fetch: () => { throw Error('not expected'); } });
  const module = { exports: {} };
  const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const pure = { exports: {} };
  vm.runInContext('(function(module,exports){' + compile('lib/gemini-usage-telemetry.ts') + '\n})', context)(pure, pure.exports);
  const req = name => {
    if (name === 'server-only') return {};
    if (name === 'next/server') return { after: task => { if (failure === 'schedule') throw Error('SECRET BODY'); tasks.push(task); } };
    if (name === './gemini-usage-telemetry') return pure.exports;
    if (name === '@supabase/supabase-js') return { createClient: (_url, key, options) => {
      assert.equal(key, 'SERVER SECRET'); assert.equal(options.auth.persistSession, false);
      return { from: table => { assert.equal(table, 'misaki_gemini_usage_telemetry'); return { insert: async row => {
        inserts.push(row);
        if (failure === 'throw') throw Error('PRIVATE PROMPT SECRET');
        return { error: failure === 'error' ? { message: 'PRIVATE RESPONSE SECRET' } : null };
      } }; } };
    } };
    throw Error(name);
  };
  vm.runInContext('(function(require,module,exports){' + compile('lib/gemini-usage-telemetry-server.ts') + '\n})', context)(req, module, module.exports);
  return { ...module.exports, ...pure.exports, tasks, inserts, logs };
}

const attempt = { model: 'gemini-3.1-flash-lite', attempt_no: 1, prompt_tokens: null, candidate_tokens: null,
  thoughts_tokens: null, total_tokens: null, cached_tokens: null, http_status: 503, success: false,
  latency_ms: 12, occurred_at: '2026-10-04T00:00:00Z', rawResponse: 'PRIVATE BODY' };

test('server sink schedules only allowlisted rows after the response, resolving retry usage there', async () => {
  const h = harness();
  for (const callKind of ['normal_reply', 'relationship_analyzer', 'critical_validator']) {
    h.createGeminiTelemetrySink(callKind, 'trusted-user', 'opaque-id')(attempt, Promise.resolve({
      prompt_tokens: 7, candidate_tokens: 0, thoughts_tokens: null, total_tokens: 7, cached_tokens: null,
    }));
  }
  assert.equal(h.inserts.length, 0);
  await Promise.all(h.tasks.map(task => task()));
  assert.deepEqual(h.inserts.map(row => row.call_kind), ['normal_reply', 'relationship_analyzer', 'critical_validator']);
  for (const row of h.inserts) { assert.equal(row.prompt_tokens, 7); assert.equal(row.thoughts_tokens, null); assert.doesNotMatch(JSON.stringify(row), /PRIVATE|SECRET/); }
});

test('write and scheduling failures are best effort and never log provider content or secrets', async () => {
  for (const failure of ['error', 'throw', 'schedule']) {
    const h = harness(failure);
    h.observeGeminiAttempt(h.createGeminiTelemetrySink('normal_reply', null, null), attempt);
    await Promise.all(h.tasks.map(task => task()));
    assert.ok(h.logs.length > 0);
    assert.ok(h.logs.every(args => JSON.stringify(args) === '["GEMINI TELEMETRY WRITE FAILED"]'));
  }
});
