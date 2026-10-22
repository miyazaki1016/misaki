import test from "node:test";
import assert from "node:assert/strict";
import { candidate, chooseEmptyEventGuide, compareGuideBytes } from "../lib/conversation-engine/empty-event-guide-candidate.mjs";
test("only empty events get a candidate", () => {
  assert.equal(chooseEmptyEventGuide([]), candidate);
  assert.equal(chooseEmptyEventGuide([{type:"earthquake"}]), null);
  assert.throws(() => chooseEmptyEventGuide(undefined), /EVENT_LIST_REQUIRED/);
});
test("absence of observed events is not an all-clear", () => {
  assert.match(candidate, /何も起きていないという意味ではありません/);
  assert.match(candidate, /確認できません/);
});
test("no invented provenance", () => assert.match(candidate, /未確認の出来事や情報を知った経緯を作らず/));
test("ordinary chat need not mention events", () => assert.match(candidate, /必要なときだけ/));
test("byte estimate is not a token estimate or behavior proof", () => {
  const r=compareGuideBytes("とても長い基準テキスト".repeat(20), candidate);
  assert.ok(r.savedBytes>0);
  assert.equal(r.geminiTokensSaved,null);
  assert.equal(r.equivalentBehaviorProven,false);
});
test("invalid inputs fail closed", () => assert.throws(() => compareGuideBytes(null,candidate), /TEXT_REQUIRED/));
