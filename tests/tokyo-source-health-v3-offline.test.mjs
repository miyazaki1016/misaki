import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summarizeTokyoSourcesStrict, REQUIRED_REQUESTS } from '../lib/conversation-engine/tokyo-source-health-v3-offline.mjs';
const ok = source => ({ source, requests: REQUIRED_REQUESTS[source].map(id => ({ id, state: 'success' })), events: [] });
const all = () => Object.keys(REQUIRED_REQUESTS).map(ok);
test('all required subrequests succeeded with no events', () => {
  const x = summarizeTokyoSourcesStrict(all());
  assert.equal(x.status, 'empty'); assert.equal(x.completenessVerified, true);
});
test('missing Haneda international request is rejected', () => {
  const x = all(); x[4].requests = [{id:'domestic',state:'success'}];
  assert.throws(() => summarizeTokyoSourcesStrict(x), TypeError);
});
test('duplicate Haneda domestic request is rejected', () => {
  const x = all(); x[4].requests = [{id:'domestic',state:'success'},{id:'domestic',state:'success'}];
  assert.throws(() => summarizeTokyoSourcesStrict(x), TypeError);
});
test('unknown Haneda request is rejected', () => {
  const x = all(); x[4].requests = [{id:'domestic',state:'success'},{id:'other',state:'success'}];
  assert.throws(() => summarizeTokyoSourcesStrict(x), TypeError);
});
test('partial Haneda success does not claim complete coverage', () => {
  const x = all(); x[4].requests[1].state = 'failure';
  const y = summarizeTokyoSourcesStrict(x);
  assert.equal(y.sources.haneda,'partial'); assert.equal(y.completenessVerified,false);
});
test('rail intentionally skipped is not verified complete', () => {
  const x = all(); x[3].requests[0].state = 'skipped';
  const y = summarizeTokyoSourcesStrict(x);
  assert.equal(y.sources.train,'skipped'); assert.equal(y.status,'partial');
});
test('verified earthquake is preserved when Haneda failed', () => {
  const x = all(); x[0].events = [{type:'earthquake',title:'fixture'}];
  x[4].requests[0].state = 'failure'; x[4].requests[1].state = 'failure';
  const y = summarizeTokyoSourcesStrict(x);
  assert.equal(y.events.length,1); assert.equal(y.status,'partial');
});
test('events without successful requests are rejected', () => {
  const x = all(); x[3].requests[0].state = 'skipped'; x[3].events = [{type:'train'}];
  assert.throws(() => summarizeTokyoSourcesStrict(x), TypeError);
});
test('duplicate source is rejected', () => {
  const x = all(); x[4] = ok('train');
  assert.throws(() => summarizeTokyoSourcesStrict(x), TypeError);
});
test('missing source is rejected', () => assert.throws(() => summarizeTokyoSourcesStrict(all().slice(1)), TypeError));
