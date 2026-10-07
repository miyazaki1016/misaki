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

test("constraint anchor blocks stale same-version promotion after breakup",()=>{
 const ended=resolveRelationshipIdentity({state:state(90,90,50,95,95),relationshipStateVersion:20,current:{primaryIdentity:"lover",constraint:"none",preRomanticIdentity:"best_friend"},criticalEvent:"relationship_end"});
 assert.equal(ended.constraintAnchorVersion,20);
 const same=resolveRelationshipIdentity({state:state(90,90,50,95,95),relationshipStateVersion:20,current:{primaryIdentity:ended.primaryIdentity,constraint:ended.constraint,constraintAnchorVersion:ended.constraintAnchorVersion,preRomanticIdentity:ended.preRomanticIdentity}});
 assert.equal(same.primaryIdentity,"best_friend"); assert.equal(same.candidateIdentity,null);
});
test("only a post-anchor canonical state can start rebuilding identity",()=>{
 const current:IdentityState={primaryIdentity:"friend",constraint:"post_breakup",constraintAnchorVersion:20,preRomanticIdentity:"friend"};
 const same=resolveRelationshipIdentity({state:state(90,95,50,85,5),relationshipStateVersion:20,current});
 assert.equal(same.candidateIdentity,null);
 const newer=resolveRelationshipIdentity({state:state(90,95,50,85,5),relationshipStateVersion:21,current});
 assert.equal(newer.candidateIdentity,"best_friend"); assert.equal(newer.candidateConfirmations,1); assert.equal(newer.candidateSourceVersion,21);
});
test("duplicate post-anchor version cannot complete rebuilding confirmation",()=>{
 const current:IdentityState={primaryIdentity:"friend",constraint:"post_breakup",constraintAnchorVersion:20,preRomanticIdentity:"friend"};
 const first=resolveRelationshipIdentity({state:state(90,95,50,85,5),relationshipStateVersion:21,current});
 const replay=resolveRelationshipIdentity({state:state(90,95,50,85,5),relationshipStateVersion:21,current:{primaryIdentity:first.primaryIdentity,candidateIdentity:first.candidateIdentity,candidateConfirmations:first.candidateConfirmations,candidateSourceVersion:first.candidateSourceVersion,constraint:first.constraint,constraintAnchorVersion:first.constraintAnchorVersion,preRomanticIdentity:first.preRomanticIdentity}});
 assert.equal(replay.primaryIdentity,"friend"); assert.equal(replay.candidateConfirmations,1);
});
test("post rejection blocks romantic promotion while allowing friendship-side rebuilding",()=>{
 const rejected=resolveRelationshipIdentity({state:state(78,82,50,85,75),relationshipStateVersion:30,current:{primaryIdentity:"friend",constraint:"none"},criticalEvent:"romantic_rejection"});
 assert.equal(rejected.constraint,"post_rejection"); assert.equal(rejected.constraintAnchorVersion,30); assert.equal(rejected.candidateIdentity,null);
 const friendship=resolveRelationshipIdentity({state:state(90,95,50,85,75),relationshipStateVersion:31,current:{primaryIdentity:"friend",constraint:"post_rejection",constraintAnchorVersion:30}});
 assert.equal(friendship.candidateIdentity,"best_friend"); assert.notEqual(friendship.candidateIdentity,"special_person");
});

test("post-breakup constraint remains until relationship is rebuilt; it is not a timer",()=>{
 const first=resolveRelationshipIdentity({state:state(90,95,50,85,5),relationshipStateVersion:21,current:{primaryIdentity:"friend",constraint:"post_breakup",constraintAnchorVersion:20}});
 assert.equal(first.constraint,"post_breakup"); assert.equal(first.candidateConfirmations,1);
 const second=resolveRelationshipIdentity({state:state(90,95,50,85,5),relationshipStateVersion:22,current:{primaryIdentity:first.primaryIdentity,candidateIdentity:first.candidateIdentity,candidateConfirmations:first.candidateConfirmations,candidateSourceVersion:first.candidateSourceVersion,constraint:first.constraint,constraintAnchorVersion:first.constraintAnchorVersion}});
 assert.equal(second.primaryIdentity,"best_friend");
 assert.equal(second.constraint,"post_breakup");
});

test("normal distant growth holds the current identity on first observation while tracking the raw candidate",()=>{
 const r=resolveRelationshipIdentity({state:state(58,62,35,58,8),relationshipStateVersion:1,current:{primaryIdentity:"conversation_partner",constraint:"none"}});
 assert.equal(r.primaryIdentity,"conversation_partner");
 assert.equal(r.candidateIdentity,"trusted_friend");
 assert.equal(r.candidateConfirmations,1);
 assert.equal(r.transitionDecision,"hold");
});
test("strong canonical shape may escape adjacency without becoming a mandatory ladder",()=>{
 const r=resolveRelationshipIdentity({state:state(88,90,55,78,8),relationshipStateVersion:1,current:{primaryIdentity:"friend",constraint:"none"}});
 assert.equal(r.candidateIdentity,"best_friend");
});
test("adjacency does not turn high romance into lover status",()=>{
 const r=resolveRelationshipIdentity({state:state(78,82,50,85,75),relationshipStateVersion:1,current:{primaryIdentity:"friend",constraint:"none"}});
 assert.notEqual(r.candidateIdentity,"lover");
});

test("post-rejection romance reentry requires a new canonical romance pattern",()=>{
 const current:IdentityState={primaryIdentity:"friend",constraint:"post_rejection",constraintAnchorVersion:10};
 const stale=resolveRelationshipIdentity({state:state(78,82,50,85,75),relationshipStateVersion:11,current,hasNewRomancePattern:false});
 assert.notEqual(stale.candidateIdentity,"special_person");
 assert.notEqual(stale.candidateIdentity,"person_of_interest");
 const fresh=resolveRelationshipIdentity({state:state(78,82,50,85,75),relationshipStateVersion:11,current,hasNewRomancePattern:true});
 assert.ok(fresh.candidateIdentity==="special_person"||fresh.candidateIdentity==="person_of_interest");
});
test("post-breakup friendship-only state update cannot revive romance identity",()=>{
 const r=resolveRelationshipIdentity({state:state(78,82,50,85,75),relationshipStateVersion:21,current:{primaryIdentity:"best_friend",constraint:"post_breakup",constraintAnchorVersion:20},hasNewRomancePattern:false});
 assert.notEqual(r.candidateIdentity,"special_person");
 assert.notEqual(r.candidateIdentity,"person_of_interest");
});
test("boundary constraint blocks romance reentry even with a new romance pattern",()=>{
 const r=resolveRelationshipIdentity({state:state(78,82,50,85,75),relationshipStateVersion:31,current:{primaryIdentity:"friend",constraint:"boundary",constraintAnchorVersion:30},hasNewRomancePattern:true});
 assert.notEqual(r.candidateIdentity,"special_person");
 assert.notEqual(r.candidateIdentity,"person_of_interest");
});
