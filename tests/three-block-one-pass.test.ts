import assert from 'node:assert/strict';
import test from 'node:test';
import { createPreviewSessions, runOnePass } from './three-block/one-pass.ts';

type Turn = Parameters<typeof runOnePass>[0];
type Draft = Parameters<typeof createPreviewSessions>[0];
const scope = { ownerUserId: 'synthetic-owner', characterId: 'synthetic-misaki' };
const draft = (tuningVersion: string, warmth: number): Draft => ({
  tuningVersion, characterId: scope.characterId, scope: 'preview',
  settings: { warmth, humor: 10, phrasingInitiative: 20, questionTone: 30, length: 'short' },
});
const current = draft('synthetic-C', 70);
const restored = draft('synthetic-A', 30);

function fixture(): Turn {
  return {
    scope, now: '2026-01-01T00:00:00.000Z', expiresAt: '2026-01-01T00:05:00.000Z',
    snapshotId: 'synthetic-snapshot-1', selectionRulesVersion: 'synthetic-selection-v1',
    userInput: 'さっきのことを教えて。', intent: 'respond', questionAllowed: true,
    materials: [{
      ownerUserId: scope.ownerUserId,
      candidate: {
        kind: 'body-clock', id: 'synthetic-1', text: '合成の生活イベント', priority: 4.5,
        expiresAt: '2026-01-01T00:03:00.000Z', alreadyUsed: false, cancelled: false,
      },
      visibility: {
        participatingCharacterIds: [scope.characterId], witnessingCharacterIds: [], explicitlySharedWithCharacterIds: [],
      },
      source: { engine: 'synthetic-body-clock', version: 'fixture-v3', evidence: 'synthetic-evidence-1' },
      forgotten: false,
    }],
    constraints: [
      { id: 'required-1', kind: 'required', value: '合成材料の結果を保つ' },
      { id: 'forbidden-1', kind: 'forbidden', value: '未確認の結果を断定しない' },
    ],
  };
}

test('1. one approved material and its contract survive selection, tuning, slimming and one send', () => {
  const input = fixture();
  const run = runOnePass(input, createPreviewSessions(current, restored).start());
  const selection = {
    schemaVersion: 1, selectionRulesVersion: input.selectionRulesVersion, snapshotId: input.snapshotId,
    scope, createdAt: input.now, expiresAt: '2026-01-01T00:03:00.000Z', selected: input.materials,
    intent: input.intent, questionAllowed: true, constraints: input.constraints,
  };
  const tuned = { ...selection, tuningVersion: current.tuningVersion, settings: current.settings, promptVersion: 'synthetic-prompt-v1' };
  assert.equal(run.result, 'sent');
  assert.deepEqual(run.selection, selection);
  assert.deepEqual(run.tuned, tuned);
  assert.equal(run.modelCalls.length, 1);
  assert.deepEqual(JSON.parse(run.modelCalls[0]).contract, tuned);
  assert.ok(run.metrics && run.metrics.savedChars > 0);
  assert.deepEqual(run.sends, [{ text: '合成材料を確認したよ。', contract: tuned }]);
});

test('2. failed action is reported as failed and a forged completion fixture is rejected', () => {
  const input = fixture();
  input.materials[0].actionResult = 'failed';
  input.materials[0].candidate.text = '満席で予約できなかった';
  const session = createPreviewSessions(current, restored).start();
  const run = runOnePass(input, session);
  assert.equal(JSON.parse(run.modelCalls[0]).contract.selected[0].actionResult, 'failed');
  assert.deepEqual(run.sends.map(send => send.text), ['満席で予約できなかった。']);
  const falseCompletion = runOnePass(input, session, { stubReply: '予約できたよ。' });
  assert.equal(falseCompletion.result, 'false-completion');
  assert.equal(falseCompletion.modelCalls.length, 1);
  assert.deepEqual(falseCompletion.sends, []);
});

test('3. explicit silence produces zero calls and zero sends even with empty selection', () => {
  const run = runOnePass({ ...fixture(), intent: 'silent', materials: [] }, current,
    { stubReply: '送信されてはいけない合成文。' });
  assert.equal(run.result, 'silent');
  assert.deepEqual(run.selection.selected, []);
  assert.deepEqual(run.modelCalls, []);
  assert.deepEqual(run.sends, []);
});

test('4. normal restore during a silent turn affects only the next session', () => {
  const sessions = createPreviewSessions(current, restored);
  const existing = sessions.start();
  const run = runOnePass({ ...fixture(), intent: 'silent', questionAllowed: false }, existing,
    { afterTuning: sessions.restore });
  assert.equal(run.result, 'silent');
  assert.equal(run.tuned.tuningVersion, current.tuningVersion);
  assert.equal(run.tuned.questionAllowed, false);
  assert.deepEqual(run.modelCalls, []);
  assert.deepEqual(run.sends, []);
  assert.equal(runOnePass(fixture(), existing).sends[0].contract.tuningVersion, current.tuningVersion);
  const next = runOnePass(fixture(), sessions.start()).sends[0].contract;
  assert.equal(next.tuningVersion, restored.tuningVersion);
  assert.deepEqual(next.settings, restored.settings);
});

test('5. a generated question is blocked when questions are forbidden', () => {
  const stubReply = '次も聞きたい？';
  const denied = runOnePass({ ...fixture(), questionAllowed: false }, current, { stubReply });
  assert.equal(denied.modelCalls.length, 1);
  assert.equal(JSON.parse(denied.modelCalls[0]).contract.questionAllowed, false);
  assert.equal(denied.result, 'question-forbidden');
  assert.deepEqual(denied.sends, []);
  assert.equal(runOnePass(fixture(), current, { stubReply }).sends[0].text, stubReply);
});
