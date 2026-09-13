import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeUserEvolution, type ExistingRelationshipTrait } from "./evolution-analyzer";
import type { ChatMessage } from "../user-profile";

export type EvolutionRunResult = {
  analyzed: boolean;
  skipped: boolean;
  reason: "manual" | "claimed" | "insufficient_history" | "cadence_not_due" | "analysis_failed";
  saved: number;
};

function buildFingerprint(history: ChatMessage[]) {
  const source = history
    .filter((item) => item.role === "user")
    .slice(-20)
    .map((item) => item.text.trim())
    .join("\n");

  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return `u-${source.length}-${hash.toString(16)}`;
}

async function loadExistingTraits(
  supabase: SupabaseClient,
  userId: string
): Promise<ExistingRelationshipTrait[]> {
  const { data, error } = await supabase
    .from("misaki_user_relationship_traits")
    .select("trait_key, content, strength")
    .eq("user_id", userId)
    .limit(20);

  if (error) {
    console.error("EVOLUTION TRAIT READ ERROR:", error);
    return [];
  }

  return Array.isArray(data)
    ? data.map((row) => ({
        trait_key: String(row.trait_key ?? ""),
        content: String(row.content ?? ""),
        strength:
          typeof row.strength === "number"
            ? row.strength
            : row.strength != null
              ? Number(row.strength)
              : null,
      }))
    : [];
}

async function claimAnalysisSlot(
  supabase: SupabaseClient,
  history: ChatMessage[]
) {
  const { data, error } = await supabase.rpc(
    "claim_user_evolution_analysis",
    {
      p_fingerprint: buildFingerprint(history),
      p_min_hours: 12,
    }
  );

  if (error) {
    console.error("EVOLUTION CLAIM ERROR:", error);
    return false;
  }

  return data === true;
}

async function saveCandidates(
  supabase: SupabaseClient,
  existingTraits: ExistingRelationshipTrait[],
  candidates: Awaited<ReturnType<typeof analyzeUserEvolution>>
) {
  const currentByTrait = new Map(
    existingTraits.map((trait) => [trait.trait_key, trait.content])
  );

  let saved = 0;

  for (const candidate of candidates) {
    const { error } = await supabase.rpc(
      "create_user_evolution_candidate",
      {
        p_trait_key: candidate.traitKey,
        p_current_content:
          currentByTrait.get(candidate.traitKey) ?? null,
        p_proposed_content: candidate.proposedContent,
        p_reason: candidate.reason,
        p_confidence: candidate.confidence,
        p_risk_level: candidate.riskLevel,
        p_evidence: {
          quotes: candidate.evidence,
          source: "conversation_analysis",
          analyzer: "gemini-3.1-flash-lite",
        },
      }
    );

    if (error) {
      console.error("EVOLUTION CANDIDATE SAVE ERROR:", error);
      continue;
    }
    saved += 1;
  }

  return saved;
}

export async function runUserEvolutionAnalysis(
  supabase: SupabaseClient,
  userId: string,
  apiKey: string,
  history: ChatMessage[],
  memory: string[],
  options?: { force?: boolean }
): Promise<EvolutionRunResult> {
  try {
    const force = options?.force === true;
    const userMessageCount = history.filter(
      (item) => item.role === "user"
    ).length;

    if (!force && userMessageCount < 8) {
      return {
        analyzed: false,
        skipped: true,
        reason: "insufficient_history",
        saved: 0,
      };
    }

    if (!force) {
      const claimed = await claimAnalysisSlot(supabase, history);
      if (!claimed) {
        return {
          analyzed: false,
          skipped: true,
          reason: "cadence_not_due",
          saved: 0,
        };
      }
    }

    const existingTraits = await loadExistingTraits(supabase, userId);
    const candidates = await analyzeUserEvolution(
      apiKey,
      history,
      memory,
      existingTraits
    );
    const saved = await saveCandidates(
      supabase,
      existingTraits,
      candidates
    );

    return {
      analyzed: true,
      skipped: false,
      reason: force ? "manual" : "claimed",
      saved,
    };
  } catch (error) {
    console.error("EVOLUTION RUNNER ERROR:", error);
    return {
      analyzed: false,
      skipped: false,
      reason: "analysis_failed",
      saved: 0,
    };
  }
}
