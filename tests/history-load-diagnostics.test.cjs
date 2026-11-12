const {test}=require('node:test');
const assert=require('node:assert/strict');
const {harness}=require('./server-canonical.test.cjs');
const fs=require('node:fs');
async function turn(h,message='synthetic-new-turn',token){
 const r=await h.load('app/api/chat/route.ts').POST(h.request({message,temporaryState:token}));
 assert.equal(r.status,200);return r.json();
}
for(const reason of ['expired','unverifiable']) test(`history load ${reason}: classified failure, no state reset/renewal or generation`,async()=>{
 const h=harness({anonymous:true});await turn(h);
 const root=h.temporaryRoots.get(h.user.id);
 if(reason==='expired') root.expires_at=new Date(0).toISOString();else root.token='synthetic-corruption';
 const before=JSON.stringify(root),count=h.calls.length,generation=h.generated;
 const r=await h.load('app/api/persona/history/route.ts').POST(h.request({action:'load'}));
 assert.equal(r.status,reason==='expired'?410:409);
 assert.equal(r.headers.get('cache-control'),'no-store');
 const data=await r.json();assert.equal(data.code,reason==='expired'?'TEMPORARY_STATE_EXPIRED':'TEMPORARY_STATE_UNVERIFIABLE');
 assert.ok(!JSON.stringify(data).includes('synthetic-corruption'));
 assert.equal(JSON.stringify(root),before);assert.equal(h.calls.length,count);assert.equal(h.generated,generation);
});
for(const anonymous of [false,true])test(`synthetic ${anonymous?'anonymous':'registered'} first visit, new turn, save and reload`,async()=>{
 const h=harness({anonymous}),api=h.load('app/api/persona/history/route.ts');
 const initial=await api.POST(h.request({action:'load'}));assert.equal(initial.status,200);
 const first=await initial.json();assert.equal(first.history.length,0);assert.equal(h.generated,0);
 const reply=await turn(h,'synthetic-new-turn',first.temporaryState);
 assert.equal(typeof reply.reply,'string');assert.equal(h.generated,1);
 const canonical=h.load('lib/canonical-state.ts');
 const saved=anonymous?await canonical.loadTemporaryRoot(h.user.id,reply.temporaryState):await canonical.loadCanonicalState(h.user.id);
 assert.ok(saved.history.some(x=>x.role==='user'&&x.text==='synthetic-new-turn'));
 assert.ok(saved.history.some(x=>x.role==='misaki'&&x.text===reply.reply));
 for(let i=0;i<2;i++){
 const r=await api.POST(h.request({action:'load',temporaryState:reply.temporaryState}));assert.equal(r.status,200);
 const reloaded=await r.json();assert.equal(reloaded.history.length,2);assert.equal(h.generated,1);
 }
});
test('no auth token returns 401 without generation',async()=>{
 const h=harness();const r=await h.load('app/api/persona/history/route.ts').POST(new Request('https://test/api/persona/history',{method:'POST',body:JSON.stringify({action:'load'})}));
 assert.equal(r.status,401);assert.equal(h.generated,0);assert.equal(h.calls.length,0);
});
test('UI only accepts matching status and fixed code, never arbitrary server text',()=>{
 const h=harness(),{temporaryStateMessage:message}=h.load('lib/temporary-state-error.ts');
 assert.match(message(410,{code:'TEMPORARY_STATE_EXPIRED'}),/期限/);
 assert.match(message(409,{code:'TEMPORARY_STATE_UNVERIFIABLE'}),/検証/);
 assert.equal(message(500,{code:'TEMPORARY_STATE_EXPIRED',error:'private'}),null);
 assert.equal(message(410,{error:'private'}),null);
});
test('both entry paths reach the same chat without passing auth/token or expiry flags',()=>{
 const source=fs.readFileSync('public/lounge/entry.js','utf8');
 assert.ok(source.includes("window.location.assign('/chat')"));assert.ok(!source.includes('temporaryState'));assert.ok(!source.includes('supabase'));
});
