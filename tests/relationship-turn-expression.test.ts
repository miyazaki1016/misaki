import assert from "node:assert/strict";
import test from "node:test";
import { createCurrentTurnActionGuide } from "../lib/relationship-turn-expression.ts";

test("space is expressed without punishment",()=>{const g=createCurrentTurnActionGuide({action:"PULL",direction:"space",reason:"boundary"});assert.match(g,/罰・無視・罪悪感/);assert.match(g,/会話を拒否しない/);});
test("closer cannot invent dating status",()=>{const g=createCurrentTurnActionGuide({action:"NORMAL",direction:"closer",reason:"warmth"});assert.match(g,/恋人関係が未成立/);});
test("repair keeps continuity instead of erasing hurt",()=>{const g=createCurrentTurnActionGuide({action:"RECONNECT",direction:"repair",reason:"repair"});assert.match(g,/仲直り/);});

test("tender afterglow reaches the wording guide",()=>{const g=createCurrentTurnActionGuide({action:"RECONNECT",direction:"repair",reason:"repair"},"tender");assert.match(g,/感情の余韻/);assert.match(g,/繊細さ/);});


test("affection can remain visible under hurt without forcing sweetness",()=>{
 const g=createCurrentTurnActionGuide({action:"PULL",direction:"space",reason:"affection_remains_but_hurt_still_needs_space"},"none","affectionate");
 assert.match(g,/同時に残っている感情/);
 assert.match(g,/親愛は残っている/);
 assert.match(g,/甘くしすぎず/);
 assert.match(g,/冷酷な言い方にも飛ばない/);
});

test("happy secondary emotion softens expression without overriding the primary emotion",()=>{
 const g=createCurrentTurnActionGuide({action:"CHASE",direction:"check_in",reason:"care_and_warmth_coexist_with_grounded_concern"},"concerned","happy");
 assert.match(g,/嬉しさ・安心の成分も残っている/);
 assert.match(g,/主感情を優先/);
 assert.match(g,/完全に突き放す表現にはしない/);
});

test("wording guide makes emotion implicit rather than narrated",()=>{
 const g=createCurrentTurnActionGuide({action:"RECONNECT",direction:"gentle",reason:"affection_remains_while_hurt_softens"},"repairing","affectionate");
 assert.match(g,/語尾・返答の長さ・距離感・冗談の量・踏み込み方/);
 assert.match(g,/感情名を説明せず/);
 assert.match(g,/少しぎこちなさを残してよい/);
});
