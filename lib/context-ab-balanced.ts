import type {ModelTrialResult,ReadOnlyModelAdapter,FrozenContextSnapshot} from "./context-ab-offline-harness.ts";
import {makePromptVariants} from "./context-ab-prompt.ts";

/** Pure isolated A/B measurement: no database, auth, persistence or logging. */
export async function measureBalancedABBA(snapshot:FrozenContextSnapshot,adapter:ReadOnlyModelAdapter){
 const prompts=makePromptVariants(snapshot.systemPromptTemplate,snapshot.recentReplies);
 const samples:{A:ModelTrialResult[];B:ModelTrialResult[]}={A:[],B:[]};
 for(const variant of ["A","B","B","A"] as const){
  samples[variant].push(await adapter({
   systemInstruction:prompts[variant],history:snapshot.history,userText:snapshot.userText,
  }));
 }
 const summarize=(results:ModelTrialResult[])=>{
  const ok=results.filter(r=>r.success);
  const mean=(values:number[])=>(values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null);
  return {runs:results.length,successes:ok.length,jsonValid:results.filter(r=>r.jsonValid).length,
   meanLatencyMs:mean(ok.map(r=>r.latencyMs)),
   minLatencyMs:ok.length?Math.min(...ok.map(r=>r.latencyMs)):null,
   maxLatencyMs:ok.length?Math.max(...ok.map(r=>r.latencyMs)):null,
   meanPromptTokens:mean(ok.flatMap(r=>r.promptTokens===null?[]:[r.promptTokens])),
   meanOutputTokens:mean(ok.flatMap(r=>r.outputTokens===null?[]:[r.outputTokens]))};
 };
 return {order:"ABBA" as const,promptChars:prompts.metrics,A:summarize(samples.A),B:summarize(samples.B)};
}
