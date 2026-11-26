import assert from "node:assert/strict";
import test from "node:test";
import { makePromptVariants, makeRecentReplySection } from "../lib/context-ab-prompt.ts";

test("A repeats recent replies while B only references existing history", () => {
  const replies = ["またね", "おかえり"];
  const result = makePromptVariants("prefix\n{{RECENT_REPLY_SECTION}}\nsuffix", replies);
  assert.match(result.A, /・またね/);
  assert.match(result.A, /・おかえり/);
  assert.doesNotMatch(result.B, /またね|おかえり/);
  assert.match(result.B, /会話履歴を参照/);
  assert.equal(result.metrics.savedChars, result.A.length - result.B.length);
  assert.equal(result.A.startsWith("prefix\n"), true);
  assert.equal(result.B.endsWith("\nsuffix"), true);
});
test("empty replies are handled without network or writes", () => {
  assert.match(makeRecentReplySection("A", []), /なし/);
  assert.match(makeRecentReplySection("B", []), /会話履歴/);
});
test("missing or duplicate placeholders are rejected", () => {
  assert.throws(() => makePromptVariants("plain", []));
  assert.throws(() => makePromptVariants("{{RECENT_REPLY_SECTION}}{{RECENT_REPLY_SECTION}}", []));
});
