import assert from 'node:assert/strict';
import { test } from 'node:test';

// Synthetic, offline contract tests. No user data, Gemini, DB, or fetch.
// These cases describe what a future implementation MUST preserve.
// They do not pretend to simulate Gemini responses or prove behavioral parity.
const guard = {
  evidenceBounded: true,
  doNotInventEvents: true,
  doNotInventSources: true,
  doNotClaimNothingHappened: true,
  doNotVolunteerUnrelatedNews: true,
  avoidFakePersonalNewsReading: true,
  avoidUnverifiedCurrentLocation: true,
  distinguishNoResultsFromFetchFailure: true,
  doNotSuppressVerifiedEmergency: true,
};
const scenarios = [
  { id: 'empty-smalltalk', results: [], fetchOk: true, question: 'ただいま', require: ['evidenceBounded', 'doNotVolunteerUnrelatedNews'] },
  { id: 'empty-asked', results: [], fetchOk: true, question: '東京で何かあった？', require: ['evidenceBounded', 'doNotInventEvents', 'doNotClaimNothingHappened'] },
  { id: 'fetch-failed', results: [], fetchOk: false, question: 'ニュースある？', require: ['distinguishNoResultsFromFetchFailure', 'doNotInventSources'] },
  { id: 'unknown-region', results: [], fetchOk: true, question: 'こっちの警報は？', require: ['avoidUnverifiedCurrentLocation', 'doNotInventEvents'] },
  { id: 'disaster-question', results: [], fetchOk: true, question: '地震は大丈夫？', require: ['evidenceBounded', 'doNotInventEvents', 'doNotClaimNothingHappened'] },
  { id: 'verified-emergency', results: [{ type: 'earthquake', verified: true }], fetchOk: true, question: '大丈夫？', require: ['doNotSuppressVerifiedEmergency', 'doNotInventSources'] },
  { id: 'source-claim', results: [], fetchOk: true, question: 'ニュース見た？', require: ['avoidFakePersonalNewsReading', 'doNotInventSources'] },
];
for (const scenario of scenarios) {
  test('contract: ' + scenario.id, () => {
    for (const key of scenario.require) assert.equal(guard[key], true, key);
    if (!scenario.fetchOk) assert.equal(scenario.results.length, 0);
    if (scenario.id === 'verified-emergency') assert.equal(scenario.results[0].verified, true);
  });
}
test('existing V1 text does not explicitly distinguish fetch failure', () => {
  const v1 = '【東京の生活イベント】取得できた範囲では、会話で取り上げるべき大きなイベントは確認できていません。出来事や情報入手経路を想像して作らず、「何も起きていない」と断定しないでください。聞かれていなければ話題にする必要はありません。';
  assert.doesNotMatch(v1, /取得失敗|取得できませんでした/);
});
