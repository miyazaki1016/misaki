import assert from "node:assert/strict";
import test from "node:test";

import { buildNaturalnessScenarioPreview } from "../lib/relationship-naturalness-scenario.ts";

test("apology after hurt can soften the relationship without snapping back to closeness", () => {
  const result = buildNaturalnessScenarioPreview({
    name: "傷つく→謝罪→少し和らぐ",
    context: {
      exists: true,
      elapsedSeconds: 2 * 3600,
      elapsedHours: 2,
      timeBand: "recent",
      intimacyLevel: "intimate",
      intimacyPoints: 120,
      emotionPrimary: "hurt",
      emotionIntensity: 62,
      actionState: "PULL",
      lastInteractionAt: "2026-09-24T20:00:00.000Z",
      stateUpdatedAt: "2026-09-24T20:00:00.000Z",
    },
    signals: {
      signals: [
        { name: "apology", strength: 0.9, confidence: 0.98, evidence: "ごめん、言いすぎた" },
        { name: "repair", strength: 0.75, confidence: 0.9, evidence: "ちゃんと話したい" },
      ],
      relationshipFacts: { mutualAffectionExplicit: true, datingEstablishedExplicit: true },
    },
    patterns: { repeatedHarm: 2, reliableRepair: 0, sustainedCare: 2 },
    recentConversation: "ユーザー: ごめん、言いすぎた。ちゃんと話したい\n美咲: ……うん。",
    relationshipMemory: "普段は親しいが、最近きつい言い方で傷ついたことが複数回ある。",
    userMessage: "まだ怒ってる？",
  });

  assert.ok(result.emotion.intensity < 62);
  assert.notEqual(result.action.direction, "closer");
  assert.match(result.systemPrompt, /急に普段どおりの甘さへ戻さない/);
});

test("grounded concern during conflict does not erase the conflict", () => {
  const result = buildNaturalnessScenarioPreview({
    name: "喧嘩中でも心配はする",
    context: {
      exists: true,
      elapsedSeconds: 5 * 3600,
      elapsedHours: 5,
      timeBand: "recent",
      intimacyLevel: "intimate",
      intimacyPoints: 120,
      emotionPrimary: "guarded",
      emotionIntensity: 48,
      actionState: "PULL",
      lastInteractionAt: "2026-09-25T00:00:00.000Z",
      stateUpdatedAt: "2026-09-25T00:00:00.000Z",
    },
    signals: {
      signals: [
        { name: "concern", strength: 0.8, confidence: 0.95, evidence: "帰りが遅くなると聞いている" },
      ],
      relationshipFacts: { mutualAffectionExplicit: true, datingEstablishedExplicit: true },
    },
    recentConversation: "美咲: 今はちょっと距離置きたい。\nユーザー: 今日かなり遅くなる。",
    userMessage: "今から帰る",
  });

  assert.notEqual(result.emotion.primary, "affectionate");
  assert.match(result.systemPrompt, /心配|気遣|check|concern|距離/);
});
