import assert from "node:assert/strict";
import test from "node:test";
import { deriveProactiveUrge, desireGuide } from "../supabase/functions/body-clock/proactive-urge.ts";

const base={action:"NORMAL" as const,emotion:"neutral" as const,emotionIntensity:0,intimacyLevel:0,lifeConfidence:"none" as const,pushesToday:0};

test("due time alone is not a reason to contact",()=>assert.deepEqual(deriveProactiveUrge(base),{shouldSend:false,strength:0,desire:"none",reason:"no_internal_urge"}));
test("space is a deliberate desire rather than a failed delivery",()=>assert.deepEqual(deriveProactiveUrge({...base,action:"PULL",emotion:"guarded",emotionIntensity:70}),{shouldSend:false,strength:0,desire:"give_space",reason:"space_is_the_action"}));
test("hurt does not automatically send a guilt-inducing message",()=>{const r=deriveProactiveUrge({...base,emotion:"hurt",emotionIntensity:80});assert.equal(r.shouldSend,false);assert.equal(r.desire,"give_space")});
test("grounded concern becomes check_in",()=>{const r=deriveProactiveUrge({...base,emotion:"concerned",emotionIntensity:60,lifeConfidence:"explicit"});assert.equal(r.shouldSend,true);assert.equal(r.desire,"check_in")});
test("concern without grounded life evidence does not initiate",()=>assert.equal(deriveProactiveUrge({...base,emotion:"concerned",emotionIntensity:90}).shouldSend,false));
test("repair becomes reconnect rather than generic affection",()=>assert.equal(deriveProactiveUrge({...base,action:"RECONNECT",emotion:"affectionate",emotionIntensity:55,intimacyLevel:3}).desire,"reconnect"));
test("teasing affection becomes playful desire",()=>assert.equal(deriveProactiveUrge({...base,action:"TEASE",emotion:"affectionate",emotionIntensity:70,intimacyLevel:3}).desire,"be_playful"));
test("strong affection needs relationship depth before initiating closeness",()=>{assert.equal(deriveProactiveUrge({...base,emotion:"affectionate",emotionIntensity:80,intimacyLevel:1}).shouldSend,false);const r=deriveProactiveUrge({...base,emotion:"affectionate",emotionIntensity:80,intimacyLevel:2});assert.equal(r.shouldSend,true);assert.equal(r.desire,"be_close")});
test("strong affection does not repeatedly initiate the same day",()=>assert.equal(deriveProactiveUrge({...base,emotion:"affectionate",emotionIntensity:80,intimacyLevel:3,pushesToday:1}).shouldSend,false));
test("happy relationship may want to talk without manufacturing romance",()=>{const r=deriveProactiveUrge({...base,emotion:"happy",emotionIntensity:80,intimacyLevel:2});assert.equal(r.shouldSend,true);assert.equal(r.desire,"talk")});
test("desire guides keep action intent separate from invented relationship facts",()=>{assert.match(desireGuide("be_close"),/交際事実/);assert.match(desireGuide("check_in"),/根拠/);assert.match(desireGuide("reconnect"),/強要しない/)});
