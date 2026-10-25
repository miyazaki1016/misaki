import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summarizeTokyoThreeStageHealth as run } from '../lib/conversation-engine/tokyo-three-stage-health-offline.mjs';
import { REQUIRED_REQUESTS } from '../lib/conversation-engine/tokyo-source-health-v3-offline.mjs';
const fixture = () => ({
  sources: Object.entries(REQUIRED_REQUESTS).map(([source,ids])=>({source,requests:ids.map(id=>({id,state:'success'})),events:[]})),
  candidates: ['earthquake','warning'].map(source=>({source,feedState:'success',candidates:[],decisions:[]})),
  details: ['earthquake','warning'].map(source=>({source,discovered:[],outcomes:[]}))
});
test('empty complete feeds with empty details are exhaustive',()=>{
  const x=run(fixture()); assert.equal(x.status,'empty'); assert.equal(x.completenessVerified,true);
});
test('selected candidate with successful detail is exhaustive',()=>{
  const x=fixture(); x.candidates[0].candidates=['a']; x.candidates[0].decisions=[{id:'a',reason:'selected'}];
  x.details[0].discovered=['a']; x.details[0].outcomes=[{id:'a',state:'success'}];
  assert.equal(run(x).completenessVerified,true);
});
test('selected candidate missing detail rejected',()=>{
  const x=fixture(); x.candidates[0].candidates=['a']; x.candidates[0].decisions=[{id:'a',reason:'selected'}];
  assert.throws(()=>run(x),TypeError);
});
test('extra detail not selected rejected',()=>{
  const x=fixture(); x.details[0].discovered=['a']; x.details[0].outcomes=[{id:'a',state:'success'}];
  assert.throws(()=>run(x),TypeError);
});
test('unrecorded candidate decision prevents completeness',()=>{
  const x=fixture(); x.candidates[0].candidates=['a'];
  assert.equal(run(x).completenessVerified,false);
});
test('cap reached is explicitly not exhaustive',()=>{
  const x=fixture(); x.candidates[0].candidates=['a']; x.candidates[0].decisions=[{id:'a',reason:'cap_reached'}];
  const y=run(x); assert.equal(y.completenessVerified,false); assert.equal(y.coverage.earthquake.blocked,1);
});
test('failed detail prevents completeness',()=>{
  const x=fixture(); x.candidates[0].candidates=['a']; x.candidates[0].decisions=[{id:'a',reason:'selected'}];
  x.details[0].discovered=['a']; x.details[0].outcomes=[{id:'a',state:'failure'}];
  assert.equal(run(x).completenessVerified,false);
});
test('feed failure must match candidate feed state',()=>{
  const x=fixture(); x.sources[0].requests[0].state='failure';
  assert.throws(()=>run(x),TypeError);
});
test('duplicate candidate source rejected',()=>{
  const x=fixture(); x.candidates[1].source='earthquake';
  assert.throws(()=>run(x),TypeError);
});
test('rail skipped prevents completeness even with complete JMA',()=>{
  const x=fixture(); x.sources[3].requests[0].state='skipped';
  assert.equal(run(x).completenessVerified,false);
});
