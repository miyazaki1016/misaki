import test from "node:test";
import assert from "node:assert/strict";
import { buildConversationAttempt } from "../lib/conversation-engine/attempt.ts";
import {
  buildExpressionAdjustmentGuide,
  buildReplyRetryGuide,
} from "../lib/conversation-engine/retry-guides.ts";

const snapshot = {
  baseSystemPrompt: "BASE\n\n人格・記憶・関係性",
  modelMessage: "ユーザーの現在の発言",
  misakiDayType: "work",
  history: [
    { role: "user" as const, text: "昨日の話" },
    { role: "misaki" as const, text: "覚えているよ" },
  ],
};

test("initial attempt keeps exact base prompt and excludes current message from history", () => {
  const result = buildConversationAttempt(snapshot);
  assert.equal(result.systemInstruction, snapshot.baseSystemPrompt);
  assert.equal(result.userText, snapshot.modelMessage);
  assert.deepEqual(result.contents, [
    { role: "user", parts: [{ text: "昨日の話" }] },
    { role: "model", parts: [{ text: "覚えているよ" }] },
  ]);
});

test("retry attempt concatenates exact production retry suffix", () => {
  const problems = ["根拠のない発言"];
  const result = buildConversationAttempt(snapshot, { retryProblems: problems });
  assert.equal(
    result.systemInstruction,
    snapshot.baseSystemPrompt + buildReplyRetryGuide(problems, "work"),
  );
});

test("expression rewrite attempt concatenates exact production supplementary suffix", () => {
  const result = buildConversationAttempt(snapshot, {
    expressionActionGuide: "軽く照れを見せる",
  });
  assert.equal(
    result.systemInstruction,
    snapshot.baseSystemPrompt + buildExpressionAdjustmentGuide("軽く照れを見せる"),
  );
  assert.deepEqual(snapshot.history, [
    { role: "user", text: "昨日の話" },
    { role: "misaki", text: "覚えているよ" },
  ]);
});

test("empty action guide does not add a rewrite suffix", () => {
  assert.equal(
    buildConversationAttempt(snapshot, { expressionActionGuide: "" }).systemInstruction,
    snapshot.baseSystemPrompt,
  );
});
