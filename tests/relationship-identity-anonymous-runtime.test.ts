import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const runtime=fs.readFileSync(new URL("../lib/relationship-runtime-v1.ts",import.meta.url),"utf8");

test("anonymous identity resolves after a critical-only canonical version change",()=>{
  assert.match(runtime,/const turnStartVersion = snapshot\.version;/);
  assert.match(runtime,/if \(identityEnabled\(\) && snapshot\.version !== turnStartVersion\)/);
  assert.match(runtime,/latestCritical = snapshot\.criticalEvents\?\.filter\(e => e\.request_id === turn\.requestId\)\.at\(-1\)\?\.event_type/);
  assert.match(runtime,/relationshipStateVersion: snapshot\.version/);
  assert.match(runtime,/current: snapshot\.identity/);
});

test("anonymous critical identity resolution is not conditional on a Pattern result",()=>{
  const applyIndex=runtime.indexOf("snapshot = applyTemporaryEvidence(snapshot, turn, evidence);");
  const identityIndex=runtime.indexOf("if (identityEnabled() && snapshot.version !== turnStartVersion)");
  assert.ok(applyIndex>=0&&identityIndex>applyIndex);
  const between=runtime.slice(applyIndex,identityIndex);
  assert.doesNotMatch(between,/appliedPatterns|Pattern|pattern/);
});
