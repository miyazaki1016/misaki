const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const {randomUUID}=require('node:crypto');
function harness({generationFailure=false,relayFailure=false}={}){
 let releaseGeneration,releaseRelay,generationStarted,relayStarted;
 const generationGate=new Promise(r=>releaseGeneration=r),relayGate=new Promise(r=>releaseRelay=r);
 const generating=new Promise(r=>generationStarted=r),relaying=new Promise(r=>relayStarted=r);
 const calls=[],operation={id:randomUUID(),capability:randomUUID(),trackingKey:randomUUID()};let state=null;
 function client(_url,_key,options){return{rpc:async(name,args)=>{calls.push({name,args,headers:options?.global?.headers});
   if(name==='verify_misaki_body_clock_secret')return{data:true};if(name==='sign_misaki_body_clock_relay')return{data:'a'.repeat(64)};
   if(name==='admit_misaki_legacy_operation'){state='admitted';return{data:operation};}
   if(name==='progress_misaki_legacy_operation'){state=args.p_state;return{};}
   if(name==='claim_misaki_body_clock_due_users')return{data:[{user_id:randomUUID(),notifications_enabled:true,recent_history:[],long_term_memory:[],relationship_points:80}]};
   if(name==='finish_misaki_body_clock_delivery')return{data:{deliveryId:randomUUID(),nextPushAt:new Date().toISOString(),pushesToday:1}};
   return{data:{}};},from:table=>{const q={};for(const m of ['select','eq','not','order','limit','insert'])q[m]=()=>q;
     q.single=async()=>({data:{next_push_at:new Date(Date.now()+600000).toISOString()}});q.then=(yes,no)=>Promise.resolve({data:[],error:null}).then(yes,no);return q;}};}
 const context=vm.createContext({Response,Request,URL,Date,JSON,Math,AbortSignal,console:{error(){}},
   Deno:{env:{get:()=> 'synthetic'},serve(){}},fetch:async(url,options)=>{
     if(String(url).includes('generativelanguage')){generationStarted();await generationGate;
       return generationFailure?Response.json({},{status:500}):Response.json({candidates:[{content:{parts:[{text:'{"reply":"元気にしてる？"}'}]}}]});}
     const body=JSON.parse(options.body);if(body.deliveryId==='health')return Response.json({ok:true});
     calls.push({name:'relay',headers:options.headers});relayStarted();await relayGate;
     return relayFailure?Response.json({error:'synthetic'},{status:500}):Response.json({sent:1,failed:0});}});
 const cache=new Map(),root=path.join(__dirname,'../supabase/functions/body-clock');
 function load(file){if(cache.has(file))return cache.get(file);const mod={exports:{}};
   const req=name=>{if(name.startsWith('npm:'))return{createClient:client};
     if(name==='./persona-store.ts')return{loadPersonaPrompt:async()=>({text:'美咲'})};
     if(name==='./proactive-photo.ts')return{selectMisakiProactivePhoto:()=>null};
     if(name==='./proactive-life-context.ts')return{buildProactiveLifeContext:()=>({}),createProactiveLifeGuide:()=>''};
     if(name==='./proactive-decision.ts')return{buildProactiveDecisionContext:async()=>({direction:'normal',relationshipPoints:80}),createProactiveDecisionGuide:()=>''};
     return load(name.slice(2));};
   const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
   vm.runInContext(`(function(require,module,exports){${code}\n})`,context)(req,mod,mod.exports);cache.set(file,mod.exports);return mod.exports;}
 return{calls,operation,generating,relaying,releaseGeneration,releaseRelay,get state(){return state;},
   run:()=>load('index.ts').handler(new Request('https://synthetic.invalid/',{method:'POST',headers:{'x-cron-secret':'x'.repeat(64)}}))};
}
test('actual old Edge handler admits before claim; batch unresolved through generation and signed relay response',async()=>{
 const h=harness();const p=h.run();await h.generating;assert.equal(h.state,'admitted');h.releaseGeneration();await h.relaying;assert.equal(h.state,'admitted');
 const names=h.calls.map(c=>c.name);assert.ok(names.indexOf('admit_misaki_legacy_operation')<names.indexOf('claim_misaki_body_clock_due_users'));
 for(const call of h.calls.filter(c=>['claim_misaki_body_clock_due_users','finish_misaki_body_clock_delivery','relay'].includes(c.name)))assert.equal(call.headers['x-misaki-operation'],h.operation.id);
 h.releaseRelay();assert.equal((await p).status,200);assert.equal(h.state,'succeeded');
});
for(const generationFailure of [true,false])test(`${generationFailure?'generation':'relay'} failure in actual Edge remains unknown`,async()=>{
 const h=harness({generationFailure,relayFailure:!generationFailure});const p=h.run();await h.generating;h.releaseGeneration();
 if(!generationFailure){await h.relaying;h.releaseRelay();}assert.equal((await p).status,500);assert.equal(h.state,'unknown');
});
