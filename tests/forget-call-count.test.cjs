const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {harness}=require('./helpers/canonical-harness.cjs');
const {judge}=require('./forget-fixture.cjs');

// Count actual fetch invocations from the real route/common policy/persona store.
// Scripted responses give deterministic counts, not latency/cost measurements.
for(const withTraits of [false,true]) test(`Gemini Forget additions per chat path (traits=${withTraits})`,async t=>{
 const h=harness({realPersonaStore:true,personaTraits:withTraits?[{content:'猫が好き',strength:80}]:[]});h.setSemanticJudge(judge);
 h.rootState.memory=['弟の名前は隆紀','猫が好き'];
 h.rootState.history=[{role:'user',text:'弟の名前は隆紀',sentAt:'2026-01-01T00:00:00Z'}];
 h.rootState.today_memory={date:'',items:['猫が好き']};
 h.setOpenaiPayload({reply:'うん、そうなんだ😊',memory:['猫が好き'],misakiTodayMemory:{items:['猫が好き']}});
 async function measure(label,message){
  const start=h.geminiCalls.length;
  const response=await h.load('app/api/chat/route.ts').POST(h.request({message,requestId:randomUUID()}));assert.equal(response.status,200);
  const calls=h.geminiCalls.slice(start),tasks=calls.map(x=>x.task),extra=tasks.filter(x=>x!=='reply');
  t.diagnostic(JSON.stringify({label,withTraits,extra:extra.length,tasks}));return {extra,tasks};
 }
 assert.equal((await measure('ordinary-no-controls','今日は晴れてるね')).extra.length,0);
 // Restore target removed by the ordinary model candidate so forget can resolve it.
 h.rootState.memory=['弟の名前は隆紀','猫が好き'];
 const expected=withTraits?1:0;
 assert.equal((await measure('soft-forget','隆紀のことは忘れて')).extra.length,6+expected);
 assert.equal((await measure('ordinary-active','今日は晴れてるね')).extra.length,7+expected);
 assert.equal((await measure('reoffer','弟の隆紀がさ…')).extra.length,6+expected);
 assert.equal((await measure('affirmative','うん')).extra.length,4+expected);
});
