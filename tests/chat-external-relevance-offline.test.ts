import assert from "node:assert/strict";
import test from "node:test";
import { selectChatExternalFacts, type ExternalItem } from "../lib/conversation-engine/chat-external-relevance.ts";
const fact = (kind: ExternalItem["kind"], changes: Partial<ExternalItem> = {}): ExternalItem => ({
  id: kind, kind, location: "user", permitted: true, fresh: true,
  relevantRegion: true, verified: true, severity: "normal", ...changes,
});
test("hello does not include routine Tokyo weather, Haneda or rail facts", () => {
  const r = selectChatExternalFacts("smalltalk", [
    fact("weather", { location: "character" }),
    fact("airport", { location: "other" }),
    fact("rail", { location: "other" }),
  ]);
  assert.equal(r.filter(x => x.included).length, 0);
});
test("weather question selects permitted user-region weather but not transport", () => {
  const r = selectChatExternalFacts("weather", [fact("weather"), fact("rail"), fact("airport")]);
  assert.deepEqual(r.map(x => x.included), [true, false, false]);
});
test("airport question does not pull unrelated or expired Haneda data", () => {
  const r = selectChatExternalFacts("transport", [
    fact("airport", { location: "other" }),
    fact("airport", { id: "haneda-stale", fresh: false }),
    fact("rail", { id: "nearby-rail" }),
  ]);
  assert.deepEqual(r.map(x => x.reason), ["wrong_region", "expired", "selected"]);
});
test("missing permission takes priority over severity and relevance", () => {
  const r = selectChatExternalFacts("earthquake", [fact("earthquake", { permitted: false, severity: "high" })]);
  assert.equal(r[0].reason, "no_permission");
});
test("high severity local earthquake is only eligible for context, not sending", () => {
  const r = selectChatExternalFacts("smalltalk", [
    fact("earthquake", { severity: "high" }),
    fact("weather_warning", { id: "warning", severity: "high", location: "other" }),
  ]);
  assert.deepEqual(r.map(x => x.included), [true, false]);
  assert.equal(r[0].reason, "important_local_event");
});
test("unverified and stale facts cannot be selected", () => {
  const r = selectChatExternalFacts("earthquake", [
    fact("earthquake", { verified: false, severity: "high" }),
    fact("earthquake", { id: "old", fresh: false, severity: "high" }),
  ]);
  assert.deepEqual(r.map(x => x.reason), ["unverified", "expired"]);
});
test("rejects duplicate external event identifiers", () => {
  assert.throws(() => selectChatExternalFacts("smalltalk", [fact("weather"), fact("weather")]), /DUPLICATE/);
});
