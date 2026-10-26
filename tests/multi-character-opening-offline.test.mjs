import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createOpeningState,advanceOpening,mayEnterChat,openingCopy} from '../lib/conversation-engine/multi-character-opening-offline.mjs';
test('skipping cinematic does not falsely complete model loading',()=>{
 let s=createOpeningState({characterId:'misaki',modelKey:'shared-embedding-v1'});
 s=advanceOpening(s,{type:'progress',value:35});
 s=advanceOpening(s,{type:'skip'});
 assert.equal(s.skipped,true);assert.equal(mayEnterChat(s),false);
 s=advanceOpening(s,{type:'model-ready'});
 assert.equal(mayEnterChat(s),true);
});
test('different characters can reuse the same model without sharing identity',()=>{
 const a=createOpeningState({characterId:'misaki',modelKey:'shared-embedding-v1'});
 const b=createOpeningState({characterId:'other',modelKey:'shared-embedding-v1',modelReady:true});
 assert.equal(a.modelKey,b.modelKey);assert.notEqual(a.characterId,b.characterId);
 assert.equal(mayEnterChat(b),true);
});
test('progress is bounded and failure has retry state',()=>{
 let s=createOpeningState({characterId:'misaki',modelKey:'model'});
 s=advanceOpening(s,{type:'progress',value:300});
 assert.equal(s.progress,100);assert.equal(mayEnterChat(s),false);
 s=advanceOpening(s,{type:'model-error',message:'offline'});
 assert.match(openingCopy(s,'美咲').status,/失敗/);
 s=advanceOpening(s,{type:'retry'});assert.equal(s.error,null);
});
