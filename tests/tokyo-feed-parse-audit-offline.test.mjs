import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auditTokyoFeedShape as audit } from '../lib/conversation-engine/tokyo-feed-parse-audit-offline.mjs';
const item = '<entry><title>地震情報</title><link href="https://example.invalid/a"/></entry>';
test('complete Atom fixture with one linked entry',()=>{
  const x=audit('<feed>'+item+'</feed>');
  assert.equal(x.safeToClaimParsedCoverage,true); assert.equal(x.matchedEntryCount,1);
});
test('empty feed is structurally valid but not evidence of network success',()=>{
  assert.equal(audit('<feed></feed>').safeToClaimParsedCoverage,true);
});
test('truncated entry is flagged',()=>{
  const x=audit('<feed><entry><title>test</title></feed>');
  assert.equal(x.safeToClaimParsedCoverage,false);
  assert.ok(x.reasons.includes('entry_boundary_mismatch'));
});
test('namespaced entry is unsupported by production regex',()=>{
  const x=audit('<feed><atom:entry><atom:link href="x"/></atom:entry></feed>');
  assert.ok(x.reasons.includes('namespaced_entry_unsupported'));
});
test('entry without recognized link is flagged',()=>{
  const x=audit('<feed><entry><title>x</title></entry></feed>');
  assert.equal(x.linksMissing,1);
});
test('missing feed wrapper is flagged',()=>{
  assert.ok(audit(item).reasons.includes('feed_wrapper_missing'));
});
test('non-string feed rejected',()=>{
  assert.throws(()=>audit(null),TypeError);
});
