export type ProactiveUrge = {
  shouldSend: boolean;
  strength: number;
  reason: string;
};

type Input = {
  action: "NORMAL"|"WAIT"|"TEASE"|"SULK"|"CHASE"|"PULL"|"RECONNECT";
  emotion: "neutral"|"happy"|"affectionate"|"concerned"|"hurt"|"sulky"|"guarded";
  emotionIntensity: number;
  lifeConfidence: "none"|"explicit";
  pushesToday: number;
};

export function deriveProactiveUrge(input: Input): ProactiveUrge {
  const intensity=Math.max(0,Math.min(100,input.emotionIntensity));
  if(input.action==="PULL"||input.emotion==="guarded")
    return {shouldSend:false,strength:0,reason:"space_is_the_action"};
  if(input.action==="SULK"||input.emotion==="hurt")
    return {shouldSend:false,strength:0,reason:"hurt_does_not_require_contact"};
  if(input.emotion==="concerned"&&input.lifeConfidence==="explicit"&&intensity>=35)
    return {shouldSend:true,strength:Math.min(100,55+Math.round(intensity*.35)),reason:"grounded_concern_wants_check_in"};
  if(input.action==="RECONNECT"&&intensity>=20)
    return {shouldSend:true,strength:Math.min(100,45+Math.round(intensity*.35)),reason:"repair_wants_contact"};
  if(input.action==="CHASE"&&intensity>=35)
    return {shouldSend:true,strength:Math.min(100,45+Math.round(intensity*.4)),reason:"active_feeling_wants_contact"};
  if(input.action==="TEASE"&&input.emotion==="affectionate"&&intensity>=50)
    return {shouldSend:true,strength:Math.min(100,40+Math.round(intensity*.35)),reason:"affection_wants_playful_contact"};
  if(input.emotion==="affectionate"&&intensity>=65&&input.pushesToday===0)
    return {shouldSend:true,strength:Math.min(85,35+Math.round(intensity*.35)),reason:"strong_affection_wants_contact"};
  return {shouldSend:false,strength:0,reason:"no_internal_urge"};
}
