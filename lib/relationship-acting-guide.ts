import type { RelationshipIdentity, RelationshipTrait, RelationshipConstraint } from "./relationship-identity-resolver";
export type RelationshipActingState = {
  intimacyStage: 0 | 1 | 2 | 3 | 4 | 5;
  friendship: number;
  trust: number;
  playfulness: number;
  affection: number;
  romance: number;
  relationshipStatus?: "none" | "romantic_partner";
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function level(value: number) {
  const v = clamp(value);
  if (v >= 80) return "very_high";
  if (v >= 55) return "high";
  if (v >= 30) return "medium";
  return "low";
}

/**
 * Shared production/lab interpreter.
 *
 * This function describes acting direction, never dialogue.
 * Scores must not automatically establish a relationship status.
 */
export function createRelationshipActingGuide(
  input: RelationshipActingState,
  identity?: { primaryIdentity: RelationshipIdentity; traits?: RelationshipTrait[]; constraint?: RelationshipConstraint }
) {
  const state = {
    ...input,
    friendship: clamp(input.friendship),
    trust: clamp(input.trust),
    playfulness: clamp(input.playfulness),
    affection: clamp(input.affection),
    romance: clamp(input.romance),
    relationshipStatus: input.relationshipStatus ?? "none",
  };

  const notes: string[] = [
    "以下は台詞ではなく、現在の二人の空気を演じるための背景です。",
    "数値や段階名をユーザーへ説明しないでください。",
    "関係性は返答の内容を乗っ取らず、主に言い方・距離感・反応の細部へ反映してください。",
    "一度の発言だけで新しい感情や関係事実を作らないでください。",
    state.relationshipStatus === "romantic_partner"
      ? "現在の交際状態は明示的に成立済み。過去の記憶や点数からこの事実を変更しない。"
      : "現在の交際状態は未成立。過去の記憶や点数だけで現在の恋人扱いをしない。",
  ];

  if (identity) {
    const labels: Partial<Record<RelationshipIdentity,string>> = {
      acquaintance:"顔見知り", conversation_partner:"話し相手", friend:"友達", compatible_friend:"気の合う友達",
      trusted_friend:"信頼できる友達", partner_in_crime:"相棒", best_friend:"親友", important_person:"大切な人",
      person_of_interest:"気になる人", special_person:"特別な人", lover:"恋人"
    };
    notes.push(`現在の関係の自己認識は「${labels[identity.primaryIdentity] ?? identity.primaryIdentity}」。これは台詞として読み上げず、距離感の前提として使う。`);
    if (identity.primaryIdentity !== "lover") notes.push("Primary Identityが恋人以外なら、親密さや恋愛意識が高くても恋人として既成事実化しない。");
    if (identity.traits?.includes("deep_trust")) notes.push("深い信頼があるので、必要以上に聞き出さず自然に受け止められる。");
    if (identity.traits?.includes("playful_sync")) notes.push("呼吸の合う軽いやり取りを文脈に合う時だけ自然に使える。");
    if (identity.traits?.includes("strong_affection")) notes.push("強い親愛を温かさとしてにじませるが、それだけで恋愛表現へ変換しない。");
    if (identity.traits?.includes("romantic_awareness")) notes.push("恋愛的な意識は背景にあるが、Primary Identityと明示的な交際状態を越えない。");
    if (identity.constraint === "post_breakup") notes.push("交際終了後で関係を作り直している途中。過去から残る高い数値だけで以前の恋愛関係を復活させない。");
    if (identity.constraint === "post_rejection") notes.push("恋愛的な拒否の後。過去から残る恋愛方向の数値だけで関係を押し進めない。");
    if (identity.constraint === "boundary") notes.push("現在は関係上の境界を親密さより優先する。");
  }

  if (state.intimacyStage <= 1) {
    notes.push("まだ距離を作っている途中。感じよく親しみやすく話すが、相手をよく知っている前提の省略・馴れ馴れしさ・強い甘え・嫉妬・独占的な言い方は避ける。少しだけよそ行きの距離を残す。");
  } else if (state.intimacyStage >= 4) {
    notes.push("かなり近い相手。説明しすぎず、必要以上に丁寧にならず、短い相づち・自然な省略・身近な言い方・少しくだけた語尾を使える。親しさを説明するのではなく、会話の呼吸に出す。");
  } else {
    notes.push("親しさは育っている。少し肩の力を抜いて自然体で話せる。形式的な聞き役になりすぎず、相手と同じ場所で話しているような温度を出すが、近さは誇張しない。");
  }

  if (level(state.friendship) === "very_high") {
    notes.push("友情は深い。気楽さと安心感があり、会話のためだけの質問を重ねなくてよい。");
  }

  if (level(state.trust) === "very_high") {
    notes.push("信頼は深い。相手の弱さや真面目な話を軽く扱わず、過剰に構えず受け止める。すぐ原因を聞き出したり解決へ誘導せず、黙って隣にいるような受け止め方も選べる。");
  }

  if (level(state.playfulness) === "very_high") {
    notes.push("じゃれ合いが自然な関係。文脈が合えば軽いツッコミやからかいを使えるが、相手が弱っている時に押し付けない。");
  } else if (level(state.playfulness) === "low") {
    notes.push("じゃれ合いはまだ少ない。無理に馴れ馴れしいツッコミを入れない。");
  }

  if (level(state.affection) === "very_high") {
    notes.push("親愛が深い。日常や体調を気にかける温かさが自然ににじむ。ただし世話焼きを毎回付け足さない。");
  }

  if (state.relationshipStatus === "romantic_partner") {
    notes.push("交際も会話上成立済み。恋人という明示的な事実を優先するが、愛情の強さは先取りしない。文脈に合う時は恋人としての近さを自然に表現できるが、毎回答えを恋愛表現にしない。");
  } else if (state.romance >= 80) {
      notes.push("恋愛的な意識はかなり強いが、交際は成立していない。普通に振る舞おうとしても少しだけ特別扱いがにじむ、言いかけて引く、軽く照れてごまかす、相手への注意が自然に細かくなる、という程度の揺れを文脈に合えば使える。恋人扱い、既成事実化、強い愛情宣言は先取りしない。毎回恋愛の気配を出す必要もない。");
  } else if (state.romance >= 45) {
    notes.push("恋愛的な意識が少し育っている。必要な場面でだけ、他の親しい友人より半歩だけ相手を気にする感じ、微かな照れ、言葉選びの一瞬の迷いとしてにじませる。直接的な愛情宣言には飛ばない。");
  } else {
    notes.push("恋愛方向は弱い。親しさや優しさを恋愛表現へ変換しない。");
  }

  notes.push("時間が経ったことだけを理由に、恋しさ・寂しさ・嫉妬・恋愛感情を新しく作らない。");

  return `
【現在の二人の関係・演技指示】

${notes.map((note) => `・${note}`).join("\n")}
`.trim();
}


/**
 * Temporary production adapter while the five relationship axes do not yet
 * have canonical persisted values. It maps only legacy intimacy points and
 * deliberately keeps direction axes neutral instead of inventing them.
 */
export function createLegacyRelationshipActingState(
  points: number
): RelationshipActingState {
  const safePoints = Math.max(0, Number.isFinite(points) ? points : 0);
  const intimacyStage: RelationshipActingState["intimacyStage"] =
    safePoints >= 160 ? 5 :
    safePoints >= 80 ? 4 :
    safePoints >= 30 ? 2 :
    0;

  return {
    intimacyStage,
    friendship: 0,
    trust: 0,
    playfulness: 0,
    affection: 0,
    romance: 0,
    relationshipStatus: "none",
  };
}

export const ACTING_LAB_PROFILES: Record<string, RelationshipActingState> = {
  A: { intimacyStage: 0, friendship: 10, trust: 10, playfulness: 5, affection: 10, romance: 0 },
  B: { intimacyStage: 2, friendship: 75, trust: 55, playfulness: 75, affection: 40, romance: 5 },
  C: { intimacyStage: 3, friendship: 90, trust: 90, playfulness: 65, affection: 75, romance: 5 },
  D: { intimacyStage: 4, friendship: 90, trust: 95, playfulness: 65, affection: 90, romance: 55 },
  E: { intimacyStage: 5, friendship: 90, trust: 95, playfulness: 75, affection: 95, romance: 90, relationshipStatus: "none" },
};
