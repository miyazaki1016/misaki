import type {
  RelationshipSignalAssessment,
  RelationshipSignalName,
} from "./relationship-signal";

export type EmotionPrimary =
  | "neutral"
  | "happy"
  | "affectionate"
  | "concerned"
  | "hurt"
  | "sulky"
  | "guarded";

export type EmotionStateV2 = {
  primary: EmotionPrimary;
  intensity: number;
};

export type RelationshipPatternContext = {
  repeatedHarm?: number;
  reliableRepair?: number;
  sustainedCare?: number;
};

export type EmotionReducerInput = {
  previous: EmotionStateV2;
  signals: RelationshipSignalAssessment;
  elapsedHours: number;
  intimacyLevel: string;
  patterns?: RelationshipPatternContext;
};

export type EmotionReducerResult = EmotionStateV2 & {
  reason: string;
  evidence: string[];
  secondary: EmotionPrimary | null;
  afterglow: "none" | "warm" | "tender" | "repairing" | "wary" | "concerned";
};

function clampIntensity(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function weighted(
  assessment: RelationshipSignalAssessment,
  names: RelationshipSignalName[]
) {
  return assessment.signals
    .filter((signal) => names.includes(signal.name))
    .reduce((sum, signal) => sum + signal.strength * signal.confidence, 0);
}

function evidenceFor(
  assessment: RelationshipSignalAssessment,
  names: RelationshipSignalName[]
) {
  return assessment.signals
    .filter((signal) => names.includes(signal.name))
    .map((signal) => signal.evidence)
    .filter(Boolean)
    .slice(0, 4);
}

function timeSettling(elapsedHours: number) {
  if (elapsedHours < 6) return 0;
  if (elapsedHours < 24) return 3;
  if (elapsedHours < 72) return 7;
  if (elapsedHours < 168) return 11;
  return 15;
}

/**
 * Pure deterministic reducer.
 *
 * Time may soften an existing emotion, but it never invents a new relational
 * event. A warm conversation does not become loneliness merely because days
 * passed. Hurt can linger; repair can resolve it; concern can soften.
 */
export function reduceRelationshipEmotion(
  input: EmotionReducerInput
): EmotionReducerResult {
  const { previous, signals, elapsedHours } = input;
  const repeatedHarm = Math.max(0, input.patterns?.repeatedHarm ?? 0);
  const reliableRepair = Math.max(0, input.patterns?.reliableRepair ?? 0);
  const sustainedCare = Math.max(0, input.patterns?.sustainedCare ?? 0);
  const positive = weighted(signals, [
    "warmth", "care", "trust", "openness", "shared_history",
  ]);
  const romantic = weighted(signals, ["romantic"]);
  const harm = weighted(signals, ["hurtful", "rejection", "boundary"]);
  const repair = weighted(signals, ["apology", "repair"]);
  const concern = weighted(signals, ["concern"]);
  const settle = timeSettling(Math.max(0, elapsedHours));
  const relationshipSafety = Math.min(sustainedCare * 2 + reliableRepair * 2, 10);
  const learnedCaution = Math.min(repeatedHarm * 3, 9);

  // A current-turn relational event outranks passive passage of time.
  if (harm >= 0.45) {
    const primary: EmotionPrimary =
      weighted(signals, ["rejection", "boundary"]) >= 0.55
        ? "guarded"
        : "hurt";
    return {
      primary,
      intensity: clampIntensity(Math.max(previous.intensity * 0.7, 24) + harm * 34 + Math.min(repeatedHarm * 6, 18)),
      reason: "relational_harm",
      secondary: previous.primary === "affectionate" || previous.primary === "happy" ? previous.primary : null,
      afterglow: primary === "guarded" ? "wary" : "none",
      evidence: evidenceFor(signals, ["hurtful", "rejection", "boundary"]),
    };
  }

  if (concern >= 0.5) {
    return {
      primary: "concerned",
      intensity: clampIntensity(Math.max(previous.primary === "concerned" ? previous.intensity : 18, 18) + concern * 30),
      reason: "grounded_concern",
      secondary: previous.primary === "affectionate" || previous.primary === "happy" ? previous.primary : null,
      afterglow: "concerned",
      evidence: evidenceFor(signals, ["concern"]),
    };
  }

  const repairingExistingHurt =
    repair >= 0.4 &&
    ["hurt", "sulky", "guarded"].includes(previous.primary);

  if (repairingExistingHurt) {
    const remaining = clampIntensity(
      previous.intensity - 18 - repair * 34 + Math.min(settle, 8) + Math.min(repeatedHarm * 5, 15) - Math.min(reliableRepair * 4, 12)
    );
    if (remaining >= 22) {
      return {
        primary: previous.primary,
        intensity: remaining,
        reason: "repair_in_progress",
        secondary:
          previous.primary === "affectionate" ||
          previous.primary === "happy" ||
          positive + romantic >= 0.45
            ? "affectionate"
            : null,
        afterglow: "repairing",
        evidence: evidenceFor(signals, ["apology", "repair"]),
      };
    }

    return {
      primary: positive + romantic >= 0.45 ? "happy" : "neutral",
      intensity: positive + romantic >= 0.45 ? clampIntensity(12 + (positive + romantic) * 16) : 6,
      reason: "repair_resolved_hurt",
      secondary: null,
      afterglow: "tender",
      evidence: evidenceFor(signals, ["apology", "repair", "warmth", "romantic"]),
    };
  }

  // Romantic words alone cannot cancel an unresolved boundary/rejection.
  if (romantic >= 0.5 && previous.primary === "guarded" && previous.intensity >= 20 && repair < 0.4) {
    return {
      primary: "guarded",
      intensity: clampIntensity(Math.max(12, previous.intensity - settle - romantic * 5)),
      reason: "romance_received_while_boundary_still_active",
      secondary: "affectionate",
      afterglow: "wary",
      evidence: evidenceFor(signals, ["romantic"]),
    };
  }

  if (romantic >= 0.5) {
    return {
      primary: "affectionate",
      intensity: clampIntensity(
        Math.max(previous.primary === "affectionate" ? previous.intensity - settle : 16, 16) +
          romantic * 30 +
          Math.min(positive * 8, 10) +
          Math.min(relationshipSafety, 6) -
          Math.min(learnedCaution, 5)
      ),
      reason: "romantic_warmth",
      secondary: null,
      afterglow: "tender",
      evidence: evidenceFor(signals, ["romantic", "warmth", "trust"]),
    };
  }

  // Warmth/care alone must not instantly cancel an unresolved boundary or rejection.
  if (positive >= 0.45 && previous.primary === "guarded" && previous.intensity >= 20 && repair < 0.4) {
    return {
      primary: "guarded",
      intensity: clampIntensity(Math.max(12, previous.intensity - settle - positive * 8)),
      secondary: "happy",
      afterglow: "wary",
      reason: "warmth_received_while_boundary_still_active",
      evidence: evidenceFor(signals, ["warmth", "care", "trust"]),
    };
  }

  if (positive >= 0.45) {
    return {
      primary: "happy",
      intensity: clampIntensity(
        Math.max(previous.primary === "happy" ? previous.intensity - settle : 10, 10) +
          positive * 20 + Math.min(sustainedCare * 3, 9) + Math.min(reliableRepair * 2, 6) - Math.min(learnedCaution, 5)
      ),
      reason: "relational_warmth",
      secondary: null,
      afterglow: "warm",
      evidence: evidenceFor(signals, ["warmth", "care", "trust", "openness", "shared_history"]),
    };
  }

  // No new evidence: only settle the emotion already supported by history.
  // Crucially, elapsed time cannot change its semantic category by itself.
  const passiveDecay =
    previous.primary === "concerned"
      ? Math.max(settle, elapsedHours >= 24 ? 10 : 0)
      : settle;

  const historyResistance =
    previous.primary === "hurt" || previous.primary === "guarded" || previous.primary === "sulky"
      ? Math.min(repeatedHarm * 1.5, 4)
      : previous.primary === "happy" || previous.primary === "affectionate"
        ? Math.min((sustainedCare + reliableRepair) * 0.75, 3)
        : 0;
  const effectiveDecay = Math.max(0, passiveDecay - historyResistance);
  const intensity = clampIntensity(previous.intensity - effectiveDecay);
  return {
    primary: intensity === 0 ? "neutral" : previous.primary,
    intensity,
    reason: effectiveDecay > 0 ? "existing_emotion_settled_with_time" : "no_new_relational_evidence",
    secondary: null,
    afterglow: intensity === 0 ? "none" : previous.primary === "affectionate" ? "tender" : previous.primary === "happy" ? "warm" : previous.primary === "guarded" ? "wary" : previous.primary === "concerned" ? "concerned" : "none",
    evidence: [],
  };
}
