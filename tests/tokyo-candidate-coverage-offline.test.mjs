import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auditTokyoCandidateCoverage as audit } from '../lib/conversation-engine/tokyo-candidate-coverage-offline.mjs';
const run = (candidates,decisions,source='earthquake',feedState='success') =>
  audit({source,feedState,candidates,decisions});
test('zero candidates from successful feed is stage-complete',()=>{
  assert.equal(run([],[]).complete,true);
});
test('every selected candidate recorded',()=>{
  const x=run(['a','b'],[{id:'a',reason:'selected'},{id:'b',reason:'selected'}]);
  assert.equal(x.complete,true); assert.equal(x.selected,2);
});
test('filtered and missing-link candidates are explicitly recorded',()=>{
  const x=run(['a','b'],[{id:'a',reason:'filtered'},{id:'b',reason:'no_link'}],'warning');
  assert.equal(x.ignored,2); assert.equal(x.complete,true);
});
test('cap reached remains visible rather than disappearing',()=>{
  const x=run(['a','b'],[{id:'a',reason:'selected'},{id:'b',reason:'cap_reached'}]);
  assert.equal(x.blocked,1); assert.equal(x.complete,true);
});
test('missing decision marks incomplete',()=>{
  const x=run(['a','b'],[{id:'a',reason:'selected'}]);
  assert.equal(x.complete,false); assert.deepEqual(x.missing,['b']);
});
test('failed feed is unavailable not verified empty',()=>{
  const x=run([],[],'earthquake','failure');
  assert.equal(x.complete,false); assert.equal(x.status,'unavailable');
});
test('failed feed with candidates rejected',()=>{
  assert.throws(()=>run(['a'],[],'earthquake','failure'),TypeError);
});
test('duplicate candidate rejected',()=>{
  assert.throws(()=>run(['a','a'],[]),TypeError);
});
test('unknown decision rejected',()=>{
  assert.throws(()=>run(['a'],[{id:'z',reason:'selected'}]),TypeError);
});
test('duplicate decision rejected',()=>{
  assert.throws(()=>run(['a'],[{id:'a',reason:'selected'},{id:'a',reason:'filtered'}]),TypeError);
});
