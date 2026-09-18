const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const {randomUUID,webcrypto}=require('node:crypto');
const root=path.join(__dirname,'..');
function harness({premium=false,anonymous=false,fail=false,maintenance=false,missing=false,syncFailure=false}={}){
 const user={id:randomUUID(),is_anonymous:anonymous},calls=[],ops=new Map();let on=maintenance;
 let release;const generation=new Promise(r=>release=r);let started;const generating=new Promise(r=>started=r);
 const rpc=async(name,args)=>{calls.push({name,args});
   if(name==='admit_misaki_legacy_operation'){
     if(on||missing)return{data:null,error:{message:'MISAKI_MAINTENANCE'}};
     const o={id:randomUUID(),capability:randomUUID(),trackingKey:randomUUID()};ops.set(o.id,{...o,state:'admitted'});return{data:o,error:null};
   }
   if(name==='progress_misaki_legacy_operation'){ops.get(args.p_id).state=args.p_state;return{error:null};}
   if(name==='consume_daily_message')return{data:[{allowed:true,is_premium:premium,message_count:premium?0:1,remaining:premium?20:19}],error:null};
   if(name==='refund_daily_message')return{data:[{refunded:true,is_premium:false,message_count:0,remaining:20}],error:null};
   if(name==='sync_user_conversation_state'&&syncFailure)return{data:null,error:{message:'response unknown'}};
   return{data:{},error:null};
 };
 const builder=()=>{const q={};for(const m of ['select','eq','not','order','limit','insert','update','delete','upsert'])q[m]=()=>q;
   q.maybeSingle=q.single=async()=>({data:{memory:[]},error:null});q.then=(yes,no)=>Promise.resolve({data:[],error:null}).then(yes,no);return q;};
 const createClient=(_url,_key,options)=>({auth:{getUser:async()=>({data:{user},error:null})},from:builder,
   rpc:async(name,args)=>{if(['consume_daily_message','refund_daily_message','sync_user_conversation_state'].includes(name)){
     calls.push({headers:options?.global?.headers,name:'context'});
   }return rpc(name,args);}});
 const context=vm.createContext({Response,Request,URL,Date,JSON,Math,AbortSignal,AbortController,crypto:webcrypto,TextEncoder,TextDecoder,setTimeout,clearTimeout,
   process:{env:{GEMINI_API_KEY:'synthetic',SUPABASE_SERVICE_ROLE_KEY:'synthetic'}},console:{log(){},error(){},warn(){}},
   fetch:async url=>{if(String(url).includes('generativelanguage')){started();await generation;if(fail)return Response.json({error:'test'},{status:500});
     return Response.json({candidates:[{content:{parts:[{text:JSON.stringify({reply:'うん、聞いてるよ。',memory:['new memory'],misakiTodayMemory:{items:[]}})}]}}]});}
     return Response.json({});}});
 const cache=new Map();
 function load(file){if(cache.has(file))return cache.get(file);
   const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
   const mod={exports:{}};cache.set(file,mod.exports);
   const req=name=>{if(name==='@supabase/supabase-js')return{createClient};
     if(name.endsWith('/persona/persona-store'))return{loadPersonaPrompt:async()=>({text:'美咲'})};
     if(name.startsWith('.'))return load(path.resolve(path.dirname(file),name+'.ts'));
     return require(name);};
   vm.runInContext(`(function(require,module,exports){${code}\n})`,context)(req,mod,mod.exports);cache.set(file,mod.exports);return mod.exports;
 }
 return{calls,ops,user,generating,release,setOn:()=>on=true,
   send:(proxy=false)=>load(path.join(root,proxy?'app/api/chat-proxy/route.ts':'app/api/chat/route.ts')).POST(new Request('https://synthetic.invalid/api/chat',{
     method:'POST',headers:{Authorization:'Bearer synthetic','Content-Type':'application/json'},body:JSON.stringify({message:'こんにちは',history:[],memory:[],relationshipPoints:81,requestId:'browser-forged',misakiTodayMemory:{date:'',items:[]}})}))};
}
for(const anonymous of [false,true])for(const premium of [false,true]){
 test(`ON rejects before usage or generation (${anonymous?'anonymous':'permanent'},${premium?'Premium':'Free'})`,async()=>{
   const h=harness({anonymous,premium,maintenance:true});const r=await h.send();assert.equal(r.status,503);assert.equal((await r.json()).maintenance,true);
   assert.equal(h.calls.some(c=>c.name==='consume_daily_message'),false);assert.equal(h.ops.size,0);
 });
 test(`usage -> generating -> ON -> success stays awaiting browser (${anonymous?'anonymous':'permanent'},${premium?'Premium':'Free'})`,async()=>{
   const h=harness({anonymous,premium});const promise=h.send(true);await h.generating;h.setOn();h.release();const r=await promise;
   assert.equal(r.status,200);const data=await r.json();assert.equal(h.ops.get(data.maintenanceOperation.id).state,'awaiting_browser');
   const names=h.calls.map(c=>c.name);assert.ok(names.indexOf('admit_misaki_legacy_operation')<names.indexOf('consume_daily_message'));
   const usage=h.calls.find(c=>c.name==='consume_daily_message');assert.equal(usage.args.p_request_id,data.maintenanceOperation.trackingKey);
   assert.notEqual(usage.args.p_request_id,'browser-forged');assert.equal(names.includes('refund_daily_message'),false);
   assert.ok(h.calls.filter(c=>c.name==='context').every(c=>c.headers['x-misaki-operation']===data.maintenanceOperation.id));
 });
 test(`generation failure after ON confirms ${premium?'no Premium refund':'Free refund'} before finalize (${anonymous?'anonymous':'permanent'})`,async()=>{
   const h=harness({anonymous,premium,fail:true});const promise=h.send();await h.generating;h.setOn();h.release();const r=await promise;
   assert.equal(r.status,500);const state=[...h.ops.values()][0].state;assert.equal(state,premium?'failed':'refunded');
   assert.equal(h.calls.filter(c=>c.name==='refund_daily_message').length,premium?0:1);
   if(!premium){const names=h.calls.map(c=>c.name);assert.ok(names.indexOf('refund_daily_message')<names.lastIndexOf('progress_misaki_legacy_operation'));}
 });
}
test('missing registry fails closed before usage',async()=>{const h=harness({missing:true});assert.equal((await h.send()).status,503);assert.equal(h.ops.size,0);});
test('proxy save response unknown retains reconciliation blocker',async()=>{const h=harness({syncFailure:true});const p=h.send(true);await h.generating;h.setOn();h.release();assert.equal((await p).status,500);assert.equal([...h.ops.values()][0].state,'unknown');});
