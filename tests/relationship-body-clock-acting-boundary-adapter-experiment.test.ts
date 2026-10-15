import assert from "node:assert/strict";
import { test } from "node:test";
import { createRelationshipActingGuide, type RelationshipActingState } from "../lib/relationship-acting-guide.ts";

/** Isolated, read-only acting prompt adapter. Never imported by Body Clock production. */
export type LabEmotionTag = "romantic" | "miss_you" | "affectionate" | "playful" | "soft" | "calm";
export type LabAction = "NORMAL" | "PULL" | "SULK" | "TEASE" | "CHASE";
export function createBodyClockActingBoundaryExperiment(input: {
  acting: RelationshipActingState | null;
  tags: LabEmotionTag[];
  action: LabAction;
}): string {
  const { acting, tags, action } = input;
  const guide = acting
    ? createRelationshipActingGuide(acting)
    : "関係性の正本が確認できないため、交際を成立済みと推測しない。";
  const relationshipRule = acting?.relationshipStatus === "romantic_partner"
    ? "交際の事実は成立済み。ただし恋愛タグは強い愛情表現を毎回要求しない。"
    : "交際は未成立または未確認。感情タグは交際の証拠ではない。恋人呼称・独占・交際の既成事実化を避ける。恋愛スコアが低い場合は優しさを恋愛に置き換えない。";
  const actionRule = action === "PULL"
    ? "距離を取る行動を優先し、甘い表現を抑える。"
    : action === "SULK"
      ? "拗ねても罰・攻撃・交際の推測をしない。"
      : action === "TEASE"
        ? "じゃれ合いは相手が受け止められる文脈に限る。"
        : action === "CHASE"
          ? "追いかける行動は恋人関係成立の証拠ではない。"
          : "感情タグを表現の候補として扱う。";
  return [guide, relationshipRule, actionRule, "感情タグは参考情報: " + tags.join(", ")].join("\n");
}
const state = (status: "none" | "romantic_partner", romance: number, playfulness = 10): RelationshipActingState => ({
  intimacyStage: 2, friendship: 50, trust: 50, playfulness, affection: 40, romance, relationshipStatus: status,
});
test("romance score and romantic tag do not establish a partnership", () => {
  const result = createBodyClockActingBoundaryExperiment({ acting: state("none", 90), tags: ["romantic"], action: "NORMAL" });
  assert.match(result, /交際は成立していない/);
  assert.match(result, /感情タグは交際の証拠ではない/);
});
test("partner status remains authoritative despite low romance", () => {
  const result = createBodyClockActingBoundaryExperiment({ acting: state("romantic_partner", 0), tags: [], action: "NORMAL" });
  assert.match(result, /交際の事実は成立済み/);
});
test("missing snapshot does not manufacture a relationship", () => {
  const result = createBodyClockActingBoundaryExperiment({ acting: null, tags: ["romantic"], action: "NORMAL" });
  assert.match(result, /交際を成立済みと推測しない/);
});
test("PULL outranks romantic tag", () => {
  const result = createBodyClockActingBoundaryExperiment({ acting: state("romantic_partner", 90), tags: ["romantic"], action: "PULL" });
  assert.match(result, /距離を取る行動を優先/);
});
test("TEASE does not override low playfulness", () => {
  const result = createBodyClockActingBoundaryExperiment({ acting: state("none", 0), tags: ["playful"], action: "TEASE" });
  assert.match(result, /無理に馴れ馴れしいツッコミを入れない/);
  assert.match(result, /相手が受け止められる文脈に限る/);
});
test("SULK does not become punishment", () => {
  const result = createBodyClockActingBoundaryExperiment({ acting: state("none", 50), tags: ["romantic"], action: "SULK" });
  assert.match(result, /拗ねても罰・攻撃/);
});
