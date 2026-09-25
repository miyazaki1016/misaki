import assert from "node:assert/strict";
import test from "node:test";
import {
  extractExplicitLifeFacts,
  selectRelevantLifeFacts,
} from "../lib/relationship-life-context.ts";

const observedAt = "2026-09-25T10:00:00+09:00";

test("本人が明示した今日の休みだけを期限付きで抽出する", () => {
  const facts = extractExplicitLifeFacts("今日は休みだよ", observedAt);
  assert.equal(facts.length, 1);
  assert.equal(facts[0].fact, "今日は休み");
  assert.equal(facts[0].kind, "schedule");
  assert.equal(facts[0].source, "user");
  assert.ok(facts[0].validUntil);
});

test("今日の予定は翌日には現在事実として使わない", () => {
  const facts = extractExplicitLifeFacts("今日は仕事だよ", observedAt);
  const relevant = selectRelevantLifeFacts(facts, "2026-09-26T12:00:00+09:00");
  assert.equal(relevant.length, 0);
});

test("明日の予定は当日中に期限切れにしない", () => {
  const facts = extractExplicitLifeFacts("明日は休み", observedAt);
  const relevant = selectRelevantLifeFacts(facts, "2026-09-26T12:00:00+09:00");
  assert.equal(relevant.length, 1);
  assert.equal(relevant[0].fact, "明日は休み");
});

test("第三者や曖昧な話題を本人の生活予定にしない", () => {
  assert.equal(extractExplicitLifeFacts("友達は今日は仕事らしい", observedAt).length, 0);
  assert.equal(extractExplicitLifeFacts("今日は仕事の話をした", observedAt).length, 0);
  assert.equal(extractExplicitLifeFacts("明日は休みかな？", observedAt).length, 0);
});
