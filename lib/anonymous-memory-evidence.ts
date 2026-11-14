import { ANONYMOUS_MEMORY_TTL_MS, type AnonymousEvidence } from "../supabase/functions/_shared/anonymous-memory-expiry";
import type { SemanticJudge } from "../supabase/functions/_shared/forget-control";

type Source = AnonymousEvidence & { text: string };
type UserTurn = { role: string; requestId: string; sentAt: string; text: string };

export function anonymousUserSources(rows: unknown[], now: number): Map<string, Source> {
  const sources = new Map<string, Source>();
  const duplicates = new Set<string>();
  for (const row of rows) {
    const turn = row as Partial<UserTurn> | null;
    if (turn?.role !== "user" || typeof turn.requestId !== "string" || !turn.requestId ||
        typeof turn.text !== "string" || !turn.text.trim() || typeof turn.sentAt !== "string") continue;
    const sentAt = Date.parse(turn.sentAt);
    const expiresAt = sentAt + ANONYMOUS_MEMORY_TTL_MS;
    if (!Number.isFinite(sentAt) || sentAt > now || expiresAt <= now) continue;
    if (sources.has(turn.requestId)) duplicates.add(turn.requestId);
    sources.set(turn.requestId, { requestId: turn.requestId, origin: "user", sentAt, expiresAt, text: turn.text });
  }
  for (const id of duplicates) sources.delete(id);
  return sources;
}

export function evidenceMetadata({ requestId, origin, sentAt, expiresAt }: Source): AnonymousEvidence {
  return { requestId, origin, sentAt, expiresAt };
}

export async function verifyAnonymousMemory(
  candidates: string[], sources: Map<string, Source>, judge: SemanticJudge,
): Promise<Map<string, AnonymousEvidence[]>> {
  const evidence = new Map<string, AnonymousEvidence[]>();
  if (!candidates.length || !sources.size) return evidence;

  try {
    const result = await judge("memory_evidence", {
      rows: candidates,
      sources: Array.from(sources.values(), ({ requestId, text }) => ({ requestId, text })),
    });
    if (!Array.isArray(result?.rows) || result.rows.length !== candidates.length) return evidence;

    for (const [index, row] of result.rows.entries()) {
      if (row?.index !== index) return new Map();
      if (row.supported !== true || !Array.isArray(row.sources) || !row.sources.length || row.sources.length > sources.size) continue;
      const verified = new Map<string, AnonymousEvidence>();
      for (const ref of row.sources) {
        const source = sources.get(ref?.requestId);
        if (!source || verified.has(source.requestId) || typeof ref.quote !== "string" ||
            !ref.quote.trim() || !source.text.includes(ref.quote)) break;
        verified.set(source.requestId, evidenceMetadata(source));
      }
      if (verified.size === row.sources.length) evidence.set(candidates[index], [...verified.values()]);
    }
  } catch {
    // An unavailable or invalid verifier must never grant a new memory a lifetime.
  }
  return evidence;
}
