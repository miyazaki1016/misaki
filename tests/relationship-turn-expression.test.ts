import assert from "node:assert/strict";
import test from "node:test";
import { createCurrentTurnActionGuide } from "../lib/relationship-turn-expression.ts";

test("space is expressed without punishment",()=>{const g=createCurrentTurnActionGuide({action:"PULL",direction:"space",reason:"boundary"});assert.match(g,/罰・無視・罪悪感/);assert.match(g,/会話を拒否しない/);});
test("closer cannot invent dating status",()=>{const g=createCurrentTurnActionGuide({action:"NORMAL",direction:"closer",reason:"warmth"});assert.match(g,/恋人関係が未成立/);});
test("repair keeps continuity instead of erasing hurt",()=>{const g=createCurrentTurnActionGuide({action:"RECONNECT",direction:"repair",reason:"repair"});assert.match(g,/仲直り/);});

test("tender afterglow reaches the wording guide",()=>{const g=createCurrentTurnActionGuide({action:"RECONNECT",direction:"repair",reason:"repair"},"tender");assert.match(g,/感情の余韻/);assert.match(g,/繊細さ/);});
