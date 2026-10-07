import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { RELATIONSHIP_IDENTITIES, resolveRelationshipIdentity, type IdentityInput } from "../lib/relationship-identity-resolver.ts";
import { applyTemporaryEvidence, type Snapshot, type Evidence, type Turn } from "../lib/relationship-engine-v1.ts";

const source=fs.readFileSync(new URL("../lib/relationship-identity-resolver.ts",import.meta.url),"utf8");
// Test-only instrumentation: keep private geometry out of the production resolver API.
async function instrument(reorder=false){
 const insertion=reorder?"const reversed=Object.entries(centers).reverse(); for(const k of Object.keys(centers)) delete centers[k]; Object.assign(centers,Object.fromEntries(reversed)); for(const k of Object.keys(neighbors)) neighbors[k]=[...neighbors[k]].reverse();":"";
 const js=ts.transpileModule(source+"\n"+insertion+"\nexport {centers,neighbors,gates,adjacentTarget,candidate,distance,uniqueClosest};",{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 return import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
}
const shape=(values:number[])=>({friendship:values[0],trust:values[1],playfulness:values[2],affection:values[3],romance:values[4],relationshipStatus:"none" as const});

test("all 11 identities: geometry, constraints, provenance, overrides and hysteresis are declaration-order invariant",async()=>{
 const normal=await instrument(),reversed=await instrument(true);
 // Confirm that this is a real permutation, not a duplicate module/cache entry.
 assert.deepEqual(Object.keys(reversed.centers),Object.keys(normal.centers).reverse());
 for(const id of Object.keys(normal.neighbors)) assert.deepEqual(reversed.neighbors[id],[...normal.neighbors[id]].reverse());
 let cases=0;
 for(const primaryIdentity of RELATIONSHIP_IDENTITIES){
  for(const values of [...Object.values(normal.centers),[25,15,20,20,100],[90,95,50,90,55]] as number[][]){
   for(const constraint of ["none","post_breakup","post_rejection","boundary"] as const){
    for(const proof of [null,11]){
     for(const criticalEvent of [null,"romantic_acceptance","relationship_end","romantic_rejection","boundary_event","reconciliation"] as const){
      const input:IdentityInput={state:shape(values),relationshipStateVersion:12,current:{primaryIdentity,constraint,constraintAnchorVersion:constraint==="none"?null:10,romanceReentryVersion:constraint==="post_breakup"||constraint==="post_rejection"?proof:null,preRomanticIdentity:"friend"},criticalEvent,hasNewRomancePattern:proof!==null};
      const a=normal.resolveRelationshipIdentity(input),b=reversed.resolveRelationshipIdentity(input);
      assert.deepEqual(a,b,JSON.stringify(input));
      assert.ok(RELATIONSHIP_IDENTITIES.includes(a.primaryIdentity));
      assert.equal(a.primaryIdentity==="lover",criticalEvent==="romantic_acceptance"||(primaryIdentity==="lover"&&criticalEvent!=="relationship_end"));
      if(["relationship_end","romantic_rejection","boundary_event"].includes(criticalEvent??"")) assert.equal(a.romanceReentryVersion,null);
      if(a.constraint==="boundary") assert.ok(!["person_of_interest","special_person"].includes(a.candidateIdentity??""));
      const replay=normal.resolveRelationshipIdentity({...input,current:a,criticalEvent:null,hasNewRomancePattern:false});
      if(a.candidateIdentity) assert.equal(replay.candidateConfirmations,1);
      cases++;
     }
    }
   }
  }
 }
 assert.equal(cases,6336);
});

test("exact candidate tie refuses classification and keeps current identity; adjacency ranks real non-adjacent targets by five-axis distance",async()=>{
 const m=await instrument();
 const tied=shape([22.5,15,12.5,15,0]);
 assert.equal(m.candidate(tied,"none"),null);
 assert.equal(resolveRelationshipIdentity({state:tied,relationshipStateVersion:1,current:{primaryIdentity:"friend"}}).primaryIdentity,"friend");
 assert.equal(m.uniqueClosest([["friend",.1],["important_person",.1]]),null);
 let exercised=0;
 const shapes=Object.values(m.centers) as number[][];
 for(const current of Object.keys(m.neighbors)){
  for(const left of shapes) for(const right of shapes){
   const s=shape(left.map((v,i)=>(v+right[i])/2)),target=m.candidate(s,"none");
   if(!target||target===current||m.neighbors[current].includes(target)) continue;
   const supported=m.neighbors[current].filter((id:string)=>m.gates[id](s));
   const ranked=supported.map((id:string)=>[id,m.distance(s,m.centers[id])]).sort((a:any,b:any)=>a[1]-b[1]);
   if(ranked.length<2||Math.abs(ranked[0][1]-ranked[1][1])<=1e-12) continue;
   assert.equal(m.adjacentTarget(current,target,s),ranked[0][0]);
   if(supported[0]!==ranked[0][0]) exercised++;
  }
 }
 assert.ok(exercised>0);
});

test("all ten score identities maintain their canonical center under small perturbations; lover requires canonical status",async()=>{
 const m=await instrument();
 for(const [primaryIdentity,values] of Object.entries(m.centers) as [any,number[]][]){
  for(const change of [-1,0,1]){
   const r=resolveRelationshipIdentity({state:shape(values.map(v=>Math.max(0,v+change))),relationshipStateVersion:20,current:{primaryIdentity}});
   assert.equal(r.primaryIdentity,primaryIdentity);
   assert.equal(r.candidateIdentity,null);
  }
 }
 for(const values of Object.values(m.centers) as number[][]){
  const s={...shape(values),relationshipStatus:"romantic_partner" as const};
  assert.equal(resolveRelationshipIdentity({state:s,relationshipStateVersion:20,current:{primaryIdentity:"lover"}}).primaryIdentity,"lover");
 }
});

test("actual positive three-day romance Pattern opens provenance; non-romance update preserves it; replay cannot confirm",()=>{
 const turn=(day:number):Turn=>({requestId:`romance-${day}`,message:"fixture",reply:"fixture",savedAt:`2026-10-0${day}T01:00:00Z`});
 const evidence:Evidence={axis:"romance",type:"care",polarity:1,strength:70,confidence:1,interpretation:"direct",subject:"user_to_misaki",supportingTurn:"fixture"};
 let snapshot:Snapshot={state:{...shape([78,82,50,85,72]),intimacyStage:4},version:10,episodes:[],appliedPatterns:[],processed:[],pending:[]};
 for(const day of [1,2]) snapshot=applyTemporaryEvidence(snapshot,turn(day),[evidence]);
 assert.equal(snapshot.version,10);
 const before=snapshot;
 snapshot=applyTemporaryEvidence(snapshot,turn(3),[evidence]);
 assert.equal(snapshot.version,11); assert.ok(snapshot.state.romance>before.state.romance);
 const first=resolveRelationshipIdentity({state:snapshot.state,relationshipStateVersion:snapshot.version,current:{primaryIdentity:"friend",constraint:"post_rejection",constraintAnchorVersion:10},hasNewRomancePattern:snapshot.version>before.version&&snapshot.state.romance>before.state.romance});
 assert.equal(first.romanceReentryVersion,11);
 assert.equal(resolveRelationshipIdentity({state:snapshot.state,relationshipStateVersion:11,current:first}).candidateConfirmations,1);
 const second=resolveRelationshipIdentity({state:snapshot.state,relationshipStateVersion:12,current:first,hasNewRomancePattern:false});
 assert.equal(second.romanceReentryVersion,11); assert.equal(second.primaryIdentity,"special_person");
});
