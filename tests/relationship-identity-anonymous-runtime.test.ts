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

test("identity feature gate keeps permanent worker and anonymous resolver off",()=>{
  assert.match(runtime,/if \(identityEnabled\(\)\) await processPermanentIdentity\(userId\);/);
  assert.match(runtime,/if \(identityEnabled\(\) && snapshot\.version !== turnStartVersion\)/);
});

test("identity feature gate off preserves legacy v2 temporary import",()=>{
  const gate=runtime.indexOf("if (!identityEnabled()) {");
  const v2=runtime.indexOf('db.rpc("import_misaki_temporary_relationship_v2"',gate);
  const returnIndex=runtime.indexOf("return;",v2);
  const v3=runtime.indexOf('db.rpc("import_misaki_temporary_relationship_v3"',gate);
  assert.ok(gate>=0&&v2>gate&&returnIndex>v2&&v3>returnIndex);
});


test("permanent identity worker carries romance reentry provenance end to end",()=>{
  const start=runtime.indexOf("async function processPermanentIdentity");
  assert.ok(start>=0);
  const worker=runtime.slice(start);
  assert.match(worker,/romanceReentryVersion:saved\.romance_reentry_version == null \? null : Number\(saved\.romance_reentry_version\)/);
  assert.match(worker,/hasNewRomancePattern=false/);
  assert.match(worker,/romance_delta/);
  assert.match(worker,/hasNewRomancePattern=Number\(application\?\.after_state\?\.relationship_state_version\)[\s\S]*Number\(application\?\.romance_delta \?\? 0\)>0/);
  assert.match(worker,/current,criticalEvent,hasNewRomancePattern/);
  assert.match(worker,/p_romance_reentry_version:resolved\.romanceReentryVersion/);
});

test("anonymous identity snapshot persists romance reentry provenance",()=>{
  const start=runtime.indexOf("async function analyzeTemporarySnapshot");
  const end=runtime.indexOf("async function runAnonymous",start);
  const anonymous=runtime.slice(start,end);
  assert.match(anonymous,/const hasFreshRomanceProvenance=snapshot\.version>preEvidenceVersion && snapshot\.state\.romance>preEvidenceRomance/);
  assert.match(anonymous,/hasNewRomancePattern:hasFreshRomanceProvenance/);
  assert.match(anonymous,/romanceReentryVersion: resolved\.romanceReentryVersion/);
});


test("romance provenance application is selected by canonical source version, not timestamp row order",()=>{
 assert.match(runtime,/\.eq\("after_state->>relationship_state_version",String\(relationship\.relationship_state_version\)\)/);
 const start=runtime.indexOf('select("romance_delta,after_state")');
 const end=runtime.indexOf('if(applicationError)',start);
 assert.doesNotMatch(runtime.slice(start,end),/order\("created_at"/);
});
