export const RELATIONSHIP_SIGNAL_NAMES = [
  "warmth",
  "care",
  "trust",
  "openness",
  "shared_history",
  "romantic",
  "hurtful",
  "rejection",
  "apology",
  "repair",
  "concern",
  "boundary",
] as const;

export type RelationshipSignalName =
  (typeof RELATIONSHIP_SIGNAL_NAMES)[number];

export type RelationshipSignal = {
  name: RelationshipSignalName;
  strength: number;
  confidence: number;
  evidence: string;
};

export type RelationshipSignalAssessment = {
  signals: RelationshipSignal[];
  relationshipFacts: {
    mutualAffectionExplicit: boolean;
    datingEstablishedExplicit: boolean;
  };
};

const SIGNAL_SET = new Set<string>(RELATIONSHIP_SIGNAL_NAMES);

function clamp01(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : 0;
}

export function sanitizeRelationshipSignalAssessment(
  value: unknown
): RelationshipSignalAssessment {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  const rawSignals = Array.isArray(source.signals) ? source.signals : [];
  const signals: RelationshipSignal[] = [];

  for (const item of rawSignals.slice(0, 8)) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name : "";
    if (!SIGNAL_SET.has(name)) continue;

    const strength = clamp01(row.strength);
    const confidence = clamp01(row.confidence);
    const evidence =
      typeof row.evidence === "string"
        ? row.evidence.trim().slice(0, 160)
        : "";

    // Weak guesses are worse than no signal. A signal must be grounded in
    // this turn, not merely plausible from the relationship.
    if (strength <= 0 || confidence < 0.55 || !evidence) continue;

    signals.push({
      name: name as RelationshipSignalName,
      strength,
      confidence,
      evidence,
    });
  }

  const facts =
    source.relationshipFacts && typeof source.relationshipFacts === "object"
      ? (source.relationshipFacts as Record<string, unknown>)
      : {};

  return {
    signals,
    relationshipFacts: {
      mutualAffectionExplicit: facts.mutualAffectionExplicit === true,
      datingEstablishedExplicit: facts.datingEstablishedExplicit === true,
    },
  };
}

export function createRelationshipSignalGuide() {
  return `
【関係シグナル判定】

返答と同時に、今回のユーザー発言が二人の関係に持つ意味を relationshipSignals として判定してください。
これは美咲の台詞を甘くするための採点ではありません。会話の意味を、後段の状態遷移が使える小さな事実へ分解するためのものです。

使える signal:
warmth / care / trust / openness / shared_history / romantic / hurtful / rejection / apology / repair / concern / boundary

各 signal:
・strength: 0〜1。今回の発言にその意味がどれくらい強く含まれるか
・confidence: 0〜1。会話からそう判断できる確かさ
・evidence: 今回の発言または直近文脈にある短い根拠。存在しない過去を作らない

重要:
・単語一致だけで決めない。「好き」でも物や第三者の話なら romantic ではない
・「ごめん」が常に repair ではない。二人の傷つきや衝突を修復する文脈がある場合だけ repair
・質問「俺のこと好き？」は、それだけではユーザーからの romantic 表明でも相互好意成立でもない
・冗談、引用、否定、仮定を文字列だけで肯定扱いしない
・通常雑談なら signals は空配列でよい。無理に何か付けない
・relationshipFacts は明示的な会話事実だけ。推測禁止
・mutualAffectionExplicit は双方の恋愛的好意が明確に表明された根拠がある場合だけ true
・datingEstablishedExplicit は「付き合おう」への明確な合意など、交際成立を直接裏付ける場合だけ true
・relationshipFacts は relationshipPoints や親密度から推測しない
`.trim();
}
