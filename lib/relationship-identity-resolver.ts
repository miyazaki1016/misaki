export const RELATIONSHIP_IDENTITIES = ["acquaintance","conversation_partner","friend","compatible_friend","trusted_friend","partner_in_crime","best_friend","important_person","person_of_interest","special_person","lover"] as const;
export type RelationshipIdentity = typeof RELATIONSHIP_IDENTITIES[number];
export type RelationshipConstraint = "none" | "post_breakup" | "post_rejection" | "boundary";
export type RelationshipTrait = "comfortable" | "deep_trust" | "playful_sync" | "strong_affection" | "romantic_awareness";
export type IdentityDecision = "maintain" | "promote" | "demote" | "lateral" | "canonical_override" | "hold";
export type AxisState = { friendship:number; trust:number; playfulness:number; affection:number; romance:number; relationshipStatus?:"none"|"romantic_partner" };
export type IdentityState = { primaryIdentity:RelationshipIdentity; candidateIdentity?:RelationshipIdentity|null; candidateConfirmations?:number; candidateSourceVersion?:number|null; constraint?:RelationshipConstraint; constraintAnchorVersion?:number|null; preRomanticIdentity?:Exclude<RelationshipIdentity,"lover">|null };
export type IdentityInput = { state:AxisState; relationshipStateVersion:number; current?:IdentityState; criticalEvent?:"romantic_acceptance"|"romantic_rejection"|"relationship_end"|"boundary_event"|"reconciliation"|null };
export type IdentityResult = { primaryIdentity:RelationshipIdentity; traits:RelationshipTrait[]; candidateIdentity:RelationshipIdentity|null; candidateConfirmations:number; candidateSourceVersion:number|null; constraint:RelationshipConstraint; constraintAnchorVersion:number|null; preRomanticIdentity:Exclude<RelationshipIdentity,"lover">|null; transitionDecision:IdentityDecision; reasonCode:string };

