import assert from "node:assert/strict";
import test from "node:test";
import { deriveProactiveMotive, motiveGuide } from "../supabase/functions/body-clock/proactive-motive.ts";

test("fresh user conversation can be the motive for wanting to talk",()=>{const m=deriveProactiveMotive({desire:"talk",history:[{role:"user",text:"今日はいいことあったよ",sentAt:new Date().toISOString()}],memory:[],lifeEvidence:[]});assert.equal(m.kind,"recent_conversation");assert.equal(m.freshness,"fresh")});
test("old chat is not presented as the immediate reason to talk",()=>{const old=new Date(Date.now()-8*86400000).toISOString();const m=deriveProactiveMotive({desire:"talk",history:[{role:"user",text:"今日は仕事だよ",sentAt:old}],memory:[],lifeEvidence:[]});assert.equal(m.kind,"internal_state")});
test("relationship memory may ground closeness without becoming current-life evidence",()=>{const m=deriveProactiveMotive({desire:"be_close",history:[],memory:["二人で前に映画の話をして盛り上がった"],lifeEvidence:[]});assert.equal(m.kind,"relationship_memory");assert.equal(m.freshness,"unknown");assert.match(motiveGuide(m),/現在の生活状況の証拠にはしない/)});
test("check-in keeps explicit life evidence but exposes freshness uncertainty",()=>{const m=deriveProactiveMotive({desire:"check_in",history:[],memory:[],lifeEvidence:["明日は仕事だよ"]});assert.equal(m.kind,"life");assert.equal(m.freshness,"unknown");assert.match(motiveGuide(m),/現在進行形/)});
