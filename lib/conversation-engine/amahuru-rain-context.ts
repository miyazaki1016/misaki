/** Experimental boundary for Amahuru rain snapshot consumption.
 * Draft contract only. No network, Gemini, DB, notification or production wiring.
 * Amahuru owns authoritative weather interpretation; Misaki must not fill gaps.
 */
export type AmahuruRainSnapshot = Readonly<{
  schemaVersion: "weather-context.v0-proposal";
  eventId: string;
  kind: "RAIN_START_EXPECTED" | "RAIN_CONFIRMED" | "RAIN_ENDING_EXPECTED";
  status: "forecast" | "observation";
  location: Readonly<{ areaCode: string; label: string; spatialResolution: string }>;
  issuedAt: string;
  observedAt: string | null;
  validFrom: string;
  validUntil: string;
  receivedAt: string;
  source: Readonly<{ provider: string; product: string; reference: string | null }>;
  quality: Readonly<{ state: "VALID" | "UNKNOWN" | "STALE" | "FETCH_ERROR"; reason: string | null }>;
  payload: Readonly<{ intensityMmH?: number; rainStartMinutes?: number }>;
}>;

export type RainContextDecision =
  | Readonly<{ usable: true; fact: AmahuruRainSnapshot }>
  | Readonly<{ usable: false; reason: "MALFORMED" | "VERSION_UNSUPPORTED" | "LOCATION_MISMATCH" | "SOURCE_UNVERIFIED" | "UNKNOWN" | "STALE" | "FETCH_ERROR" | "OUTSIDE_VALIDITY" }>;

function parseTime(value: unknown): number {
  return typeof value === "string" && value.trim() ? Date.parse(value) : NaN;
}

/** Caller supplies a trusted clock and the specifically requested area.
 * For uncertain or expired data, this returns no fact rather than asserting no rain.
 */
export function selectUsableRainContext(raw: unknown, expectedAreaCode: string, nowMs: number): RainContextDecision {
  if (!raw || typeof raw !== "object" || !Number.isFinite(nowMs) || !expectedAreaCode) {
    return { usable: false, reason: "MALFORMED" };
  }
  const s = raw as Partial<AmahuruRainSnapshot>;
  if (s.schemaVersion !== "weather-context.v0-proposal") return { usable: false, reason: "VERSION_UNSUPPORTED" };
  if (!s.location || s.location.areaCode !== expectedAreaCode) return { usable: false, reason: "LOCATION_MISMATCH" };
  if (!s.source || s.source.provider !== "JMA" || !s.source.product) return { usable: false, reason: "SOURCE_UNVERIFIED" };
  if (!s.quality || !["VALID", "UNKNOWN", "STALE", "FETCH_ERROR"].includes(s.quality.state)) return { usable: false, reason: "MALFORMED" };
  if (s.quality.state !== "VALID") return { usable: false, reason: s.quality.state };
  if (!s.eventId || !["RAIN_START_EXPECTED", "RAIN_CONFIRMED", "RAIN_ENDING_EXPECTED"].includes(s.kind ?? "") ||
      !["forecast", "observation"].includes(s.status ?? "") || !s.payload ||
      !Number.isFinite(parseTime(s.issuedAt)) || !Number.isFinite(parseTime(s.validFrom)) ||
      !Number.isFinite(parseTime(s.validUntil)) || !Number.isFinite(parseTime(s.receivedAt)) ||
      (s.status === "observation" && !Number.isFinite(parseTime(s.observedAt)))) {
    return { usable: false, reason: "MALFORMED" };
  }
  if (s.kind === "RAIN_CONFIRMED" && s.status !== "observation") return { usable: false, reason: "MALFORMED" };
  if (s.kind !== "RAIN_CONFIRMED" && s.status !== "forecast") return { usable: false, reason: "MALFORMED" };
  if ((s.payload.intensityMmH !== undefined && (!Number.isFinite(s.payload.intensityMmH) || s.payload.intensityMmH < 0)) ||
      (s.payload.rainStartMinutes !== undefined && (!Number.isFinite(s.payload.rainStartMinutes) || s.payload.rainStartMinutes < 0))) {
    return { usable: false, reason: "MALFORMED" };
  }
  if ((s.status === "observation" && parseTime(s.validFrom) > nowMs) || parseTime(s.validUntil) <= nowMs ||
      parseTime(s.issuedAt) > nowMs || parseTime(s.receivedAt) > nowMs) {
    return { usable: false, reason: "OUTSIDE_VALIDITY" };
  }
  return { usable: true, fact: s as AmahuruRainSnapshot };
}
