const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const root=path.join(__dirname,'..');let db;
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
before(async()=>{
 db=new PGlite();
 await db.exec(`
 create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create schema misaki_operations;
 create table auth.users(id uuid primary key,is_anonymous boolean default false);
 create function auth.uid() returns uuid language sql as $$select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
 `);
 await db.exec(`
 create function misaki_operations.guard_root_write() returns trigger language plpgsql as $$begin
 if current_setting('misaki.freeze',true)='on' then raise exception 'writes frozen';end if;return null;end$$;
 create table public.misaki_user_conversation_state(user_id uuid primary key,history jsonb default '[]',memory jsonb default '[]',today_memory jsonb default '{"date":"","items":[]}',message_count int default 0,user_message_count int default 0,updated_at timestamptz default clock_timestamp());
 create table public.misaki_relationship_state(user_id uuid primary key,intimacy_points int default 0,intimacy_level text,intimacy_migrated_at timestamptz,state_updated_at timestamptz,last_user_message_at timestamptz,last_misaki_message_at timestamptz,last_interaction_at timestamptz,silence_started_at timestamptz,emotion_state jsonb,action_state text);
 create table public.background_push_state(user_id uuid primary key,recent_history jsonb,long_term_memory jsonb,today_memory jsonb,updated_at timestamptz);
 create table public.misaki_relationship_events(id bigserial primary key,user_id uuid,event_type text,request_id uuid,before_state jsonb,after_state jsonb,reason text,metadata jsonb,created_at timestamptz default clock_timestamp());
 create unique index completed_request on public.misaki_relationship_events(user_id,request_id) where event_type='chat_turn_completed';
 create unique index email_checkpoint on public.misaki_relationship_events(user_id) where event_type='email_save_checkpoint';
 create table public.daily_message_requests(request_id uuid primary key,user_id uuid,allowed boolean,processed boolean,refunded_at timestamptz,completed_at timestamptz,temporary_result text,message_hash text,parent_hash text,usage_date date,is_premium boolean,message_count int,remaining int);
 create table public.daily_message_usage(user_id uuid,usage_date date,message_count int,updated_at timestamptz,primary key(user_id,usage_date));
 create table public.misaki_temporary_roots(user_id uuid primary key,token text,revision uuid,expires_at timestamptz);
 create function public.edit_misaki_conversation_state(uuid,text,text default null) returns jsonb language sql as $$select '{}'::jsonb$$;
 create function public.save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,jsonb default null,uuid default null) returns jsonb language sql as $$select '{}'::jsonb$$;
 `);
 const base=read('supabase/migrations/20260918073918_canonical_misaki_root_state.sql');
 // Execute the actual existing temporary receipt writer and completed-turn refund guard.
 await db.exec(base.slice(base.indexOf('create function public.complete_misaki_temporary_turn'),base.indexOf('-- Refreshable pre-confirmation')));
 await db.exec(read('supabase/migrations/20260918081000_refund_failed_chat_usage.sql'));
 await db.exec(base.slice(base.indexOf('create function public.guard_misaki_completed_turn_refund'),base.indexOf('-- All temporary writers')));
 const migration=fs.readdirSync(path.join(root,'supabase/migrations')).find(x=>x.endsWith('_forget_control_v1.sql'));
 await db.exec(read('supabase/migrations/'+migration));
 await db.exec('grant usage on schema public,auth,misaki_operations to service_role,authenticated;grant select,insert,update on all tables in schema public to service_role;grant select on auth.users to service_role;grant usage,select on all sequences in schema public to service_role;');
});
after(async()=>{if(db)await db.close();});
async function isolated(fn){await db.exec('begin');try{await fn();}finally{await db.exec('rollback');}}
const payload='encrypted-owner-bound-fixture'.repeat(3);
async function seed(anonymous=false){const id=randomUUID();await db.query('insert into auth.users values($1,$2)',[id,anonymous]);await db.query('insert into background_push_state(user_id)values($1)',[id]);return id;}
async function state(id){return (await db.query('select * from misaki_user_conversation_state where user_id=$1',[id])).rows[0];}
async function controls(id){return (await db.query('select * from misaki_forget_controls where user_id=$1',[id])).rows;}
async function complete(id,r,message='hello',extra={}){
 await db.query("insert into daily_message_requests(request_id,user_id,allowed,processed,is_premium,usage_date)values($1,$2,true,true,false,current_date)on conflict do nothing",[r,id]);
 const s=await state(id);
 const result={reply:'safe reply',memory:['safe memory'],misakiTodayMemory:{date:'today',items:[]},relationshipPointDelta:0,rootUpdatedAt:s?.updated_at??null,forgetControlPayload:payload,...extra};
 return (await db.query('select complete_misaki_chat_turn($1,$2,$3,clock_timestamp(),$4::jsonb)result',[id,r,message,JSON.stringify(result)])).rows[0].result;
}
test('migration: RLS/service-only surface, retired overloads and maintenance freeze',()=>isolated(async()=>{
 const privileges=(await db.query(`select has_table_privilege('authenticated','misaki_forget_controls','select') as readable,
 has_function_privilege('authenticated','edit_misaki_conversation_state(uuid,text,text,timestamptz,text)','execute') as editable,
 has_function_privilege('service_role','complete_misaki_chat_turn(uuid,uuid,text,timestamptz,jsonb)','execute') as service,
 to_regprocedure('save_misaki_temporary_state(uuid,jsonb,jsonb,jsonb,integer,jsonb,uuid)') as retired`)).rows[0];
 assert.equal(privileges.readable,false);assert.equal(privileges.editable,false);assert.equal(privileges.service,true);assert.equal(privileges.retired,null);
 const id=await seed();await db.exec("savepoint frozen;select set_config('misaki.freeze','on',true)");await assert.rejects(db.query('select persist_misaki_forget_controls($1,$2)',[id,payload]),/frozen/);await db.exec('rollback to frozen');assert.deepEqual(await controls(id),[]);
}));
test('UI edit transaction commits memory removal/control together and preserves history/Relationship State',()=>isolated(async()=>{
 const id=await seed();await complete(id,randomUUID(),'弟は隆紀');const before=await state(id),relationship=await db.query('select * from misaki_relationship_state where user_id=$1',[id]);
 await db.query('select edit_misaki_conversation_state($1,$2,$3,$4,$5)',[id,'deleteMemory','safe memory',before.updated_at,payload]);
 const s=await state(id);assert.deepEqual(s.memory,[]);assert.deepEqual(s.history,before.history);assert.equal((await controls(id)).length,1);
 assert.deepEqual((await db.query('select * from misaki_relationship_state where user_id=$1',[id])).rows,relationship.rows);
 const snapshot=(await db.query('select long_term_memory from background_push_state where user_id=$1',[id])).rows[0];assert.deepEqual(snapshot.long_term_memory,[]);
}));
test('UI invalid control or stale revision rolls back removal and control; double deletion stays one canonical row',()=>isolated(async()=>{
 const id=await seed();await complete(id,randomUUID());const before=await state(id);const original=(await controls(id))[0].payload;
 for(const args of [[before.updated_at,null],['2000-01-01T00:00:00Z',payload]]){
  await db.exec('savepoint edit');await assert.rejects(db.query('select edit_misaki_conversation_state($1,$2,$3,$4,$5)',[id,'deleteMemory','safe memory',...args]));await db.exec('rollback to edit');assert.deepEqual((await state(id)).memory,before.memory);assert.equal((await controls(id))[0].payload,original);
 }
 for(let i=0;i<2;i++) await db.query('select edit_misaki_conversation_state($1,$2,$3,$4,$5)',[id,'deleteMemory','safe memory',(await state(id)).updated_at,payload]);
 assert.equal((await controls(id)).length,1);assert.deepEqual((await state(id)).memory,[]);
}));
test('Soft Forget commit is atomic with chat receipt, quota proof and Body Clock snapshot; retry is idempotent',()=>isolated(async()=>{
 const id=await seed(),r=randomUUID(),a=await complete(id,r,'忘れて');const b=await complete(id,r,'忘れて');assert.deepEqual(a,b);assert.equal(a.forgetControlPayload,undefined);
 assert.equal((await controls(id)).length,1);assert.equal((await state(id)).history.length,2);
 assert.equal((await db.query("select count(*)::int n from misaki_relationship_events where user_id=$1 and event_type='chat_turn_completed'",[id])).rows[0].n,1);
}));
test('failed control commit leaves no successful chat; Free refund works once; successful request cannot refund',()=>isolated(async()=>{
 const id=await seed(),r=randomUUID();await db.query('insert into daily_message_usage values($1,current_date,1,clock_timestamp())',[id]);
 await db.query("insert into daily_message_requests(request_id,user_id,allowed,processed,is_premium,usage_date)values($1,$2,true,true,false,current_date)",[r,id]);
 await db.exec('savepoint failed');await assert.rejects(complete(id,r,'忘れて',{forgetControlPayload:null}),/forget payload/);await db.exec('rollback to failed');assert.deepEqual(await controls(id),[]);assert.equal(await state(id),undefined);
 await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:id})]);let refund=(await db.query('select * from refund_daily_message($1)',[r])).rows[0];assert.equal(refund.refunded,true);refund=(await db.query('select * from refund_daily_message($1)',[r])).rows[0];assert.equal(refund.refunded,false);
 const good=randomUUID();await complete(id,good);await db.exec('savepoint refund');await assert.rejects(db.query('select * from refund_daily_message($1)',[good]),/completed chat turn cannot be refunded/);await db.exec('rollback to refund');
}));
test('anonymous root checkpoint refresh and receipt retry preserve latest controls once; permanent reimport rejected',()=>isolated(async()=>{
 const id=await seed(true),r=randomUUID();await db.query("insert into daily_message_requests(request_id,user_id,allowed,processed,is_premium,usage_date)values($1,$2,true,true,false,current_date)",[r,id]);
 const initial={history:[{role:'user',text:'弟は隆紀'}],memory:['弟は隆紀'],todayMemory:{date:'today',items:[]},relationshipPoints:0,forgetControlPayload:payload};
 const args=[id,r,'message-hash','parent-hash','encrypted-root-token',null,JSON.stringify(initial)];await db.query('select complete_misaki_temporary_turn($1,$2,$3,$4,$5,$6,$7::jsonb)',args);
 let rev=(await db.query('select revision from misaki_temporary_roots where user_id=$1',[id])).rows[0].revision;
 await db.query('select save_misaki_temporary_state($1,$2::jsonb,$3::jsonb,$4::jsonb,$5,$6::jsonb,$7,$8)',[id,JSON.stringify(initial.history),JSON.stringify(initial.memory),JSON.stringify(initial.todayMemory),0,null,rev,payload]);
 const latest={...initial,memory:[],history:[...initial.history,{role:'user',text:'忘れて'}],forgetControlPayload:payload+'updated'};
 await db.query('select write_misaki_temporary_root($1,$2,$3::jsonb,$4)',[id,'new-encrypted-root',JSON.stringify(latest),rev]);
 assert.deepEqual((await state(id)).memory,[]);assert.equal((await state(id)).history.length,2);assert.equal((await controls(id))[0].payload,payload+'updated');
 // Old receipt retries do not reapply old checkpoint/control.
 await db.query('select complete_misaki_temporary_turn($1,$2,$3,$4,$5,$6,$7::jsonb)',args);assert.equal((await controls(id))[0].payload,payload+'updated');
 await db.query('update auth.users set is_anonymous=false where id=$1',[id]);rev=(await db.query('select revision from misaki_temporary_roots where user_id=$1',[id])).rows[0].revision;
 await db.exec('savepoint imported');await assert.rejects(db.query('select save_misaki_temporary_state($1,$2::jsonb,$3::jsonb,$4::jsonb,$5,$6::jsonb,$7,$8)',[id,'[]','[]','{}',0,null,rev,payload]),/anonymous account required/);await db.exec('rollback to imported');assert.equal((await controls(id)).length,1);
}));
