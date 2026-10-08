import test from "node:test";
import assert from "node:assert/strict";
import { criticalCandidates, validateCriticalEvent } from "../lib/relationship-analyzer-v1.ts";
import type { Turn } from "../lib/relationship-engine-v1.ts";

const turn: Turn = {
  requestId: "acceptance-turn",
  message: "じゃあ、美咲も俺と付き合いたいってことでいい？😊",
  reply: "恋人同士なんだから、そんなに不安にならなくてもいいんだよ。大好きだよ。",
  savedAt: "2026-10-08T00:00:00Z",
};

test("explicit confirmation question creates romantic_acceptance candidate", () => {
  assert.ok(criticalCandidates(turn.message).includes("romantic_acceptance"));
});

test("prior proposal plus explicit Misaki partnership reply can ground acceptance", async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({
    confirmed: true,
    supportingTurn: "恋人同士なんだから",
  }) }] } }] });
  try {
    assert.equal(await validateCriticalEvent(turn, "romantic_acceptance", [
      { request_id: "proposal-turn", event_type: "romantic_proposal" },
    ]), true);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("Misaki reply alone cannot ground acceptance without prior canonical proposal", async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({
    confirmed: true,
    supportingTurn: "恋人同士なんだから",
  }) }] } }] });
  try {
    await assert.rejects(
      () => validateCriticalEvent(turn, "romantic_acceptance", []),
      /invalid_critical_validation/,
    );
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("ordinary affection still creates no critical event", () => {
  for (const text of ["好き", "大好き", "ずっとそばにいるよ"]) {
    assert.deepEqual(criticalCandidates(text), []);
  }
});
