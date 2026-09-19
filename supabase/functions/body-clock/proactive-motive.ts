export type ProactiveMotive={kind:"life"|"recent_conversation"|"relationship_memory"|"internal_state";evidence:string;summary:string};
type ChatMessage={role:"user"|"misaki";text:string;sentAt?:string};

function clean(s:string){return s.replace(/\s+/g," ").trim().slice(0,140)}
export function deriveProactiveMotive(input:{desire:string;history:ChatMessage[];memory:string[];lifeEvidence:string[]}):ProactiveMotive{
  if(input.desire==="check_in"&&input.lifeEvidence.length)return{kind:"life",evidence:clean(input.lifeEvidence.at(-1)!),summary:"本人が話した生活上の出来事が気になっている"};
  if(input.desire==="reconnect"){
    const recent=[...input.history].reverse().find(x=>x.role==="user"&&x.text.trim());
    if(recent)return{kind:"recent_conversation",evidence:clean(recent.text),summary:"直近のやり取りを受けて関係をつなぎ直したい"};
  }
  if(["talk","be_playful","be_close"].includes(input.desire)){
    const recent=[...input.history].reverse().find(x=>x.role==="user"&&x.text.trim());
    if(recent)return{kind:"recent_conversation",evidence:clean(recent.text),summary:"直近の会話の続きとして自分から関わりたい"};
    const remembered=[...input.memory].reverse().find(x=>x.trim());
    if(remembered)return{kind:"relationship_memory",evidence:clean(remembered),summary:"二人の記憶を背景に自分から関わりたい"};
  }
  return{kind:"internal_state",evidence:"none",summary:"現在の内部状態以外に特定の出来事根拠はない"};
}
export function motiveGuide(m:ProactiveMotive){return `【今回の自発行動の動機】\n種類: ${m.kind}\n意味: ${m.summary}\n根拠: ${m.evidence}\n・根拠は「なぜ今話しかけたいか」の背景であり、必ず本文に引用する必要はない\n・根拠にない出来事、現在地、体調、予定、関係事実を追加しない\n・古い記憶を現在進行形の事実へ変換しない`;}
