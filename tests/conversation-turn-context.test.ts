import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { USER_REPLY_CONTEXT } from '../lib/conversation-turn-context.ts';
import { createFallbackPersonaPrompt } from '../lib/persona/fallback-persona.ts';

// Prompt contract tests, not probabilistic model-output evaluations.
for (const message of ['はじめまして', 'こっちは仕事中😮‍💨']) {
  test(`normal reply supplies turn context for ${message}`, () => {
    const route = fs.readFileSync('app/api/chat/route.ts', 'utf8');
    assert.match(route, /\$\{personaPrompt\}\s*\$\{USER_REPLY_CONTEXT\}/);
    assert.match(USER_REPLY_CONTEXT, /ユーザーが送った最新メッセージに返答/);
    assert.match(USER_REPLY_CONTEXT, /「仕事中」は現在勤務している意味/);
    assert.match(USER_REPLY_CONTEXT, /実際の履歴に美咲からの自発的な連絡がある場合だけ/);
  });
}
test('proactive persona remains distinct and available', () => {
  assert.match(createFallbackPersonaPrompt('proactive'), /【美咲からの自発LINE】/);
  assert.doesNotMatch(createFallbackPersonaPrompt('chat'), /【美咲からの自発LINE】/);
  assert.ok(!fs.readFileSync('supabase/functions/body-clock/index.ts','utf8').includes('USER_REPLY_CONTEXT'));
});
