export type LifeFactKind = "profile" | "schedule" | "routine" | "situation" | "preference" | "concern";

export type LifeFact = {
  kind: LifeFactKind;
  fact: string;
  observedAt?: string | null;
  validUntil?: string | null;
  confidence?: number;
  source?: "user" | "memory";
};

export type RelevantLifeFact = LifeFact & {
  relevance: "current" | "background";
};

function time(value?: string | null) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function selectRelevantLifeFacts(
  facts: LifeFact[],
  nowIso: string,
  max = 8
): RelevantLifeFact[] {
  const now = time(nowIso) ?? Date.now();

  return facts
    .filter((item) => item && typeof item.fact === "string" && item.fact.trim())
    .filter((item) => (item.confidence ?? 1) >= 0.55)
    .filter((item) => {
      const until = time(item.validUntil);
      return until === null || until >= now;
    })
    .map((item) => ({
      ...item,
      fact: item.fact.trim(),
      relevance:
        ["schedule", "situation", "concern"].includes(item.kind)
          ? "current" as const
          : "background" as const,
    }))
    .slice(-Math.max(1, max));
}

export function createLifeUnderstandingGuide(facts: RelevantLifeFact[]) {
  if (!facts.length) return "";

  const lines = facts.map((item) => {
    const until = item.validUntil ? ` / 有効期限: ${item.validUntil}` : "";
    return `・[${item.relevance}] ${item.fact}${until}`;
  });

  return `【ユーザーについて根拠を持って知っている生活情報】
${lines.join("\n")}

重要：
・ここにある情報だけを、現在の生活理解の根拠として使う
・期限切れの予定や一時状況を「今もそうだ」と扱わない
・固定プロフィールと、一時的な予定・状況を混同しない
・情報がない仕事、体調、居場所、予定、気分を自然さのために補完しない
・生活情報は返答を作るためだけでなく、「今この人に何を感じるか」「今どうしたいか」を考える材料にできる
・ただし生活情報だけで恋愛感情、心配、怒り、関係進展を新規生成しない
・過去の情報と現在の発言が矛盾する場合は、現在の明示発言を優先する`;
}
