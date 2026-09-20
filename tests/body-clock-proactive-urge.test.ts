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
test("teasing affection becomes playful desire when there is no explicit photo opportunity",()=>assert.equal(deriveProactiveUrge({...base,photoOpportunity:false,action:"TEASE",emotion:"affectionate",emotionIntensity:70,intimacyLevel:3}).desire,"be_playful"));
test("strong affection needs relationship depth before initiating closeness",()=>{assert.equal(deriveProactiveUrge({...base,emotion:"affectionate",emotionIntensity:80,intimacyLevel:1}).shouldSend,false);const r=deriveProactiveUrge({...base,emotion:"affectionate",emotionIntensity:80,intimacyLevel:2});assert.equal(r.shouldSend,true);assert.equal(r.desire,"be_close")});
test("strong affection does not repeatedly initiate the same day",()=>assert.equal(deriveProactiveUrge({...base,emotion:"affectionate",emotionIntensity:80,intimacyLevel:3,pushesToday:1}).shouldSend,false));
test("happy relationship may want to talk without manufacturing romance",()=>{const r=deriveProactiveUrge({...base,emotion:"happy",emotionIntensity:80,intimacyLevel:2});assert.equal(r.shouldSend,true);assert.equal(r.desire,"talk")});
test("desire guides keep action intent separate from invented relationship facts",()=>{assert.match(desireGuide("be_close"),/交際事実/);assert.match(desireGuide("check_in"),/根拠/);assert.match(desireGuide("reconnect"),/強要しない/)});

test("photo desire is an explicit motive, not a random attachment",()=>{const r=deriveProactiveUrge({...base,photoOpportunity:true,action:"TEASE",emotion:"affectionate",emotionIntensity:80,intimacyLevel:3});assert.equal(r.shouldSend,true);assert.equal(r.desire,"share_photo");assert.equal(r.reason,"strong_affection_wants_to_show_something")});
test("photo opportunity alone cannot create a photo desire",()=>assert.notEqual(deriveProactiveUrge({...base,photoOpportunity:true,emotion:"neutral",emotionIntensity:90,intimacyLevel:3}).desire,"share_photo"));
test("photo desire requires enough relationship depth",()=>assert.notEqual(deriveProactiveUrge({...base,photoOpportunity:true,action:"TEASE",emotion:"affectionate",emotionIntensity:90,intimacyLevel:1}).desire,"share_photo"));


test("unresolved hurt with remaining affection still chooses silence over contact",()=>{const r=deriveProactiveUrge({...base,action:"PULL",emotion:"hurt",emotionIntensity:44,intimacyLevel:3});assert.equal(r.shouldSend,false);assert.equal(r.desire,"give_space");assert.equal(r.reason,"space_is_the_action")});
test("next-morning reconnect can initiate gently after hurt has softened",()=>{const r=deriveProactiveUrge({...base,action:"RECONNECT",emotion:"hurt",emotionIntensity:28,intimacyLevel:3});assert.equal(r.shouldSend,true);assert.equal(r.desire,"reconnect");assert.equal(r.reason,"repair_wants_contact")});
test("ordinary next morning does not contact just because intimacy is deep",()=>{const r=deriveProactiveUrge({...base,action:"NORMAL",emotion:"neutral",emotionIntensity:12,intimacyLevel:3});assert.equal(r.shouldSend,false);assert.equal(r.reason,"no_internal_urge")});
test("safety-relevant grounded concern can contact even without affectionate mood",()=>{const r=deriveProactiveUrge({...base,action:"CHASE",emotion:"concerned",emotionIntensity:55,intimacyLevel:1,lifeConfidence:"explicit"});assert.equal(r.shouldSend,true);assert.equal(r.desire,"check_in");assert.equal(r.reason,"grounded_concern_wants_check_in")});

test("grounded external alert can become concern input without pretending it came from the user",()=>{const r=deriveProactiveUrge({...base,action:"CHASE",emotion:"concerned",emotionIntensity:55,intimacyLevel:1,externalConcern:true});assert.equal(r.shouldSend,true);assert.equal(r.desire,"check_in");assert.equal(r.reason,"grounded_external_concern_wants_check_in")});
test("external alert flag alone cannot create concern or contact",()=>{const r=deriveProactiveUrge({...base,externalConcern:true,emotion:"neutral",emotionIntensity:80,intimacyLevel:3});assert.equal(r.shouldSend,false);assert.equal(r.reason,"no_internal_urge")});


test("wanting closeness shortly after contact can remain a feeling without becoming another message",()=>{
 const r=deriveProactiveUrge({...base,emotion:"affectionate",emotionIntensity:82,intimacyLevel:3,hoursSinceLastContact:2});
 assert.equal(r.shouldSend,false);
 assert.equal(r.reason,"no_internal_urge");
});

test("playful urge waits when they just talked",()=>{
 const r=deriveProactiveUrge({...base,action:"TEASE",emotion:"affectionate",emotionIntensity:72,intimacyLevel:3,hoursSinceLastContact:1});
 assert.equal(r.shouldSend,false);
});

test("ordinary desire can act again after enough relationship time passes",()=>{
 const r=deriveProactiveUrge({...base,emotion:"affectionate",emotionIntensity:82,intimacyLevel:3,hoursSinceLastContact:8});
 assert.equal(r.shouldSend,true);
 assert.equal(r.desire,"be_close");
});

test("grounded concern is not silenced by the ordinary recent-contact cooldown",()=>{
 const r=deriveProactiveUrge({...base,action:"CHASE",emotion:"concerned",emotionIntensity:60,lifeConfidence:"explicit",hoursSinceLastContact:1});
 assert.equal(r.shouldSend,true);
 assert.equal(r.desire,"check_in");
});


test("proactive focus distinguishes Misaki, the user, and the relationship",()=>{
 assert.equal(deriveProactiveUrge({...base,photoOpportunity:true,action:"TEASE",emotion:"affectionate",emotionIntensity:80,intimacyLevel:3}).focus,"self");
 assert.equal(deriveProactiveUrge({...base,action:"CHASE",emotion:"concerned",emotionIntensity:60,lifeConfidence:"explicit"}).focus,"user");
 assert.equal(deriveProactiveUrge({...base,action:"RECONNECT",emotion:"hurt",emotionIntensity:28,intimacyLevel:3}).focus,"relationship");
});

test("ordinary affectionate closeness is about the relationship rather than inventing a user need",()=>{
 const r=deriveProactiveUrge({...base,emotion:"affectionate",emotionIntensity:82,intimacyLevel:3});
 assert.equal(r.shouldSend,true);
 assert.equal(r.desire,"be_close");
 assert.equal(r.focus,"relationship");
});
