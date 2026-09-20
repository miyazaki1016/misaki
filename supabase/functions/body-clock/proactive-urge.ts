export type ProactiveDesire = "none"|"give_space"|"check_in"|"reconnect"|"talk"|"be_playful"|"be_close"|"share_photo";
export type ProactiveUrge={shouldSend:boolean;strength:number;desire:ProactiveDesire;reason:string};
type Input={photoOpportunity?:boolean;action:"NORMAL"|"WAIT"|"TEASE"|"SULK"|"CHASE"|"PULL"|"RECONNECT";emotion:"neutral"|"happy"|"affectionate"|"concerned"|"hurt"|"sulky"|"guarded";emotionIntensity:number;intimacyLevel:number;lifeConfidence:"none"|"explicit";pushesToday:number};
export function deriveProactiveUrge(input:Input):ProactiveUrge{const intensity=Math.max(0,Math.min(100,input.emotionIntensity));
if(input.action==="PULL"||input.emotion==="guarded")return{shouldSend:false,strength:0,desire:"give_space",reason:"space_is_the_action"};
if(input.action==="SULK"||input.emotion==="hurt"){
 if(input.action==="RECONNECT"&&intensity>=20)return{shouldSend:true,strength:Math.min(100,45+Math.round(intensity*.35)),desire:"reconnect",reason:"repair_wants_contact"};
 return{shouldSend:false,strength:0,desire:"give_space",reason:"hurt_does_not_require_contact"};
}
if(input.action==="WAIT")return{shouldSend:false,strength:0,desire:"none",reason:"waiting_without_new_motive"};
if(input.emotion==="concerned"&&input.lifeConfidence==="explicit"&&intensity>=35)return{shouldSend:true,strength:Math.min(100,55+Math.round(intensity*.35)),desire:"check_in",reason:"grounded_concern_wants_check_in"};
if(input.action==="RECONNECT"&&intensity>=20)return{shouldSend:true,strength:Math.min(100,45+Math.round(intensity*.35)),desire:"reconnect",reason:"repair_wants_contact"};
if(input.photoOpportunity===true&&input.pushesToday===0&&input.intimacyLevel>=2&&input.emotion==="affectionate"&&intensity>=72&&(input.action==="TEASE"||input.action==="CHASE"))return{shouldSend:true,strength:Math.min(90,45+Math.round(intensity*.4)),desire:"share_photo",reason:"strong_affection_wants_to_show_something"};
if(input.action==="TEASE"&&input.emotion==="affectionate"&&intensity>=50)return{shouldSend:true,strength:Math.min(100,40+Math.round(intensity*.35)),desire:"be_playful",reason:"affection_wants_playful_contact"};
if(input.action==="CHASE"&&intensity>=35)return{shouldSend:true,strength:Math.min(100,45+Math.round(intensity*.4)),desire:input.emotion==="affectionate"?"be_close":"talk",reason:"active_feeling_wants_contact"};
if(input.emotion==="affectionate"&&intensity>=65&&input.intimacyLevel>=2&&input.pushesToday===0)return{shouldSend:true,strength:Math.min(85,35+Math.round(intensity*.35)),desire:"be_close",reason:"strong_grounded_affection_wants_contact"};
if(input.emotion==="happy"&&intensity>=70&&input.intimacyLevel>=2&&input.pushesToday===0)return{shouldSend:true,strength:Math.min(75,30+Math.round(intensity*.3)),desire:"talk",reason:"shared_happiness_wants_contact"};
return{shouldSend:false,strength:0,desire:"none",reason:"no_internal_urge"}}
export function desireGuide(d:ProactiveDesire){switch(d){case"check_in":return"今は相手を気にかけたい。根拠のあることだけに触れ、尋問のようにしない。";case"reconnect":return"今は関係をやわらかくつなぎ直したい。過去の傷を蒸し返さず、仲直りを強要しない。";case"talk":return"今は少し話したい。用事を捏造せず、自然な一言として話しかける。";case"be_playful":return"今は少しじゃれたい。親密度を越えた恋人表現へ飛躍しない。";case"be_close":return"今は少し近くにいたい。交際事実がないなら恋人として振る舞わない。";case"share_photo":return"今は何かを見せたい。写真の内容と実際の生活事実を混同しない。";default:return"今は自分から連絡する明確な欲求はない。"}}