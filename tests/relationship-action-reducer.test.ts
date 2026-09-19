import assert from "node:assert/strict";
import test from "node:test";
import { reduceRelationshipAction } from "../lib/relationship-action-reducer.ts";

const assessment = (signals = []) => ({signals,relationshipFacts:{mutualAffectionExplicit:false,datingEstablishedExplicit:false}});

test("affection plus elapsed time alone does not force reconnect or tease",()=>{
 const d=reduceRelationshipAction({previousAction:"NORMAL",emotion:{primary:"affectionate",intensity:55,reason:"existing_emotion_settled_with_time",evidence:[]},signals:assessment(),intimacyLevel:"intimate"});
 assert.deepEqual({action:d.action,direction:d.direction},{action:"NORMAL",direction:"steady"});
});
test("grounded concern chooses check-in",()=>{
 const d=reduceRelationshipAction({previousAction:"NORMAL",emotion:{primary:"concerned",intensity:50,reason:"grounded_concern",evidence:["具合悪い"]},signals:assessment([{name:"concern",strength:.9,confidence:.9,evidence:"具合悪い"}]),intimacyLevel:"familiar"});
 assert.equal(d.action,"CHASE"); assert.equal(d.direction,"check_in");
});
test("rejection creates space without punitive behavior",()=>{
 const d=reduceRelationshipAction({previousAction:"NORMAL",emotion:{primary:"guarded",intensity:55,reason:"relational_harm",evidence:["放っておいて"]},signals:assessment([{name:"rejection",strength:.9,confidence:.95,evidence:"放っておいて"}]),intimacyLevel:"intimate"});
 assert.equal(d.action,"PULL"); assert.equal(d.direction,"space");
});
test("repair moves toward reconnect",()=>{
 const d=reduceRelationshipAction({previousAction:"SULK",emotion:{primary:"hurt",intensity:30,reason:"repair_in_progress",evidence:["ごめん"]},signals:assessment([{name:"repair",strength:.9,confidence:.9,evidence:"仲直りしたい"}]),intimacyLevel:"intimate"});
 assert.equal(d.action,"RECONNECT"); assert.equal(d.direction,"repair");
});
test("teasing requires current warmth and established closeness",()=>{
 const sig=assessment([{name:"romantic",strength:.9,confidence:.9,evidence:"大好き"}]);
 assert.equal(reduceRelationshipAction({previousAction:"NORMAL",emotion:{primary:"affectionate",intensity:60,reason:"romantic_warmth",evidence:["大好き"]},signals:sig,intimacyLevel:"initial"}).action,"NORMAL");
 assert.equal(reduceRelationshipAction({previousAction:"NORMAL",emotion:{primary:"affectionate",intensity:60,reason:"romantic_warmth",evidence:["大好き"]},signals:sig,intimacyLevel:"intimate"}).action,"TEASE");
});
