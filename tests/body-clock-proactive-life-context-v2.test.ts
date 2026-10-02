import assert from "node:assert/strict";
import test from "node:test";
import { buildProactiveLifeContext } from "../supabase/functions/body-clock/proactive-life-context.ts";
const now=()=>new Date().toISOString(),days=(n:number)=>new Date(Date.now()-n*86400000).toISOString();
test("fresh explicit user life statement is usable",()=>{const c=buildProactiveLifeContext([{role:"user",text:"今日は夜勤だよ",sentAt:now()}],[]);assert.equal(c.confidence,"explicit");assert.equal(c.situation,"今日は夜勤だよ")});
test("old user life statement is not treated as current",()=>{const c=buildProactiveLifeContext([{role:"user",text:"今日は夜勤だよ",sentAt:days(8)}],[]);assert.equal(c.confidence,"none");assert.equal(c.situation,"none")});
test("timeless memory cannot prove current work or plans",()=>{const c=buildProactiveLifeContext([],["今日は仕事だよ","明日は病院に行く"]);assert.equal(c.confidence,"none");assert.deepEqual(c.evidence,[])});
test("relative-day plan expires instead of becoming a false current plan",()=>{const c=buildProactiveLifeContext([{role:"user",text:"明日は仕事に行く",sentAt:days(2)}],["今日は休みだよ"]);assert.equal(c.confidence,"none");assert.equal(c.plan,"none");assert.equal(c.situation,"none")});

test("unexpired structured life memory can ground Body Clock",()=>{const memory=["[life:v1]"+JSON.stringify({kind:"schedule",fact:"今日は仕事",observedAt:now(),validUntil:new Date(Date.now()+3600000).toISOString(),confidence:1,source:"user"})];const c=buildProactiveLifeContext([],memory);assert.equal(c.confidence,"explicit");assert.equal(c.situation,"今日は仕事");assert.equal(c.evidenceItems[0]?.source,"structured_memory")});
test("expired structured life memory is ignored",()=>{const memory=["[life:v1]"+JSON.stringify({kind:"schedule",fact:"今日は仕事",observedAt:days(2),validUntil:new Date(Date.now()-3600000).toISOString(),confidence:1,source:"user"})];const c=buildProactiveLifeContext([],memory);assert.equal(c.confidence,"none")});
test("malformed structured life memory never leaks raw JSON into context",()=>{const c=buildProactiveLifeContext([],["[life:v1]{broken"]);assert.equal(c.confidence,"none");assert.deepEqual(c.evidence,[])});
test("ordinary saved memory remains background rather than current evidence",()=>{const c=buildProactiveLifeContext([],["今日は仕事だよ"]);assert.equal(c.confidence,"none")});
