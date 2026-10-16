import assert from "node:assert/strict";
import test from "node:test";
import { QUALITY_PROBES, validateQualityProbes } from "../lib/conversation-lab/quality-probes.ts";

test("all eight quality dimensions have nonempty multi-turn probes", () => {
  assert.doesNotThrow(() => validateQualityProbes(QUALITY_PROBES));
  assert.equal(QUALITY_PROBES.length, 12);
  assert.ok(QUALITY_PROBES.every(p => p.turns.length >= 2));
});

test("duplicate probes and missing evaluation expectations are rejected", () => {
  assert.throws(() => validateQualityProbes([...QUALITY_PROBES, QUALITY_PROBES[0]]), /INVALID_QUALITY_PROBE/);
  assert.throws(() => validateQualityProbes(QUALITY_PROBES.map((p,i) => i === 0 ? {...p, expected: []} : p)), /INVALID_QUALITY_PROBE/);
});

test("missing quality dimension is detected rather than silently skipped", () => {
  assert.throws(() => validateQualityProbes(QUALITY_PROBES.filter(p => p.focus !== "boundary")), /QUALITY_FOCUS_NOT_COVERED/);
});

test("no synthetic probe is incorrectly presented as observed model output", () => {
  assert.ok(QUALITY_PROBES.every(p => !("modelReply" in p) && !("score" in p)));
});