const centers:Record<Exclude<RelationshipIdentity,"lover">,[number,number,number,number,number]>={
 acquaintance:[15,10,10,10,0], conversation_partner:[30,20,15,20,0], friend:[50,35,30,30,5],
 compatible_friend:[65,45,70,40,5], trusted_friend:[65,70,35,50,5], partner_in_crime:[82,72,82,58,8],
 best_friend:[88,90,55,78,8], important_person:[72,82,42,90,12], person_of_interest:[58,48,38,48,55],
 special_person:[75,78,48,80,72]
};
const gates:Record<Exclude<RelationshipIdentity,"lover">,(s:AxisState)=>boolean>={
 acquaintance:()=>true, conversation_partner:s=>s.friendship>=20||s.trust>=15||s.affection>=15,
 friend:s=>s.friendship>=40&&Math.max(s.trust,s.playfulness,s.affection)>=25,
 compatible_friend:s=>s.friendship>=55&&s.playfulness>=55, trusted_friend:s=>s.friendship>=55&&s.trust>=60,
 partner_in_crime:s=>s.friendship>=70&&s.trust>=55&&s.playfulness>=70,
 best_friend:s=>s.friendship>=75&&s.trust>=80&&s.affection>=65,
 important_person:s=>s.trust>=70&&s.affection>=80&&s.friendship>=55,
 person_of_interest:s=>s.romance>=45&&Math.max(s.friendship,s.trust,s.affection)>=45&&(s.trust+s.affection)>=90,
 special_person:s=>s.romance>=65&&s.trust>=65&&s.affection>=70&&s.friendship>=60
};
function distance(s:AxisState,c:[number,number,number,number,number]){
 const a=[s.friendship,s.trust,s.playfulness,s.affection,s.romance],w=[1,1,1,1,.35];
 return a.reduce((n,v,i)=>n+w[i]*((v-c[i])/100)**2,0)/w.reduce((a,b)=>a+b,0);
}
function candidate(s:AxisState,constraint:RelationshipConstraint){
 if(s.relationshipStatus==="romantic_partner") return "lover" as const;
 const blockedRomance=constraint!=="none";
 const ranked=(Object.keys(centers) as Exclude<RelationshipIdentity,"lover">[])
  .filter(id=>gates[id](s)&&(!blockedRomance||!["person_of_interest","special_person"].includes(id)))
  .map(id=>[id,distance(s,centers[id])] as const).sort((a,b)=>a[1]-b[1]);
 if(!ranked.length||ranked[0][1]>.30) return null;
 // Romance without relational foundation must never manufacture relationship growth.
 if(s.romance>=80&&Math.max(s.friendship,s.trust,s.affection)<45) return null;
 return ranked[0][0];
}
const neighbors:Record<Exclude<RelationshipIdentity,"lover">,readonly Exclude<RelationshipIdentity,"lover">[]>={
 acquaintance:["conversation_partner"], conversation_partner:["acquaintance","friend"],
 friend:["conversation_partner","compatible_friend","trusted_friend","person_of_interest","important_person"],
 compatible_friend:["friend","partner_in_crime","important_person"], trusted_friend:["friend","best_friend","important_person"],
 partner_in_crime:["compatible_friend","important_person","special_person"], best_friend:["trusted_friend","important_person","special_person"],
 important_person:["friend","compatible_friend","trusted_friend","partner_in_crime","best_friend","person_of_interest","special_person"],
 person_of_interest:["friend","important_person","special_person"], special_person:["person_of_interest","important_person","partner_in_crime","best_friend"]
};
function adjacentTarget(current:RelationshipIdentity,target:RelationshipIdentity,s:AxisState){
 if(current==="lover"||target==="lover"||neighbors[current].includes(target)) return target;
 const local=neighbors[current].filter(id=>gates[id](s)).map(id=>[id,distance(s,centers[id])] as const).sort((a,b)=>a[1]-b[1]);
 // Escape only when canonical shape overwhelmingly supports a distant region; normal movement prefers a supported neighbor.
 const targetDistance=distance(s,centers[target]);
 if(targetDistance<=.015) return target;
 return local[0]?.[0]??target;
}
export function deriveRelationshipTraits(s:AxisState):RelationshipTrait[]{
 const out:RelationshipTrait[]=[]; if(Math.max(s.friendship,s.trust,s.affection)>=50)out.push("comfortable");
 if(s.trust>=70)out.push("deep_trust"); if(s.playfulness>=70&&s.friendship>=60)out.push("playful_sync");
 if(s.affection>=75)out.push("strong_affection"); if(s.romance>=45&&Math.max(s.friendship,s.trust,s.affection)>=45)out.push("romantic_awareness"); return out;
}
export function resolveRelationshipIdentity(input:IdentityInput):IdentityResult{
 const cur=input.current??{primaryIdentity:"acquaintance",candidateIdentity:null,candidateConfirmations:0,constraint:"none"};
 let constraint=cur.constraint??"none"; let constraintAnchorVersion=cur.constraintAnchorVersion??null;
 if(input.criticalEvent==="relationship_end"){ constraint="post_breakup"; constraintAnchorVersion=input.relationshipStateVersion; }
 if(input.criticalEvent==="romantic_rejection"){ constraint="post_rejection"; constraintAnchorVersion=input.relationshipStateVersion; }
 if(input.criticalEvent==="boundary_event"){ constraint="boundary"; constraintAnchorVersion=input.relationshipStateVersion; }
 if(input.state.relationshipStatus==="romantic_partner"||input.criticalEvent==="romantic_acceptance")
  return {primaryIdentity:"lover",traits:deriveRelationshipTraits(input.state),candidateIdentity:null,candidateConfirmations:0,candidateSourceVersion:null,constraint:"none",constraintAnchorVersion:null,preRomanticIdentity:cur.primaryIdentity==="lover"?(cur.preRomanticIdentity??null):cur.primaryIdentity,transitionDecision:"canonical_override",reasonCode:"explicit_romantic_partnership"};
 if(input.criticalEvent==="relationship_end"&&cur.primaryIdentity==="lover")
  return {primaryIdentity:cur.preRomanticIdentity??"acquaintance",traits:deriveRelationshipTraits(input.state),candidateIdentity:null,candidateConfirmations:0,candidateSourceVersion:null,constraint,constraintAnchorVersion,preRomanticIdentity:cur.preRomanticIdentity??null,transitionDecision:"canonical_override",reasonCode:"explicit_relationship_end_restore_safe_identity"};
 const hasPostAnchorState=constraint==="none"||constraintAnchorVersion==null||input.relationshipStateVersion>constraintAnchorVersion;
 const rawNext=hasPostAnchorState?candidate(input.state,constraint):null;
 // Adjacency shapes ordinary growth. Post-constraint rebuilding is already guarded by the anchor, romance block, and two distinct canonical confirmations, so do not distort its safe non-romantic candidate through the ordinary graph.\n const next=rawNext?(constraint==="none"?adjacentTarget(cur.primaryIdentity,rawNext,input.state):rawNext):null;
 if(!next||next===cur.primaryIdentity) return {primaryIdentity:cur.primaryIdentity,traits:deriveRelationshipTraits(input.state),candidateIdentity:null,candidateConfirmations:0,candidateSourceVersion:null,constraint,constraintAnchorVersion,preRomanticIdentity:cur.preRomanticIdentity??null,transitionDecision:"maintain",reasonCode:next?"current_identity_supported":"candidate_refused"};
 const sameCandidate=cur.candidateIdentity===next;
 const sameSource=sameCandidate&&cur.candidateSourceVersion===input.relationshipStateVersion;
 const confirmations=sameSource?(cur.candidateConfirmations??1):(sameCandidate?(cur.candidateConfirmations??0)+1:1);
 if(confirmations<2) return {primaryIdentity:cur.primaryIdentity,traits:deriveRelationshipTraits(input.state),candidateIdentity:next,candidateConfirmations:confirmations,candidateSourceVersion:input.relationshipStateVersion,constraint,constraintAnchorVersion,preRomanticIdentity:cur.preRomanticIdentity??null,transitionDecision:"hold",reasonCode:sameSource?"duplicate_source_version_ignored":"candidate_requires_second_canonical_state"};
 return {primaryIdentity:next,traits:deriveRelationshipTraits(input.state),candidateIdentity:null,candidateConfirmations:0,candidateSourceVersion:null,constraint,constraintAnchorVersion,preRomanticIdentity:cur.preRomanticIdentity??null,transitionDecision:"lateral",reasonCode:"candidate_confirmed_by_distinct_state_versions"};
}
