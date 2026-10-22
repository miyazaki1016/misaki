import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectBaseSystemPromptSource, measureSyntheticSections } from '../lib/conversation-engine/prompt-template-audit.mjs';
test('splits static text from interpolations', () => {
  const r = inspectBaseSystemPromptSource('const baseSystemPrompt = `\n人格:${personaPrompt}\n\n天気:${weatherGuide}\n`.trim();');
  assert.deepEqual(r.interpolationNames, ['personaPrompt','weatherGuide']);
  assert.equal(r.interpolationCount,2);
  assert.equal(r.constantScaffoldUtf8Bytes, new TextEncoder().encode('\n人格:\n\n天気:\n').length);
  assert.equal(r.measuredRuntimeBytes,null);
  assert.equal(r.measuredModelTokens,null);
});
test('rejects unsupported interpolation rather than silently undercounting', () => {
  assert.throws(() => inspectBaseSystemPromptSource('const baseSystemPrompt = `${foo({bar: 1})}`.trim();'),/UNSUPPORTED/);
});
test('rejects absent or ambiguous template anchors', () => {
  assert.throws(() => inspectBaseSystemPromptSource('anything'),/ANCHOR/);
  assert.throws(() => inspectBaseSystemPromptSource('const baseSystemPrompt = `a`.trim(); const baseSystemPrompt = `b`.trim();'),/ANCHOR/);
});
test('counts UTF-8 correctly for synthetic Japanese sections', () => {
  const r=measureSyntheticSections([{key:'persona',text:'美咲'},{key:'weather',text:'雨☔️',selected:false}]);
  assert.equal(r.selectedUtf8Bytes,new TextEncoder().encode('美咲').length);
  assert.equal(r.modelInputTokens,null);
});
test('rejects duplicate identifiers and wrong input types', () => {
  assert.throws(() => measureSyntheticSections([{key:'x',text:'a'},{key:'x',text:'b'}]),/BAD_SECTION/);
  assert.throws(() => measureSyntheticSections(null),/SECTIONS_REQUIRED/);
});
