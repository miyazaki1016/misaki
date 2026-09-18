const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
const root=path.join(__dirname,'..');
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
test('actual sendMessage maintenance response restores draft and leaves no maintenance history bubble',async()=>{
 const source=fs.readFileSync(path.join(root,'app/chat/page.tsx'),'utf8').replace(/\r\n/g,'\n');const start=source.indexOf('  async function sendMessage()');const end=source.indexOf('\n  return (\n    <main',start);
 assert.ok(start>0&&end>start);const old=[{role:'misaki',text:'before'}];let messages=old,draft=' hello ',error='';
 const c=vm.createContext({message:draft,messages:old,memory:[],relationshipPoints:80,misakiTodayMemory:{date:'',items:[]},loading:false,accountLoaded:true,isPremium:false,usageCountToday:0,FREE_DAILY_LIMIT:20,MAX_MESSAGES:60,
  getJapanDateKey:()=>'',getJapanCurrentTime:()=>'',getAccessToken:async()=> 'token',supabase:{auth:{getSession:async()=>({data:{session:{user:{id:'a'}}}})}},
  setMessages:v=>messages=typeof v==='function'?v(messages):v,setMessage:v=>draft=v,setLoading(){},setSendError:v=>error=v,setShowPremium(){},applyApiUsage(){},console:{error(){}},JSON,Response,
  fetch:async()=>Response.json({maintenance:true,error:'maintenance'},{status:503})});
 vm.runInContext(compile(source.slice(start,end)),c);await vm.runInContext('sendMessage()',c);
 assert.deepEqual(messages,old);assert.equal(draft,'hello');assert.equal(error,'maintenance');
});
function helper(){const map=new Map();let user='a',fail=true;const calls=[];
 const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 const client={auth:{getSession:async()=>({data:{session:{user:{id:user}}}})},rpc:async(name,args)=>{calls.push({name,args});return{error:fail?{message:'unknown'}:null};}};
 const c=vm.createContext({localStorage:storage,JSON,Intl,Notification:{permission:'default'}}),module={exports:{}};
 vm.runInContext(`(function(require,module,exports){${compile(fs.readFileSync(path.join(root,'lib/legacy-browser-drain.ts'),'utf8'))}\n})`,c)(()=>({supabase:client}),module,module.exports);
 return{api:module.exports,map,calls,setUser:v=>user=v,succeed:()=>fail=false};}
test('actual browser helper keeps failed exact snapshot, retries without TTL, and never saves another user',async()=>{
 const h=helper(),o={id:'server',capability:'cap',trackingKey:'key'};
 await assert.rejects(h.api.saveLegacyTurn(o,[{role:'misaki',text:'exact reply'}],['exact memory'],{},81,'a'),/unresolved/);
 const before=h.calls.length;h.setUser('b');await h.api.flushLegacySaves();assert.equal(h.calls.length,before);
 h.setUser('a');h.succeed();await h.api.flushLegacySaves();assert.equal(h.calls.at(-1).args.p_history[0].text,'exact reply');
 assert.deepEqual(JSON.parse(h.map.get('misaki-drain-pending-saves')),[]);
});
test('account switch before queue insertion cannot cache foreign conversation',async()=>{
 const h=helper();h.setUser('b');await assert.rejects(h.api.saveLegacyTurn({id:'old',capability:'cap'},['old'],[],{},81,'a'),/Account changed/);
 assert.equal(h.map.size,0);assert.equal(h.calls.length,0);
});
