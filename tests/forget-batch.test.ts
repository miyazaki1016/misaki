import assert from 'node:assert/strict';
import test from 'node:test';
import {applyBatch,planBatch,batchMask,liveJudges,metrics,classify,prepareForgetTurn} from './helpers/forget-batch-evaluation.ts';
import {fixtures} from './helpers/forget-batch-fixtures.ts';
import {runEvaluation,evaluate} from './helpers/forget-batch-runner.ts';
import {createRequire} from 'node:module';
const {judge}=createRequire(import.meta.url)('./forget-fixture.cjs');

test('paired fixtures cover all requested semantics and classify every disagreement without trusting current',async()=>{
 const report=await runEvaluation();assert.equal(report.rows.length,20);
 const expected:Record<string,string>={'partial-name':'batch_matches_oracle_only','person-and-relationship':'batch_matches_oracle_only','batch-only-injected-miss':'current_matches_oracle_only','both-injected-miss':'both_same_oracle_mismatch'};
 for(const row of report.rows){assert.equal(row.classification,expected[row.id]??'both_match_oracle',row.id);
  for(const arm of [row.current,row.batch]){assert.equal(arm.metrics.inputTokens,null);assert.equal(arm.metrics.outputTokens,null);assert.equal(arm.metrics.latencyMs,null);}
 }
 assert.equal(report.semanticEquivalenceProven,false);
});
const badResponses:Record<string,(good:any)=>any>={
 'missing id':good=>({rows:good.rows.slice(1)}),
 'duplicate id':good=>({rows:good.rows.map((r:any,i:number)=>i===1?good.rows[0]:r)}),
 'unknown id':good=>({rows:good.rows.map((r:any,i:number)=>i===0?{...r,id:'invented'}:r)}),
 'invalid span':good=>({rows:good.rows.map((r:any,i:number)=>i===0?{...r,spans:['invented fact']}:r)}),
 'empty span':good=>({rows:good.rows.map((r:any,i:number)=>i===0?{...r,spans:['']}:r)}),
 'ambiguous':good=>({rows:good.rows.map((r:any,i:number)=>i===0?{...r,uncertain:true}:r)}),
 'missing uncertain':good=>({rows:good.rows.map((r:any,i:number)=>i===0?{id:r.id,spans:[]}:r)}),
 'nonboolean uncertain':good=>({rows:good.rows.map((r:any,i:number)=>i===0?{...r,uncertain:'false'}:r)}),
 'parse failure':()=>'{bad JSON',
 'provenance override':good=>({rows:good.rows.map((r:any,i:number)=>i===0?{...r,provenance:{sentAt:'2099'}}:r)}),
 'barrier override':good=>({rows:good.rows.map((r:any,i:number)=>i===0?{...r,targets:[]}:r)}),
 'rewritten text':good=>({rows:good.rows.map((r:any,i:number)=>i===0?{...r,text:'safe rewritten text'}:r)}),
 'extra top-level control':good=>({...good,controls:[]}),
 'nonarray spans':good=>({rows:good.rows.map((r:any,i:number)=>i===0?{...r,spans:'弟'}:r)}),
};
for(const [name,corrupt] of Object.entries(badResponses))test(`batch fail closed: ${name}`,async()=>{
 const f=fixtures()[0],plan=await planBatch(f.input,f.controls);
 const good={rows:plan.jobs.map(j=>({id:j.id,spans:[],uncertain:false}))};
 assert.throws(()=>applyBatch(plan,corrupt(good)));
});
test('server barrier planning keeps active/released/history/derived distinctions and stable IDs',async()=>{
 const f=fixtures().find(f=>f.id==='active-released-mixture')!,plan=await planBatch(f.input,f.controls);
 assert.equal(plan.jobs.find(j=>j.id==='history/old')!.targets.length,2);
 assert.equal(plan.jobs.find(j=>j.id==='history/new')!.targets.length,1);
 assert.equal(plan.jobs.find(j=>j.id==='traits/cat')!.targets.length,2);
 const reversed=await planBatch([...f.input].reverse(),f.controls);
 assert.deepEqual(new Set(reversed.jobs.map(j=>j.id)),new Set(plan.jobs.map(j=>j.id)));
 const before=structuredClone(f);await batchMask(f.input,f.controls,async(_task,input:any)=>({rows:input.rows.map((r:any)=>({id:r.id,spans:[],uncertain:false})).reverse()}));assert.deepEqual(f,before);
});
test('batch linked provenance is calculated on server and kept on the exact row',async()=>{
 const f=fixtures()[0];f.input[0].rows.push({id:'forget',text:'隆紀のことは忘れて',requestId:'forget'});
 const p=await planBatch(f.input,f.controls);
 assert.deepEqual(p.jobs.find(j=>j.id==='history/forget')!.linkedTargets,[0]);assert.deepEqual(p.jobs.find(j=>j.id==='history/old')!.linkedTargets,[]);
});
test('all submitted rows need IDs even without a barrier, and no-barrier rows cannot be modified',async()=>{
 const bundles=[{id:'memory',source:'memory' as const,rows:[{id:'empty',text:''},{id:'spaces',text:'  猫が好き  '}]}];
 const p=await planBatch(bundles,[]);assert.equal(p.jobs.length,2);
 assert.throws(()=>applyBatch(p,{rows:[{id:p.jobs[0].id,spans:[],uncertain:false}]}),/incomplete/);
 assert.throws(()=>applyBatch(p,{rows:p.jobs.map(j=>({id:j.id,spans:j.id.endsWith('spaces')?['猫が好き']:[],uncertain:false}))}),/without_barrier/);
 const result=await batchMask(bundles,[],async()=>{throw Error('unnecessary network call')});assert.deepEqual(result.memory,bundles[0].rows);
});
test('duplicate server input IDs are rejected before the model is called',async()=>{
 const f=fixtures()[0];f.input[0].rows.push({...f.input[0].rows[0]});
 await assert.rejects(batchMask(f.input,f.controls,async()=>{throw Error('should not call model')}),/duplicate_input_id/);
});
test('repeated span cannot erase distinct occurrences; reply alteration rejects the entire output',async()=>{
 const f=fixtures()[0];f.input[0].rows[0].text='隆紀と隆紀';const p=await planBatch([f.input[0]],f.controls);
 assert.throws(()=>applyBatch(p,{rows:p.jobs.map((j,i)=>({id:j.id,spans:i===0?['隆紀']:[],uncertain:false}))}),/ungrounded/);
 const reply=f.output[2];reply.rows[0].text='弟は隆紀';const out=await planBatch([reply],f.controls);
 assert.throws(()=>applyBatch(out,{rows:[{id:out.jobs[0].id,spans:['弟は隆紀'],uncertain:false}]}),/reply_rejected/);
});
test('reoffer stays independent and same current confirmation causes release in both comparison arms',async()=>{
 const f=fixtures().find(f=>f.id==='reoffer-confirmation')!;
 const offer=await prepareForgetTurn({history:f.input[0].rows,memory:[],forgetControls:f.controls},f.message,'offer','2026-10-07T01:01:00Z','s',judge);
 assert.equal(offer.controls[0].status,'active');
 const yes=await prepareForgetTurn({history:[...f.input[0].rows,{role:'misaki',text:offer.reply!,requestId:'offer'}],memory:[],forgetControls:offer.controls},'うん','yes',f.now,'s',judge);
 assert.equal(yes.controls[0].status,'released');assert.deepEqual(yes.learned,['弟の隆紀']);
 const current=await evaluate(f,'current'),batch=await evaluate(f,'batch');
 assert.equal(current.metrics.observations.filter(o=>o.task==='reoffer').length,1);assert.equal(batch.metrics.observations.filter(o=>o.task==='reoffer').length,1);
 assert.ok(!batch.metrics.observations.some(o=>o.task==='mask'));
});
test('same result can be wrong, and batch-only correctness is a separate category',()=>{
 assert.equal(classify({leak:true},{leak:true},{leak:false}).classification,'both_same_oracle_mismatch');
 assert.equal(classify({leak:true},{leak:false},{leak:false}).classification,'batch_matches_oracle_only');
});
test('live instrumentation reads actual usage metadata and does not invent absent tokens',async()=>{
 let count=0;
 const transport=liveJudges('fixture-key',async()=>{
  count++;return Response.json({...(count===1?{usageMetadata:{promptTokenCount:120,candidatesTokenCount:30}}:{}),candidates:[{content:{parts:[{text:'{"rows":[]}'}]}}]});
 });
 await transport.current('mask',{targets:[],rows:[]});await transport.batch('mask_batch',{rows:[]});
 assert.equal(transport.observations[0].inputTokens,120);assert.equal(transport.observations[0].outputTokens,30);assert.equal(transport.observations[1].inputTokens,null);
 assert.equal(metrics(transport.observations).inputTokens,null);assert.ok(transport.observations.every(o=>typeof o.latencyMs==='number'));
});
