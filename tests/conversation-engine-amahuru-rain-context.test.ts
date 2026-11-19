import assert from "node:assert/strict";
import test from "node:test";
import { selectUsableRainContext, type AmahuruRainSnapshot } from "../lib/conversation-engine/amahuru-rain-context.ts";

const now = Date.parse("2026-10-16T08:45:00+09:00");
const example: AmahuruRainSnapshot = {
  schemaVersion: "weather-context.v0-proposal",
  eventId: "synthetic-001",
  kind: "RAIN_START_EXPECTED",
  status: "forecast",
  location: { areaCode: "EXAMPLE", label: "Example city", spatialResolution: "point-or-area" },
  issuedAt: "2026-10-16T08:40:00+09:00",
  observedAt: null,
  validFrom: "2026-10-16T09:00:00+09:00",
  validUntil: "2026-10-16T09:30:00+09:00",
  receivedAt: "2026-10-16T08:45:00+09:00",
  source: { provider: "JMA", product: "official-forecast", reference: null },
  quality: { state: "VALID", reason: null },
  payload: { intensityMmH: 8, rainStartMinutes: 20 },
};
const check = (sample: unknown, areaCode = "EXAMPLE") => selectUsableRainContext(sample, areaCode, now);

test("future rainfall forecast can be shown as a forecast, never as observation", () => {
  const r = check(example);
  assert.equal(r.usable, true);
  if (r.usable) assert.equal(r.fact.status, "forecast");
});

test("unknown, fetch errors and stale data never become no-rain assertions", () => {
  for (const state of ["UNKNOWN", "STALE", "FETCH_ERROR"] as const) {
    const r = check({ ...example, quality: { state, reason: "synthetic" } });
    assert.deepEqual(r, { usable: false, reason: state });
  }
});

test("refuse unsupported schema, mismatched place, expired interval and invalid source", () => {
  assert.deepEqual(check({ ...example, schemaVersion: "weather-context.v9" }), { usable: false, reason: "VERSION_UNSUPPORTED" });
  assert.deepEqual(check(example, "OTHER"), { usable: false, reason: "LOCATION_MISMATCH" });
  assert.deepEqual(check({ ...example, validUntil: "2026-10-16T08:44:00+09:00" }), { usable: false, reason: "OUTSIDE_VALIDITY" });
  assert.deepEqual(check({ ...example, source: { provider: "UNKNOWN", product: "" } }), { usable: false, reason: "SOURCE_UNVERIFIED" });
});

test("observations need an actual observation timestamp and cannot claim future time", () => {
  const observed = { ...example, kind: "RAIN_CONFIRMED", status: "observation", validFrom: "2026-10-16T08:35:00+09:00" };
  assert.deepEqual(check(observed), { usable: false, reason: "MALFORMED" });
  assert.equal(check({ ...observed, observedAt: "2026-10-16T08:35:00+09:00" }).usable, true);
  assert.deepEqual(check({ ...observed, observedAt: "2026-10-16T08:35:00+09:00", validFrom: "2026-10-16T08:50:00+09:00" }), { usable: false, reason: "OUTSIDE_VALIDITY" });
});

test("reject unsupported event type and malformed intensity", () => {
  assert.deepEqual(check({ ...example, kind: "OFFICIAL_WARNING" }), { usable: false, reason: "MALFORMED" });
  assert.deepEqual(check({ ...example, payload: { intensityMmH: -5 } }), { usable: false, reason: "MALFORMED" });
});
