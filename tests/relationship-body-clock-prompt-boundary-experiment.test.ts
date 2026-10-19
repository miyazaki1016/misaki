import assert from "node:assert/strict";
import { test } from "node:test";
import { createRelationshipActingGuide, type RelationshipActingState } from "../lib/relationship-acting-guide.ts";

/** Isolated prompt-boundary experiment. Not wired into Body Clock or production. */
type Tag = "romantic" | "miss_you" | "affectionate" | "playful" | "soft" | "calm";
type Input = { acting: RelationshipActingState | null; tags: Tag[]; action: "NORMAL" | "PULL" | "TEASE" | "CHASE" | "SULK" };
function compose(input: Input): string {
  const base = input.acting ? createRelationshipActingGuide(input.acting) :
    "関係性の正本を確認できない。交際済みと決めつけない。既知の事実だけを使い、恋人としての既成事実を作らない。";
  const tags = input.tags.join(", ");
  const guard = input.acting?.relationshipStatus === "romantic_partner"
    ? "交際成立済み。ただし感情タグは表現の候補であり、毎回恋愛台詞にしない。"
    : "交際未成立または未確認。romantic、miss_you、affectionate、playfulは演技の候補に過ぎず、恋人としての呼称・交際の既成事実・独占を正当化しない。恋愛意識が低い場合は優しさを恋愛へ変換しない。";
  const actionGuard = input.action === "PULL"
    ? "距離を置く演技を優先し、romantic、miss_you、affectionateを表に出さない。"
    : input.action === "SULK"
      ? "拗ねても相手を責めたり交際を既成事実にしない。"
      : input.action === "TEASE"
        ? "からかいは相手が受け止められる文脈でだけ使う。"
        : input.action === "CHASE"
          ? "追いかけたい気持ちは交際成立の証拠ではない。"
          : "";
  return [base, "感情・行動タグ（参考）: " + tags, guard, actionGuard].join("\n");
}
const state = (relationshipStatus: "none" | "romantic_partner", romance: number, playfulness = 20): RelationshipActingState =>
  ({ intimacyStage: 2, friendship: 60, trust: 60, playfulness, affection: 55, romance, relationshipStatus });

test("unpartnered high romance plus romantic tags cannot authorize established romance", () => {
  const prompt = compose({ acting: state("none", 90), tags: ["romantic", "miss_you"], action: "CHASE" });
  assert.match(prompt, /交際は成立していない/);
  assert.match(prompt, /恋人としての呼称・交際の既成事実/);
  assert.match(prompt, /追いかけたい気持ちは交際成立の証拠ではない/);
});
test("partner status stays independent from low romance score", () => {
  const prompt = compose({ acting: state("romantic_partner", 10), tags: ["affectionate"], action: "NORMAL" });
  assert.match(prompt, /交際も会話上成立済み/);
  assert.match(prompt, /毎回恋愛台詞にしない/);
});
test("missing acting snapshot fails closed even with romantic tags", () => {
  const prompt = compose({ acting: null, tags: ["romantic"], action: "NORMAL" });
  assert.match(prompt, /交際済みと決めつけない/);
  assert.match(prompt, /交際未成立または未確認/);
});
test("PULL action has precedence over conflicting romance tags", () => {
  const prompt = compose({ acting: state("romantic_partner", 80), tags: ["romantic", "miss_you"], action: "PULL" });
  assert.match(prompt, /距離を置く演技を優先/);
});
test("TEASE at low playfulness must remain context-gated", () => {
  const prompt = compose({ acting: state("none", 0, 10), tags: ["playful"], action: "TEASE" });
  assert.match(prompt, /無理に馴れ馴れしいツッコミを入れない/);
  assert.match(prompt, /相手が受け止められる文脈でだけ/);
});
test("SULK does not imply romantic partnership", () => {
  const prompt = compose({ acting: state("none", 50), tags: ["romantic"], action: "SULK" });
  assert.match(prompt, /拗ねても相手を責めたり交際を既成事実にしない/);
});
