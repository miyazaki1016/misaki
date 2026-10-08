/**
 * Isolated synthetic quality A/B. No Supabase, production chat, or user data.
 * Live API requests require MISAKI_AB_LIVE=YES and GEMINI_API_KEY.
 * Only aggregate numeric pass/fail counts are logged; no model text.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { randomInt } from "node:crypto";
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
const exportReview = process.env.MISAKI_AB_EXPORT_REVIEW === "YES";
const reviewItems: Array<{scenarioId:string; description:string; userText:string; response1:string; response2:string}> = [];
const reviewKeys: Array<{scenarioId:string; response1:"A"|"B"; response2:"A"|"B"}> = [];
let count=0;
for (const scenario of qualityScenarios) {
  const replies=scenario.history.filter(h=>h.role==="model").map(h=>h.text);
  const variants=makePromptVariants(fixture.systemPromptTemplate,replies);
  const metrics:Record<string,boolean | number>={};
  const captured: Partial<Record<"A"|"B",string>> = {};
  for (const variant of ["A","B"] as const) {
    if (count++ && delayMs) await new Promise(resolve=>setTimeout(resolve,delayMs));
    const stats=totals[variant]; stats.calls++;
    try {
      const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
        method:"POST",
        headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
        signal:AbortSignal.timeout(30000),
        body:JSON.stringify({
          systemInstruction:{parts:[{text:variants[variant]+`\n\n【出力形式】必ずJSONオブジェクトで返してください。会話本文は文字列の reply キーに入れてください。例: {"reply":"こんにちは"}。他のキーは任意です。`}]},
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
      if (exportReview && response.ok) captured[variant]=reply;
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
  if (exportReview && captured.A && captured.B) {
    const swap=randomInt(2)===1;
    reviewItems.push({scenarioId:scenario.id,description:scenario.description,userText:scenario.userText,response1:swap?captured.B:captured.A,response2:swap?captured.A:captured.B});
    reviewKeys.push({scenarioId:scenario.id,response1:swap?"B":"A",response2:swap?"A":"B"});
  }
}
console.log(JSON.stringify({mode:"synthetic-quality-ab",model,delayMs,totals,scenarioCounts,notes:"Heuristic checks only; no human quality judgment and not a Production-equivalent prompt."},null,2));

if (exportReview) {
  mkdirSync("ab-review-output",{recursive:true});
  writeFileSync("ab-review-output/blind-review.json",JSON.stringify({notice:"Synthetic scenarios only. Human ratings are not automatic quality proof.",items:reviewItems},null,2),{mode:0o600});
  writeFileSync("ab-review-output/blind-key.json",JSON.stringify(reviewKeys,null,2),{mode:0o600});
  console.log(JSON.stringify({reviewExported:true,reviewPairs:reviewItems.length,replyTextLogged:false}));
}
