const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sql = fs.readFileSync(path.join(__dirname, '..',
  'supabase/migrations/20260917031500_phase5_relationship_aware_proactive_claim.sql'), 'utf8');

test('Body Clock silence never invents lonely from neutral', () => {
  assert.doesNotMatch(sql, /primary','lonely'.*neutral/s);
  assert.doesNotMatch(sql, /in \('neutral','lonely'\).*then jsonb_build_object\('primary','lonely'/s);
});

test('Body Clock may still react to an already-lonely or sulky state', () => {
  assert.match(sql, /primary','neutral'\) = 'lonely'.*interval '3 days'.*'WAIT'/s);
  assert.match(sql, /primary','neutral'\) = 'lonely'.*interval '7 days'.*'PULL'/s);
  assert.match(sql, /primary','neutral'\) = 'sulky'.*interval '7 days'.*'PULL'/s);
});
