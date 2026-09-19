// Run only against a disposable local PostgreSQL. Multiple physical connections,
// real advisory locks, actual old sync/save/refund SQL; no production credentials.
const {test,before,after,describe}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {Client}=require(process.env.MISAKI_TEST_PG_MODULE || 'pg');
const root=path.join(__dirname,'..');
const connection={host:'127.0.0.1',port:55438,user:'postgres',database:'misaki_drain_test_'+Date.now()};
let operator,service,a,b;
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const user=randomUUID(),other=randomUUID();
// Candidate protocols are installed ONLY in a disposable database below.
// Neither candidate is production equipment or an accepted safety design.
for(const lifetime of ['transaction','session-disconnect'])test(`candidate ${lifetime} barrier must reject late stale write AND admission`,async()=>{
 const config={...connection,database:'misaki_barrier_'+randomUUID().replaceAll('-','')};
 const boot=new Client({...config,database:'postgres'});const opened=[];
 let holder;
 const connect=async()=>{const c=new Client(config);await c.connect();opened.push(c);return c;};
 try {
  await boot.connect();await boot.query('create database '+config.database);
  const observer=await connect();holder=await connect();
  const fixture=read('tests/legacy-schema.fixture.sql').replace(/create role (\w+);/g,(_,r)=>`do $$begin if not exists(select 1 from pg_roles where rolname='${r}') then create role ${r};end if;end$$;`);
  await observer.query(fixture);await observer.query(read('supabase/legacy-maintenance-drain.sql'));
  const uid=randomUUID();await observer.query('insert into auth.users(id) values($1)',[uid]);
  await observer.query('insert into background_push_state(user_id,relationship_points) values($1,0)',[uid]);
  // Separate outer barrier: acquire shared before the legacy lifecycle lock.
  // A trigger/RPC must also protect callers that did NOT cooperate before their snapshot.
  for(const signature of ['misaki_drain.guard_write()','public.admit_misaki_legacy_operation(text,uuid)']){
   const def=(await observer.query('select pg_get_functiondef($1::regprocedure) def',[signature])).rows[0].def;
   assert.match(def,/\bbegin\s/i);
   await observer.query(def.replace(/\bbegin\s/i,'begin\n perform pg_catalog.pg_advisory_xact_lock_shared(1296646475,31);\n'));
  }
  const writer=await connect(),admitter=await connect(),fresh=await connect();
  for(const c of [writer,admitter,fresh])await c.query("set role service_role; set statement_timeout='3s'");
  for(const c of [writer,admitter]){
   await c.query('begin isolation level repeatable read');
   await c.query('select count(*) from background_push_state');
  }
  const holderPid=(await holder.query('select pg_backend_pid() pid')).rows[0].pid;
  const locks=async()=>Number((await observer.query("select count(*) n from pg_locks where pid=$1 and locktype='advisory' and classid=1296646475 and objid=31 and granted",[holderPid])).rows[0].n);
  await holder.query('select misaki_drain.stop_admission()');
  await holder.query("select misaki_drain.verify_body_clock('isolated candidate barrier; no runtime or external relay')");
  await holder.query('begin');
  await holder.query(`select pg_advisory_${lifetime==='transaction'?'xact_':''}lock(1296646475,31)`);
  await holder.query('select misaki_drain.freeze()');assert.equal(await locks(),1);
  await holder.query('commit');
  if(lifetime==='session-disconnect'){
   assert.equal(await locks(),1); // Freeze COMMIT preserves the session barrier.
   assert.equal((await fresh.query('select pg_try_advisory_xact_lock_shared(1296646475,31) acquired')).rows[0].acquired,false);
   await holder.query('begin');await holder.query('rollback');assert.equal(await locks(),1);
   await holder.end();opened.splice(opened.indexOf(holder),1);holder=null;
  }
  assert.equal(await locks(),0);
  const state=async()=>(await observer.query('select phase,epoch,(select count(*)::int from misaki_drain.operations) operations from misaki_drain.control')).rows[0];
  const frozen=await state();assert.equal(frozen.phase,'writes_frozen');assert.equal(frozen.operations,0);
  // New READ COMMITTED requests are refused, so the test is not a missing guard.
  await assert.rejects(fresh.query('update background_push_state set relationship_points=1 where user_id=$1',[uid]),{code:'55000'});
  await assert.rejects(fresh.query("select admit_misaki_legacy_operation('relay',null)"),{code:'55000'});
  const result={lifetime,version:(await observer.query('show server_version')).rows[0].server_version,frozen};
  try {result.changed=(await writer.query('update background_push_state set relationship_points=99 where user_id=$1 returning relationship_points',[uid])).rows;}
  catch(e){result.writeError=e.code;}
  await writer.query('rollback');
  try {await admitter.query("select admit_misaki_legacy_operation('relay',null)");result.admitted=true;}
  catch(e){result.admissionError=e.code;}
  await admitter.query('rollback');
  assert.equal((await observer.query('select relationship_points from background_push_state where user_id=$1',[uid])).rows[0].relationship_points,0);
  assert.deepEqual(await state(),frozen);result.rollbackConfirmed=true;
  // Timeouts are not successful rejection, and known failures are never TODO/skip.
  assert.ok(['55000','40001'].includes(result.writeError)&&['55000','40001'].includes(result.admissionError),'CANDIDATE BARRIER BYPASS: '+JSON.stringify(result));
 } finally {
  for(const c of opened){await c.query('rollback').catch(()=>{});await c.end();}
  // Retain the disposable fixture, matching the existing DB suite. Probe writes
  // have been rolled back and verified above; cluster teardown removes fixtures.
  await boot.end();
 }
});
async function client(role='postgres',uid=user){const c=new Client(connection);await c.connect();
 if(role!=='postgres')await c.query('set role '+role);
 await c.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({role:role==='postgres'?'service_role':role,sub:uid})]);return c;}
