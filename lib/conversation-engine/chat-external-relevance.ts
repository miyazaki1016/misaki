/**
 * Offline-only and deliberately conservative relevance selector for chat.
 * Not connected to app/api/chat/route.ts, Gemini or a network service.
 *
 * Permission, freshness and regional relevance are caller-supplied facts.
 * Never infer the user's present location from their profession/home region.
 */
export type ExternalKind = "weather" | "earthquake" | "weather_warning" | "rail" | "airport";
export type ExternalItem = Readonly<{
  id: string;
  kind: ExternalKind;
  location: "character" | "user" | "other";
  permitted: boolean;
  fresh: boolean;
  relevantRegion: boolean;
  verified: boolean;
  severity?: "normal" | "high";
}>;
export type ChatTopic = "smalltalk" | "weather" | "earthquake" | "transport" | "other";
export type Choice = Readonly<{
  id: string;
  included: boolean;
  reason: "selected" | "no_permission" | "unverified" | "expired" | "wrong_region" | "not_requested" | "important_local_event";
}>;

/**
 * Important events are eligible for a chat context, not automatically pushable.
 * All event-to-user notifications must go through an independent opt-in gate.
 */
export function selectChatExternalFacts(
  topic: ChatTopic,
  items: readonly ExternalItem[],
): readonly Choice[] {
  const seen = new Set<string>();
  return items.map(item => {
    if (!item.id || seen.has(item.id)) throw new Error("DUPLICATE_OR_EMPTY_EXTERNAL_ID");
    seen.add(item.id);
    if (!item.permitted) return { id: item.id, included: false, reason: "no_permission" };
    if (!item.verified) return { id: item.id, included: false, reason: "unverified" };
    if (!item.fresh) return { id: item.id, included: false, reason: "expired" };
    if (!item.relevantRegion || item.location === "other") return { id: item.id, included: false, reason: "wrong_region" };

    const important = (item.kind === "earthquake" || item.kind === "weather_warning")
      && item.severity === "high" && item.location === "user";
    if (important) return { id: item.id, included: true, reason: "important_local_event" };

    const relevantTopic =
      (topic === "weather" && item.kind === "weather") ||
      (topic === "earthquake" && (item.kind === "earthquake" || item.kind === "weather_warning")) ||
      (topic === "transport" && (item.kind === "rail" || item.kind === "airport"));
    return {
      id: item.id, included: relevantTopic,
      reason: relevantTopic ? "selected" : "not_requested",
    };
  });
}

/**
 * More precise transport selection for a known user request.
 * The original selector remains available for baseline comparisons only.
 * A production caller must use this strict query contract before including
 * transport facts; topic="transport" alone is too broad.
 */
export type ChatExternalQuery = Readonly<{
  topic: ChatTopic;
  transportKind?: "rail" | "airport";
  targetId?: string; // canonical, provider-validated airport/line ID, not user-entered free text
}>;

export type TargetedExternalItem = ExternalItem & Readonly<{
  targetId?: string; // canonical ID, checked before this call
}>;

export type TargetedChoice = Readonly<{
  id: string;
  included: boolean;
  reason: Choice["reason"] | "missing_target" | "wrong_target" | "wrong_transport_kind";
}>;

export function selectChatExternalFactsForQuery(
  query: ChatExternalQuery,
  items: readonly TargetedExternalItem[],
): readonly TargetedChoice[] {
  const base = selectChatExternalFacts(query.topic, items);
  return base.map((decision, index): TargetedChoice => {
    const item = items[index];
    if (!decision.included || query.topic !== "transport") return decision;
    // This strict selector must not include rail facts for an airport question.
    if (!query.transportKind || !query.targetId?.trim()) {
      return { id: item.id, included: false, reason: "missing_target" };
    }
    if (item.kind !== query.transportKind) {
      return { id: item.id, included: false, reason: "wrong_transport_kind" };
    }
    if (!item.targetId || item.targetId !== query.targetId) {
      return { id: item.id, included: false, reason: "wrong_target" };
    }
    return decision;
  });
}
