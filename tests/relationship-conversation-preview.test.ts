import assert from "node:assert/strict";
import test from "node:test";

import { previewRelationshipConversation } from "../lib/relationship-conversation-preview.ts";
import type { RelationshipTimeContext } from "../lib/relationship-time.ts";

const context = (overrides: Partial<RelationshipTimeContext> = {}): RelationshipTimeContext => ({
  exists: true,
  elapsedSeconds: 0,
  elapsedHours: 0,
  timeBand: "recent",
  intimacyLevel: "intimate",
  intimacyPoints: 120,
  emotionPrimary: "neutral",
  emotionIntensity: 0,
  actionState: "NORMAL",
  lastInteractionAt: "2026-09-25T00:00:00.000Z",
  stateUpdatedAt: "2026-09-25T00:00:00.000Z",
  ...overrides,
});

test("read-only preview exposes hurt as distance in the expression guide", () => {
  const result = previewRelationshipConversation(
    context({ emotionPrimary: "affectionate", emotionIntensity: 55 }),
    {
      signals: [{ name: "hurtful", strength: 0.9, confidence: 0.95, evidence: "きつい言い方をされた" }],
      relationshipFacts: { mutualAffectionExplicit: true, datingEstablishedExplicit: true },
    },
    { sustainedCare: 2 }
  );

  assert.equal(result.emotion.primary, "hurt");
  assert.equal(result.emotion.secondary, "affectionate");
  assert.equal(result.action.direction, "space");
  assert.match(result.expressionGuide, /好意は残っていても今は傷を優先/);
});

test("read-only preview keeps apology gradual after repeated harm", () => {
  const result = previewRelationshipConversation(
    context({ emotionPrimary: "hurt", emotionIntensity: 62, actionState: "SULK", elapsedHours: 10 }),
    {
      signals: [
        { name: "apology", strength: 0.9, confidence: 0.95, evidence: "さっきは言いすぎた、ごめん" },
        { name: "repair", strength: 0.7, confidence: 0.9, evidence: "ちゃんと話したい" },
      ],
      relationshipFacts: { mutualAffectionExplicit: true, datingEstablishedExplicit: true },
    },
    { repeatedHarm: 2, reliableRepair: 0, sustainedCare: 1 }
  );

  assert.ok(["hurt", "neutral"].includes(result.emotion.primary));
  assert.ok(result.emotion.intensity < 62);
  assert.notEqual(result.action.direction, "closer");
  assert.match(result.expressionGuide, /即座に全部なかったことにはしない|甘さを義務化しない/);
});

test("read-only preview lets time soften hurt without inventing romance", () => {
  const result = previewRelationshipConversation(
    context({ emotionPrimary: "hurt", emotionIntensity: 42, actionState: "SULK", elapsedHours: 14 }),
    {
      signals: [],
      relationshipFacts: { mutualAffectionExplicit: false, datingEstablishedExplicit: false },
    }
  );

  assert.equal(result.emotion.primary, "hurt");
  assert.ok(result.emotion.intensity < 42);
  assert.notEqual(result.emotion.primary, "affectionate");
  assert.notEqual(result.emotion.primary, "affectionate");
});
