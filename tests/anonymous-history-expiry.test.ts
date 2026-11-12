import assert from "node:assert/strict";
import test from "node:test";
import { activeAnonymousHistory } from "../supabase/functions/_shared/anonymous-history-expiry.ts";

test("anonymous history expires at 24 hours without rewriting its timestamp", () => {
  const now = Date.parse("2026-11-12T08:00:00.000Z");
  const at = (offset: number) => ({ sentAt: new Date(now + offset).toISOString() });
  const cutoff = -24 * 60 * 60 * 1000;
  const active = at(cutoff + 1000);
  const history = [at(cutoff), active, at(1), null, {}, { sentAt: "invalid" }];

  assert.deepEqual(activeAnonymousHistory(history, now), [active]);
  assert.deepEqual(activeAnonymousHistory(history, now + 1000), [history[2]]);
  assert.equal(active.sentAt, "2026-11-11T08:00:01.000Z");
  assert.deepEqual(activeAnonymousHistory(null, now), []);
});
