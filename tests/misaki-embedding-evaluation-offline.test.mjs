import assert from 'node:assert/strict';
import {test} from 'node:test';
import {evaluateTopicEmbeddings} from '../lib/conversation-engine/misaki-embedding-evaluation-offline.mjs';
test('returns abstention for equal embeddings',async()=>{
 const result=await evaluateTopicEmbeddings(async()=>[1,0],{cases:[{id:'ambiguous',history:['a','b'],message:'x',goldTopic:null,ambiguous:true}]});
 assert.equal(result.results[0].prediction,null);
 assert.equal(result.correct,1);
});
test('selects clearly closest embedding',async()=>{
 const vectors={a:[1,0],b:[0,1],x:[0.99,0.01]};
 const result=await evaluateTopicEmbeddings(async text=>vectors[text],{cases:[{id:'clear',history:['a','b'],message:'x',goldTopic:0,ambiguous:false}]});
 assert.equal(result.results[0].prediction,0);
});
