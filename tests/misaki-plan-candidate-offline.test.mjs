import assert from 'node:assert/strict';
import {test} from 'node:test';
import {classifyPlanCandidate} from '../lib/conversation-engine/misaki-plan-candidate-offline.mjs';
const cases=[
 ['来週、箱根に行こうかな','planned'],
 ['やっぱり行くことにした！','confirmed'],
 ['ごめん、今回は中止にする','cancelled'],
 ['箱根に行ってきた','completed'],
];
test('clear utterances become unverified candidates only',()=>{
 for(const [text,state] of cases){
  const result=classifyPlanCandidate(text);
  assert.equal(result.state,state);assert.equal(result.review,true);
 }
});
test('negation, quotation, question and mixed state require review',()=>{
 for(const text of ['箱根には行かないかも','友達が予約したらしい',
   '予約した？','中止したけど、やっぱり行くことにした',
   '箱根に行くことにしてない','今日は疲れた']){
  const result=classifyPlanCandidate(text);
  assert.equal(result.state,null,text);assert.equal(result.review,true);
 }
});
