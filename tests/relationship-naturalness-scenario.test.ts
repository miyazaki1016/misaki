import assert from "node:assert/strict";
import test from "node:test";

import { buildNaturalnessScenarioPreview } from "../lib/relationship-naturalness-scenario.ts";

test("next morning after a hurtful night carries yesterday into the wording prompt", () => {
  const result = buildNaturalnessScenarioPreview({
    name: "仲良い夜→傷つく一言→翌朝",
    context: {
      exists: true,
      elapsedSeconds: 8 * 3600,
      elapsedHours: 8,
      timeBand: "same_day",
      intimacyLevel: "intimate",
      intimacyPoints: 120,
      emotionPrimary: "affectionate",
      emotionIntensity: 58,
      actionState: "NORMAL",
      lastInteractionAt: "2026-09-24T18:00:00.000Z",
      stateUpdatedAt: "2026-09-24T18:00:00.000Z",
    },
    signals: {
      signals: [
        { name: "hurtful", strength: 0.8, confidence: 0.95, evidence: "昨夜きつい言い方をされた" },
      ],
      relationshipFacts: { mutualAffectionExplicit: true, datingEstablishedExplicit: true },
    },
    recentConversation: "ユーザー: もういいって。しつこい\n美咲: ……そういう言い方、ちょっと嫌。",
    relationshipMemory: "普段は冗談を言い合い、親しく話している。",
    userMessage: "おはよう",
  });

  assert.equal(result.userMessage, "おはよう");
  assert.notEqual(result.emotion.primary, "affectionate");
  assert.match(result.systemPrompt, /直近の会話/);
  assert.match(result.systemPrompt, /昨夜|もういいって|そういう言い方/);
  assert.match(result.systemPrompt, /急に普段どおりの甘さへ戻さない/);
});

test("scenario preview is pure and does not require a database or model call", () => {
  const result = buildNaturalnessScenarioPreview({
    name: "初期状態",
    context: null,
    signals: {
      signals: [],
      relationshipFacts: { mutualAffectionExplicit: false, datingEstablishedExplicit: false },
    },
    userMessage: "おはよう",
  });

  assert.equal(result.emotion.primary, "neutral");
  assert.match(result.systemPrompt, /ユーザーとは最初から恋人ではありません/);
});
