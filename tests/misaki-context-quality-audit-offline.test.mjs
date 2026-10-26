import assert from 'node:assert/strict';
import {test} from 'node:test';
import {auditSyntheticConversation} from '../lib/conversation-engine/misaki-context-quality-audit-offline.mjs';
test('preserves ambiguous utterances and source freshness fields',()=>{
  const result=auditSyntheticConversation({
    recentTurns:[{role:'user',content:'さっきの、もう落ち着いた？'},
      {role:'assistant',content:'羽田のことかな？🤭'}],
    memory:[{verified:true,kind:'topic',fact:'羽田の話をしていた'},
      {verified:false,fact:'推測した約束'}],
    events:[{selected:true,type:'haneda',detail:'一部便遅延',source:'official',
      observedAt:'2026-10-26T10:00:00+09:00',status:'ok'},
      {selected:false,detail:'地震情報'}],
  });
  assert.equal(result.pass,true);
  assert.equal(result.checks.recentVerbatim,true);
  assert.equal(result.checks.eventProvenance,true);
});
test('handles empty input without fabricated memories',()=>{
  const result=auditSyntheticConversation({});
  assert.equal(result.pass,true);
});
