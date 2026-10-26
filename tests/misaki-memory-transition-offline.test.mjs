import assert from 'node:assert/strict';
import {test} from 'node:test';
import {resolveMemoryTransitions,memoryMayBePresentedAsFuturePlan} from '../lib/conversation-engine/misaki-memory-transition-offline.mjs';
const r=(state,sequence,extras={})=>({id:'hakone',topic:'箱根旅行',verified:true,state,sequence,...extras});
test('cancelled plan is not a confirmed future promise',()=>{
 const result=resolveMemoryTransitions([r('confirmed',1),r('cancelled',2)]);
 assert.equal(result.memories[0].state,'cancelled');
 assert.equal(memoryMayBePresentedAsFuturePlan(result.memories[0]),false);
});
test('older record does not revive cancelled plan',()=>{
 const result=resolveMemoryTransitions([r('cancelled',3),r('confirmed',1)]);
 assert.equal(result.memories[0].state,'cancelled');
});
test('unverified newer records cannot overwrite',()=>{
 const result=resolveMemoryTransitions([r('confirmed',1),r('cancelled',2,{verified:false})]);
 assert.equal(result.memories[0].state,'confirmed');
 assert.ok(result.warnings.length>0);
});
test('equal-order conflict is suppressed',()=>{
 const result=resolveMemoryTransitions([r('confirmed',1),r('cancelled',1)]);
 assert.equal(result.memories.length,0);
 assert.ok(result.warnings.includes('ambiguous_same_sequence'));
});
test('mere consideration is not a confirmed plan',()=>{
 const result=resolveMemoryTransitions([r('planned',1)]);
 assert.equal(memoryMayBePresentedAsFuturePlan(result.memories[0]),false);
});
