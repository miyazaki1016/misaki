import assert from "node:assert/strict";
import test from "node:test";
import { createIsolatedGeminiAdapter } from "../lib/context-ab-gemini-adapter.ts";

test("isolated adapter calls Gemini with frozen input, returns token counts and never calls chat", async () => {
  const urls: string[] = [];
  const adapter = createIsolatedGeminiAdapter({
    apiKey: "test-only",
    model: "gemini-test",
    fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
      urls.push(String(input));
      assert.match(String(input), /generativelanguage.googleapis.com/);
      assert.equal(init?.method, "POST");
      const body = JSON.parse(String(init?.body));
      assert.equal(body.systemInstruction.parts[0].text, "system");
      assert.equal(body.contents.length, 2);
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: '{"reply":"hello"}' }] } }],
        usageMetadata: { promptTokenCount: 400, candidatesTokenCount: 20 },
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as typeof fetch,
  });
  const result = await adapter({ systemInstruction: "system", history: [{ role: "model", text: "previous" }], userText: "hi" });
  assert.equal(result.success, true);
  assert.equal(result.jsonValid, true);
  assert.equal(result.promptTokens, 400);
  assert.equal(result.outputTokens, 20);
  assert.equal(urls.length, 1);
});
test("isolated adapter handles upstream HTTP errors and never claims success", async () => {
  const adapter = createIsolatedGeminiAdapter({
    apiKey: "test-only", model: "gemini-test",
    fetchImpl: (async () => new Response(JSON.stringify({ error: { message: "rate limited" } }), { status: 429 })) as typeof fetch,
  });
  const result = await adapter({ systemInstruction: "", history: [], userText: "" });
  assert.equal(result.success, false);
  assert.equal(result.jsonValid, false);
});
test("isolated adapter refuses missing credentials", () => {
  assert.throws(() => createIsolatedGeminiAdapter({ apiKey: "", model: "gemini-test" }));
});
