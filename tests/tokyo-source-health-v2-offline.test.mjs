import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summarizeTokyoSources, TOKYO_SOURCE_IDS } from '../lib/conversation-engine/tokyo-source-health-v2-offline.mjs';
const ok = source => ({ source, requests: [{ state: 'success' }], events: [] });
const all = () => TOKYO_SOURCE_IDS.map(ok);
test('five completed empty sources are verified empty', () => {
  const x = summarizeTokyoSources(all());
  assert.equal(x.status, 'empty');
  assert.equal(x.completenessVerified, true);
});
test('rail skipped in Vercel is not verified empty', () => {
  const x = all();
  x[3] = { source: 'train', requests: [{ state: 'skipped' }], events: [] };
  const y = summarizeTokyoSources(x);
  assert.equal(y.status, 'partial');
  assert.equal(y.sources.train, 'skipped');
  assert.equal(y.completenessVerified, false);
});
test('Haneda domestic success and international failure is partial', () => {
  const x = all();
  x[4] = { source: 'haneda', requests: [{ state: 'success' }, { state: 'failure' }], events: [] };
  const y = summarizeTokyoSources(x);
  assert.equal(y.sources.haneda, 'partial');
  assert.equal(y.completenessVerified, false);
});
test('verified event remains visible despite partial failure', () => {
  const x = all();
  x[0].events = [{ type: 'earthquake', title: 'fixture' }];
  x[4] = { source: 'haneda', requests: [{ state: 'failure' }], events: [] };
  const y = summarizeTokyoSources(x);
  assert.equal(y.events.length, 1);
  assert.equal(y.status, 'partial');
});
test('all sources failed is unavailable', () => {
  const y = summarizeTokyoSources(TOKYO_SOURCE_IDS.map(source => ({source, requests:[{state:'failure'}], events:[]})));
  assert.equal(y.status, 'unavailable');
});
test('rejects missing source', () => assert.throws(() => summarizeTokyoSources(all().slice(1)), TypeError));
test('rejects duplicate source', () => assert.throws(() => summarizeTokyoSources(all().map(() => ok('train'))), TypeError));
test('rejects invented event on skipped source', () => {
  const x = all(); x[3] = {source:'train', requests:[{state:'skipped'}], events:[{type:'train'}]};
  assert.throws(() => summarizeTokyoSources(x), TypeError);
});
test('rejects unknown request state', () => {
  const x = all(); x[3].requests = [{state:'unknown'}];
  assert.throws(() => summarizeTokyoSources(x), TypeError);
});
