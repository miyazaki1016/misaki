import assert from "node:assert/strict";
import test from "node:test";
import {
  selectChatExternalFactsForQuery,
  type TargetedExternalItem,
} from "../lib/conversation-engine/chat-external-relevance.ts";

function item(kind: TargetedExternalItem["kind"], id: string, targetId?: string, extra: Partial<TargetedExternalItem> = {}): TargetedExternalItem {
  return { id, kind, targetId, location: "user", permitted: true, fresh: true,
    relevantRegion: true, verified: true, severity: "normal", ...extra };
}

test("airport question selects only the named airport, never same-region railway", () => {
  const decisions = selectChatExternalFactsForQuery(
    { topic: "transport", transportKind: "airport", targetId: "HND" },
    [item("airport", "hnd-event", "HND"), item("airport", "nrt-event", "NRT"),
      item("rail", "rail-event", "JR-YAMANOTE")],
  );
  assert.deepEqual(decisions.map(d => d.reason), ["selected", "wrong_target", "wrong_transport_kind"]);
});

test("rail question selects only the named line", () => {
  const decisions = selectChatExternalFactsForQuery(
    { topic: "transport", transportKind: "rail", targetId: "JR-YAMANOTE" },
    [item("airport", "hnd-event", "HND"), item("rail", "line-one", "JR-YAMANOTE"),
      item("rail", "line-two", "JR-CHUO")],
  );
  assert.deepEqual(decisions.map(d => d.included), [false, true, false]);
});

test("vague transport question does not automatically include everything", () => {
  const decisions = selectChatExternalFactsForQuery({ topic: "transport" }, [
    item("rail", "train", "JR-YAMANOTE"), item("airport", "airport", "HND")]);
  assert.deepEqual(decisions.map(d => d.reason), ["missing_target", "missing_target"]);
});

test("missing source target is rejected", () => {
  const [decision] = selectChatExternalFactsForQuery(
    { topic: "transport", transportKind: "airport", targetId: "HND" },
    [item("airport", "unknown")]);
  assert.equal(decision.reason, "wrong_target");
});

test("authorization, verification and freshness override matching target", () => {
  const decisions = selectChatExternalFactsForQuery(
    { topic: "transport", transportKind: "airport", targetId: "HND" },
    [item("airport", "not-allowed", "HND", { permitted: false }),
      item("airport", "not-verified", "HND", { verified: false }),
      item("airport", "old", "HND", { fresh: false })]);
  assert.deepEqual(decisions.map(d => d.reason), ["no_permission", "unverified", "expired"]);
});

test("a general weather question still behaves like existing conservative selector", () => {
  const decisions = selectChatExternalFactsForQuery(
    { topic: "weather" },
    [item("weather", "user-weather"), item("airport", "hnd", "HND")]);
  assert.deepEqual(decisions.map(d => d.included), [true, false]);
});
