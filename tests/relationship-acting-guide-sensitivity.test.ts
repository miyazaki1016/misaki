import test from "node:test";
import assert from "node:assert/strict";
import { createRelationshipActingGuide, type RelationshipActingState } from "../lib/relationship-acting-guide.ts";

/**
 * Characterization only: captures the CURRENT guide's sensitivity to five-axis scores.
 * No Gemini calls, no DB writes, no production implementation changes.
 */
const base: RelationshipActingState = {
  intimacyStage: 2, friendship: 0, trust: 0, playfulness: 0,
  affection: 0, romance: 0, relationshipStatus: "none",
};
const values = [0, 1, 29, 30, 44, 45, 54, 55, 79, 80, 100] as const;
const axes = ["friendship", "trust", "playfulness", "affection", "romance"] as const;
function guide(axis: typeof axes[number], score: number, status: "none" | "romantic_partner" = "none") {
  return createRelationshipActingGuide({ ...base, [axis]: score, relationshipStatus: status });
}
for (const axis of axes) {
  test(`acting-guide axis sensitivity: ${axis}`, () => {
    const outputs = values.map(score => guide(axis, score));
    const transitions = values.slice(1).flatMap((score, i) =>
      outputs[i] === outputs[i + 1] ? [] : [score]
    );
    const expected = axis === "playfulness" ? [30, 80]
      : axis === "romance" ? [45, 80] : [80];
    assert.deepEqual(transitions, expected, `${axis} thresholds drifted; review design matrix`);
    assert.equal(guide(axis, 0), guide(axis, 1), `${axis}: 0→1 changes current guide unexpectedly`);
  });
}
test("status remains independent of romance score", () => {
  assert.notEqual(guide("romance", 0, "none"), guide("romance", 0, "romantic_partner"));
  assert.equal(guide("romance", 0, "romantic_partner"), guide("romance", 100, "romantic_partner"));
});
test("intimacy stage is held constant during five-axis comparisons", () => {
  const a = createRelationshipActingGuide({ ...base, intimacyStage: 1 });
  const b = createRelationshipActingGuide({ ...base, intimacyStage: 2 });
  assert.notEqual(a, b);
});
