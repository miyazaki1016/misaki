import test from "node:test";
import assert from "node:assert/strict";
import { compareChatPromptSelections } from "../lib/conversation-engine/chat-prompt-selection-diff.mjs";

const baseline = () => [
  { key: "persona", text: "美咲らしく話す", state: "present" },
  { key: "memory", text: "二人の記憶", state: "present", sourceKeys: ["memory:1"] },
  { key: "relationship", text: "長く付き合っている", state: "present" },
  { key: "safety", text: "断定しない", state: "present" },
  { key: "weather", text: "東京の天気：雨", state: "present" },
  { key: "rail", text: "山手線：正常", state: "present" },
];

test("external-only removal saves exact bytes, not fictional tokens", () => {
  const b = baseline();
  const c = b.map(x => ["weather","rail"].includes(x.key) ? { ...x, selected:false, state:"not_relevant" } : x);
  const d = compareChatPromptSelections(b,c);
  assert.equal(d.savedUtf8Bytes,new TextEncoder().encode("東京の天気：雨山手線：正常").length);
  assert.equal(d.modelTokenSavings,null);
});
test("protects persona", () => {
  const b=baseline(),c=b.map(x=>x.key==="persona"?{...x,text:"別の人格"}:x);
  assert.throws(()=>compareChatPromptSelections(b,c),/PROTECTED_SECTION_CHANGED:persona/);
});
test("protects memory", () => {
  const b=baseline(),c=b.map(x=>x.key==="memory"?{...x,selected:false}:x);
  assert.throws(()=>compareChatPromptSelections(b,c),/PROTECTED_SECTION_CHANGED:memory/);
});
test("protects relationship and safety", () => {
  for(const key of ["relationship","safety"]) {
    const b=baseline(),c=b.map(x=>x.key===key?{...x,text:""}:x);
    assert.throws(()=>compareChatPromptSelections(b,c),/PROTECTED_SECTION_CHANGED/);
  }
});
test("rejects added or removed sections", () => {
  const b=baseline();
  assert.throws(()=>compareChatPromptSelections(b,b.slice(1)),/SECTION_SET_CHANGED/);
});
test("rejects silently rewritten external facts", () => {
  const b=baseline(),c=b.map(x=>x.key==="weather"?{...x,text:"晴れ"}:x);
  assert.throws(()=>compareChatPromptSelections(b,c),/EXTERNAL_TEXT_CHANGED/);
});
test("unchanged input is zero savings", () => {
  const b=baseline();assert.equal(compareChatPromptSelections(b,b).savedUtf8Bytes,0);
});