async function headers(c,o){await c.query("select set_config('request.headers',$1,false)",[JSON.stringify(o?{'x-misaki-operation':o.id,'x-misaki-capability':o.capability}:{})]);}
async function admit(kind='chat',uid=user){return (await service.query('select public.admit_misaki_legacy_operation($1,$2) o',[kind,uid])).rows[0].o;}
async function progress(o,state){return service.query('select public.progress_misaki_legacy_operation($1,$2,$3)',[o.id,o.capability,state]);}
async function ledger(o,premium=false,allowed=true){await headers(service,o);await service.query(`insert into daily_message_requests(request_id,user_id,usage_date,allowed,processed,is_premium) values($1,$2,current_date,$3,true,$4)`,[o.trackingKey,user,allowed,premium]);
 if(!premium&&allowed)await service.query('insert into daily_message_usage(user_id,usage_date,message_count) values($1,current_date,1) on conflict(user_id,usage_date) do update set message_count=daily_message_usage.message_count+1',[user]);}
async function reset(){await operator.query('select misaki_drain.reopen()');await operator.query('truncate misaki_drain.operations');await headers(service,null);await headers(a,null);await headers(b,null);await operator.query('truncate daily_message_requests,daily_message_usage,misaki_body_clock_push_attempts,background_push_state,misaki_user_conversation_state');}
async function stopped(){await operator.query('select misaki_drain.stop_admission()');await operator.query("select misaki_drain.verify_body_clock('isolated test: no old Edge or external relay exists')");}
const snapshot=JSON.stringify([{role:'user',text:'hello'},{role:'misaki',text:'reply'}]);
async function save(o,c=a){return c.query('select complete_misaki_legacy_browser_save($1,$2,$3,$4,$5,$6,$7,$8)',[o.id,o.capability,snapshot,'["memory"]','{}',81,false,'Asia/Tokyo']);}
describe('isolated PostgreSQL drain',()=>{
before(async()=>{
 const bootstrap=new Client({...connection,database:'postgres'});await bootstrap.connect();
 await bootstrap.query('create database '+connection.database);await bootstrap.end();
 operator=await client();
 // Roles are cluster-level; allow repeat runs without touching other databases.
 let fixture=read('tests/legacy-schema.fixture.sql');fixture=fixture.replace(/create role (\w+);/g,(_,r)=>`do $$begin if not exists(select 1 from pg_roles where rolname='${r}') then create role ${r};end if;end$$;`);
 await operator.query(fixture);
 await operator.query(read('supabase/migrations/20260918014700_prevent_duplicate_chat_turn_sync.sql'));
 await operator.query(read('supabase/migrations/20260917051607_save_anonymous_conversation.sql'));
 await operator.query(read('supabase/migrations/20260918081000_refund_failed_chat_usage.sql'));
 await operator.query('grant execute on function public.sync_user_conversation_state(jsonb,jsonb) to authenticated');
 await operator.query('insert into auth.users(id,is_anonymous) values($1,false),($2,false)',[user,other]);
 await operator.query(read('supabase/legacy-maintenance-drain.sql'));
 service=await client('service_role');a=await client('authenticated');b=await client('authenticated',other);
});
after(async()=>{for(const c of [a,b,service,operator])if(c)await c.end();});
test('OFF admits server IDs; ON refuses registration; service cannot operate controls',async()=>{
 await reset();const o=await admit();assert.match(o.id,/^[\da-f-]{36}$/);assert.notEqual(o.trackingKey,o.id);
 await stopped();await assert.rejects(admit(),/MISAKI_MAINTENANCE/);
 await assert.rejects(service.query('select misaki_drain.freeze()'),/permission denied/);
 await assert.rejects(a.query('select admit_misaki_legacy_operation($1,$2)',['chat',user]),/permission denied/);
});
test('OFF check/admission versus ON: stop waits for the accepting transaction and set is fixed',async()=>{
 await reset();const c=await client('service_role');await c.query('begin');const o=(await c.query("select admit_misaki_legacy_operation('chat',$1) o",[user])).rows[0].o;
 const stop=operator.query('select misaki_drain.stop_admission()');
 await service.query('select 1');
 const lock=await service.query("select exists(select 1 from pg_locks where locktype='advisory' and not granted) waiting");assert.equal(lock.rows[0].waiting,true);
 await c.query('commit');await stop;await c.end();await assert.rejects(admit(),/MISAKI_MAINTENANCE/);
 assert.equal((await operator.query('select count(*)::int n from misaki_drain.unresolved')).rows[0].n,1);assert.ok(o.id);
});
test('registration versus freeze under held stop lock never sneaks into frozen state',async()=>{
 await reset();await stopped();await operator.query('begin');await operator.query('select misaki_drain.freeze()');
 const attempt=admit();await a.query('select 1');await operator.query('commit');await assert.rejects(attempt,/MISAKI_MAINTENANCE/);
 await headers(service,null);await assert.rejects(service.query('update background_push_state set relationship_points=0 where false'),/MISAKI_MAINTENANCE/);
});
for(const premium of [false,true])for(const anonymous of [false,true])test(`generating -> ON -> old browser save -> freeze (${premium?'Premium':'Free'}, ${anonymous?'anonymous':'permanent'})`,async()=>{
 await reset();await operator.query('update auth.users set is_anonymous=$1 where id=$2',[anonymous,user]);
 const o=await admit();await ledger(o,premium);await stopped();await assert.rejects(operator.query('select misaki_drain.freeze()'),/unresolved operations/);
 await progress(o,'awaiting_browser');await headers(a,null);await save(o);
 assert.equal((await operator.query('select state from misaki_drain.operations where id=$1',[o.id])).rows[0].state,'succeeded');
 assert.equal((await operator.query('select count(*)::int n from misaki_user_conversation_state')).rows[0].n,anonymous?0:1);
 await operator.query('select misaki_drain.freeze()');await save(o); // Idempotent response-loss retry even frozen.
});
test('generation failure refunds with actual old refund RPC during drain; cannot freeze ahead of refund',async()=>{
 await reset();const o=await admit();await ledger(o);await stopped();await progress(o,'refund_pending');
 await assert.rejects(progress(o,'refunded'),/refund not confirmed/);await assert.rejects(operator.query('select misaki_drain.freeze()'),/unresolved/);
 await headers(a,o);await a.query('select * from refund_daily_message($1)',[o.trackingKey]);await a.query('select * from refund_daily_message($1)',[o.trackingKey]);
 await progress(o,'refunded');assert.equal((await operator.query('select message_count from daily_message_usage')).rows[0].message_count,0);await operator.query('select misaki_drain.freeze()');
});
test('crash/unknown does not expire, reopen does not discard it; only evidenced operator reconciliation resolves',async()=>{
 await reset();const o=await admit();await progress(o,'unknown');await operator.query("update misaki_drain.operations set started_at=now()-interval '30 days'");await stopped();
 await assert.rejects(operator.query('select misaki_drain.freeze()'),/unresolved/);await assert.rejects(progress(o,'failed'),/unresolved|reconciliation/);
 await operator.query('select misaki_drain.reopen()');assert.equal((await operator.query('select count(*)::int n from misaki_drain.unresolved')).rows[0].n,1);
 await assert.rejects(operator.query('select misaki_drain.reconcile($1,$2)',[o.id,'TTL expired']),/evidence/);
 await operator.query('select misaki_drain.reconcile($1,$2)',[o.id,'isolated test: verified no usage record and no pending writes']);await stopped();await operator.query('select misaki_drain.freeze()');
});
test('multiple sessions cannot borrow foreign or browser-invented capability',async()=>{
 await reset();const o=await admit();await ledger(o);await progress(o,'awaiting_browser');await stopped();
 await assert.rejects(save(o,b),/owner mismatch/);await assert.rejects(save({...o,capability:randomUUID()}),/owner mismatch/);
 await headers(b,o);await assert.rejects(b.query("update background_push_state set relationship_points=999 where false"),/owner mismatch/);
 await save(o);await assert.rejects(a.query("update background_push_state set relationship_points=999 where false"),/MISAKI_MAINTENANCE/);
});
for(const kind of ['history','email_checkpoint'])test(`accepted ${kind} continues under stop; new/direct old RPC is refused`,async()=>{
 await reset();const o=await admit(kind);await stopped();await headers(a,o);
 if(kind==='history')await a.query('select sync_user_conversation_state($1,$2)',[snapshot,'[]']);
 else {await operator.query('update auth.users set is_anonymous=true where id=$1',[user]);await a.query('select save_anonymous_conversation_state($1,$2)',[snapshot,'[]']);}
 await progress(o,'succeeded');await headers(a,null);await assert.rejects(a.query('select sync_user_conversation_state($1,$2)',[snapshot,'[]']),/MISAKI_MAINTENANCE/);
 await operator.query('select misaki_drain.freeze()');
});
test('Body Clock batch covers claim/generation/delivery/relay; unknown relay prevents freeze beyond lease expiry',async()=>{
 await reset();const o=await admit('body_clock',null);await headers(service,o);
 await service.query('insert into background_push_state(user_id) values($1)',[user]);await stopped();
 await assert.rejects(operator.query('select misaki_drain.freeze()'),/unresolved/);
 const delivery=randomUUID();await service.query('insert into misaki_proactive_deliveries(id,user_id) values($1,$2)',[delivery,user]);
 await service.query('insert into misaki_body_clock_push_attempts(delivery_id) values($1)',[delivery]);
 await progress(o,'succeeded');await assert.rejects(operator.query('select misaki_drain.freeze()'),/relay attempts/);
 await assert.rejects(service.query('update misaki_body_clock_push_attempts set completed_at=now() where delivery_id=$1',[delivery]),/resolved operation/);
 // A trusted operator must resolve the orphan with evidence; no automatic expiry.
 await operator.query('select misaki_drain.reopen()');await headers(service,null);await service.query('update misaki_body_clock_push_attempts set completed_at=now() where delivery_id=$1',[delivery]);await stopped();await operator.query('select misaki_drain.freeze()');
});
test('transactional direct write drains before stop returns, and freeze refuses missing Body Clock evidence',async()=>{
 await reset();await a.query('begin');await headers(a,null);await a.query('insert into background_push_state(user_id) values($1)',[user]);
 const stop=operator.query('select misaki_drain.stop_admission()');await b.query('select 1');await a.query('commit');await stop;
 await assert.rejects(operator.query('select misaki_drain.freeze()'),/body clock/);
});
test('equipment DDL BEGIN/ROLLBACK leaves no objects in a separate isolated namespace',async()=>{
 await reset();await operator.query('begin');await operator.query('drop schema misaki_drain cascade');
 await operator.query('drop function admit_misaki_legacy_operation(text,uuid),progress_misaki_legacy_operation(uuid,uuid,text),complete_misaki_legacy_browser_save(uuid,uuid,jsonb,jsonb,jsonb,integer,boolean,text)');
 const sql=read('supabase/legacy-maintenance-drain.sql').replace(/^begin;$/m,'').replace(/^commit;$/m,'');
 await operator.query(sql);await operator.query('rollback');assert.equal((await operator.query('select count(*)::int n from misaki_drain.control')).rows[0].n,1);
});
test('ordinary business writes use shared lock: independent users are not serialized',async()=>{
 await reset();await a.query('begin');await b.query('begin');await a.query('insert into background_push_state(user_id) values($1)',[user]);
 await b.query("set local statement_timeout='2s'");await b.query('insert into background_push_state(user_id) values($1)',[other]);
 await a.query('commit');await b.query('commit');
});
test('provisional processed=false usage record is unknown, never drained as failed',async()=>{
 await reset();const o=await admit();await headers(service,o);await service.query('insert into daily_message_requests(request_id,user_id,usage_date,allowed,processed) values($1,$2,current_date,false,false)',[o.trackingKey,user]);
 await assert.rejects(progress(o,'failed'),/unresolved/);await progress(o,'unknown');await stopped();await assert.rejects(operator.query('select misaki_drain.freeze()'),/unresolved/);
});
test('freeze requires separately stopped scheduler metadata and never changes it',async()=>{
 await reset();await stopped();await operator.query("update cron.job set active=true where jobname='misaki-body-clock'");
 await assert.rejects(operator.query('select misaki_drain.freeze()'),/scheduler still active/);
 assert.equal((await operator.query("select active from cron.job where jobname='misaki-body-clock'")).rows[0].active,true);
 await operator.query("update cron.job set active=false where jobname='misaki-body-clock'");await operator.query('select misaki_drain.freeze()');
});
});

