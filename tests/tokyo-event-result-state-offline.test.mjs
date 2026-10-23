import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyTokyoEventResult, emptyTokyoEventGuideState } from '../lib/conversation-engine/tokyo-event-result-state.mjs';

const event = { type: 'earthquake', title: 'synthetic', source: 'fixture' };
const cases = [
  { name: 'not checked', input: { events: [], attempted: 0 }, status: 'not_checked', guide: 'not_checked' },
  { name: 'checked with no events', input: { events: [], attempted: 5 }, status: 'empty', guide: 'no_confirmed_events' },
  { name: 'fetch failed with no events', input: { events: [], failures: ['synthetic timeout'], attempted: 5 }, status: 'unavailable', guide: 'fetch_unverified' },
  { name: 'partial success with event', input: { events: [event], failures: ['synthetic timeout'], attempted: 5 }, status: 'partial', guide: 'events_present' },
  { name: 'success with event', input: { events: [event], attempted: 5 }, status: 'available', guide: 'events_present' },
];
for (const c of cases) test(c.name, () => {
  const result = classifyTokyoEventResult(c.input);
  assert.equal(result.status, c.status);
  assert.equal(emptyTokyoEventGuideState(result), c.guide);
});
test('reject malformed inputs', () => {
  assert.throws(() => classifyTokyoEventResult({ events: null, attempted: 1 }), TypeError);
  assert.throws(() => classifyTokyoEventResult({ events: [], attempted: -1 }), TypeError);
});
test('never claims verified no-events after a fetch failure', () => {
  const result = classifyTokyoEventResult({ events: [], attempted: 5, failures: ['offline fixture'] });
  assert.notEqual(emptyTokyoEventGuideState(result), 'no_confirmed_events');
});
