import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auditDynamicDetails as audit } from '../lib/conversation-engine/tokyo-dynamic-detail-health-offline.mjs';
const input = (discovered, outcomes, source='earthquake') => ({source, discovered, outcomes});
test('no discovered details is complete for this stage only', () => {
  const x=audit(input([],[])); assert.equal(x.complete,true); assert.equal(x.discoveredCount,0);
});
test('all discovered details successful', () => {
  const x=audit(input(['a','b'],[{id:'a',state:'success'},{id:'b',state:'success'}]));
  assert.equal(x.complete,true); assert.equal(x.succeeded,2);
});
test('one detail failure makes result partial', () => {
  const x=audit(input(['a','b'],[{id:'a',state:'success'},{id:'b',state:'failure'}]));
  assert.equal(x.status,'partial'); assert.equal(x.complete,false);
});
test('one skipped detail makes result partial', () => {
  const x=audit(input(['a','b'],[{id:'a',state:'success'},{id:'b',state:'skipped'}]));
  assert.equal(x.status,'partial');
});
test('all details failed is unavailable', () => {
  assert.equal(audit(input(['a'],[{id:'a',state:'failure'}])).status,'unavailable');
});
test('missing discovered outcome is rejected', () => {
  assert.throws(()=>audit(input(['a','b'],[{id:'a',state:'success'}])),TypeError);
});
test('unknown detail outcome is rejected', () => {
  assert.throws(()=>audit(input(['a'],[{id:'z',state:'success'}])),TypeError);
});
test('duplicate discovered id is rejected', () => {
  assert.throws(()=>audit(input(['a','a'],[{id:'a',state:'success'}])),TypeError);
});
test('duplicate outcome is rejected', () => {
  assert.throws(()=>audit(input(['a'],[{id:'a',state:'success'},{id:'a',state:'success'}])),TypeError);
});
test('warning source accepted; unknown source rejected', () => {
  assert.equal(audit(input(['a'],[{id:'a',state:'success'}],'warning')).complete,true);
  assert.throws(()=>audit(input([],[],'train')),TypeError);
});
