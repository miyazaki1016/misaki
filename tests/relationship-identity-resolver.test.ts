import test from "node:test"; import assert from "node:assert/strict";
import {resolveRelationshipIdentity,type IdentityState} from "../lib/relationship-identity-resolver.ts";
const state=(friendship:number,trust:number,playfulness:number,affection:number,romance:number,relationshipStatus:"none"|"romantic_partner"="none")=>({friendship,trust,playfulness,affection,romance,relationshipStatus});
function twice(s:ReturnType<typeof state>,current:IdentityState={primaryIdentity:"friend",candidateIdentity:null,candidateConfirmations:0,constraint:"none"}){
 const a=resolveRelationshipIdentity({state:s,relationshipStateVersion:1,current}); return [a,resolveRelationshipIdentity({state:s,relationshipStateVersion:2,current:{primaryIdentity:a.primaryIdentity,candidateIdentity:a.candidateIdentity,candidateConfirmations:a.candidateConfirmations,candidateSourceVersion:a.candidateSourceVersion,constraint:a.constraint,preRomanticIdentity:a.preRomanticIdentity}})] as const;
}
test("same depth can settle into different identities after two canonical confirmations",()=>{
 assert.equal(twice(state(90,82,92,60,5))[1].primaryIdentity,"partner_in_crime");
 assert.equal(twice(state(90,95,50,85,5))[1].primaryIdentity,"best_friend");
 assert.equal(twice(state(75,90,35,95,10))[1].primaryIdentity,"important_person");
});
test("best friend with mild romance keeps identity and gains awareness",()=>{
 const r=resolveRelationshipIdentity({state:state(90,95,50,90,55),relationshipStateVersion:1,current:{primaryIdentity:"best_friend",constraint:"none"}});
 assert.equal(r.primaryIdentity,"best_friend"); assert.ok(r.traits.includes("romantic_awareness"));
});
test("romance alone cannot manufacture romantic identity",()=>{
 const r=resolveRelationshipIdentity({state:state(25,15,20,20,100),relationshipStateVersion:1,current:{primaryIdentity:"conversation_partner",constraint:"none"}});
 assert.equal(r.primaryIdentity,"conversation_partner"); assert.equal(r.candidateIdentity,null);
});
test("explicit partnership overrides scores; breakup overrides lover and blocks stale romance",()=>{
 const lover=resolveRelationshipIdentity({state:state(20,20,20,20,5,"romantic_partner"),relationshipStateVersion:1,current:{primaryIdentity:"friend",constraint:"none"}});
 assert.equal(lover.primaryIdentity,"lover");
 const ended=resolveRelationshipIdentity({state:state(90,90,50,95,95),relationshipStateVersion:2,current:{primaryIdentity:"lover",constraint:"none",preRomanticIdentity:"best_friend"},criticalEvent:"relationship_end"});
 assert.notEqual(ended.primaryIdentity,"lover"); assert.equal(ended.constraint,"post_breakup");
 const after=resolveRelationshipIdentity({state:state(90,90,50,95,95),relationshipStateVersion:2,current:{primaryIdentity:ended.primaryIdentity,constraint:ended.constraint,preRomanticIdentity:ended.preRomanticIdentity}});
 assert.notEqual(after.candidateIdentity,"special_person");
});
test("candidate must be confirmed by two canonical state observations",()=>{
 const [a,b]=twice(state(78,82,50,85,75)); assert.equal(a.transitionDecision,"hold"); assert.equal(a.primaryIdentity,"friend"); assert.equal(b.primaryIdentity,"special_person");
});

test("duplicate canonical state version cannot satisfy second confirmation",()=>{
 const s=state(78,82,50,85,75);
 const a=resolveRelationshipIdentity({state:s,relationshipStateVersion:10,current:{primaryIdentity:"friend",constraint:"none"}});
 const replay=resolveRelationshipIdentity({state:s,relationshipStateVersion:10,current:{primaryIdentity:a.primaryIdentity,candidateIdentity:a.candidateIdentity,candidateConfirmations:a.candidateConfirmations,candidateSourceVersion:a.candidateSourceVersion,constraint:a.constraint}});
 assert.equal(replay.primaryIdentity,"friend"); assert.equal(replay.candidateConfirmations,1);
});
test("breakup restores safe pre-romantic identity instead of inventing acquaintance",()=>{
 const r=resolveRelationshipIdentity({state:state(90,90,50,95,95),relationshipStateVersion:20,current:{primaryIdentity:"lover",constraint:"none",preRomanticIdentity:"best_friend"},criticalEvent:"relationship_end"});
 assert.equal(r.primaryIdentity,"best_friend"); assert.equal(r.constraint,"post_breakup");
});
