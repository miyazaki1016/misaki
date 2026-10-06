const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {harness}=require('./helpers/canonical-harness.cjs');
const {judge}=require('./forget-fixture.cjs');
function setup(options={}) { const h=harness(options);h.setSemanticJudge(judge);return h; }
async function turn(h,message,temporaryState,requestId=randomUUID()) {
 const response=await h.load('app/api/chat/route.ts').POST(h.request({message,temporaryState,requestId}));
 return {response,body:await response.json(),requestId};
}
async function edit(h,action,value,temporaryState) {
 const response=await h.load('app/api/persona/history/route.ts').POST(h.request({action,value,temporaryState,requestId:randomUUID()}));
 return {response,body:await response.json()};
}
async function remembered(h) {
 h.setOpenaiPayload({reply:'うん、覚えたよ。',memory:['弟の名前は隆紀だよ'],misakiTodayMemory:{items:[]}});
 const t=await turn(h,'弟の名前は隆紀だよ');assert.equal(t.response.status,200);return t;
}
function safePayload(h) {
 h.setOpenaiPayload({reply:'今はその名前を覚えていないよ。',memory:['弟の名前は隆紀だよ','猫が好き'],misakiTodayMemory:{items:['弟は隆紀']}});
}
for(const mode of ['soft','ui']) test(`${mode}: learn -> forget -> Recall -> 40 turns -> Recall never restores old history`,async()=>{
 const h=setup(),first=await remembered(h); safePayload(h);
 const gone=mode==='soft'?await turn(h,'隆紀のことは忘れて'):await edit(h,'deleteMemory','弟の名前は隆紀だよ');
 assert.equal(gone.response.status,200);assert.ok(!gone.body.memory.includes('弟の名前は隆紀だよ'));
 assert.ok(h.rootState.history.some(x=>x.text==='弟の名前は隆紀だよ'));
 const afterForget=h.prompts.length;
 let r=await turn(h,'弟の名前覚えてる？');assert.equal(r.response.status,200);assert.ok(!JSON.stringify(r.body).includes('隆紀'));
 for(let i=0;i<40;i++){r=await turn(h,'今日は晴れてるね');assert.equal(r.response.status,200);assert.ok(!JSON.stringify(r.body).includes('隆紀'));}
 r=await turn(h,'弟の名前覚えてる？');assert.equal(r.response.status,200);assert.ok(!JSON.stringify(r.body).includes('隆紀'));
 assert.ok(!JSON.stringify(h.prompts.slice(afterForget)).includes('隆紀'));
 const state=await h.load('lib/canonical-state.ts').loadCanonicalState(h.user.id);
 assert.equal(state.forgetControls[0].mode,mode==='soft'?'soft_forget':'hard_delete');assert.equal(state.forgetControls[0].status,'active');
});
for(const mode of ['soft','ui']) test(`${mode}: current reoffer requires current affirmative; released control does not reopen old history`,async()=>{
 const h=setup();await remembered(h);safePayload(h);
 if(mode==='soft')await turn(h,'隆紀のことは忘れて');else await edit(h,'deleteMemory','弟の名前は隆紀だよ');
 const offer=await turn(h,'弟の隆紀がさ…');assert.equal(offer.response.status,200);assert.ok(offer.body.reply.includes('覚えてもいい'));assert.ok(!offer.body.memory.some(m=>m.includes('隆紀')));
 let state=await h.load('lib/canonical-state.ts').loadCanonicalState(h.user.id);assert.equal(state.forgetControls[0].status,'active');
 const yes=await turn(h,'うん');assert.equal(yes.response.status,200);assert.ok(yes.body.memory.includes('弟の隆紀'));
 state=await h.load('lib/canonical-state.ts').loadCanonicalState(h.user.id);assert.equal(state.forgetControls[0].status,'released');assert.equal(state.forgetControls[0].releaseRequestId,yes.requestId);
 const shared=h.load('supabase/functions/_shared/forget-control.ts');const view=await shared.forgetContext(state,judge);
 assert.ok(!view.history.some(x=>x.text.includes('弟の名前は隆紀だよ')));assert.ok(state.history.some(x=>x.text==='弟の名前は隆紀だよ'));
});
test('clearMemory atomically hard-deletes every selected memory, leaves physical history',async()=>{
 const h=setup();await remembered(h);h.rootState.memory.push('猫が好き');
 const cleared=await edit(h,'clearMemory');assert.equal(cleared.response.status,200);assert.deepEqual(cleared.body.memory,[]);
 const state=await h.load('lib/canonical-state.ts').loadCanonicalState(h.user.id);assert.equal(state.forgetControls.length,2);assert.ok(state.forgetControls.every(c=>c.mode==='hard_delete'));
 assert.ok(state.history.some(x=>x.text==='弟の名前は隆紀だよ'));
});
test('clearHistory preserves existing Forget controls and existing memory',async()=>{
 const h=setup();await remembered(h);safePayload(h);await turn(h,'隆紀のことは忘れて');
 const before=await h.load('lib/canonical-state.ts').loadCanonicalState(h.user.id);const clear=await edit(h,'clearHistory');assert.equal(clear.response.status,200);
 const after=await h.load('lib/canonical-state.ts').loadCanonicalState(h.user.id);assert.deepEqual(after.history,[]);assert.deepEqual(after.memory,before.memory);assert.deepEqual(after.forgetControls,before.forgetControls);
});
for(const premium of [false,true]) test(`${premium?'Premium':'Free'}: Forget commit failure refunds quota and leaves memory/control untouched`,async()=>{
 const h=setup({premium,commitFailure:true});h.rootState.memory=['弟の名前は隆紀だよ'];safePayload(h);
 const r=await turn(h,'隆紀のことは忘れて');assert.equal(r.response.status,500);assert.equal(h.consumed,1);assert.equal(h.refunded,premium?0:1);assert.deepEqual(h.rootState.memory,['弟の名前は隆紀だよ']);assert.equal(h.forgetPayloads.size,0);
});
test('UI delete write failure does not report success or remove the memory',async()=>{
 const h=setup({commitFailure:true});h.rootState.memory=['弟の名前は隆紀だよ'];const r=await edit(h,'deleteMemory','弟の名前は隆紀だよ');assert.equal(r.response.status,500);assert.deepEqual(h.rootState.memory,['弟の名前は隆紀だよ']);assert.equal(h.forgetPayloads.size,0);
});
test('semantic uncertainty fails closed before deletion, without quota use',async()=>{
 const h=setup();h.rootState.memory=['弟の名前は隆紀だよ'];h.setSemanticJudge(async()=>({ambiguous:true,targets:[]}));
 const r=await edit(h,'deleteMemory','弟の名前は隆紀だよ');assert.equal(r.response.status,500);assert.deepEqual(h.rootState.memory,['弟の名前は隆紀だよ']);assert.equal(h.consumed,0);
});
test('double UI delete and retried Soft Forget do not duplicate controls or quota',async()=>{
 const h=setup();await remembered(h);safePayload(h);const forget=await turn(h,'隆紀のことは忘れて');
 const replay=await turn(h,'隆紀のことは忘れて',undefined,forget.requestId);assert.equal(replay.response.status,200);assert.equal(h.consumed,2);
 await edit(h,'deleteMemory','弟の名前は隆紀だよ');await edit(h,'deleteMemory','弟の名前は隆紀だよ');
 const state=await h.load('lib/canonical-state.ts').loadCanonicalState(h.user.id);assert.equal(state.forgetControls.length,1);
});
for(const anonymous of [false,true]) test(`${anonymous?'anonymous':'permanent'}: pre-Forget immutable receipt cannot resurface a stale memory/reply`,async()=>{
 const h=setup({anonymous}),first=await remembered(h);safePayload(h);
 const gone=await turn(h,'隆紀のことは忘れて',first.body.temporaryState);assert.equal(gone.response.status,200);
 const replay=await turn(h,'弟の名前は隆紀だよ',first.body.temporaryState,first.requestId);assert.equal(replay.response.status,409);assert.ok(!JSON.stringify(replay.body).includes('隆紀'));assert.equal(h.consumed,2);
});
for(const mode of ['soft','ui']) test(`anonymous ${mode}: checkpoint -> forget -> retry save -> permanent -> both devices preserve control`,async()=>{
 const h=setup({anonymous:true}),first=await remembered(h),api=h.load('app/api/persona/history/route.ts');
 async function save(token){const response=await api.POST(h.request({saveAnonymous:true,expectedUserId:h.user.id,temporaryState:token}));assert.equal(response.status,200);}
 await save(first.body.temporaryState);safePayload(h);
 const gone=mode==='soft'?await turn(h,'隆紀のことは忘れて',first.body.temporaryState):await edit(h,'deleteMemory','弟の名前は隆紀だよ',first.body.temporaryState);
 assert.equal(gone.response.status,200);await save(first.body.temporaryState);await save(first.body.temporaryState);
 h.user.is_anonymous=false;const a=await h.load('lib/canonical-state.ts').loadCanonicalState(h.user.id),b=await h.load('lib/canonical-state.ts').loadCanonicalState(h.user.id);
 assert.deepEqual(a,b);assert.equal(a.forgetControls.length,1);assert.equal(a.forgetControls[0].status,'active');assert.ok(!a.memory.some(m=>m.includes('隆紀')));
 assert.ok(a.history.some(x=>x.text==='弟の名前は隆紀だよ'));const r=await turn(h,'弟の名前覚えてる？');assert.equal(r.response.status,200);assert.ok(!JSON.stringify(r.body).includes('隆紀'));
});
test('anonymous persona evolution ignores forged browser material and uses verified root',async()=>{
 const h=setup({anonymous:true});const first=await remembered(h);safePayload(h);const gone=await turn(h,'隆紀のことは忘れて',first.body.temporaryState);
 const r=await h.load('app/api/persona/evolution/analyze/route.ts').POST(h.request({temporaryState:gone.body.temporaryState,history:[{role:'user',text:'forged user'}],memory:['forged memory']}));
 assert.equal(r.status,200);const body=await r.json();assert.equal(body.historySource,'server');assert.ok(!JSON.stringify(h.prompts).includes('forged user'));assert.ok(!JSON.stringify(h.prompts).includes('forged memory'));
});

