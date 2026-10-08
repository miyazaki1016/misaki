/**
 * Local-only adapter for an explicitly approved conversation snapshot.
 * Never fetches production data, calls a model, or writes to a database.
 * Caller must review and redact the snapshot before using this adapter.
 */
export type SavedTurn = { role: string; text: string; [key: string]: unknown };
export type ReplayTurn = { role: "user" | "model"; parts: [{ text: string }] };
export type ReplayFixture = {
  history: ReplayTurn[];
  nextUserText: string;
  counts: { historyMessages: number; userMessages: number; modelMessages: number };
};

function mapRole(role: string): "user" | "model" {
  if (role === "user") return "user";
  if (role === "misaki" || role === "model") return "model";
  throw new Error("Unsupported conversation role");
}

/**
 * Takes a redacted, locally supplied snapshot. The final user turn is the
 * next message to replay; all earlier turns form the shared A/B history.
 * Fails closed on unknown roles, malformed messages, or insufficient history.
 */
export function prepareApprovedReplayFixture(input: unknown): ReplayFixture {
  if (!Array.isArray(input) || input.length < 3 || input.length > 60) {
    throw new Error("Expected 3..60 approved conversation turns");
  }
  const turns = input.map((entry): { role: "user" | "model"; text: string } => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("Invalid conversation turn");
    }
    const turn = entry as Partial<SavedTurn>;
    if (typeof turn.role !== "string" || typeof turn.text !== "string" || !turn.text.trim()) {
      throw new Error("Invalid role or empty text");
    }
    return { role: mapRole(turn.role), text: turn.text };
  });
  const next = turns[turns.length - 1];
  if (next.role !== "user") throw new Error("Last turn must be a user message");
  const prior = turns.slice(0, -1);
  return {
    history: prior.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
    nextUserText: next.text,
    counts: {
      historyMessages: prior.length,
      userMessages: prior.filter((turn) => turn.role === "user").length,
      modelMessages: prior.filter((turn) => turn.role === "model").length,
    },
  };
}
