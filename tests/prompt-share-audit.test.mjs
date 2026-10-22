import assert from 'node:assert/strict';
import test from 'node:test';
import {measurePromptShare,exampleSyntheticTurn} from '../lib/conversation-engine/prompt-share-audit.mjs';

test('selected sections sum exactly and shares near 100 percent', () => {
  const r=measurePromptShare(exampleSyntheticTurn({historyTurns:20}));
  assert.equal(r.totalBytes,Object.values(r.categoryBytes).reduce((a,b)=>a+b,0));
  assert.ok(Math.abs(r.categories.reduce((a,b)=>a+b.sharePercent,0)-100)<0.1);
});
test('history share rises as number of synthetic turns increases', () => {
  const short=measurePromptShare(exampleSyntheticTurn({historyTurns:2}));
  const long=measurePromptShare(exampleSyntheticTurn({historyTurns:60}));
  assert.ok(long.categoryBytes.history>short.categoryBytes.history);
  assert.ok(long.categories.find(x=>x.category==='history').sharePercent>short.categories.find(x=>x.category==='history').sharePercent);
});
test('optional external section does not remove protected sections', () => {
  const a=measurePromptShare(exampleSyntheticTurn({includeExternal:true}));
  const b=measurePromptShare(exampleSyntheticTurn({includeExternal:false}));
  assert.equal(b.categoryBytes.external,0);
  for (const category of ['persona','relationship','memory','history','scaffold']) assert.equal(a.categoryBytes[category],b.categoryBytes[category]);
  assert.equal(a.totalBytes-b.totalBytes,a.categoryBytes.external);
});
test('no false Gemini usage or source parity claim',()=>{
  const r=measurePromptShare(exampleSyntheticTurn());
  assert.equal(r.actualGeminiTokens,null);assert.equal(r.actualApiCost,null);assert.equal(r.productionParityEstablished,false);
});
test('rejects malformed, duplicate and unapproved classifications',()=>{
  assert.throws(()=>measurePromptShare([]),/SECTIONS_REQUIRED/);
  assert.throws(()=>measurePromptShare([{key:'x',category:'secret',text:'value',selected:true}]),/INVALID_SECTION/);
  assert.throws(()=>measurePromptShare([{key:'x',category:'memory',text:'ok',selected:true},{key:'x',category:'memory',text:'ok',selected:true}]),/INVALID_SECTION/);
  assert.throws(()=>measurePromptShare([{key:'x',category:'history',text:'ok'}]),/INVALID_SECTION/);
});
test('rejects unsupported history sizes',()=>{
  assert.throws(()=>exampleSyntheticTurn({historyTurns:61}),/INVALID_HISTORY_COUNT/);
});
