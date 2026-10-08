import {createClient} from "@supabase/supabase-js";
import {loadCanonicalState} from "../../../../lib/canonical-state";
import {selectLastUserReplayBoundary} from "../../../../lib/context-ab-replay-boundary";
import {makePromptVariants} from "../../../../lib/context-ab-prompt";
import {createIsolatedGeminiAdapter} from "../../../../lib/context-ab-gemini-adapter";

/** Preview-only, opt-in, two-call read-only benchmark. No personal text in response or logs. */
export async function POST(request:Request){
 if(process.env.VERCEL_ENV!=="preview") return Response.json({error:"Preview only"},{status:404});
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
 if(!token) return Response.json({error:"Login required"},{status:401});
 const db=createClient("https://tzozajnwznxqgxnjikoy.supabase.co","sb_publishable_ZEYZ3tc1RLE7EuClbUP4vA_ISHWfKr1",{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data:{user},error}=await db.auth.getUser(token);
 if(error||!user||user.is_anonymous||user.email?.toLowerCase()!=="miyazaki1016@gmail.com") return Response.json({error:"Not authorized"},{status:403});
 const key=process.env.MISAKI_AB_GEMINI_API_KEY||process.env.GEMINI_API_KEY;
 if(!key) return Response.json({error:"Preview Gemini key is not configured; no calls made"},{status:503});
 try{
  const state=await loadCanonicalState(user.id);
  const history=state.history;
  if(!Array.isArray(history)||history.length<4) return Response.json({error:"Insufficient history"},{status:422});
  const fixture=selectLastUserReplayBoundary(history.slice(-60));
  const turns=fixture.history.map(turn=>({role:turn.role,text:turn.parts[0].text}));
  const replies=turns.filter(turn=>turn.role==="model").slice(-8).map(turn=>turn.text);
  const template=["あなたは美咲という日本語の会話AIです。これまでの会話の文脈と関係性を自然に尊重し、過去の発言を不必要に繰り返さず短く返答してください。","{{RECENT_REPLY_SECTION}}",'必ずJSONオブジェクトで返答してください。形式: {"reply":"..."}'].join("\n");
  const prompts=makePromptVariants(template,replies);
  const adapter=createIsolatedGeminiAdapter({apiKey:key,model:process.env.MISAKI_AB_MODEL||"gemini-3.1-flash-lite",allowLiveRequests:true,timeoutMs:30000});
  const A=await adapter({systemInstruction:prompts.A,history:turns,userText:fixture.nextUserText});
  const B=await adapter({systemInstruction:prompts.B,history:turns,userText:fixture.nextUserText});
  return Response.json({mode:"real-history-preview-isolated",promptType:"simplified experimental persona, not production system prompt",historyTurns:turns.length,model:process.env.MISAKI_AB_MODEL||"gemini-3.1-flash-lite",promptChars:prompts.metrics,A,B},{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"Experiment failed; no production state was changed"},{status:500});}
}
