export type ProactiveMotive={kind:"life"|"relationship_event"|"recent_conversation"|"relationship_memory"|"internal_state";evidence:string;summary:string;evidenceAt:string|null;freshness:"fresh"|"recent"|"old"|"unknown"};
export type RelationshipEventEvidence={eventType:string;reason:string;createdAt:string;direction?:string};
type ChatMessage={role:"user"|"misaki";text:string;sentAt?:string};
function clean(s:string){return s.replace(/\s+/g," ").trim().slice(0,140)}
function freshness(sentAt?:string){if(!sentAt)return{evidenceAt:null,freshness:"unknown" as const};const t=new Date(sentAt).getTime();if(!Number.isFinite(t))return{evidenceAt:null,freshness:"unknown" as const};const h=Math.max(0,(Date.now()-t)/3600000);return{evidenceAt:new Date(t).toISOString(),freshness:(h<24?"fresh":h<168?"recent":"old") as "fresh"|"recent"|"old"}}
function recentUser(history:ChatMessage[]){return[...history].reverse().find(x=>x.role==="user"&&x.text.trim())}
function usableRelationshipEvent(events:RelationshipEventEvidence[]){return events.find(e=>e.eventType==="emotion_action_v2_after_chat"&&e.reason.trim())}
export function deriveProactiveMotive(input:{desire:string;history:ChatMessage[];memory:string[];lifeEvidence:string[];relationshipEvents?:RelationshipEventEvidence[]}):ProactiveMotive{
 const user=recentUser(input.history),age=freshness(user?.sentAt),event=usableRelationshipEvent(input.relationshipEvents??[]),eventAge=freshness(event?.createdAt);
 if(input.desire==="check_in"&&input.lifeEvidence.length)return{kind:"life",evidence:clean(input.lifeEvidence.at(-1)!),summary:"本人が話した生活上の出来事が気になっている",...age};
 if(input.desire==="reconnect"&&event&&eventAge.freshness!=="old")return{kind:"relationship_event",evidence:clean(event.reason),summary:"保存された二人の関係の出来事を受けて、つなぎ直したい",...eventAge};
 if(input.desire==="reconnect"&&user)return{kind:"recent_conversation",evidence:clean(user.text),summary:"直近のやり取りを受けて関係をつなぎ直したい",...age};
 if(["talk","be_playful","be_close"].includes(input.desire)){
   if(event&&eventAge.freshness!=="old")return{kind:"relationship_event",evidence:clean(event.reason),summary:"保存された関係の変化を背景に自分から関わりたい",...eventAge};
   if(user&&age.freshness!=="old")return{kind:"recent_conversation",evidence:clean(user.text),summary:"直近の会話の続きとして自分から関わりたい",...age};
   const remembered=[...input.memory].reverse().find(x=>x.trim());
   if(remembered)return{kind:"relationship_memory",evidence:clean(remembered),summary:"二人の記憶を背景に自分から関わりたい",evidenceAt:null,freshness:"unknown"};
 }
 return{kind:"internal_state",evidence:"none",summary:"現在の内部状態以外に特定の出来事根拠はない",evidenceAt:null,freshness:"unknown"};
}
export function motiveGuide(m:ProactiveMotive){return `【今回の自発行動の動機】\n種類: ${m.kind}\n意味: ${m.summary}\n根拠: ${m.evidence}\n根拠の新しさ: ${m.freshness}\n・根拠は「なぜ今話しかけたいか」の背景であり、必ず本文に引用する必要はない\n・relationship_event は保存済みの関係変化であり、そこにない会話内容を捏造しない\n・old / unknown の根拠を現在進行形の事実として扱わない\n・根拠にない出来事、現在地、体調、予定、関係事実を追加しない\n・記憶は関係の背景には使えるが、現在の生活状況の証拠にはしない`;}
