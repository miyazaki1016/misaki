import test from "node:test";
import assert from "node:assert/strict";
import { canonicalActingState } from "../lib/relationship-engine-v1.ts";
import { createRelationshipActingGuide } from "../lib/relationship-acting-guide.ts";
import { generateGeminiJson } from "../lib/gemini-json-generator.ts";

const baseRow = {
  friendship_score: 0,
  trust_score: 0,
  playfulness_score: 0,
  affection_score: 1,
  romance_score: 0,
  relationship_status: "none",
};

async function captureSystemInstruction(row: typeof baseRow & { relationship_status: "none" | "romantic_partner" }) {
  const oldFetch = globalThis.fetch;
  let requestBody: any;
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options!.body as string);
    return Response.json({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ reply: "同じ固定応答" }) }] } }],
    });
  };

  try {
    const actingState = canonicalActingState(row, 0);
    const result = await generateGeminiJson({
      apiKey: "test",
      systemInstruction: createRelationshipActingGuide(actingState),
      contents: [{ role: "user", parts: [{ text: "今日は少し疲れたよ。" }] }],
      userText: "今日は少し疲れたよ。",
    });
    assert.equal(JSON.parse(result.text!).reply, "同じ固定応答");
    return requestBody.systemInstruction.parts[0].text as string;
  } finally {
    globalThis.fetch = oldFetch;
  }
}

test("same input/history: canonical romantic_partner status changes the Gemini system instruction", async () => {
  const notDating = await captureSystemInstruction({ ...baseRow, relationship_status: "none" });
  const dating = await captureSystemInstruction({ ...baseRow, relationship_status: "romantic_partner" });

  assert.match(notDating, /交際状態は未成立/);
  assert.match(notDating, /恋愛方向は弱い/);
  assert.match(dating, /交際状態は明示的に成立済み/);
  assert.match(dating, /交際も会話上成立済み/);
  assert.notEqual(notDating, dating);
});

test("affection score only changes the acting instruction when it crosses the current very_high threshold", () => {
  const low = createRelationshipActingGuide(canonicalActingState({ ...baseRow, relationship_status: "none", affection_score: 1 }, 0));
  const high = createRelationshipActingGuide(canonicalActingState({ ...baseRow, relationship_status: "none", affection_score: 80 }, 0));
  const zero = createRelationshipActingGuide(canonicalActingState({ ...baseRow, relationship_status: "none", affection_score: 0 }, 0));

  assert.equal(zero, low, "scores 0 and 1 are both low, so they currently produce identical affection guidance");
  assert.notEqual(low, high);
  assert.match(high, /親愛が深い/);
  assert.doesNotMatch(low, /親愛が深い/);
});
