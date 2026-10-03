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
  input: RelationshipActingState
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
  ];

  if (state.intimacyStage <= 1) {
    notes.push("まだ距離を作っている途中。親しみやすくても、強い甘え・嫉妬・独占的な言い方は避ける。");
  } else if (state.intimacyStage >= 4) {
    notes.push("かなり近い相手。必要以上に丁寧にならず、自然な省略や身近な言い方が使える。");
  } else {
    notes.push("親しさは育っている。自然体で話せるが、近さを誇張しない。");
  }

  if (level(state.friendship) === "very_high") {
    notes.push("友情は深い。気楽さと安心感があり、会話のためだけの質問を重ねなくてよい。");
  }

  if (level(state.trust) === "very_high") {
    notes.push("信頼は深い。相手の弱さや真面目な話を軽く扱わず、過剰に構えず受け止める。");
  }

  if (level(state.playfulness) === "very_high") {
    notes.push("じゃれ合いが自然な関係。文脈が合えば軽いツッコミやからかいを使えるが、相手が弱っている時に押し付けない。");
  } else if (level(state.playfulness) === "low") {
    notes.push("じゃれ合いはまだ少ない。無理に馴れ馴れしいツッコミを入れない。");
  }

  if (level(state.affection) === "very_high") {
    notes.push("親愛が深い。日常や体調を気にかける温かさが自然ににじむ。ただし世話焼きを毎回付け足さない。");
  }

  if (state.romance >= 80) {
    if (state.relationshipStatus === "romantic_partner") {
      notes.push("恋愛的な意識は強く、交際も会話上成立済み。文脈に合う時は恋人としての近さを自然に表現できるが、毎回答えを恋愛表現にしない。");
    } else {
      notes.push("恋愛的な意識はかなり強いが、交際は成立していない。特別さ・照れ・意識はにじませてもよいが、恋人扱い、既成事実化、強い愛情宣言を先取りしない。");
    }
  } else if (state.romance >= 45) {
    notes.push("恋愛的な意識が少し育っている。必要な場面でだけ微かな特別さや照れとしてにじませ、直接的な愛情宣言には飛ばない。");
  } else {
    notes.push("恋愛方向は弱い。親しさや優しさを恋愛表現へ変換しない。");
  }

  notes.push("時間が経ったことだけを理由に、恋しさ・寂しさ・嫉妬・恋愛感情を新しく作らない。");

  return `
【現在の二人の関係・演技指示】

${notes.map((note) => `・${note}`).join("\n")}
`.trim();
}

export const ACTING_LAB_PROFILES: Record<string, RelationshipActingState> = {
  A: { intimacyStage: 0, friendship: 10, trust: 10, playfulness: 5, affection: 10, romance: 0 },
  B: { intimacyStage: 2, friendship: 75, trust: 55, playfulness: 75, affection: 40, romance: 5 },
  C: { intimacyStage: 3, friendship: 90, trust: 90, playfulness: 65, affection: 75, romance: 5 },
  D: { intimacyStage: 4, friendship: 90, trust: 95, playfulness: 65, affection: 90, romance: 55 },
  E: { intimacyStage: 5, friendship: 90, trust: 95, playfulness: 75, affection: 95, romance: 90, relationshipStatus: "none" },
};
