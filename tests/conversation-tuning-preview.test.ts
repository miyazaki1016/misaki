import { describe, expect, it } from "vitest";
import { createTuningPreviewPair, validateTuningDraft } from "../lib/conversation-tuning-preview";

const settings = { warmth: 70, humor: 30, phrasingInitiative: 40, questionTone: 20, length: "short" };
const draft = (version: string) => ({ tuningVersion: version, scope: "preview", settings });
const fixture = {
  snapshotId: "snapshot-1", selectionRulesVersion: "rules-1",
  promptVersion: "prompt-1", model: "synthetic-only",
  userInput: "疲れた", selectedFacts: [], requiredConstraints: ["do-not-invent"],
  forbiddenConstraints: ["invent-facts"], questionAllowed: false,
};
describe("conversation tuning preview isolation", () => {
  it("accepts preview settings and shares one immutable selection fixture across A/B", () => {
    const pair = createTuningPreviewPair(fixture, draft("a"), draft("b"));
    expect(pair.experiment).toBe("tuning");
    expect(pair.fixture.snapshotId).toBe("snapshot-1");
    expect(Object.isFrozen(pair.fixture.selectedFacts)).toBe(true);
    expect(pair.baseline.scope).toBe("preview");
  });
  it.each([NaN, Infinity, -1, 101, "70"])("rejects invalid scores: %s", value => {
    expect(() => validateTuningDraft({...draft("a"), settings: {...settings, warmth: value}})).toThrow();
  });
  it("rejects production scope and invalid length", () => {
    expect(() => validateTuningDraft({...draft("a"), scope: "production"})).toThrow();
    expect(() => validateTuningDraft({...draft("a"), settings: {...settings, length: "verbose"}})).toThrow();
  });
  it("fails closed on missing constraints and inconsistent version reuse", () => {
    expect(() => createTuningPreviewPair({...fixture, requiredConstraints: undefined} as never, draft("a"), draft("b"))).toThrow();
    expect(() => createTuningPreviewPair(fixture, draft("a"), {...draft("a"), settings: {...settings, humor: 50}})).toThrow();
  });
});
