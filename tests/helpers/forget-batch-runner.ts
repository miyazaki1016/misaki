import {createRequire} from 'node:module';
import {batchMask,currentMask,prepareForgetTurn,metrics,measuredJudge,liveJudges,classify,type SemanticJudge} from './forget-batch-evaluation.ts';
import {fixtures,expected,type Fixture} from './forget-batch-fixtures.ts';
const {judge:legacyScripted}=createRequire(import.meta.url)('../forget-fixture.cjs');
function scripted(f:Fixture,kind:'current'|'batch'):SemanticJudge{return async(task,input:any)=>{
 if(task!=='mask'&&task!=='mask_batch')return legacyScripted(task,input);
 if(task==='mask_batch')return {rows:input.rows.map((row:any)=>({id:row.id,uncertain:f.uncertain.includes(row.id),
  spans:(f.fault==='batch_leak'||f.fault==='both_leak')&&row.id==='history/old'?[]:f.spans[row.id]??[]}))};
 const value=await legacyScripted(task,input);
 if(f.fault==='both_leak'&&input.rows.length===1)input.rows.forEach((row:any,i:number)=>{if(row.text==='弟の名前は隆紀')value.rows[i].spans=[];});return value;
};}
export async function evaluate(f:Fixture,kind:'current'|'batch',key?:string){
 const live=key?liveJudges(key):null;
 const measured=live?{judge:kind==='current'?live.current:live.batch,observations:live.observations}:measuredJudge(scripted(f,kind));
 const judge=measured.judge;let phase:'prepare'|'input'|'output'='prepare';let input:any=null,output:any=null,state:any=null,error:any=null,errorCode:any=null;
 try{
  const history=f.input.find(b=>b.id==='history')!.rows,memory=f.input.find(b=>b.id==='memory')!.rows.map(r=>r.text);
  const turn=await prepareForgetTurn({history,memory,forgetControls:structuredClone(f.controls)},f.message,'current',f.now,'fixture-secret',judge);
  state={status:turn.controls.map(c=>c.status),pending:turn.controls.flatMap(c=>c.pending?[c.pending.fact]:[]),learned:turn.learned};
  // Freeze legacy future row using production history fingerprints, not fixture assumptions.
  // The fixture's released control must carry its real frozen key before masking.
  if(f.id==='released-future-legacy-history'){
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([history[0].role??'',history[0].text,history[0].requestId??'',history[0].sentAt??''])));
   turn.controls[0].blockedHistoryKeys=[[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')];
  }
  const mask=kind==='current'?currentMask:batchMask;phase='input';input=await mask(f.input,turn.controls,judge);
  const outputs=structuredClone(f.output);
  // Same production fixed-ack behavior: it is never model-generated final reply.
  if(turn.reply)outputs.splice(outputs.findIndex(b=>b.id==='reply'),1);
  phase='output';output=await mask(outputs,turn.controls,judge);
  if(turn.reply)output.reply=[{id:'final',text:turn.reply}];
 }catch(e:any){error=phase;errorCode=e.message;}
 return {result:{state,error,input,output},errorCode,metrics:metrics(measured.observations)};
}
export async function runEvaluation(key?:string){
 const rows=[];
 for(const f of fixtures()){
  if(key&&f.fault)continue;
  const current=await evaluate(f,'current',key),batch=await evaluate(f,'batch',key),oracle=expected(f);
  rows.push({id:f.id,note:f.note??null,oracle,current,batch,...classify(current.result,batch.result,oracle),review:key?'human_review_required':'scripted_fixture_only'});
 }
 return {mode:key?'live-gemini':'scripted',semanticEquivalenceProven:false,measurementNote:key?'latencyMs is summed resolver fetch duration, not end-to-end chat latency; outputTokens is candidatesTokenCount':'tokens and latency are unmeasured; scripted calls are actual resolver-port invocation counts',rows};
}
