import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aggregateTokyoSourceResults, TOKYO_SOURCES } from '../lib/conversation-engine/tokyo-source-health-offline.mjs';
import { classifyTokyoEventResult } from '../lib/conversation-engine/tokyo-event-result-state.mjs';

const ok = source => ({ source, status: 'fulfilled', events: [] });
const fail = source => ({ source, status: 'rejected' });
test('five successful empty sources means verified empty', () => {
  const x = classifyTokyoEventResult(aggregateTokyoSourceResults(TOKYO_SOURCES.map(ok)));
  assert.equal(x.status, 'empty');
});
test('one failed source means unavailable even when others return []', () => {
  const x = classifyTokyoEventResult(aggregateTokyoSourceResults(TOKYO_SOURCES.map(s => s === 'train' ? fail(s) : ok(s))));
  assert.equal(x.status, 'unavailable');
});
test('one verified event and one failed source means partial', () => {
  const outcomes = TOKYO_SOURCES.map(ok);
  outcomes[0].events = [{ type: 'earthquake', title: 'synthetic' }];
  outcomes[1] = fail(TOKYO_SOURCES[1]);
  const x = classifyTokyoEventResult(aggregateTokyoSourceResults(outcomes));
  assert.equal(x.status, 'partial');
  assert.equal(x.events.length, 1);
});
test('rejects missing source', () => assert.throws(() => aggregateTokyoSourceResults(TOKYO_SOURCES.slice(1).map(ok)), TypeError));
test('rejects duplicate source', () => assert.throws(() => aggregateTokyoSourceResults(TOKYO_SOURCES.map(() => ok('train'))), TypeError));
test('rejects malformed fulfilled result', () => assert.throws(() => aggregateTokyoSourceResults(TOKYO_SOURCES.map(s => s === 'train' ? {source:s,status:'fulfilled'} : ok(s))), TypeError));
test('rejects rejected result with fabricated events', () => assert.throws(() => aggregateTokyoSourceResults(TOKYO_SOURCES.map(s => s === 'train' ? {source:s,status:'rejected',events:[]} : ok(s))), TypeError));
