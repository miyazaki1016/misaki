import assert from 'node:assert/strict';
import {test} from 'node:test';
import {comparePackingSynthetic} from '../lib/conversation-engine/misaki-context-comparison-offline.mjs';
test('reports synthetic savings without claiming token count', () => {
  const r=comparePackingSynthetic({olderTurns:Array.from({length:40},(_,i)=>({content:'past '+i+' '.repeat(300)})),
    recentTurns:[{role:'user',content:'最後にいいのが来た🤭'}],
    memory:[{verified:true,fact:'羽田で仕事'}]});
  assert.ok(r.savedChars>0);
  assert.equal(r.droppedOldTurns,40);
  assert.match(r.caveats[0],/not Gemini token/);
});
test('does not assume savings when payload is larger', () => {
  const r=comparePackingSynthetic({});
  assert.equal(r.rawChars>0,true);
  assert.equal(r.savedChars,r.rawChars-r.packedChars);
});
