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


test("fresh hurt with affection uses quiet distance rather than breakup language",()=>{
 const g=createCurrentTurnActionGuide({action:"PULL",direction:"space",reason:"affection_remains_but_hurt_still_needs_space"},"none","affectionate");
 assert.match(g,/短め・静かめ/);
 assert.match(g,/別れや嫌悪を勝手に示さない/);
});

test("softening hurt reconnects by small changes rather than instant reset",()=>{
 const g=createCurrentTurnActionGuide({action:"RECONNECT",direction:"gentle",reason:"affection_remains_while_hurt_softens"},"none","affectionate");
 assert.match(g,/小さく応じる/);
 assert.match(g,/少し柔らかくする/);
 assert.match(g,/いきなり元通りにせず/);
});

test("warm concern stays familiar without turning into interrogation",()=>{
 const g=createCurrentTurnActionGuide({action:"CHASE",direction:"check_in",reason:"care_and_warmth_coexist_with_grounded_concern"},"concerned","happy");
 assert.match(g,/普段の親しさを消さない/);
 assert.match(g,/尋問のように質問を重ねず/);
});


test("unresolved relationship event keeps ordinary wording from resetting instantly",()=>{
 const g=createCurrentTurnActionGuide(
  {action:"NORMAL",direction:"steady",reason:"no_action_pressure"},
  "none",
  null,
  {unresolvedHurt:.8,repairStage:"hurt",meaning:"unresolved_hurt",lastMeaningfulAt:"2026-09-25T00:00:00.000Z"}
 );
 assert.match(g,/二人の出来事の余韻/);
 assert.match(g,/急に完全復帰した温度へ戻さない/);
});

test("demonstrated repair changes old hurt into relationship safety instead of grievance",()=>{
 const g=createCurrentTurnActionGuide(
  {action:"NORMAL",direction:"gentle",reason:"no_action_pressure"},
  "warm",
  null,
  {unresolvedHurt:0,repairStage:"rebuilding",meaning:"repair_demonstrated",lastMeaningfulAt:"2026-09-25T00:00:00.000Z"}
 );
 assert.match(g,/修復できた二人/);
 assert.match(g,/昔の傷を蒸し返さず/);
});

test("repeated harm keeps caution without instructing punishment",()=>{
 const g=createCurrentTurnActionGuide(
  {action:"RECONNECT",direction:"repair",reason:"repair_is_underway"},
  "repairing",
  null,
  {unresolvedHurt:1.2,repairStage:"repair_attempted",meaning:"repeated_harm",lastMeaningfulAt:"2026-09-25T00:00:00.000Z"}
 );
 assert.match(g,/言葉だけで警戒を即解除せず/);
 assert.match(g,/会話を拒否しない/);
});
