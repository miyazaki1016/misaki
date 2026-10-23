import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Read the REAL source from the current checkout; no Gemini, DB or network calls.
// This extraction intentionally fails closed when the function changes shape.
const source = readFileSync(new URL('../lib/tokyo-life-events.ts', import.meta.url), 'utf8');
const functionStart = source.indexOf('export function createTokyoLifeEventsGuide(');
assert.ok(functionStart >= 0, 'createTokyoLifeEventsGuide must exist');
const segment = source.slice(functionStart);
const emptyBranch = segment.match(/if\s*\(\s*events\.length\s*===\s*0\s*\)\s*\{\s*return\s*`([\s\S]*?)`\.trim\(\);/);
assert.ok(emptyBranch, 'V0 empty-event template must match expected structure');
const v0 = emptyBranch[1].trim();
const v1 = '【東京の生活イベント】取得できた範囲では、会話で取り上げるべき大きなイベントは確認できていません。出来事や情報入手経路を想像して作らず、「何も起きていない」と断定しないでください。聞かれていなければ話題にする必要はありません。';
const bytes = text => Buffer.byteLength(text, 'utf8');

test('extracts actual empty-event V0 source (not a manual transcription)', () => {
  assert.match(v0, /東京のリアルな生活イベント/);
  assert.match(v0, /現在取得できている情報の範囲では/);
});
test('V0 contains explicit no-news-self-report examples', () => {
  assert.match(v0, /ニュースを見てない/);
  assert.match(v0, /詳しくは知らない/);
});
test('V0 contains an example response absent from V1', () => {
  assert.match(v0, /今のところ特に大きいのは聞いてないよ/);
  assert.doesNotMatch(v1, /今のところ特に大きいのは聞いてないよ/);
});
test('V1 preserves bounded-evidence and no-fabrication wording', () => {
  assert.match(v1, /取得できた範囲では/);
  assert.match(v1, /想像して作らず/);
});
test('V1 preserves no-event certainty and unsolicited-topic guards', () => {
  assert.match(v1, /断定しない/);
  assert.match(v1, /聞かれていなければ/);
});
test('V1 lacks explicit prohibition of pretending not to have read news', () => {
  assert.doesNotMatch(v1, /ニュースを見てない/);
});
test('V1 is smaller in UTF-8 bytes than extracted V0', () => {
  assert.ok(bytes(v1) < bytes(v0));
});
test('report extracted sizes without equating bytes to tokens', () => {
  assert.ok(bytes(v0) > 0 && bytes(v1) > 0);
  console.log(JSON.stringify({ source: 'lib/tokyo-life-events.ts', v0Bytes: bytes(v0), v1Bytes: bytes(v1), deltaBytes: bytes(v0) - bytes(v1), measuredGeminiTokens: null, measuredCost: null, safetyParity: 'unverified' }));
});
