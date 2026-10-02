import assert from "node:assert/strict";
import test from "node:test";
import {
  createLifeUnderstandingGuide,
  selectRelevantLifeFacts,
} from "../lib/relationship-life-context.ts";

const now = "2026-09-25T12:00:00+09:00";

test("期限切れの一時予定を現在事実として残さない", () => {
  const facts = selectRelevantLifeFacts([
    { kind: "schedule", fact: "昨日は遅番", validUntil: "2026-09-24T23:59:59+09:00" },
    { kind: "profile", fact: "タクシードライバー", source: "memory" },
  ], now);

  assert.deepEqual(facts.map((x) => x.fact), ["タクシードライバー"]);
});

test("現在有効な予定と固定プロフィールを分ける", () => {
  const facts = selectRelevantLifeFacts([
    { kind: "profile", fact: "タクシードライバー" },
    { kind: "schedule", fact: "今日は15時から乗務", validUntil: "2026-09-26T11:00:00+09:00" },
  ], now);

  assert.equal(facts[0].relevance, "background");
  assert.equal(facts[1].relevance, "current");
});

test("信頼度の低い推測は生活理解へ入れない", () => {
  const facts = selectRelevantLifeFacts([
    { kind: "situation", fact: "たぶん今は羽田にいる", confidence: 0.4 },
    { kind: "situation", fact: "今日は休みと本人が言った", confidence: 1, source: "user" },
  ], now);

  assert.deepEqual(facts.map((x) => x.fact), ["今日は休みと本人が言った"]);
});

test("ガイドは不足情報の補完と生活情報だけの感情捏造を禁止する", () => {
  const facts = selectRelevantLifeFacts([
    { kind: "schedule", fact: "今日は帰りが遅い", validUntil: "2026-09-26T00:00:00+09:00" },
  ], now);
  const guide = createLifeUnderstandingGuide(facts);

  assert.match(guide, /仕事、体調、居場所、予定、気分を自然さのために補完しない/);
  assert.match(guide, /生活情報だけで恋愛感情、心配、怒り、関係進展を新規生成しない/);
  assert.match(guide, /現在の明示発言を優先/);
});
