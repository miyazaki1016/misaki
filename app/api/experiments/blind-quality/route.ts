import {createClient} from "@supabase/supabase-js";
import {loadCanonicalState} from "../../../../lib/canonical-state";
import {selectLastUserReplayBoundary} from "../../../../lib/context-ab-replay-boundary";
import {makePromptVariants} from "../../../../lib/context-ab-prompt";
import {BlindQualitySafeError,decodeBlindQualityReply} from "../../../../lib/context-ab-blind-quality";

/** Preview-only, owner-authorized, read-only blind quality comparison. Never logs replies. */
export async function POST(request:Request){
 const noStore={"Cache-Control":"private, no-store, max-age=0"};
 if(process.env.VERCEL_ENV!=="preview") return Response.json({error:"Preview only"},{status:404,headers:noStore});
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
 if(!token) return Response.json({error:"Login required"},{status:401,headers:noStore});
 const db=createClient("https://tzozajnwznxqgxnjikoy.supabase.co","sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1",{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data:{user},error}=await db.auth.getUser(token);
 if(error||!user||user.is_anonymous||user.email?.toLowerCase()!=="miyazaki1016@gmail.com")return Response.json({error:"Not authorized"},{status:403,headers:noStore});
 if(request.headers.get("x-misaki-quality-consent")!=="YES")return Response.json({error:"Explicit consent required"},{status:400,headers:noStore});
 const key=process.env.MISAKI_AB_GEMINI_API_KEY||process.env.GEMINI_API_KEY;
 if(!key)return Response.json({error:"Gemini key unavailable"},{status:503,headers:noStore});
 let stage="load-history";
 try{
  const state=await loadCanonicalState(user.id);
  if(!Array.isArray(state.history)||state.history.length<4)return Response.json({error:"Insufficient history"},{status:422,headers:noStore});
  stage="prepare-history";
  const fixture=selectLastUserReplayBoundary(state.history.slice(-60));
  const history=fixture.history.map(turn=>({role:turn.role,parts:[{text:turn.parts[0].text}]}));
  const replies=fixture.history.filter(turn=>turn.role==="model").slice(-8).map(turn=>turn.parts[0].text);
  const template=["あなたは美咲という日本語の会話AIです。これまでの会話の文脈と関係性を自然に尊重し、過去の発言を不必要に繰り返さず短く返答してください。","{{RECENT_REPLY_SECTION}}",'必ずJSONオブジェクトで返答してください。形式: {"reply":"..."}'].join("\n");
  const prompts=makePromptVariants(template,replies);
  const model=process.env.MISAKI_AB_MODEL||"gemini-3.1-flash-lite";
  const generate=async(systemInstruction:string)=>{
   const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
    method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},signal:AbortSignal.timeout(30000),
    body:JSON.stringify({systemInstruction:{parts:[{text:systemInstruction}]},contents:[...history,{role:"user",parts:[{text:fixture.nextUserText}]}],generationConfig:{responseMimeType:"application/json",temperature:0}}),
   });
   if(!response.ok)throw new BlindQualitySafeError("gemini-http-error",response.status);
   let payload:unknown;
   try{payload=await response.json();}catch{throw new BlindQualitySafeError("gemini-empty-response");}
   return decodeBlindQualityReply(payload);
  };
  // X/Y labels are randomized independently of call order; do not expose the mapping until review.
  stage="gemini-first";
  const firstA=Math.random()<0.5;
  const first=await generate(firstA?prompts.A:prompts.B);
  stage="gemini-second";
  const second=await generate(firstA?prompts.B:prompts.A);
  const reviewId=crypto.randomUUID();
  // No database writes. Mapping is returned only to this authenticated owner and held in browser memory.
  return Response.json({mode:"preview-blind-quality",reviewId,X:first,Y:second,key:{X:firstA?"A":"B",Y:firstA?"B":"A"},model,historyTurns:history.length},{headers:noStore});
 }catch(error){
  const diagnostic=error instanceof BlindQualitySafeError
   ? {reasonCode:error.code,...(error.upstreamStatus?{upstreamStatus:error.upstreamStatus}:{})}
   : {reasonCode:stage==="load-history"?"history-load-failed":stage==="prepare-history"?"history-preparation-failed": "gemini-request-failed"};
  return Response.json({error:"Quality comparison failed; production unchanged",stage,...diagnostic},{status:500,headers:noStore});
 }
}