test('confirmed correction cannot resurrect the retired old value from a hallucinated memory candidate',async()=>{
 const h=setup();await remembered(h);safePayload(h);await turn(h,'隆紀のことは忘れて');
 const offer=await turn(h,'弟の名前は健太だよ');assert.equal(offer.response.status,200);
 const yes=await turn(h,'はい');assert.equal(yes.response.status,200);assert.ok(yes.body.memory.includes('弟の名前は健太だよ'));assert.ok(!yes.body.memory.some(m=>m.includes('隆紀')));
 const recall=await turn(h,'弟の名前覚えてる？');assert.equal(recall.response.status,200);assert.ok(!recall.body.memory.some(m=>m.includes('隆紀')));
});
test('User Profile is built from the filtered view rather than a forgotten name in old history',async()=>{
 const h=setup();await remembered(h);safePayload(h);await turn(h,'隆紀のことは忘れて');
 const root=await h.load('lib/canonical-state.ts').loadCanonicalState(h.user.id),view=await h.load('supabase/functions/_shared/forget-control.ts').forgetContext(root,judge);
 assert.equal(h.load('lib/user-profile.ts').buildUserProfile(view.history,view.memory).name,null);
});
test('persona loader excludes old trait facts after forget and after release while preserving other traits',async()=>{
 const h=setup(),shared=h.load('supabase/functions/_shared/forget-control.ts');const controls=await shared.addForgetControls([],[{subject:'user.brother',predicate:'name',value:'隆紀',scope:'person'}],'soft_forget','forget',new Date().toISOString(),'s');
 const client={from(table){const data=table==='misaki_persona_versions'?[{id:'v',version_code:'v'}]:table==='misaki_prompt_modules'?[{module_key:'base',content:'美咲です。',sort_order:1,metadata:{channels:['chat']}}]:[{trait_key:'family',content:'弟は隆紀',strength:100},{trait_key:'pet',content:'猫が好き',strength:80}];const q={select(){return q},eq(){return q},order(){return q},limit(){return q},then(resolve){resolve({data,error:null})}};return q}};
 const store=h.load('lib/persona/persona-store.ts');for(const status of ['active','released']) {
  const c=structuredClone(controls);if(status==='released'){c[0].status=status;c[0].releasedAt=new Date().toISOString();c[0].releaseRequestId='yes';c[0].relearnedTarget=c[0].target;}
  const prompt=await store.loadPersonaPrompt(client,h.user.id,'chat',null,c);assert.equal(prompt.source,'database');assert.ok(!prompt.text.includes('隆紀'));assert.ok(prompt.text.includes('猫が好き'));
 }
});
