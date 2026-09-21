import assert from "node:assert/strict";
import test from "node:test";
import { deriveProactiveMotive, motiveGuide } from "../supabase/functions/body-clock/proactive-motive.ts";

test("fresh user conversation can be the motive for wanting to talk",()=>{const m=deriveProactiveMotive({desire:"talk",focus:"relationship",history:[{role:"user",text:"今日はいいことあったよ",sentAt:new Date().toISOString()}],memory:[],lifeEvidence:[]});assert.equal(m.kind,"recent_conversation");assert.equal(m.freshness,"fresh")});
test("old chat is not presented as the immediate reason to talk",()=>{const old=new Date(Date.now()-8*86400000).toISOString();const m=deriveProactiveMotive({desire:"talk",focus:"relationship",history:[{role:"user",text:"今日は仕事だよ",sentAt:old}],memory:[],lifeEvidence:[]});assert.equal(m.kind,"internal_state")});
test("relationship memory may ground closeness without becoming current-life evidence",()=>{const m=deriveProactiveMotive({desire:"be_close",focus:"relationship",history:[],memory:["二人で前に映画の話をして盛り上がった"],lifeEvidence:[]});assert.equal(m.kind,"relationship_memory");assert.equal(m.freshness,"unknown");assert.match(motiveGuide(m),/現在の生活状況の証拠にはしない/)});
test("check-in keeps explicit life evidence but exposes freshness uncertainty",()=>{const m=deriveProactiveMotive({desire:"check_in",focus:"user",history:[],memory:[],lifeEvidence:["明日は仕事だよ"]});assert.equal(m.kind,"life");assert.equal(m.freshness,"unknown");assert.match(motiveGuide(m),/現在進行形/)});


test("fresh relationship event is preferred as reconnect motive",()=>{
 const now=new Date().toISOString();
 const motive=deriveProactiveMotive({desire:"reconnect",focus:"relationship",history:[{role:"user",text:"またね",sentAt:now}],memory:[],lifeEvidence:[],relationshipEvents:[{eventType:"emotion_action_v2_after_chat",reason:"repair_after_hurt",createdAt:now,direction:"repair"}]});
 assert.equal(motive.kind,"relationship_event");
 assert.equal(motive.evidence,"repair_after_hurt");
});


test("self focus does not hijack a recent user message as its motive",()=>{
 const m=deriveProactiveMotive({desire:"talk",focus:"self",history:[{role:"user",text:"今日は仕事だよ",sentAt:new Date().toISOString()}],memory:["前に映画の話をした"],lifeEvidence:[]});
 assert.equal(m.kind,"internal_state");
 assert.match(m.summary,/美咲自身/);
});


test("user focus does not turn an unrelated relationship memory into a current reason to contact",()=>{
 const m=deriveProactiveMotive({desire:"check_in",focus:"user",history:[],memory:["前に二人で映画の話をして盛り上がった"],lifeEvidence:[]});
 assert.equal(m.kind,"internal_state");
 assert.equal(m.evidence,"none");
});

test("relationship focus prefers a fresh shared event over a generic older memory",()=>{
 const now=new Date().toISOString();
 const m=deriveProactiveMotive({desire:"be_close",focus:"relationship",history:[],memory:["前に映画の話をした"],lifeEvidence:[],relationshipEvents:[{eventType:"emotion_action_v2_after_chat",reason:"shared_warmth_after_chat",createdAt:now,direction:"closer"}]});
 assert.equal(m.kind,"relationship_event");
 assert.equal(m.evidence,"shared_warmth_after_chat");
});

test("self focus remains Misaki-led even when relationship evidence exists",()=>{
 const now=new Date().toISOString();
 const m=deriveProactiveMotive({desire:"talk",focus:"self",history:[{role:"user",text:"今日は忙しかった",sentAt:now}],memory:["二人の思い出"],lifeEvidence:["今日は仕事"] ,relationshipEvents:[{eventType:"emotion_action_v2_after_chat",reason:"warm_chat",createdAt:now}]});
 assert.equal(m.kind,"internal_state");
 assert.match(m.summary,/美咲自身/);
});


test("topic source identifies whose material actually grounds the message",()=>{
 const now=new Date().toISOString();
 const self=deriveProactiveMotive({desire:"talk",focus:"self",history:[{role:"user",text:"今日は忙しい",sentAt:now}],memory:[],lifeEvidence:["今日は仕事"]});
 const user=deriveProactiveMotive({desire:"check_in",focus:"user",history:[],memory:[],lifeEvidence:["今日は仕事"]});
 const relationship=deriveProactiveMotive({desire:"reconnect",focus:"relationship",history:[],memory:[],lifeEvidence:[],relationshipEvents:[{eventType:"emotion_action_v2_after_chat",reason:"repair_after_hurt",createdAt:now}]});
 assert.equal(self.topicSource,"misaki");
 assert.equal(user.topicSource,"user");
 assert.equal(relationship.topicSource,"relationship");
});

test("no grounded topic remains explicitly none instead of borrowing unrelated evidence",()=>{
 const m=deriveProactiveMotive({desire:"check_in",focus:"user",history:[],memory:["昔の二人の思い出"],lifeEvidence:[]});
 assert.equal(m.topicSource,"none");
 assert.equal(m.evidence,"none");
});


test("topic intent says why Misaki is speaking, independently from the evidence source",()=>{
 const now=new Date().toISOString();
 const self=deriveProactiveMotive({desire:"talk",focus:"self",history:[],memory:[],lifeEvidence:[]});
 const care=deriveProactiveMotive({desire:"check_in",focus:"user",history:[],memory:[],lifeEvidence:["今日は仕事"]});
 const bond=deriveProactiveMotive({desire:"be_close",focus:"relationship",history:[],memory:[],lifeEvidence:[],relationshipEvents:[{eventType:"emotion_action_v2_after_chat",reason:"warm_chat",createdAt:now}]});
 assert.equal(self.topicIntent,"share_self");
 assert.equal(care.topicIntent,"care_for_user");
 assert.equal(bond.topicIntent,"continue_relationship");
});

test("missing evidence never manufactures an intent from an unrelated memory",()=>{
 const m=deriveProactiveMotive({desire:"check_in",focus:"user",history:[],memory:["二人で映画の話をした"],lifeEvidence:[]});
 assert.equal(m.topicIntent,"none");
 assert.equal(m.topicSource,"none");
});
