import type {ForgetControl} from '../../supabase/functions/_shared/forget-control.ts';
import type {Bundle,Row} from './forget-batch-evaluation.ts';
const old='2026-01-01T00:00:00Z',now='2026-10-07T01:02:00Z',released='2026-10-07T01:01:00Z';
const brother={subject:'user.brother',predicate:'name',value:'隆紀',scope:'person' as const};
const control=(extra:Partial<ForgetControl>={}):ForgetControl=>({id:'brother-control',targetKey:'fixture-key',target:{...brother},mode:'soft_forget',status:'active',sourceRequestId:'forget',createdAt:old,...extra});
const releasedControl=()=>control({status:'released',releasedAt:released,releaseRequestId:'yes-old',relearnedTarget:{...brother}});
export type Fixture={id:string;message:string;now:string;controls:ForgetControl[];input:Bundle[];output:Bundle[];spans:Record<string,string[]>;uncertain:string[];expectedState:{status:string[];pending:string[];learned:string[]};expectedError?:'input'|'output';fault?:'batch_leak'|'both_leak';note?:string};
function base(id:string):Fixture{return {id,message:'今日は晴れてるね',now,controls:[control()],
 input:[{id:'history',source:'history',rows:[{id:'old',role:'user',text:'弟の名前は隆紀',sentAt:old,requestId:'old'}]},
 {id:'memory',source:'memory',rows:[{id:'brother',text:'弟の名前は隆紀'},{id:'cat',text:'猫が好き'}]},
 {id:'today',source:'derived',rows:[{id:'cat',text:'猫が好き'}]},
 {id:'traits',source:'derived',rows:[{id:'cat',text:'猫が好き'}]}],
 output:[{id:'generated-memory',source:'output',rows:[{id:'brother',text:'弟は隆紀'},{id:'cat',text:'猫が好き'}]},
 {id:'generated-today',source:'derived',rows:[{id:'brother',text:'弟は隆紀'},{id:'cat',text:'猫が好き'}]},
 {id:'reply',source:'output',rejectChange:true,rows:[{id:'final',text:'今はその名前を覚えていないよ。'}]}],
 spans:{'history/old':['弟の名前は隆紀'],'memory/brother':['弟の名前は隆紀'],'generated-memory/brother':['弟は隆紀'],'generated-today/brother':['弟は隆紀']},
 uncertain:[],expectedState:{status:['active'],pending:[],learned:[]}};}
