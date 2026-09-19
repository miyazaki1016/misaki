import assert from "node:assert/strict";
import test from "node:test";
import { buildProactiveLifeContext } from "../supabase/functions/body-clock/proactive-life-context.ts";
const now=()=>new Date().toISOString(),days=(n:number)=>new Date(Date.now()-n*86400000).toISOString();
test("fresh explicit user life statement is usable",()=>{const c=buildProactiveLifeContext([{role:"user",text:"今日は夜勤だよ",sentAt:now()}],[]);assert.equal(c.confidence,"explicit");assert.equal(c.situation,"今日は夜勤だよ")});
test("old user life statement is not treated as current",()=>{const c=buildProactiveLifeContext([{role:"user",text:"今日は夜勤だよ",sentAt:days(8)}],[]);assert.equal(c.confidence,"none");assert.equal(c.situation,"none")});
test("timeless memory cannot prove current work or plans",()=>{const c=buildProactiveLifeContext([],["今日は仕事だよ","明日は病院に行く"]);assert.equal(c.confidence,"none");assert.deepEqual(c.evidence,[])});
test("recent plan remains usable without promoting unrelated memory",()=>{const c=buildProactiveLifeContext([{role:"user",text:"明日は仕事に行く",sentAt:days(2)}],["今日は休みだよ"]);assert.equal(c.confidence,"explicit");assert.equal(c.plan,"明日は仕事に行く");assert.equal(c.situation,"none")});