// Kept after the existing suite: cluster roles are initialized serially.
{
// Safety regression: MUST reject a write from a pre-stop MVCC snapshot.
// Disposable loopback DB only; no production connection or external services.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {Client}=require(process.env.MISAKI_TEST_PG_MODULE || 'pg');
const root=path.join(__dirname,'..');
test('freeze rejects new operation admission from a pre-stop REPEATABLE READ snapshot',async()=>{
  const config={host:'127.0.0.1',port:55438,user:'postgres',database:'misaki_admission_snapshot_'+Date.now()};
  const boot=new Client({...config,database:'postgres'});
  let operator,writer,fresh;
  try {
    await boot.connect();await boot.query('create database '+config.database);
    operator=new Client(config);writer=new Client(config);fresh=new Client(config);
    await operator.connect();await writer.connect();await fresh.connect();
    const fixture=fs.readFileSync(path.join(root,'tests/legacy-schema.fixture.sql'),'utf8')
      .replace(/create role (\w+);/g,(_,r)=>`do $$begin if not exists(select 1 from pg_roles where rolname='${r}') then create role ${r};end if;end$$;`);
    await operator.query(fixture);
    await operator.query(fs.readFileSync(path.join(root,'supabase/legacy-maintenance-drain.sql'),'utf8'));
    await writer.query('set role service_role');await fresh.query('set role service_role');
    await writer.query('begin isolation level repeatable read');
    await writer.query('select count(*) from public.background_push_state');
    await operator.query('select misaki_drain.stop_admission()');
    await operator.query("select misaki_drain.verify_body_clock('isolated fixture only: no runtime or relay exists')");
    await operator.query('select misaki_drain.freeze()');
    const current=(await operator.query('select phase,epoch,(select count(*)::int from misaki_drain.operations) operations from misaki_drain.control')).rows[0];
    assert.equal(current.phase,'writes_frozen');assert.equal(current.operations,0);
    await assert.rejects(fresh.query("select public.admit_misaki_legacy_operation('relay',null)"),{code:'55000'});
    let error,admitted=false,staleEpoch;
    try {
      await writer.query("select public.admit_misaki_legacy_operation('relay',null)");
      // No capability or user data is logged. Commit only synthetic local data
      // to establish whether freeze can coexist with a newly durable operation.
      await writer.query('commit');
      admitted=true;
    } catch(e){error=e;await writer.query('rollback');}
    const after=(await operator.query('select phase,epoch,(select count(*)::int from misaki_drain.operations where ended_at is null) unresolved from misaki_drain.control')).rows[0];
    if(admitted)staleEpoch=(await operator.query('select epoch from misaki_drain.operations')).rows[0].epoch;
    // Remove the synthetic committed probe before asserting the safety contract.
    await operator.query('truncate misaki_drain.operations');
    const cleanupConfirmed=(await operator.query('select count(*)::int n from misaki_drain.operations')).rows[0].n===0;
    assert.ok(cleanupConfirmed);
    assert.ok(error && ['55000','40001'].includes(error.code),
      'ADMISSION AFTER FREEZE: '+JSON.stringify({current,admitted,after,staleEpoch,cleanupConfirmed,error:error?.message}));
  } finally {
    if(writer){await writer.query('rollback').catch(()=>{});await writer.end();}
    if(fresh)await fresh.end();
    if(operator)await operator.end();
    await boot.end();
  }
});
test('freeze rejects a protected write from a pre-stop REPEATABLE READ snapshot',async()=>{
  const config={host:'127.0.0.1',port:55438,user:'postgres',database:'misaki_snapshot_'+Date.now()};
  const boot=new Client({...config,database:'postgres'});
  let operator,writer;
  try {
    await boot.connect();await boot.query('create database '+config.database);
    operator=new Client(config);writer=new Client(config);
    await operator.connect();await writer.connect();
    const fixture=fs.readFileSync(path.join(root,'tests/legacy-schema.fixture.sql'),'utf8')
      .replace(/create role (\w+);/g,(_,r)=>`do $$begin if not exists(select 1 from pg_roles where rolname='${r}') then create role ${r};end if;end$$;`);
    await operator.query(fixture);
    await operator.query(fs.readFileSync(path.join(root,'supabase/legacy-maintenance-drain.sql'),'utf8'));
    const user=randomUUID();
    await operator.query('insert into auth.users(id) values($1)',[user]);
    await operator.query('insert into public.background_push_state(user_id,relationship_points) values($1,0)',[user]);
    await writer.query('set role service_role');
    await writer.query('begin isolation level repeatable read');
    // An ordinary pre-stop read establishes the snapshot without a write lock.
    await writer.query('select relationship_points from public.background_push_state');
    await operator.query('select misaki_drain.stop_admission()');
    await operator.query("select misaki_drain.verify_body_clock('isolated fixture only: no runtime or relay exists')");
    await operator.query('select misaki_drain.freeze()');
    const current=(await operator.query('select phase,epoch,(select count(*)::int from misaki_drain.operations) operations from misaki_drain.control')).rows[0];
    assert.equal(current.phase,'writes_frozen');assert.equal(current.operations,0);
    // Control: the same role/table on a fresh snapshot really is protected.
    const fresh=new Client(config);await fresh.connect();
    try {
      await fresh.query('set role service_role');
      await assert.rejects(fresh.query('update public.background_push_state set relationship_points=1 where user_id=$1',[user]),{code:'55000'});
    } finally {await fresh.end();}
    let error,changed=[];
    try {changed=(await writer.query('update public.background_push_state set relationship_points=99 where user_id=$1 returning relationship_points',[user])).rows;}
    catch(e){error=e;}
    await writer.query('rollback');
    assert.equal((await operator.query('select relationship_points from public.background_push_state where user_id=$1',[user])).rows[0].relationship_points,0);
    assert.ok(error && ['55000','40001'].includes(error.code),
      'FREEZE BYPASS: '+JSON.stringify({current,changed,rollbackConfirmed:true,error:error?.message}));
  } finally {
    if(writer){await writer.query('rollback').catch(()=>{});await writer.end();}
    if(operator)await operator.end();
    await boot.end();
  }
});

}