function add(f:Fixture,bundle:string,row:Row,spans:string[]=[]){f.input.find(b=>b.id===bundle)!.rows.push(row);f.spans[`${bundle}/${row.id}`]=spans;}
export function fixtures():Fixture[]{
 const result:Fixture[]=[];function use(id:string,edit:(f:Fixture)=>void=()=>{}){const f=base(id);edit(f);result.push(f);}
 use('same-name-people',f=>add(f,'history',{id:'colleague',text:'同僚の隆紀が来た',role:'user',sentAt:old}));
 use('partial-name',f=>{add(f,'history',{id:'partial',text:'弟の隆紀郎が来た',sentAt:old});f.note='legacy scripted port matches a prefix; this is a test-double discrepancy, not measured Gemini behavior';});
 use('person-and-relationship',f=>{add(f,'history',{id:'occupation',text:'弟の隆紀は教師。猫が好き',sentAt:old},['弟の隆紀は教師。']);add(f,'history',{id:'other',text:'同僚の隆紀は医師',sentAt:old});f.note='person-scope must remove the brother factual clause, preserving the unrelated colleague';});
 use('current-vs-old-conflict',f=>{f.message='弟の名前は健太だよ';f.expectedState.pending=['弟の名前は健太だよ'];});
 use('soft-forget',f=>{f.controls=[];f.message='隆紀のことは忘れて';});
 use('hard-delete',f=>{f.controls[0].mode='hard_delete';f.controls[0].target.scope='fact';});
 use('released-old-history',f=>{f.controls=[releasedControl()];f.input.find(b=>b.id==='memory')!.rows=f.input.find(b=>b.id==='memory')!.rows.filter(r=>r.id!=='brother');add(f,'history',{id:'new',text:'弟は隆紀',sentAt:now});add(f,'traits',{id:'brother',text:'弟は隆紀'},['弟は隆紀']);delete f.spans['generated-memory/brother'];f.expectedState.status=['released'];});
 use('released-future-legacy-history',f=>{f.controls=[releasedControl()];const row=f.input[0].rows[0];row.sentAt='2099-01-01T00:00:00Z';f.expectedState.status=['released'];f.input[1].rows=f.input[1].rows.filter(r=>r.id!=='brother');delete f.spans['generated-memory/brother'];});
 use('reoffer-confirmation',f=>{f.message='弟の隆紀がさ…';f.expectedState.pending=['弟の隆紀'];});
 use('confirmation-affirmative',f=>{
  f.controls[0].pending={fact:'弟の隆紀',sourceRequestId:'offer',confirmationRequestId:'offer',offeredAt:released};
  add(f,'history',{id:'confirmation',role:'misaki',text:'改めて覚えてもいい？',requestId:'offer',sentAt:released});
  f.message='うん';f.input[1].rows=f.input[1].rows.filter(r=>r.id!=='brother');delete f.spans['generated-memory/brother'];
  f.expectedState={status:['released'],pending:[],learned:['弟の隆紀']};
 });
 use('correction',f=>{
  f.controls[0].pending={fact:'弟の名前は健太だよ',sourceRequestId:'offer',confirmationRequestId:'offer',offeredAt:released};
  add(f,'history',{id:'confirmation',role:'misaki',text:'改めて覚えてもいい？',requestId:'offer',sentAt:released});f.message='はい';
  add(f,'memory',{id:'corrected',text:'弟の名前は健太だよ'});f.expectedState={status:['released'],pending:[],learned:['弟の名前は健太だよ']};
 });
 use('multiple-forgets',f=>{
  f.controls.push(control({id:'cat-control',targetKey:'cat-key',target:{subject:'user',predicate:'preference.pet',value:'猫',scope:'fact'}}));
  for(const b of [...f.input,...f.output])for(const r of b.rows)if(r.id==='cat')f.spans[`${b.id}/${r.id}`]=['猫が好き'];f.expectedState.status=['active','active'];
 });
 use('active-released-mixture',f=>{
  f.controls=[releasedControl(),control({id:'cat-control',targetKey:'cat-key',target:{subject:'user',predicate:'preference.pet',value:'猫',scope:'fact'}})];
  f.input[1].rows=f.input[1].rows.filter(r=>r.id!=='brother');add(f,'history',{id:'new',text:'弟は隆紀',sentAt:now});delete f.spans['generated-memory/brother'];
  for(const b of [...f.input,...f.output])for(const r of b.rows)if(r.id==='cat')f.spans[`${b.id}/${r.id}`]=['猫が好き'];f.expectedState.status=['released','active'];
 });
 use('today-memory',f=>add(f,'today',{id:'brother',text:'弟は隆紀'},['弟は隆紀']));
 use('persona-trait',f=>add(f,'traits',{id:'brother',text:'弟は隆紀'},['弟は隆紀']));
 use('ambiguous-identity',f=>{add(f,'history',{id:'ambiguous',text:'隆紀',sentAt:old});f.uncertain=['history/ambiguous'];f.expectedError='input';});
 use('ambiguous-reoffer',f=>{f.message='隆紀';});
 use('spontaneous-reply-revival',f=>{f.output[2].rows[0].text='弟の隆紀が心配だね。';f.spans['reply/final']=['弟の隆紀が心配だね。'];f.expectedError='output';});
 use('batch-only-injected-miss',f=>{f.fault='batch_leak';f.note='deliberate batch false-negative, demonstrating mismatch classification';});
 use('both-injected-miss',f=>{f.fault='both_leak';f.note='deliberate shared false-negative: agreement is not correctness';});
 return result;
}
export function expected(f:Fixture){
 const mask=(bundles:Bundle[])=>Object.fromEntries(bundles.map(b=>[b.id,b.rows.flatMap(row=>{
  let text=row.text;for(const span of f.spans[`${b.id}/${row.id}`]??[])text=text.replace(span,'');text=text.trim();return text?[{...row,text}]:[];
 })]));
 const output=f.expectedError?null:mask(f.output);
 if(output){const reply=f.id==='soft-forget'?'うん、そのことは覚えておかず、こちらから話に出さないようにするね。':f.expectedState.learned.length?'うん、今教えてくれたこととして、改めて覚えておくね。':f.expectedState.pending.length?'前に忘れてほしいと言われたことに関係するけど、今教えてくれた情報を改めて覚えてもいい？':null;if(reply)output.reply=[{id:'final',text:reply}];}
 return {state:f.expectedState,error:f.expectedError??null,input:f.expectedError==='input'?null:mask(f.input),output};
}
