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
