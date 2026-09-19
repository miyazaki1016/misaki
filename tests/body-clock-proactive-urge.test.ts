import assert from "node:assert/strict";
import test from "node:test";
import { deriveProactiveUrge } from "../supabase/functions/body-clock/proactive-urge.ts";

const base={action:"NORMAL" as const,emotion:"neutral" as const,emotionIntensity:0,lifeConfidence:"none" as const,pushesToday:0};
test("due time alone is not a reason to contact",()=>assert.equal(deriveProactiveUrge(base).shouldSend,false));
test("space is a deliberate no-action",()=>assert.deepEqual(deriveProactiveUrge({...base,action:"PULL",emotion:"guarded",emotionIntensity:70}),{shouldSend:false,strength:0,reason:"space_is_the_action"}));
test("hurt does not automatically send a guilt-inducing message",()=>assert.equal(deriveProactiveUrge({...base,emotion:"hurt",emotionIntensity:80}).shouldSend,false));
test("grounded concern can create an urge",()=>assert.equal(deriveProactiveUrge({...base,emotion:"concerned",emotionIntensity:60,lifeConfidence:"explicit"}).shouldSend,true));
test("strong affection may initiate contact, but not repeatedly the same day",()=>{assert.equal(deriveProactiveUrge({...base,emotion:"affectionate",emotionIntensity:75}).shouldSend,true);assert.equal(deriveProactiveUrge({...base,emotion:"affectionate",emotionIntensity:75,pushesToday:1}).shouldSend,false);});
