// Verification-only. No application import, cache, database or commit operation.
import { readFileSync } from 'node:fs';
import { createForgetJudge, maskForgetRows, prepareForgetTurn, validateControls, type ForgetControl, type SemanticJudge } from '../../supabase/functions/_shared/forget-control.ts';

export type Row = { id: string; text: string; role?: string; sentAt?: string; requestId?: string };
export type Bundle = { id: string; source: 'history'|'memory'|'derived'|'output'; rows: Row[]; rejectChange?: boolean };
export type BatchJob = { id: string; text: string; source: Bundle['source']; targets: unknown[]; linkedTargets: number[]; provenance: { role?: string; sentAt?: string; requestId?: string } };
export type Plan = { bundles: Bundle[]; jobs: BatchJob[] };

// Delegate ALL barrier/provenance selection to the unchanged production policy.
// The planning judge never contacts a model; it only captures its input.
export async function planBatch(bundles: Bundle[], controls: ForgetControl[]): Promise<Plan> {
 validateControls(controls);const jobs: BatchJob[]=[];const ids=new Set<string>();
 const bundleIds=new Set<string>();
 for(const bundle of bundles){if(typeof bundle.id!=='string'||!bundle.id.trim()||bundleIds.has(bundle.id))throw Error('invalid_bundle_id');bundleIds.add(bundle.id);}
 for(const bundle of bundles) for(const row of bundle.rows) {
  if(typeof row.id!=='string'||!row.id.trim())throw Error('invalid_input_id');
  const id=`${bundle.id}/${row.id}`;if(ids.has(id))throw Error('duplicate_input_id');ids.add(id);
  let captured=false;
  await maskForgetRows([row],controls,async(task,input:any)=>{
   if(task!=='mask'||input.rows.length!==1)throw Error('invalid_planning_task');
   captured=true;
   jobs.push({id,text:row.text,source:bundle.source,targets:structuredClone(input.targets),linkedTargets:[...input.rows[0].linkedTargets],
    provenance:{role:row.role,sentAt:row.sentAt,requestId:row.requestId}});
   return {rows:[{index:0,spans:[],uncertain:false}]};
  },bundle.source);
  if(!captured)jobs.push({id,text:row.text,source:bundle.source,targets:[],linkedTargets:[],provenance:{role:row.role,sentAt:row.sentAt,requestId:row.requestId}});
 }
 return {bundles:structuredClone(bundles),jobs};
}
function exactKeys(value:any,keys:string[]) {
 return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join('|')===[...keys].sort().join('|');
}
export function applyBatch(plan: Plan, value: unknown): Record<string,Row[]> {
 const response:any=typeof value==='string'?JSON.parse(value):value;
 if(!exactKeys(response,['rows'])||!Array.isArray(response.rows)||response.rows.length!==plan.jobs.length)throw Error('incomplete_batch');
 const jobs=new Map(plan.jobs.map(j=>[j.id,j])),decisions=new Map<string,string>();
 for(const decision of response.rows){
  if(!exactKeys(decision,['id','spans','uncertain'])||typeof decision.id!=='string'||!jobs.has(decision.id)||decisions.has(decision.id)||
    !Array.isArray(decision.spans)||decision.uncertain!==false)throw Error('invalid_batch_decision');
  const job=jobs.get(decision.id)!;let text=job.text;const seen=new Set<string>();
  if(!job.targets.length&&decision.spans.length)throw Error('mask_without_barrier');
  for(const span of decision.spans){
   if(typeof span!=='string'||!span.trim()||span.length>4000||!job.text.includes(span)||job.text.indexOf(span)!==job.text.lastIndexOf(span)||seen.has(span))throw Error('ungrounded_batch_span');
   seen.add(span);text=text.replace(span,'');
  }
  // Apply exactly the production trim behavior; never accept model-rewritten text.
  decisions.set(decision.id,job.targets.length?text.trim():text);
 }
 const result:Record<string,Row[]>={};
 for(const bundle of plan.bundles){
  const rows:Row[]=[];
  for(const row of bundle.rows){const id=`${bundle.id}/${row.id}`;const text=decisions.has(id)?decisions.get(id)!:row.text;
   if(bundle.rejectChange&&text!==row.text)throw Error('reply_rejected');
   if(!jobs.get(id)?.targets.length||text.trim())rows.push({...row,text});
  }
  result[bundle.id]=rows;
 }
 return result;
}
export async function batchMask(bundles:Bundle[],controls:ForgetControl[],judge:SemanticJudge){
 const plan=await planBatch(bundles,controls);
 return applyBatch(plan,plan.jobs.some(j=>j.targets.length)?await judge('mask_batch',{rows:structuredClone(plan.jobs)}):{rows:plan.jobs.map(j=>({id:j.id,spans:[],uncertain:false}))});
}
export async function currentMask(bundles:Bundle[],controls:ForgetControl[],judge:SemanticJudge){
 const result:Record<string,Row[]>={};
 for(const b of bundles){const rows=await maskForgetRows(b.rows,controls,judge,b.source);
  if(b.rejectChange&&JSON.stringify(rows)!==JSON.stringify(b.rows))throw Error('reply_rejected');result[b.id]=rows;
 }return result;
}
export type Observation={task:string;inputTokens:number|null;outputTokens:number|null;latencyMs:number|null};
export function measuredJudge(judge:SemanticJudge){
 const observations:Observation[]=[];
 return {observations,judge:async(task:string,input:unknown)=>{
  observations.push({task,inputTokens:null,outputTokens:null,latencyMs:null});return judge(task,input);
 }};
}
export function liveJudges(key:string,fetcher:typeof fetch=fetch){
 const observations:Observation[]=[];
 const measuredFetch:typeof fetch=async(url,options)=>{
  const payload=JSON.parse(String(options?.body));const task=JSON.parse(payload.contents[0].parts[0].text).task;
  const observation:Observation={task,inputTokens:null,outputTokens:null,latencyMs:null};observations.push(observation);const start=performance.now();
  try{const response=await fetcher(url,options),data=await response.clone().json();const usage=data.usageMetadata;
   observation.inputTokens=Number.isInteger(usage?.promptTokenCount)?usage.promptTokenCount:null;
   observation.outputTokens=Number.isInteger(usage?.candidatesTokenCount)?usage.candidatesTokenCount:null;
   return response;
  }finally{observation.latencyMs=performance.now()-start;}
 };
 const current=createForgetJudge(key,measuredFetch);
 // Read the unchanged production policy to avoid quietly drifting its instructions.
 const source=readFileSync(new URL('../../supabase/functions/_shared/forget-control.ts',import.meta.url),'utf8');
 const policy=source.match(/const POLICY = `([\s\S]*?)`;/)?.[1];if(!policy)throw Error('production_policy_unavailable');
 const batch:SemanticJudge=async(task,input)=>{
  if(task!=='mask_batch')return current(task,input);
  const response=await measuredFetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${key}`,{
   method:'POST',signal:AbortSignal.timeout(25_000),headers:{'Content-Type':'application/json'},
   body:JSON.stringify({systemInstruction:{parts:[{text:policy+`
mask_batch: input rows each have immutable server id, text, source, targets, linkedTargets and provenance.
Apply the mask rules separately to EVERY row using ONLY THAT ROW's targets and linkedTargets.
Never borrow facts, identity or provenance from another row. Never change barriers/provenance.
Return exactly {rows:[{id,spans:[exact substring,...],uncertain:boolean}]} for every submitted id.
No extra keys, no rewritten text. Preserve unrelated identities and abstain when uncertain.`}]},
    contents:[{role:'user',parts:[{text:JSON.stringify({task,input})}]}],generationConfig:{temperature:0,responseMimeType:'application/json'}})});
  if(!response.ok)throw Error('batch_transport_failed');const data=await response.json();
  return JSON.parse(data?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text??'').join(''));
 };
 return {current,batch,observations};
}
export function metrics(observations:Observation[]){
 const sum=(key:'inputTokens'|'outputTokens'|'latencyMs')=>observations.length&&observations.every(o=>o[key]!==null)?observations.reduce((n,o)=>n+o[key]!,0):null;
 return {calls:observations.length,inputTokens:sum('inputTokens'),outputTokens:sum('outputTokens'),latencyMs:sum('latencyMs'),observations};
}
export function normalizedState(value:any){
 return {...value,controls:value.controls?.map(({id,targetKey,...rest}:ForgetControl)=>rest)};
}
export function classify(current:any,batch:any,oracle:any){
 const equal=(a:any,b:any)=>JSON.stringify(a)===JSON.stringify(b);const c=equal(current,oracle),b=equal(batch,oracle);
 return {agreement:equal(current,batch),classification:c&&b?'both_match_oracle':!c&&b?'batch_matches_oracle_only':c&&!b?'current_matches_oracle_only':equal(current,batch)?'both_same_oracle_mismatch':'both_different_oracle_mismatch'};
}
export {prepareForgetTurn};
export type {SemanticJudge};
