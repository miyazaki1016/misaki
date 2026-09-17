import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";
import type { ProactiveLifeContext } from "./proactive-life-context.ts";

export type ProactiveDirection = "MISAKI" | "USER" | "US" | "MISAKI_TO_USER" | "MISAKI_TO_US";
export type RelationshipAction = "NORMAL" | "WAIT" | "TEASE" | "SULK" | "CHASE" | "PULL" | "RECONNECT";
export type RelationshipEmotion = "neutral" | "happy" | "lonely" | "sulky" | "concerned" | "affectionate";
export type ProactiveDecisionContext = {
  shouldSend: true; reason: "claimed_after_relationship_action_gate"; direction: ProactiveDirection;
  action: RelationshipAction; emotion: RelationshipEmotion; emotionIntensity: number; intimacyLevel: number;
  relationshipPoints: number; timeBand: "recent"|"same_day"|"one_to_three_days"|"three_to_seven_days"|"seven_plus_days"|"unknown";
  situation: string; plan: string; lifeEvidence: string[]; lifeConfidence: "none"|"explicit";
};
type RelationshipRow={intimacy_level?:number|null;emotion_state?:{primary?:string;intensity?:number}|null;action_state?:string|null;last_interaction_at?:string|null};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
function timeBand(last?:string|null):ProactiveDecisionContext["timeBand"]{if(!last)return"unknown";const h=Math.max(0,(Date.now()-new Date(last).getTime())/3600000);if(h<6)return"recent";if(h<24)return"same_day";if(h<72)return"one_to_three_days";if(h<168)return"three_to_seven_days";return"seven_plus_days"}
function action(v:unknown):RelationshipAction{const a=String(v||"NORMAL").toUpperCase();return ["NORMAL","WAIT","TEASE","SULK","CHASE","PULL","RECONNECT"].includes(a)?a as RelationshipAction:"NORMAL"}
function emotion(v:unknown):RelationshipEmotion{const e=String(v||"neutral").toLowerCase();return ["neutral","happy","lonely","sulky","concerned","affectionate"].includes(e)?e as RelationshipEmotion:"neutral"}
function direction(a:RelationshipAction,e:RelationshipEmotion,life:ProactiveLifeContext):ProactiveDirection{if(e==="concerned"&&life.confidence==="explicit")return"USER";if(a==="RECONNECT"||a==="CHASE")return"MISAKI_TO_USER";if(a==="TEASE"||e==="happy")return"US";if(e==="affectionate")return"MISAKI_TO_US";return"MISAKI"}
export async function buildProactiveDecisionContext(s:SupabaseClient,userId:string,points:number,life:ProactiveLifeContext):Promise<ProactiveDecisionContext>{const{data,error}=await s.from("misaki_relationship_state").select("intimacy_level,emotion_state,action_state,last_interaction_at").eq("user_id",userId).maybeSingle();if(error)throw error;const r=(data||{})as RelationshipRow,a=action(r.action_state),e=emotion(r.emotion_state?.primary);return{shouldSend:true,reason:"claimed_after_relationship_action_gate",direction:direction(a,e,life),action:a,emotion:e,emotionIntensity:clamp(Number(r.emotion_state?.intensity)||0,0,100),intimacyLevel:Math.max(0,Number(r.intimacy_level)||0),relationshipPoints:Math.max(0,points),timeBand:timeBand(r.last_interaction_at),situation:life.situation,plan:life.plan,lifeEvidence:life.evidence,lifeConfidence:life.confidence}}
export function createProactiveDecisionGuide(c:ProactiveDecisionContext){return `【今回の自発行動コンテキスト】\n方向: ${c.direction}\n感情: ${c.emotion}（強さ ${c.emotionIntensity}）\n行動傾向: ${c.action}\n親密度: ${c.intimacyLevel}\n関係時間帯: ${c.timeBand}\n生活根拠の確度: ${c.lifeConfidence}\n\nこのコンテキストは文章と写真の共通の原因です。\n・方向と感情を返事の温度へ自然ににじませる\n・タグ名や内部状態を本文に書かない\n・USER方向でも、根拠のない現在地・勤務・体調・予定を作らない\n・MISAKI方向では、美咲自身の今の気分や短い一言を優先してよい\n・US方向では、二人の関係の空気を優先するが、存在しない出来事を作らない`}
