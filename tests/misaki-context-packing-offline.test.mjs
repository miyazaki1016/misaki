import assert from 'node:assert/strict';
import {test} from 'node:test';
import {packMisakiContext, estimateContextSize} from '../lib/conversation-engine/misaki-context-packing-offline.mjs';
test('recent chat content remains verbatim', () => {
  const content='でも最後にいいのが来た🤭\n  そうそう';
  const packed=packMisakiContext({recentTurns:[{role:'user',content}]});
  assert.equal(packed.recentTurns[0].content,content);
});
test('unverified memory and unrelated events never enter payload', () => {
  const packed=packMisakiContext({memory:[{verified:false,fact:'guess'},{verified:true,fact:'known'}],
    events:[{selected:false,detail:'unrelated'},{selected:true,detail:'related',status:'failed'}]});
  assert.deepEqual(packed.memory.map(x=>x.fact),['known']);
  assert.deepEqual(packed.events.map(x=>x.detail),['related']);
  assert.equal(packed.events[0].status,'failed');
});
test('old turns are excluded without rewriting recent turns', () => {
  const packed=packMisakiContext({recentTurns:Array.from({length:30},(_,i)=>({role:'user',content:String(i)}))});
  assert.equal(packed.recentTurns.length,16);
  assert.equal(packed.recentTurns[0].content,'14');
  assert.equal(packed.recentTurns.at(-1).content,'29');
});
test('compact selected inputs are smaller than raw verbose candidates', () => {
  const events=Array.from({length:20},(_,i)=>({selected:i===0,type:'haneda',detail:'運航に乱れ'.repeat(50),
    observedAt:'2026-10-26T10:00:00+09:00',source:'official',status:'ok'}));
  const packed=packMisakiContext({events});
  assert.ok(estimateContextSize(packed)<estimateContextSize(events));
});
