const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {randomUUID}=require('node:crypto');
const {harness}=require('./server-canonical.test.cjs');
function storage(initial={}){const map=new Map(Object.entries(initial));return {get length(){return map.size},key:i=>[...map.keys()][i]??null,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),clear:()=>map.clear(),dump:()=>JSON.stringify([...map])}}
function tab(local,session){const module={exports:{}};vm.runInNewContext('(function(module,exports){'+ts.transpileModule(fs.readFileSync('lib/recovery-session.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText+'})',{window:{},localStorage:local,sessionStorage:session,AbortSignal})(module,module.exports);return module.exports}
async function send(h,message,token){h.setOpenaiPayload({reply:'synthetic response to '+message,memory:[],misakiTodayMemory:{items:[]}});const r=await h.load('app/api/chat/route.ts').POST(h.request({message,requestId:randomUUID(),temporaryState:token}));assert.equal(r.status,200);return r.json()}
test('explicit new namespace preserves all old auth/history/token keys and mounted old-tab scope',()=>{
 const l=storage({'misaki-chat-history':'old','misaki-device-user-id':'old-id','sb-auth':'old-auth'}),s=storage({'misaki-temporary-state-v1':'old-token'});
 const old=tab(l,s),beforeL=l.dump();assert.throws(()=>old.startIndependentRecovery({is_anonymous:false},'TEMPORARY_STATE_EXPIRED',randomUUID()));
 assert.throws(()=>old.startIndependentRecovery({is_anonymous:true},null,randomUUID()));assert.equal(l.dump(),beforeL);
 old.startIndependentRecovery({is_anonymous:true},'TEMPORARY_STATE_UNVERIFIABLE',randomUUID());
 assert.equal(old.recoveryScope,null);const fresh=tab(l,s);assert.ok(fresh.recoveryScope);
 assert.equal(fresh.conversationLocalStorage.getItem('misaki-chat-history'),null);assert.equal(fresh.conversationSessionStorage.getItem('misaki-temporary-state-v1'),null);
 fresh.conversationLocalStorage.setItem('misaki-chat-history','new');fresh.conversationSessionStorage.setItem('misaki-temporary-state-v1','new-token');
 assert.equal(old.conversationLocalStorage.getItem('misaki-chat-history'),'old');assert.equal(s.getItem('misaki-temporary-state-v1'),'old-token');
 assert.equal(l.getItem('sb-auth'),'old-auth');
 // A late old-tab write stays in its frozen namespace, never the recovery namespace.
 old.conversationLocalStorage.setItem('misaki-chat-history','late-old');assert.equal(fresh.conversationLocalStorage.getItem('misaki-chat-history'),'new');
 const reload=tab(l,s);assert.equal(reload.recoveryScope,fresh.recoveryScope);assert.equal(reload.conversationSessionStorage.getItem('misaki-temporary-state-v1'),'new-token');
 // Duplicate tab carries the recovery scope and auth/session storage, shares local cache.
 const duplicate=storage(Object.fromEntries(Array.from({length:s.length},(_,i)=>[s.key(i),s.getItem(s.key(i))])));
 assert.equal(tab(l,duplicate).recoveryScope,fresh.recoveryScope);
 // Scoped clear cannot delete an old or registered session's data.
 fresh.conversationLocalStorage.clear();assert.equal(l.getItem('misaki-chat-history'),'late-old');assert.equal(l.getItem('sb-auth'),'old-auth');
});
for(const fault of ['expired','unverifiable']) test(`${fault}: preserve old root, explicit new identity sends matching response, commits and reloads without old info`,async()=>{
 const h=harness({anonymous:true});const old=await send(h,'old-private-synthetic');const oldId=h.user.id,root=h.temporaryRoots.get(oldId);
 if(fault==='expired')root.expires_at=new Date(0).toISOString();else root.token='corrupt-synthetic';
 const before=JSON.stringify(root),calls=h.calls.length,api=h.load('app/api/persona/history/route.ts');
 const failure=await api.POST(h.request({action:'load'}));assert.equal(failure.status,fault==='expired'?410:409);assert.equal(h.calls.length,calls);assert.equal(JSON.stringify(root),before);
 // Model the isolated client's new anonymous identity; no auth service call is made.
 h.user.id='new-'+randomUUID();
 const initial=await (await api.POST(h.request({action:'load'}))).json();assert.equal(initial.history.length,0);assert.equal(initial.memory.length,0);
 const promptCount=h.prompts.length;const reply=await send(h,'new-current-input',initial.temporaryState);
 assert.equal(reply.reply,'synthetic response to new-current-input');assert.ok(!JSON.stringify(h.prompts.slice(promptCount)).includes('old-private-synthetic'));
 const state=await (await api.POST(h.request({action:'load',temporaryState:reply.temporaryState}))).json();
 assert.equal(state.history.length,2);assert.equal(state.history[0].text,'new-current-input');assert.equal(state.history[1].text,reply.reply);assert.equal(JSON.stringify(root),before);
 assert.ok(!JSON.stringify(state).includes('old-private-synthetic'));
 const canonical=h.load('lib/canonical-state.ts'),stale=await canonical.loadTemporaryRoot(h.user.id,state.temporaryState);
 await send(h,'new-concurrent-input',state.temporaryState);
 await assert.rejects(()=>canonical.editTemporaryRoot(h.user.id,stale),/commit failed/);
 assert.equal(JSON.stringify(root),before);
});
test('expired and unverified at once is unverifiable, not a confirmed expiry',async()=>{
 const h=harness({anonymous:true});await send(h,'old');const r=h.temporaryRoots.get(h.user.id);r.token='corrupt';r.expires_at=new Date(0).toISOString();
 const result=await h.load('app/api/persona/history/route.ts').POST(h.request({action:'load'}));assert.equal(result.status,409);
});
test('server/browser token expiry rejects continuation without resetting old state',async()=>{
 const h=harness({anonymous:true}),first=await send(h,'expired-old');h.advanceClock(86400001);const before=JSON.stringify(h.temporaryRoots.get(h.user.id));
 const r=await h.load('app/api/persona/history/route.ts').POST(h.request({action:'load',temporaryState:first.temporaryState}));assert.equal(r.status,410);assert.equal(JSON.stringify(h.temporaryRoots.get(h.user.id)),before);
 const count=h.generated;assert.equal((await h.load('app/api/chat/route.ts').POST(h.request({requestId:randomUUID(),temporaryState:first.temporaryState}))).status,500);assert.equal(h.generated,count);
});
test('auth storage isolation and no signout/copy/delete recovery operation are wired to UI',()=>{
 const auth=fs.readFileSync('lib/supabase.ts','utf8'),ui=fs.readFileSync('app/chat/page.tsx','utf8');
 assert.ok(auth.includes('storageKey: `misaki-recovery-auth-${recoveryScope}`'));assert.ok(auth.includes('storage: window.sessionStorage'));
 assert.ok(ui.includes('onClick={beginIndependentConversation}'));assert.ok(ui.includes('window.confirm('));
 const load=ui.slice(ui.indexOf('async function load()'),ui.indexOf('void load();'));
 assert.ok(!load.includes('const cached'));assert.ok(!load.includes('finally'));assert.ok(load.includes('setLoaded(true)'));
});
test('expired canonical root cannot replay a still-valid old browser response or receipt',async()=>{
 const h=harness({anonymous:true}),requestId=randomUUID(),message='old-replay';
 const first=await (await h.load('app/api/chat/route.ts').POST(h.request({requestId,message}))).json();
 h.temporaryRoots.get(h.user.id).expires_at=new Date(0).toISOString();
 const generated=h.generated,original=JSON.stringify(h.temporaryRoots.get(h.user.id));
 for(const token of [first.temporaryState,null]){
  const r=await h.load('app/api/chat/route.ts').POST(h.request({requestId,message,temporaryState:token}));
  assert.equal(r.status,500);assert.equal(h.generated,generated);assert.equal(JSON.stringify(h.temporaryRoots.get(h.user.id)),original);
 }
});
test('invalid recovery pointer or unavailable storage fails closed rather than using old auth',()=>{
 const l=storage({'sb-auth':'registered-auth'}),s=storage({'misaki-active-recovery-scope-v1':'invalid'});
 assert.throws(()=>tab(l,s),/Invalid recovery/);assert.equal(l.getItem('sb-auth'),'registered-auth');
 const denied=storage();denied.getItem=()=>{throw Error('storage denied')};assert.throws(()=>tab(l,denied),/storage denied/);
});
test('same original account can start independent sessions in two tabs without mutating shared auth',()=>{
 const l=storage({'sb-auth':'old-auth','misaki-chat-history':'old'}),s1=storage(),s2=storage();
 const a=tab(l,s1),b=tab(l,s2);
 a.startIndependentRecovery({is_anonymous:true},'TEMPORARY_STATE_EXPIRED',randomUUID());
 b.startIndependentRecovery({is_anonymous:true},'TEMPORARY_STATE_UNVERIFIABLE',randomUUID());
 const na=tab(l,s1),nb=tab(l,s2);assert.notEqual(na.recoveryScope,nb.recoveryScope);
 na.conversationLocalStorage.setItem('misaki-chat-history','A');nb.conversationLocalStorage.setItem('misaki-chat-history','B');
 assert.equal(na.conversationLocalStorage.getItem('misaki-chat-history'),'A');assert.equal(nb.conversationLocalStorage.getItem('misaki-chat-history'),'B');assert.equal(l.getItem('misaki-chat-history'),'old');assert.equal(l.getItem('sb-auth'),'old-auth');
});
