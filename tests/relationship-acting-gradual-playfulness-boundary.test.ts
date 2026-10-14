import assert from "node:assert/strict";
import { test } from "node:test";
import { createIntegratedActingGuideExperiment } from "../lib/relationship-acting-guide-gradual-experiment.ts";

const state = { intimacyStage: 2 as const, friendship: 40, trust: 40, playfulness: 20, affection: 40, romance: 10, relationshipStatus: "none" as const };

test("low playfulness keeps baseline discouragement without experimental contradiction", () => {
  const guide = createIntegratedActingGuideExperiment(state);
  assert.match(guide, /じゃれ合いはまだ少ない/);
  assert.doesNotMatch(guide, /じゃれ合いは少し|軽いツッコミを交えて|軽い冗談を/);
});

test("intermediate playfulness at 30 remains eligible for gradual guidance", () => {
  const guide = createIntegratedActingGuideExperiment({ ...state, playfulness: 35 });
  assert.doesNotMatch(guide, /じゃれ合いはまだ少ない/);
  assert.match(guide, /【5軸の中間的な距離感・補助指示】/);
});
