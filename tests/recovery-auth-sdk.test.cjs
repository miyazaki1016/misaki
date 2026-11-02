// Real installed auth SDK; every transport is replaced. No network/auth/DB writes.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {createClient}=require('@supabase/supabase-js');
const {randomUUID}=require('node:crypto');
function storage(initial={}){const map=new Map(Object.entries(initial));return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),dump:()=>JSON.stringify([...map])}}
function boot(scope,store,calls){
 const module={exports:{}};
 const req=name=>name==='./recovery-session'?{recoveryScope:scope}:{createClient:(_url,_key,options)=>createClient('https://synthetic.invalid','synthetic-publishable',{...options,global:{fetch:async(url,init)=>{
   calls.push(new URL(String(url)).pathname);
   assert.equal(new URL(String(url)).hostname,'synthetic.invalid');assert.match(String(url),/\/auth\/v1\/signup$/);
   const user={id:randomUUID(),is_anonymous:true,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:new Date().toISOString()};
   const expires_at=Math.floor(Date.now()/1000)+3600;
   const token=[{alg:'HS256',typ:'JWT'},{sub:user.id,exp:expires_at,iat:expires_at-3600,role:'authenticated',is_anonymous:true},'signature'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.');
   return Response.json({access_token:token,refresh_token:'synthetic-refresh',token_type:'bearer',expires_in:3600,expires_at,user});
 }}})};
 const code=ts.transpileModule(fs.readFileSync('lib/supabase.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext('(function(require,module,exports){'+code+'})',{window:{sessionStorage:store}})(req,module,module.exports);
 return module.exports.supabase;
}
test('real SDK starts isolated anonymous auth, reloads same new identity and preserves old credentials',async()=>{
 const store=storage({'sb-synthetic-auth-token':'old-auth','misaki-temporary-state-v1':'old-token'}),calls=[],scope=randomUUID();
 const client=boot(scope,store,calls);let reload;
 try{
  assert.equal((await client.auth.getSession()).data.session,null);
  assert.deepEqual(calls,[]);
  const created=await client.auth.signInAnonymously();assert.equal(created.error,null);assert.equal(created.data.user.is_anonymous,true);
  const id=created.data.user.id;assert.ok(id);assert.ok(store.getItem(`misaki-recovery-auth-${scope}`));
  assert.equal(store.getItem('sb-synthetic-auth-token'),'old-auth');assert.equal(store.getItem('misaki-temporary-state-v1'),'old-token');
  reload=boot(scope,store,calls);const resumed=await reload.auth.getSession();assert.equal(resumed.error,null);assert.equal(resumed.data.session.user.id,id);
  assert.deepEqual(calls,['/auth/v1/signup']);
 }finally{await client.auth.stopAutoRefresh();if(reload)await reload.auth.stopAutoRefresh()}
});
test('real SDK cannot load another recovery namespace even if its credentials exist in same storage',async()=>{
 const store=storage(),calls=[],a=boot(randomUUID(),store,calls),b=boot(randomUUID(),store,calls);
 try{const first=await a.auth.signInAnonymously();assert.equal(first.error,null);
  assert.equal((await b.auth.getSession()).data.session,null);
  const second=await b.auth.signInAnonymously();assert.equal(second.error,null);assert.notEqual(first.data.user.id,second.data.user.id);
  assert.equal((await a.auth.getSession()).data.session.user.id,first.data.user.id);
 }finally{await a.auth.stopAutoRefresh();await b.auth.stopAutoRefresh()}
});
