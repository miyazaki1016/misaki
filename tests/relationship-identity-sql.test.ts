import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { resolveRelationshipIdentity, type IdentityResult } from "../lib/relationship-identity-resolver.ts";

const directory=new URL("../supabase/migrations/",import.meta.url);
const read=(name:string)=>fs.readFileSync(new URL(name,directory),"utf8");
const migrations=fs.readdirSync(directory).filter(n=>n.includes("relationship_identity_v1")).sort();
const axes={friendship:78,trust:82,playfulness:50,affection:85,romance:75,relationshipStatus:"none" as const};
const resolver="relationship-identity-v1";

test("Relationship Identity migrations and RPC contracts in a fresh isolated PostgreSQL",async t=>{
 const db=new PGlite();
 try {
  await db.exec(fs.readFileSync(new URL("fixtures/relationship-identity-baseline.sql",import.meta.url),"utf8"));
  await db.exec(read("20260917023000_phase1_relationship_state_and_events_foundation.sql"));
  // Columns originally introduced by legacy migrations absent/incomplete in the repo's baseline.
  await db.exec("alter table public.misaki_relationship_state add column intimacy_migrated_at timestamptz; alter table public.misaki_relationship_events add column request_id uuid;");
  for(const name of fs.readdirSync(directory).filter(n=>n.startsWith("20261003")&&n.includes("relationship_engine_v1")).sort()) await db.exec(read(name));
  const scalar=async(sql:string,params:unknown[]=[])=>Object.values((await db.query(sql,params)).rows[0])[0];
  const fixture=async()=>{
   const user=randomUUID(),request=randomUUID(),token=randomUUID();
   await db.query("insert into auth.users values($1)",[user]);
   await db.query("insert into public.misaki_relationship_state(user_id,relationship_state_version,friendship_score,trust_score,playfulness_score,affection_score,romance_score) values($1,40,78,82,50,85,75)",[user]);
   await db.query("insert into public.misaki_relationship_events(user_id,event_type,request_id) values($1,'email_save_checkpoint',$2),($1,'chat_turn_completed',$2)",[user,request]);
   await db.query("insert into public.misaki_relationship_worker_leases(user_id,processing_version,request_id,lease_token,lease_until) values($1,$2,$3,$4,clock_timestamp()+interval '1 hour')",[user,"relationship-v1.1",request,token]);
   return {user,request,token};
  };
  const apply=async(user:string,version:number,result:IdentityResult)=>{
   const params=[user,version,resolver,result.primaryIdentity,result.candidateIdentity,result.candidateConfirmations,result.candidateSourceVersion,result.constraint,result.constraintAnchorVersion,result.romanceReentryVersion,result.preRomanticIdentity,result.transitionDecision,result.reasonCode];
   return scalar("select public.apply_misaki_relationship_identity_v1("+params.map((_,i)=>`$${i+1}`).join(",")+")",params) as Promise<any>;
  };
  const importSnapshot=async(f:Awaited<ReturnType<typeof fixture>>,constraint:string,proof:boolean|null,legacy=false,primary="friend",token=f.token)=>{
   const params:unknown[]=[f.user,f.request,"relationship-v1.1",token,randomUUID(),78,82,50,85,75,"none","relationship-v1.1",{version:900},primary,"special_person",1,899,constraint,800];
   if(!legacy) params.push(proof);
   params.push("friend",resolver);
   return scalar("select public.import_misaki_temporary_relationship_v3("+params.map((_,i)=>`$${i+1}`).join(",")+")",params) as Promise<any>;
  };

  await t.test("every migration stage is callable before its successor, including pre-provenance import",async()=>{
   assert.equal(migrations.length,4);
   await db.exec(read(migrations[0]));
   const f=await fixture();
   await db.query("select public.apply_misaki_relationship_identity_v1($1,40,$2,'friend',null,0,null,'none',null,null,'maintain','stage_064000')",[f.user,resolver]);
   await db.exec(read(migrations[1]));
   const old=await fixture();
   assert.equal((await importSnapshot(old,"post_breakup",false,true)).identity.source_relationship_state_version,41);
   assert.equal(await scalar("select count(*)::int from information_schema.columns where table_name='misaki_relationship_identity_state' and column_name='romance_reentry_version'"),0);
   await db.exec(read(migrations[2]));
   const interim=await fixture();
   const r=resolveRelationshipIdentity({state:axes,relationshipStateVersion:40});
   await apply(interim.user,40,r);
   // The old temporary import remains self-contained after the new column is added.
   await importSnapshot(await fixture(),"none",false,true);
   await db.exec(read(migrations[3]));
   await importSnapshot(await fixture(),"none",false);
  });
  await t.test("final schema has only 13-argument Identity apply and 22-argument import, service-only invoker ACL",async()=>{
   const rows=(await db.query<any>("select p.proname,p.pronargs,p.prosecdef,has_function_privilege('anon',p.oid,'EXECUTE') as anon,has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated,has_function_privilege('service_role',p.oid,'EXECUTE') as service from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('apply_misaki_relationship_identity_v1','import_misaki_temporary_relationship_v3') order by p.proname")).rows;
   assert.deepEqual(rows.map(r=>r.pronargs),[13,22]);
   for(const r of rows) assert.deepEqual([r.prosecdef,r.anon,r.authenticated,r.service],[false,false,false,true]);
   const f=await fixture();
   await db.exec("set role service_role");
   // Real role invocation, not just catalog inspection.
   const existing=await scalar("select user_id from public.misaki_relationship_identity_state limit 1");
   await assert.rejects(()=>db.query("select public.apply_misaki_relationship_identity_v1($1,999,$2,'friend',null,0,null,'none',null,null,null,'maintain','acl')",[existing,resolver]),/stale_relationship_state_version/);
   await apply(f.user,40,resolveRelationshipIdentity({state:axes,relationshipStateVersion:40}));
   for(const role of ["anon","authenticated"]){
    await db.exec(`set role ${role}`);
    await assert.rejects(()=>apply(f.user,40,resolveRelationshipIdentity({state:axes,relationshipStateVersion:40})),/permission denied for function/);
   }
   await db.exec("reset role");
  });
  await t.test("stale source refuses writes; replay preserves identity_since, version and immutable ledger; new identity changes since",async()=>{
   const f=await fixture();
   const first=resolveRelationshipIdentity({state:axes,relationshipStateVersion:40,current:{primaryIdentity:"friend"}});
   const a=await apply(f.user,40,first);
   assert.equal(a.state.candidate_confirmations,1);
   assert.deepEqual((await apply(f.user,40,first)).state,a.state);
   await assert.rejects(()=>apply(f.user,39,first),/stale_relationship_state_version/);
   await db.query("update public.misaki_relationship_state set relationship_state_version=41 where user_id=$1",[f.user]);
   const second=resolveRelationshipIdentity({state:axes,relationshipStateVersion:41,current:first});
   const b=await apply(f.user,41,second);
   assert.equal(b.state.primary_identity,"special_person");
   assert.notEqual(b.state.identity_since,a.state.identity_since);
   await db.query("update public.misaki_relationship_state set relationship_state_version=42 where user_id=$1",[f.user]);
   const c=await apply(f.user,42,resolveRelationshipIdentity({state:axes,relationshipStateVersion:42,current:second}));
   assert.equal(c.state.identity_since,b.state.identity_since);
   assert.equal(await scalar("select count(*)::int from public.misaki_relationship_identity_transitions where user_id=$1",[f.user]),3);
   assert.equal(await scalar("select romance_score::int from public.misaki_relationship_state where user_id=$1",[f.user]),75);
  });
  await t.test("RPC definition locks canonical source before Identity row and replay check (definition contract; PGlite is single-session)",async()=>{
   const definition=String(await scalar("select pg_get_functiondef(oid) from pg_proc where proname='apply_misaki_relationship_identity_v1'"));
   const source=definition.indexOf("where user_id=p_user_id for update;");
   const identity=definition.indexOf("select * into v_current");
   const replay=definition.indexOf("'replayed',true");
   assert.ok(source>=0&&identity>source&&replay>identity);
  });
  await t.test("Identity state and transition ledger roll back together when ledger persistence fails",async()=>{
   const f=await fixture(),r=resolveRelationshipIdentity({state:axes,relationshipStateVersion:40});
   await db.exec("create function public.fail_identity_ledger_fixture() returns trigger language plpgsql as $$ begin raise exception 'identity_ledger_fixture_failure'; end $$; create trigger fail_identity_ledger_fixture before insert on public.misaki_relationship_identity_transitions for each row execute function public.fail_identity_ledger_fixture();");
   try {
    await assert.rejects(()=>apply(f.user,40,r),/identity_ledger_fixture_failure/);
    assert.equal(await scalar("select count(*)::int from public.misaki_relationship_identity_state where user_id=$1",[f.user]),0);
    assert.equal(await scalar("select count(*)::int from public.misaki_relationship_identity_transitions where user_id=$1",[f.user]),0);
   } finally { await db.exec("drop trigger fail_identity_ledger_fixture on public.misaki_relationship_identity_transitions; drop function public.fail_identity_ledger_fixture();"); }
   assert.equal((await apply(f.user,40,r)).replayed,false);
  });
  await t.test("anonymous versions never cross namespace; only active breakup/rejection proof maps to permanent import version",async()=>{
   for(const constraint of ["none","post_breakup","post_rejection","boundary"]){
    for(const proof of [true,false,null]){
     const f=await fixture(),r=await importSnapshot(f,constraint,proof),s=r.identity;
     assert.equal(s.source_relationship_state_version,41);
     assert.equal(s.candidate_source_version,null); assert.equal(s.candidate_identity,null); assert.equal(s.candidate_confirmations,0);
     assert.equal(s.constraint_anchor_version,constraint==="none"?null:41);
     assert.equal(s.romance_reentry_version,proof===true&&["post_breakup","post_rejection"].includes(constraint)?41:null);
     assert.equal((await importSnapshot(f,constraint,proof)).replayed,true);
     assert.equal(await scalar("select count(*)::int from public.misaki_relationship_identity_transitions where user_id=$1",[f.user]),1);
     assert.equal(await scalar("select relationship_state_version::int from public.misaki_relationship_state where user_id=$1",[f.user]),41);
    }
   }
  });
  await t.test("imported proof survives subsequent non-romance update without accepting newly invented equal-anchor proof",async()=>{
   const f=await fixture();
   await importSnapshot(f,"post_rejection",true);
   await db.query("update public.misaki_relationship_state set relationship_state_version=42 where user_id=$1",[f.user]);
   const r=resolveRelationshipIdentity({state:axes,relationshipStateVersion:42,current:{primaryIdentity:"friend",constraint:"post_rejection",constraintAnchorVersion:41,romanceReentryVersion:41}});
   assert.equal((await apply(f.user,42,r)).state.romance_reentry_version,41);
   const unproven=await fixture();
   await assert.rejects(()=>apply(unproven.user,40,{...r,constraintAnchorVersion:39,romanceReentryVersion:39}),/invalid_romance_reentry_version/);
  });
  await t.test("fresh positive romance proof persists, same-version replay is not confirmation, new rejection/boundary resets proof",async()=>{
   for(const constraint of ["post_breakup","post_rejection"] as const){
    const f=await fixture();
    const first=resolveRelationshipIdentity({state:axes,relationshipStateVersion:40,current:{primaryIdentity:"friend",constraint,constraintAnchorVersion:39},hasNewRomancePattern:true});
    const a=await apply(f.user,40,first);
    assert.equal(a.state.romance_reentry_version,40);
    const replay=resolveRelationshipIdentity({state:axes,relationshipStateVersion:40,current:first});
    assert.equal(replay.candidateConfirmations,1);
    assert.equal((await apply(f.user,40,replay)).state.identity_version,1);
    await db.query("update public.misaki_relationship_state set relationship_state_version=41 where user_id=$1",[f.user]);
    const second=resolveRelationshipIdentity({state:axes,relationshipStateVersion:41,current:first,hasNewRomancePattern:false});
    assert.equal((await apply(f.user,41,second)).state.romance_reentry_version,40);
    await db.query("update public.misaki_relationship_state set relationship_state_version=42 where user_id=$1",[f.user]);
    const reset=resolveRelationshipIdentity({state:axes,relationshipStateVersion:42,current:second,criticalEvent:constraint==="post_breakup"?"boundary_event":"romantic_rejection"});
    assert.equal((await apply(f.user,42,reset)).state.romance_reentry_version,null);
   }
  });
  await t.test("lease-fenced positive romance Pattern application supplies proof by canonical version even when application timestamps tie",async()=>{
   const f=await fixture(),pattern=randomUUID();
   await db.query("insert into public.misaki_relationship_patterns(id,user_id,pattern_key,pattern_type,pattern_version) values($1,$2,'romance-fixture','care','relationship-v1.1')",[pattern,f.user]);
   const result:any=await scalar("select public.apply_misaki_relationship_state_v2($1,$2,'relationship-v1.1',$3,$4::uuid[],0,0,0,0,1)",[f.user,f.request,f.token,[pattern]]);
   assert.equal(result.state.relationship_state_version,41);
   assert.equal(result.state.romance_score,76);
   const proof=async(version:number)=>(await db.query<any>("select romance_delta,after_state from public.misaki_relationship_state_applications where user_id=$1 and after_state->>'relationship_state_version'=$2",[f.user,String(version)])).rows[0];
   const application=await proof(41);
   const first=resolveRelationshipIdentity({state:{...axes,romance:76},relationshipStateVersion:41,current:{primaryIdentity:"friend",constraint:"post_breakup",constraintAnchorVersion:40},hasNewRomancePattern:application.romance_delta>0});
   assert.equal((await apply(f.user,41,first)).state.romance_reentry_version,41);
   const later=randomUUID(),laterPattern=randomUUID();
   await db.query("insert into public.misaki_relationship_events(user_id,event_type,request_id) values($1,'chat_turn_completed',$2)",[f.user,later]);
   await db.query("update public.misaki_relationship_worker_leases set request_id=$2 where user_id=$1",[f.user,later]);
   await db.query("insert into public.misaki_relationship_patterns(id,user_id,pattern_key,pattern_type,pattern_version) values($1,$2,'trust-fixture','care','relationship-v1.1')",[laterPattern,f.user]);
   await scalar("select public.apply_misaki_relationship_state_v2($1,$2,'relationship-v1.1',$3,$4::uuid[],0,1,0,0,0)",[f.user,later,f.token,[laterPattern]]);
   await db.query("update public.misaki_relationship_state_applications set created_at='2026-10-07T01:00:00Z' where user_id=$1",[f.user]);
   assert.equal((await proof(42)).romance_delta,0);
   assert.equal((await proof(41)).romance_delta,1);
   const second=resolveRelationshipIdentity({state:{...axes,trust:83,romance:76},relationshipStateVersion:42,current:first,hasNewRomancePattern:(await proof(42)).romance_delta>0});
   assert.equal((await apply(f.user,42,second)).state.romance_reentry_version,41);
  });
  await t.test("import failure rolls back axes, Identity, checkpoint marker and ledger; missing checkpoint/bad lease refuse",async()=>{
   const f=await fixture();
   await assert.rejects(()=>importSnapshot(f,"none",false,false,"friend",randomUUID()),/relationship_processing_lease_required/);
   await db.query("delete from public.misaki_relationship_events where user_id=$1 and event_type='email_save_checkpoint'",[f.user]);
   await assert.rejects(()=>importSnapshot(f,"none",false),/email_save_checkpoint_required/);
   await db.query("insert into public.misaki_relationship_events(user_id,event_type) values($1,'email_save_checkpoint')",[f.user]);
   // An invalid pre-romantic value fails at Identity INSERT after axes UPDATE.
   const sql="select public.import_misaki_temporary_relationship_v3($1,$2,'relationship-v1.1',$3,$4,10,10,10,10,10,'none','relationship-v1.1','{}','friend',null,0,null,'none',null,false,'invalid', $5)";
   await assert.rejects(()=>db.query(sql,[f.user,f.request,f.token,randomUUID(),resolver]),/check constraint/);
   assert.equal(await scalar("select relationship_state_version::int from public.misaki_relationship_state where user_id=$1",[f.user]),40);
   for(const table of ["misaki_relationship_identity_state","misaki_relationship_identity_transitions","misaki_relationship_temporary_v1_imports"]) assert.equal(await scalar(`select count(*)::int from public.${table} where user_id=$1`,[f.user]),0);
  });
 } finally { await db.close(); }
});
