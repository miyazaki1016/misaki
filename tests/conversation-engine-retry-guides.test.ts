import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReplyRetryGuide,
  buildExpressionAdjustmentGuide,
} from "../lib/conversation-engine/retry-guides.ts";

test("retry suffix is absent when there are no problems", () => {
  assert.equal(buildReplyRetryGuide(undefined, "work"), "");
  assert.equal(buildReplyRetryGuide([], "work"), "");
});

test("retry suffix keeps all problems and workday semantics", () => {
  const result = buildReplyRetryGuide(["根拠のない行動", "架空の天気経過"], "work");
  assert.ok(result.startsWith("\n\n【前の返答は不採用】"));
  assert.match(result, /・根拠のない行動\n・架空の天気経過/);
  assert.match(result, /「仕事の日」/);
  assert.ok(result.endsWith("必ずJSONだけを返してください。\n"));
  assert.match(buildReplyRetryGuide(["問題"], "off"), /「休みの日」/);
});

test("expression suffix preserves action guide and instruction verbatim", () => {
  const result = buildExpressionAdjustmentGuide("気持ちを少し抑える");
  assert.ok(result.startsWith("\n\n【今回の関係状態に合わせた表現調整】"));
  assert.match(result, /気持ちを少し抑える/);
  assert.match(result, /relationshipSignals は最初の判定をやり直さず/);
  assert.ok(result.endsWith("同じ意味を保ってください。\n"));
});
