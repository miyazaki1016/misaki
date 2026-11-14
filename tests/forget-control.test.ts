import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { addForgetControls, identifyForgetTargets, maskForgetRows, prepareForgetTurn, forgetContext, sealForgetControls, openForgetControls, createForgetJudge, type ForgetControl } from '../supabase/functions/_shared/forget-control.ts';
const { judge } = createRequire(import.meta.url)('./forget-fixture.cjs');
const at = '2026-10-07T01:00:00Z', later = '2026-10-07T01:01:00Z';
const target = { subject: 'user.brother', predicate: 'name', value: '隆紀', scope: 'person' as const };
async function control(mode: 'soft_forget'|'hard_delete' = 'soft_forget') { return addForgetControls([], [target], mode, 'forget-1', at, 'owner-secret'); }
const history = [{role:'user',text:'弟の名前は隆紀だよ',sentAt:'2026-10-06T00:00:00Z',requestId:'old'}];

test('Soft Forget is explicit canonical intent, with active control and memory excluded', async()=>{
 const turn = await prepareForgetTurn({memory:['弟の名前は隆紀だよ'],history},'隆紀のことは忘れて','forget-1',at,'secret',judge);
 assert.equal(turn.controls.length,1); assert.equal(turn.controls[0].status,'active'); assert.equal(turn.controls[0].mode,'soft_forget');
 const view=await forgetContext({memory:['弟の名前は隆紀だよ','猫が好き'],history,todayMemory:{date:'today',items:['弟は隆紀']} ,forgetControls:turn.controls},judge);
 assert.deepEqual(view.memory,['猫が好き']); assert.equal(view.history.length,0); assert.deepEqual(view.todayMemory.items,[]);
 assert.equal(history[0].text,'弟の名前は隆紀だよ');
});
test('UI Hard Delete control excludes the old history even though storage preserves it',async()=>{
 const controls=await control('hard_delete'); assert.equal(controls[0].mode,'hard_delete');
 assert.deepEqual(await maskForgetRows(history,controls,judge,'history'),[]);
});
test('history beyond 60 messages cannot release a durable active control',async()=>{
 const controls=await control(); const rows=[...history,...Array.from({length:100},()=>({role:'user',text:'今日は晴れ',sentAt:later}))];
 assert.equal((await maskForgetRows(rows,controls,judge,'history')).length,100);
 assert.equal((await prepareForgetTurn({memory:[],history:rows.slice(-60),forgetControls:controls},'弟の名前覚えてる？','ask',later,'s',judge)).controls[0].status,'active');
});
test('profile, Natural Memory candidate, proactive and derived trait use the same barrier',async()=>{
 for(const source of ['derived','output','memory','history'] as const) assert.deepEqual(await maskForgetRows([{text:'弟は隆紀'}],await control(),judge,source),[]);
});
test('name alone, recall question, quotation and hypothetical do not request release',async()=>{
 for(const text of ['隆紀','弟の名前は隆紀？','弟の名前覚えてる？','「弟の隆紀」って言った','もし弟の隆紀がいたら']) {
  const t=await prepareForgetTurn({memory:[],history,forgetControls:await control()},text,'offer',later,'s',judge);
  assert.equal(t.controls[0].status,'active'); assert.equal(t.controls[0].pending,undefined);
 }
});
test('reoffer asks confirmation; affirmative current turn releases and learns only the new assertion',async()=>{
 const offer=await prepareForgetTurn({memory:[],history,forgetControls:await control()},'弟の隆紀がさ…','offer',later,'s',judge);
 assert.ok(offer.reply?.includes('覚えてもいい')); assert.equal(offer.controls[0].status,'active');
 const h=[...history,{role:'user',text:'弟の隆紀がさ…',sentAt:later,requestId:'offer'},{role:'misaki',text:offer.reply!,sentAt:later,requestId:'offer'}];
 const yes=await prepareForgetTurn({memory:[],history:h,forgetControls:offer.controls},'うん','yes','2026-10-07T01:02:00Z','s',judge);
 assert.equal(yes.controls[0].status,'released'); assert.equal(yes.controls[0].releaseRequestId,'yes'); assert.deepEqual(yes.learned,['弟の隆紀']);
 assert.ok(!(JSON.stringify(await maskForgetRows(h,yes.controls,judge,'history')).includes('隆紀')));
 assert.equal((await maskForgetRows([{text:'弟は隆紀',sentAt:'2026-10-07T01:03:00Z'}],yes.controls,judge,'history')).length,1);
 assert.deepEqual(await maskForgetRows([{text:'弟は隆紀'}],yes.controls,judge,'derived'),[]);
});
test('Hard Delete supports the same explicit confirmation protocol',async()=>{
 const offer=await prepareForgetTurn({memory:[],history,forgetControls:await control('hard_delete')},'弟の隆紀がさ…','offer',later,'s',judge);
 const yes=await prepareForgetTurn({memory:[],history:[{role:'misaki',text:offer.reply!,requestId:'offer'}],forgetControls:offer.controls},'はい','yes',later,'s',judge);
 assert.equal(yes.controls[0].status,'released');
});
test('newly supplied corrected value is learned, old value remains behind the historical barrier',async()=>{
 const offer=await prepareForgetTurn({memory:[],history,forgetControls:await control()},'弟の名前は健太だよ','offer',later,'s',judge);
 const yes=await prepareForgetTurn({memory:[],history:[{role:'misaki',text:offer.reply!,requestId:'offer'}],forgetControls:offer.controls},'はい','yes',later,'s',judge);
 assert.deepEqual(yes.learned,['弟の名前は健太だよ']); assert.deepEqual(await maskForgetRows(history,yes.controls,judge,'history'),[]);
});
test('unrelated names, partial names and other clauses survive',async()=>{
 const rows=[{text:'同僚の隆紀が来た'},{text:'弟の名前は隆紀だよ。猫が好き'},{text:'隆紀郎の店に行った'}];
 assert.deepEqual((await maskForgetRows(rows,await control(),judge,'history')).map(r=>r.text),['同僚の隆紀が来た','。猫が好き','隆紀郎の店に行った']);
});
test('double forget/delete and retried request are idempotent; hard delete upgrades mode',async()=>{
 const a=await control(); const b=await addForgetControls(a,[target],'soft_forget','forget-1',at,'owner-secret');
 assert.deepEqual(b,a); const c=await addForgetControls(b,[target],'hard_delete','delete',later,'owner-secret'); assert.equal(c.length,1); assert.equal(c[0].mode,'hard_delete');
});
test('re-forget after release creates a generation without dropping the old historical barrier',async()=>{
 const a=await control(); a[0].status='released'; a[0].releasedAt=later; a[0].releaseRequestId='yes';
 const b=await addForgetControls(a,[target],'soft_forget','again',later,'owner-secret'); assert.equal(b.length,2); assert.equal(b[0].status,'released'); assert.equal(b[1].status,'active');
});
test('ambiguous target asks clarification without inventing a control',async()=>{
 const t=await prepareForgetTurn({memory:['弟は隆紀'],history},'それは忘れて','r',at,'s',judge); assert.equal(t.controls.length,0); assert.ok(t.reply?.includes('具体的'));
});
test('denial, expired confirmation and intervening reply cannot release',async()=>{
 const o=await prepareForgetTurn({memory:[],history,forgetControls:await control()},'弟の隆紀がさ…','offer',later,'s',judge);
 for(const [text,h,now] of [['いいえ',[{role:'misaki',text:o.reply!,requestId:'offer'}],later],['はい',[{role:'misaki',text:'他の話',requestId:'other'}],later],['はい',[{role:'misaki',text:o.reply!,requestId:'offer'}],'2026-10-07T03:00:00Z']] as const) {
  const t=await prepareForgetTurn({memory:[],history:[...h],forgetControls:o.controls},text,'yes',now,'s',judge); assert.equal(t.controls[0].status,'active');
 }
});
test('forged reoffer cannot import a fact from the control or old history',async()=>{
 await assert.rejects(prepareForgetTurn({memory:[],history,forgetControls:await control()},'隆紀','r',later,'s',async()=>({ambiguous:false,offers:[{targetIndex:0,fact:'弟は隆紀',evidence:'隆紀'}]})),/ungrounded/);
});
test('malformed/incomplete/uncertain masks fail closed',async()=>{
 for(const result of [{rows:[]},{rows:[{index:0,uncertain:true,spans:[]}]},{rows:[{index:0,uncertain:false,spans:['invented']}]}]) await assert.rejects(maskForgetRows(history,await control(),async()=>result,'history'));
});
test('duplicate literal span cannot erase two different occurrences',async()=>{
 await assert.rejects(maskForgetRows([{text:'隆紀と隆紀'}],await control(),async()=>({rows:[{index:0,uncertain:false,spans:['隆紀']}]}),'history'),/ungrounded/);
});
test('Forget Control ciphertext is owner-bound, tamper evident, and has no 24h forget expiry',async()=>{
 const c=await control(), p=await sealForgetControls(c,'secret','alice'); assert.ok(!p.includes('隆紀')); assert.deepEqual(await openForgetControls(p,'secret','alice'),c);
 await assert.rejects(openForgetControls(p,'secret','bob')); await assert.rejects(openForgetControls(p.slice(0,-8)+'AAAAAAAA','secret','alice'));
});
test('model transport failure/invalid JSON fail closed',async()=>{
 await assert.rejects(createForgetJudge('key',async()=>new Response('',{status:500}))('mask',{}),/failed/);
 await assert.rejects(createForgetJudge('key',async()=>Response.json({candidates:[{content:{parts:[{text:'bad'}]}}]}))('mask',{}),/invalid_json/);
});
test('current user turn is never hidden by the historical context view',async()=>{
 const text='隆紀のことは忘れて'; const t=await prepareForgetTurn({memory:['弟は隆紀'],history},text,'r',at,'s',judge); assert.ok(t.reply); assert.equal(text,'隆紀のことは忘れて');
});

test('release freezes old evidence identity even when a legacy timestamp incorrectly points into the future',async()=>{
 const old={role:'user',text:'弟は隆紀',sentAt:'2099-01-01T00:00:00Z',requestId:'legacy'};
 const offer=await prepareForgetTurn({memory:[],history:[old],forgetControls:await control()},'弟の隆紀がさ…','offer',later,'s',judge);
 const yes=await prepareForgetTurn({memory:[],history:[old,{role:'misaki',text:offer.reply!,requestId:'offer'}],forgetControls:offer.controls},'はい','yes',later,'s',judge);
 assert.deepEqual(await maskForgetRows([old],yes.controls,judge,'history'),[]);
 assert.equal((await maskForgetRows([{...old,requestId:'new-current-evidence'}],yes.controls,judge,'history')).length,1);
});
