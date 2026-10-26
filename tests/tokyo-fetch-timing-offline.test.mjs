import assert from 'node:assert/strict';
import { test } from 'node:test';
import { measureTokyoSources } from '../lib/conversation-engine/tokyo-fetch-timing-offline.mjs';
const names = ['earthquake','warning','forecast','train','haneda'];
const tasks = () => names.map(source => ({ source, run: async () => source }));
test('five source outcomes are measured without losing values', async () => {
  let clock = 0;
  const x = await measureTokyoSources(tasks(), () => ++clock);
  assert.equal(x.measurements.length, 5);
  assert.deepEqual(x.measurements.map(y=>y.value), names);
  assert.ok(x.totalMs >= 0);
  assert.equal(x.hasNetworkBreakdown, false);
});
test('one failure does not block the other results', async () => {
  const t = tasks(); t[0].run = async () => { throw new Error('offline'); };
  const x = await measureTokyoSources(t);
  assert.equal(x.measurements[0].status, 'rejected');
  assert.equal(x.measurements[1].status, 'fulfilled');
});
test('rejects missing source', async () => {
  await assert.rejects(() => measureTokyoSources(tasks().slice(1)), TypeError);
});
test('rejects duplicate source', async () => {
  const t = tasks(); t[4].source = 'earthquake';
  await assert.rejects(() => measureTokyoSources(t), TypeError);
});
test('rejects missing run function', async () => {
  const t = tasks(); delete t[0].run;
  await assert.rejects(() => measureTokyoSources(t), TypeError);
});
