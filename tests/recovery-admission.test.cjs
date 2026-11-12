const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {harness}=require('./server-canonical.test.cjs');
const {randomUUID}=require('node:crypto');
function recoveryClient(){const module={exports:{}};const local=new Map(),session=new Map();const store=m=>({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)});
 vm.runInNewContext('(function(module,exports){'+ts.transpileModule(fs.readFileSync('lib/recovery-session.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText+'})',{window:{},localStorage:store(local),sessionStorage:store(session),AbortSignal})(module,module.exports);return {api:module.exports,session};}
function admission(accepting){const module={exports:{}};
 vm.runInNewContext('(function(require,module,exports){'+ts.transpileModule(fs.readFileSync('app/api/anonymous-recovery/admission/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText+'})',{Response})(()=>({ACCEPT_NEW_ANONYMOUS_RECOVERY:accepting}),module,module.exports);return module.exports.GET();}
for(const enabled of [true,false])test(`admission endpoint ${enabled} has no-store and no auth/state writes`,async()=>{
 const r=admission(enabled);assert.equal(r.status,200);assert.equal((await r.json()).accepting,enabled);
 for(const name of ['Cache-Control','CDN-Cache-Control','Vercel-CDN-Cache-Control'])assert.match(r.headers.get(name),/no-store/);
});
test('mounted client follows OFF -> ON admission without replacing existing pointer or auth data',async()=>{
 const c=recoveryClient(),id=randomUUID();c.api.startIndependentRecovery({is_anonymous:true},'TEMPORARY_STATE_EXPIRED',id);
 const before=JSON.stringify([...c.session]);
 assert.equal(await c.api.checkRecoveryAdmission(async()=>admission(false)),false);assert.equal(JSON.stringify([...c.session]),before);
 assert.equal(await c.api.checkRecoveryAdmission(async()=>admission(true)),true);assert.equal(JSON.stringify([...c.session]),before);
 assert.equal(await c.api.checkRecoveryAdmission(async()=>{throw Error('network')}),false);assert.equal(JSON.stringify([...c.session]),before);
});
for(const kind of ['normal-anonymous','registered','recovered-expired','recovered-unverifiable'])test(`compatible stopped release preserves ${kind} conversation, save and reload`,async()=>{
 const h=harness({anonymous:kind!=='registered'}),chat=h.load('app/api/chat/route.ts'),history=h.load('app/api/persona/history/route.ts');let token;
 if(kind.startsWith('recovered')){
  await chat.POST(h.request({message:'old-secret',requestId:randomUUID()}));const old=h.temporaryRoots.get(h.user.id);
  if(kind==='recovered-expired')old.expires_at=new Date(0).toISOString();else old.token='unverifiable';
  const saved=JSON.stringify(old);h.user.id='recovered-'+randomUUID();h.old={root:old,saved};
 }
 let state=await (await history.POST(h.request({action:'load'}))).json();token=state.temporaryState;
 const first=await chat.POST(h.request({message:'before-stop',requestId:randomUUID(),temporaryState:token}));assert.equal(first.status,200);token=(await first.json()).temporaryState;
 // Deploying only policy OFF changes no API/auth/storage code or persisted data.
 assert.equal((await admission(false).json()).accepting,false);
 for(const word of ['during-stop','after-reload']){
  state=await (await history.POST(h.request({action:'load',temporaryState:token}))).json();token=state.temporaryState;
  const r=await chat.POST(h.request({message:word,requestId:randomUUID(),temporaryState:token}));assert.equal(r.status,200);token=(await r.json()).temporaryState;
 }
 const reloaded=await (await history.POST(h.request({action:'load',temporaryState:token}))).json();
 assert.ok(reloaded.history.some(x=>x.text==='during-stop'));assert.ok(reloaded.history.some(x=>x.text==='after-reload'));
 if(h.old){assert.equal(JSON.stringify(h.old.root),h.old.saved);assert.ok(!JSON.stringify(reloaded).includes('old-secret'))}
});
test('policy is referenced only by admission endpoint; chat/history/auth/expiry never depend on it',()=>{
 for(const file of ['app/api/chat/route.ts','app/api/persona/history/route.ts','lib/canonical-state.ts','lib/supabase.ts','lib/device-conversation.ts']){
  const s=fs.readFileSync(file,'utf8');assert.ok(!s.includes('recovery-admission-policy'));assert.ok(!s.includes('checkRecoveryAdmission'));
 }
});
test('OFF release keeps deleted memory deleted despite a stale browser token and stale edit',async()=>{
 const h=harness({anonymous:true}),chat=h.load('app/api/chat/route.ts'),api=h.load('app/api/persona/history/route.ts'),canonical=h.load('lib/canonical-state.ts');
 h.setOpenaiPayload({reply:'synthetic reply',memory:['removed-synthetic'],misakiTodayMemory:{items:[]}});
 const first=await (await chat.POST(h.request({message:'seed',requestId:randomUUID()}))).json();
 const stale=await canonical.loadTemporaryRoot(h.user.id,first.temporaryState);
 assert.equal((await api.POST(h.request({action:'deleteMemory',value:'removed-synthetic',temporaryState:first.temporaryState}))).status,200);
 const beforePolicy=JSON.stringify(h.temporaryRoots.get(h.user.id));
 assert.equal((await admission(false).json()).accepting,false);assert.equal((await admission(true).json()).accepting,true);
 assert.equal(JSON.stringify(h.temporaryRoots.get(h.user.id)),beforePolicy);
 await assert.rejects(()=>canonical.editTemporaryRoot(h.user.id,stale),/commit failed/);
 h.setOpenaiPayload({reply:'new synthetic reply',memory:[],misakiTodayMemory:{items:[]}});
 const start=h.prompts.length;
 assert.equal((await chat.POST(h.request({message:'new message',requestId:randomUUID(),temporaryState:first.temporaryState}))).status,200);
 assert.ok(!JSON.stringify(h.prompts.slice(start)).includes('removed-synthetic'));
 assert.ok(!(await canonical.loadTemporaryRoot(h.user.id,null)).memory.includes('removed-synthetic'));
});
test('actual release artifact exposes its policy without reading or writing conversation state',async()=>{
 const h=harness(),expected=h.load('lib/recovery-admission-policy.ts').ACCEPT_NEW_ANONYMOUS_RECOVERY;
 assert.equal(typeof expected,'boolean');
 const r=h.load('app/api/anonymous-recovery/admission/route.ts').GET();assert.equal((await r.json()).accepting,expected);
 assert.equal(h.calls.length,0);assert.equal(h.generated,0);assert.equal(h.temporaryRoots.size,0);
});
