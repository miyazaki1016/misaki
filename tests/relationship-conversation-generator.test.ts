import assert from "node:assert/strict";
import test from "node:test";

import { createGeminiConversationGenerator } from "../lib/relationship-conversation-generator.ts";

test("preview generator uses the same Gemini model without making a real API call", async () => {
  let requestedUrl = "";
  let requestedBody: any = null;

  const fakeFetch = async (input: string | URL | Request, init?: RequestInit) => {
    requestedUrl = String(input);
    requestedBody = JSON.parse(String(init?.body ?? "{}"));
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ reply: "……おはよ。" }) }] } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const generate = createGeminiConversationGenerator("test-key", fakeFetch as typeof fetch);
  const reply = await generate({
    systemPrompt: "美咲の人格と現在感情",
    message: "おはよう",
    history: [{ role: "user", text: "昨日はごめん" }],
  });

  assert.equal(reply, "……おはよ。");
  assert.match(requestedUrl, /gemini-3\.1-flash-lite:generateContent/);
  assert.equal(requestedBody.systemInstruction.parts[0].text, "美咲の人格と現在感情");
  assert.deepEqual(requestedBody.contents, [
    { role: "user", parts: [{ text: "昨日はごめん" }] },
    { role: "user", parts: [{ text: "おはよう" }] },
  ]);
  assert.equal(requestedBody.generationConfig.responseMimeType, "application/json");
});

test("preview generator rejects malformed model output", async () => {
  const fakeFetch = async () =>
    new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ nope: true }) }] } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  const generate = createGeminiConversationGenerator("test-key", fakeFetch as typeof fetch);

  await assert.rejects(
    () => generate({ systemPrompt: "x", message: "y" }),
    /GEMINI_PREVIEW_INVALID_REPLY/
  );
});
