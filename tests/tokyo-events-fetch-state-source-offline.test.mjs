import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Source-linked characterization: deliberately documents the current defect.
// These tests DO NOT certify that the defect has been fixed.
const source = readFileSync(new URL('../lib/tokyo-life-events.ts', import.meta.url), 'utf8');
const getStart = source.indexOf('export async function getTokyoLifeEvents()');
const guideStart = source.indexOf('export function createTokyoLifeEventsGuide(');
assert.ok(getStart >= 0 && guideStart > getStart, 'expected exports are present');
const getter = source.slice(getStart, guideStart);
const guide = source.slice(guideStart);

test('current getter swallows aggregate fetch errors into an empty event array', () => {
  assert.match(getter, /catch\s*\(error\)\s*\{/);
  assert.match(getter, /TOKYO LIFE EVENTS ERROR:/);
  assert.match(getter, /return\s*\[\s*\]\s*;/);
});
test('current getter returns an event array rather than explicit status envelope', () => {
  assert.match(getter, /Promise\s*<\s*TokyoLifeEvent\[\]\s*>/);
});
test('current zero-event guide only receives events and optional userProfile', () => {
  const signature = guide.slice(0, guide.indexOf(') {') + 3);
  assert.match(signature, /events\s*:\s*TokyoLifeEvent\[\]/);
  assert.doesNotMatch(signature, /fetchStatus|fetchError|sourceHealth/);
});
test('empty guide cannot currently distinguish fetch failure from valid no-results', () => {
  assert.match(guide, /events\.length\s*===\s*0/);
  assert.match(guide, /現在取得できている情報の範囲では/);
});
test('guardrail: the test must not mistake source characterization for remediation', () => {
  const knownGap = { fetchFailureDistinctFromNoEvents: false, remediationDeployed: false };
  assert.equal(knownGap.fetchFailureDistinctFromNoEvents, false);
  assert.equal(knownGap.remediationDeployed, false);
});
