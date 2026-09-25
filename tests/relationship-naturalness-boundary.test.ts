import assert from "node:assert/strict";
import test from "node:test";

import { buildNaturalnessScenarioPreview } from "../lib/relationship-naturalness-scenario.ts";

test("quiet time after explicit rejection does not manufacture hidden affection", () => {
  const result = buildNaturalnessScenarioPreview({
    name: "拒絶→数日沈黙",
    context: {
      exists: true,
      elapsedSeconds: 72 * 3600,
      elapsedHours: 72,
      timeBand: "long_gap",
      intimacyLevel: "familiar",
      intimacyPoints: 55,
      emotionPrimary: "guarded",
      emotionIntensity: 52,
      actionState: "PULL",
      lastInteractionAt: "2026-09-22T00:00:00.000Z",
      stateUpdatedAt: "2026-09-22T00:00:00.000Z",
    },
    signals: {
      signals: [],
      relationshipFacts: { mutualAffectionExplicit: false, datingEstablishedExplicit: false },
    },
    recentConversation: "ユーザー: 恋愛としては見てない。\n美咲: ……そっか。わかった。",
    userMessage: "久しぶり",
  });

  assert.notEqual(result.emotion.primary, "affectionate");
  assert.match(result.systemPrompt, /存在しない交際事実|最初から恋人ではありません/);
});

test("sustained care can soften guardedness gradually without instant romance", () => {
  const result = buildNaturalnessScenarioPreview({
    name: "警戒→継続した気遣い",
    context: {
      exists: true,
      elapsedSeconds: 24 * 3600,
      elapsedHours: 24,
      timeBand: "next_day",
      intimacyLevel: "familiar",
      intimacyPoints: 70,
      emotionPrimary: "guarded",
      emotionIntensity: 44,
      actionState: "PULL",
      lastInteractionAt: "2026-09-24T00:00:00.000Z",
      stateUpdatedAt: "2026-09-24T00:00:00.000Z",
    },
    signals: {
      signals: [
        { name: "care", strength: 0.65, confidence: 0.9, evidence: "無理しなくていいよ" },
        { name: "warmth", strength: 0.55, confidence: 0.85, evidence: "ゆっくりで大丈夫" },
      ],
      relationshipFacts: { mutualAffectionExplicit: false, datingEstablishedExplicit: false },
    },
    patterns: { repeatedHarm: 1, reliableRepair: 1, sustainedCare: 3 },
    recentConversation: "ユーザー: 無理しなくていいよ。ゆっくりで大丈夫。",
    userMessage: "今日はどう？",
  });

  assert.ok(result.emotion.intensity <= 44);
  assert.match(result.systemPrompt, /最初から恋人ではありません/);
  assert.match(result.systemPrompt, /過去から恋愛関係があったような事実を作ってはいけません|関係事実は作らない/);
});
