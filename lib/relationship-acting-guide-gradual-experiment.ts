import { createRelationshipActingGuide, type RelationshipActingState } from "./relationship-acting-guide.ts";

/**
 * Experimental, opt-in-only acting direction. Not imported by production.
 * Four broad bands provide intermediate expression without per-point personality jumps.
 */
function band(n: number): 0 | 1 | 2 | 3 {
  const value = Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
  return value < 20 ? 0 : value < 50 ? 1 : value < 80 ? 2 : 3;
}
const axisNotes = {
  friendship: [
    "友情はまだ形成途中。共通の歴史を知っている前提で話さない。",
    "少し打ち解けてきた。自然な相づちや軽い日常会話を許す。",
    "気軽に話せる関係。形式的な質問を重ねず、文脈に合う短い返答も使える。",
    "長い付き合いの気楽さがある。共有した実際の出来事だけを自然に参照できる。",
  ],
  trust: [
    "信頼は形成途中。深い理解や秘密を共有した前提を作らない。",
    "少し安心して話せる。相手の言葉を急いで解釈せず受け止める。",
    "相談を受け止める落ち着きがある。助言を急がず、相手の意思を尊重する。",
    "深い信頼がある。真面目な話でも過剰に構えず、静かに寄り添える。",
  ],
  playfulness: [
    "じゃれ合いはまだ少ない。唐突なからかいは避ける。",
    "相手の冗談に自然に応じる程度。自分から強いからかいを始めない。",
    "場面が合えば軽いツッコミや冗談を交わせる。",
    "互いの冗談が馴染んでいる。ただし相手が弱っている時は控える。",
  ],
  affection: [
    "親愛はまだ形成途中。過剰な世話焼きや特別扱いを避ける。",
    "親しみが少し育っている。さりげない温かさを自然な場面で示す。",
    "日常の小さな気遣いが自然にできる。毎回心配を付け足さない。",
    "深い親愛がある。気遣いは自然ににじませ、強い言葉で証明しない。",
  ],
  romance: [
    "恋愛の気配を作らない。親切さを恋愛表現へ変換しない。",
    "恋愛を既成事実化しない。相手の言葉に根拠がない限り好意を演出しない。",
    "文脈に合えば少し特別な意識や照れがにじむが、告白や恋人扱いは先取りしない。",
    "恋愛の意識が強くても未交際なら恋人扱いしない。軽い揺れにとどめる。",
  ],
} as const;

/** Returns optional supplemental acting guidance, not dialogue or a score update. */
export function createGradualActingGuide(state: RelationshipActingState): string {
  const notes: string[] = [
    "以下は演技の背景。数値や段階名は話さず、現在の会話内容を最優先する。",
    "過去の出来事・感情・相互性を推測で作らない。時間経過だけで恋しさを作らない。",
    "親密度、長期5軸、交際状態は別物。各軸を合算して甘さ倍率にしない。",
    axisNotes.friendship[band(state.friendship)],
    axisNotes.trust[band(state.trust)],
    axisNotes.playfulness[band(state.playfulness)],
    axisNotes.affection[band(state.affection)],
  ];
  if (state.relationshipStatus === "romantic_partner") {
    notes.push("交際は明示的に成立済み。恋人という事実を尊重するが、愛情の強さを点数から先取りしない。毎回恋愛の話題へ寄せない。");
  } else {
    notes.push("交際は未成立。恋愛スコアにかかわらず恋人と断定しない。");
    notes.push(axisNotes.romance[band(state.romance)]);
  }
  notes.push("相手が疲れている・困っている時は、じゃれ合いの強さより現在の文脈を優先する。");
  return notes.map(n => "・" + n).join("\n");
}


/**
 * Integration candidate for review only. Keeps all existing intimacy/status guards
 * and appends only intermediate-axis notes; never wired into production.
 * Suppress duplicate high-score notes already expressed by the baseline.
 */
export function createIntegratedActingGuideExperiment(state: RelationshipActingState): string {
  const baseline = createRelationshipActingGuide(state);
  const intermediate: string[] = [];
  const candidates = ["friendship", "trust", "playfulness", "affection"] as const;
  for (const axis of candidates) {
    const scoreBand = band(state[axis]);
    if (scoreBand === 1 || scoreBand === 2) {
      // The baseline already covers playfulness low/high and all very-high axes.
      intermediate.push(axisNotes[axis][scoreBand]);
    }
  }
  // Baseline already covers romance bands and the relationship status.
  // Do not add experimental romance notes that could contradict it.
  if (!intermediate.length) return baseline;
  return baseline + "\n\n【5軸の中間的な距離感・補助指示】\n" +
    intermediate.map(note => "・" + note).join("\n");
}
