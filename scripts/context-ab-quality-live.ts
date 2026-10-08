/**
 * Isolated synthetic quality A/B. No Supabase, production chat, or user data.
 * Live API requests require MISAKI_AB_LIVE=YES and GEMINI_API_KEY.
 * Only aggregate numeric pass/fail counts are logged; no model text.
 */
import { qualityScenarios, assessQualityReply } from "../lib/context-ab-quality.ts";
import { makePromptVariants } from "../lib/context-ab-prompt.ts";
import { makeSyntheticLongContext } from "../lib/context-ab-long-fixture.ts";

if (process.env.MISAKI_AB_LIVE !== "YES") throw new Error("Explicit live opt-in required");
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is required");
const model = process.env.MISAKI_AB_MODEL;
if (!model) throw new Error("MISAKI_AB_MODEL is required");
const delayMs = Number(process.env.MISAKI_AB_DELAY_MS ?? "10000");
if (!Number.isSafeInteger(delayMs) || delayMs < 0 || delayMs > 120000) throw new Error("Invalid delay");
const fixture = makeSyntheticLongContext();
const totals = { A: {calls:0,http200:0,jsonValid:0,passed:0}, B: {calls:0,http200:0,jsonValid:0,passed:0} };
const scenarioCounts: Record<string,Record<string,boolean | number>> = {};
let count=0;
for (const scenario of qualityScenarios) {
  const replies=scenario.history.filter(h=>h.role==="model").map(h=>h.text);
  const variants=makePromptVariants(fixture.systemPromptTemplate,replies);
  const metrics:Record<string,boolean | number>={};
  for (const variant of ["A","B"] as const) {
    if (count++ && delayMs) await new Promise(resolve=>setTimeout(resolve,delayMs));
    const stats=totals[variant]; stats.calls++;
    try {
      const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
        method:"POST",
        headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
        signal:AbortSignal.timeout(30000),
        body:JSON.stringify({
          systemInstruction:{parts:[{text:variants[variant]+"\n\n【出力形式】必ずJSONオブジェクトで返してください。会話本文は文字列の reply キーに入れてください。例: {\\\"reply\\\":\\\"こんにちは\\\"}。他のキーは任意です。"}]},
          contents:[...scenario.history.map(h=>({role:h.role,parts:[{text:h.text}]})),{role:"user",parts:[{text:scenario.userText}]}],
          generationConfig:{responseMimeType:"application/json",temperature:0},
        }),
      });
      metrics[variant+"HttpStatus"]=response.status;
      if(response.ok)stats.http200++;
      const payload=await response.json() as {candidates?:{content?:{parts?:{text?:string}[]}}[]};
      const raw=payload.candidates?.[0]?.content?.parts?.map(p=>p.text??"").join("")??"";
      let parsed:unknown;
      try{parsed=JSON.parse(raw);}catch{parsed=null;}
      const valid=parsed!==null && typeof parsed==="object";
      if(valid)stats.jsonValid++;
      const reply=valid && typeof (parsed as {reply?:unknown}).reply==="string" ? (parsed as {reply:string}).reply : "";
      const result=assessQualityReply(scenario,reply);
      metrics[variant+"ReplyFieldPresent"]=valid && typeof (parsed as {reply?:unknown}).reply==="string";
      metrics[variant+"Nonempty"]=result.nonempty;
      metrics[variant+"ExpectedFactsPresent"]=result.expectedFactsPresent;
      metrics[variant+"UnsupportedClaimsAbsent"]=result.unsupportedClaimsAbsent;
      const passed=response.ok && valid && result.nonempty && result.expectedFactsPresent && result.unsupportedClaimsAbsent;
      metrics[variant+"Passed"]=passed;
      if(passed)stats.passed++;
    }catch{
      metrics[variant+"HttpStatus"]=0;
      metrics[variant+"Passed"]=false;
      metrics[variant+"RequestError"]=true;
    }
  }
  scenarioCounts[scenario.id]=metrics;
}
console.log(JSON.stringify({mode:"synthetic-quality-ab",model,delayMs,totals,scenarioCounts,notes:"Heuristic checks only; no human quality judgment and not a Production-equivalent prompt."},null,2));
