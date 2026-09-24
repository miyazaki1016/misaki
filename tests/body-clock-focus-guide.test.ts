import assert from "node:assert/strict";
import test from "node:test";
import { focusGuide } from "../supabase/functions/body-clock/focus-guide.ts";

test("self focus keeps the proactive topic centered on Misaki",()=>{
 const g=focusGuide("self");
 assert.match(g,/中心は美咲自身/);
 assert.match(g,/御用聞きにしない/);
});

test("user focus requires grounded user context without surveillance",()=>{
 const g=focusGuide("user");
 assert.match(g,/中心はユーザー/);
 assert.match(g,/根拠のある生活文脈/);
 assert.match(g,/監視や詮索/);
});

test("relationship focus stays on shared relationship without invented history",()=>{
 const g=focusGuide("relationship");
 assert.match(g,/中心は二人の関係/);
 assert.match(g,/存在しない交際事実や思い出を作らない/);
});
