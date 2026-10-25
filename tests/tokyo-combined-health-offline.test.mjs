import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summarizeTokyoCombinedHealth as combine } from '../lib/conversation-engine/tokyo-combined-health-offline.mjs';
import { REQUIRED_REQUESTS } from '../lib/conversation-engine/tokyo-source-health-v3-offline.mjs';
const all = () => Object.entries(REQUIRED_REQUESTS).map(([source,ids])=>({
  source, requests:ids.map(id=>({id,state:'success'})), events:[]
}));
const details = () => ['earthquake','warning'].map(source=>({source,discovered:[],outcomes:[]}));
test('all sources and empty discovered details verified',()=>{
  const x=combine({sources:all(),details:details()});
  assert.equal(x.status,'empty'); assert.equal(x.completenessVerified,true);
});
test('one discovered earthquake detail fails despite all feeds succeeding',()=>{
  const d=details(); d[0].discovered=['a']; d[0].outcomes=[{id:'a',state:'failure'}];
  const x=combine({sources:all(),details:d});
  assert.equal(x.completenessVerified,false); assert.equal(x.status,'partial');
});
test('missing detail outcome rejected',()=>{
  const d=details(); d[0].discovered=['a'];
  assert.throws(()=>combine({sources:all(),details:d}),TypeError);
});
test('Haneda missing international rejected',()=>{
  const s=all(); s[4].requests.pop();
  assert.throws(()=>combine({sources:s,details:details()}),TypeError);
});
test('rail skipped prevents verified complete',()=>{
  const s=all(); s[3].requests[0].state='skipped';
  assert.equal(combine({sources:s,details:details()}).completenessVerified,false);
});
test('unavailable earthquake feed cannot claim discovered details',()=>{
  const s=all(); s[0].requests[0].state='failure';
  const d=details(); d[0].discovered=['a']; d[0].outcomes=[{id:'a',state:'success'}];
  assert.throws(()=>combine({sources:s,details:d}),TypeError);
});
test('missing warning detail audit rejected',()=>{
  assert.throws(()=>combine({sources:all(),details:details().slice(1)}),TypeError);
});
test('duplicate earthquake detail audit rejected',()=>{
  const d=details(); d[1].source='earthquake';
  assert.throws(()=>combine({sources:all(),details:d}),TypeError);
});
