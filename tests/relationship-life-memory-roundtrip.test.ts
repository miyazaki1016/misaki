import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeLifeFactMemory,
  encodeLifeFactMemory,
  extractExplicitLifeFacts,
  selectRelevantLifeFacts,
  splitLifeFactMemory,
} from "../lib/relationship-life-context.ts";

test("明示した今日の予定は構造化記憶として次ターンへ持ち越せる", () => {
  const observedAt = "2026-09-25T10:00:00+09:00";
  const facts = extractExplicitLifeFacts("今日は休みだよ", observedAt);
  assert.equal(facts.length, 1);

  const encoded = encodeLifeFactMemory(facts[0]);
  const decoded = decodeLifeFactMemory(encoded);
  assert.ok(decoded);
  assert.equal(decoded.fact, "今日は休み");
  assert.equal(decoded.kind, "schedule");
  assert.equal(decoded.source, "user");

  const nextTurn = selectRelevantLifeFacts(
    [decoded],
    "2026-09-25T18:00:00+09:00"
  );
  assert.equal(nextTurn.length, 1);
});

test("持ち越した今日の予定は翌日には生活判断へ残らない", () => {
  const fact = extractExplicitLifeFacts(
    "今日は仕事だよ",
    "2026-09-25T10:00:00+09:00"
  )[0];
  const carried = decodeLifeFactMemory(encodeLifeFactMemory(fact));
  assert.ok(carried);

  const tomorrow = selectRelevantLifeFacts(
    [carried],
    "2026-09-26T09:00:00+09:00"
  );
  assert.equal(tomorrow.length, 0);
});

test("普通の長期記憶と期限付き生活記憶を分離できる", () => {
  const fact = extractExplicitLifeFacts(
    "明日は休み",
    "2026-09-25T10:00:00+09:00"
  )[0];
  const split = splitLifeFactMemory([
    "猫が好き",
    encodeLifeFactMemory(fact),
    "コーヒーはブラックが好き",
  ]);

  assert.deepEqual(split.ordinaryMemory, [
    "猫が好き",
    "コーヒーはブラックが好き",
  ]);
  assert.equal(split.facts.length, 1);
  assert.equal(split.facts[0].fact, "明日は休み");
});

test("壊れた構造化記憶は生活事実として採用しない", () => {
  assert.equal(decodeLifeFactMemory("[life:v1]{broken"), null);
  assert.equal(
    decodeLifeFactMemory('[life:v1]{"kind":"invented","fact":"今日は休み"}'),
    null
  );
});
