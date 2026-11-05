import assert from 'node:assert/strict';
import test from 'node:test';
import {checkRequest,checkPull,checkPaths,checkChecks} from './policy.mjs';
const sha='a'.repeat(40);
const pr={state:'open',draft:false,base:{ref:'main',repo:{full_name:'miyazaki1016/misaki'}},head:{sha,repo:{full_name:'miyazaki1016/misaki'}},mergeable:true,labels:[{name:'owner-decision'}],body:'### 判断してほしいこと\nAかB\n### 推奨と理由\nA'};
test('allow only confirmed request with exact sha and two repos',()=>{
  assert.equal(checkRequest({repo:'misaki',number:4,expectedHead:sha,confirm:'承認してマージ'}),null);
  assert.ok(checkRequest({repo:'unknown',number:4,expectedHead:sha,confirm:'承認してマージ'}));
  assert.ok(checkRequest({repo:'misaki',number:4,expectedHead:sha,confirm:'yes'}));
});
test('reject unsafe PR state, missing owner review, stale sha',()=>{
  assert.equal(checkPull(pr,sha),null);
  assert.ok(checkPull({...pr,draft:true},sha));
  assert.ok(checkPull({...pr,labels:[]},sha));
  assert.ok(checkPull(pr,'b'.repeat(40)));
  assert.ok(checkPull({...pr,mergeable:false},sha));
});
test('merge only strict markdown-only changes',()=>{
  assert.equal(checkPaths([{filename:'docs/DEVELOPMENT_LEDGER.md',status:'modified'}]),null);
  assert.ok(checkPaths([{filename:'app/chat/page.tsx',status:'modified'}]));
  assert.ok(checkPaths([{filename:'docs/approval-dashboard/index.html',status:'modified'}]));
  assert.ok(checkPaths([{filename:'docs/IMPORTANT.md',status:'removed'}]));
  assert.ok(checkPaths([]));
});
test('require complete successful CI',()=>{
  assert.equal(checkChecks({total_count:1,check_runs:[{status:'completed',conclusion:'success'}]}),null);
  assert.ok(checkChecks({total_count:2,check_runs:[{status:'completed',conclusion:'success'}]}));
  assert.ok(checkChecks({total_count:1,check_runs:[{status:'completed',conclusion:'failure'}]}));
  assert.ok(checkChecks({total_count:0,check_runs:[]}));
});
