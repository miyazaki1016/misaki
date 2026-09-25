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


export function extractExplicitLifeFacts(
  userMessage: string,
  observedAt: string
): LifeFact[] {
  const text = userMessage.replace(/\s+/g, " ").trim();
  if (!text) return [];

  const observedMs = time(observedAt);
  if (observedMs === null) return [];

  const endOfLocalDay = (daysAhead = 0) => {
    const date = new Date(observedMs);
    date.setDate(date.getDate() + daysAhead);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  };

  // Do not promote third-person reports, questions, or "talking about work"
  // into the user's own schedule. This extractor is intentionally narrow.
  if (/^(?:友達|友人|家族|母|父|兄|姉|弟|妹|彼|彼女|同僚|知人)/.test(text)) return [];
  if (/[？?]$/.test(text) || /(?:かな|かも|らしい)(?:[。！!？?]|$)/.test(text)) return [];
  if (/(?:仕事|勤務|乗務)の(?:話|相談|ことを話)/.test(text)) return [];

  const facts: LifeFact[] = [];
  const push = (kind: LifeFactKind, fact: string, validUntil?: string) => {
    facts.push({
      kind,
      fact,
      observedAt,
      validUntil: validUntil ?? null,
      confidence: 1,
      source: "user",
    });
  };

  // Only explicit first-person statements are extracted here. Ambiguous
  // mentions remain in conversation history instead of becoming canonical life facts.
  if (/(?:今日は|きょうは).{0,12}(?:休み|休暇|休日)(?:だ|です|なんだ|だよ|なの)?/.test(text)) {
    push("schedule", "今日は休み", endOfLocalDay());
  }
  if (/(?:今日は|きょうは).{0,16}(?:仕事|勤務|乗務)(?:だ|です|なんだ|だよ|なの|する|します)?/.test(text)) {
    push("schedule", "今日は仕事", endOfLocalDay());
  }
  if (/(?:明日は|あしたは).{0,12}(?:休み|休暇|休日)(?:だ|です|なんだ|だよ|なの)?/.test(text)) {
    push("schedule", "明日は休み", endOfLocalDay(1));
  }
  if (/(?:明日は|あしたは).{0,16}(?:仕事|勤務|乗務)(?:だ|です|なんだ|だよ|なの|する|します)?/.test(text)) {
    push("schedule", "明日は仕事", endOfLocalDay(1));
  }

  const late = text.match(/(?:今日は|きょうは)?.{0,8}(\d{1,2})時(?:ごろ|頃)?(?:まで|くらいまで)?.{0,8}(?:仕事|勤務|乗務)/);
  if (late) {
    const hour = Number(late[1]);
    if (hour >= 0 && hour <= 23) {
      push("schedule", `今日は${hour}時ごろまで仕事`, endOfLocalDay());
    }
  }

  return facts;
}


const LIFE_MEMORY_PREFIX = "[life:v1]";

export function encodeLifeFactMemory(fact: LifeFact) {
  return LIFE_MEMORY_PREFIX + JSON.stringify(fact);
}

export function decodeLifeFactMemory(value: string): LifeFact | null {
  if (!value.startsWith(LIFE_MEMORY_PREFIX)) return null;
  try {
    const parsed = JSON.parse(value.slice(LIFE_MEMORY_PREFIX.length));
    if (!parsed || typeof parsed.fact !== "string") return null;
    if (!["profile", "schedule", "routine", "situation", "preference", "concern"].includes(parsed.kind)) return null;
    return {
      kind: parsed.kind,
      fact: parsed.fact.trim(),
      observedAt: typeof parsed.observedAt === "string" ? parsed.observedAt : null,
      validUntil: typeof parsed.validUntil === "string" ? parsed.validUntil : null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 1,
      source: parsed.source === "user" ? "user" : "memory",
    };
  } catch {
    return null;
  }
}

export function splitLifeFactMemory(memory: string[]) {
  const facts: LifeFact[] = [];
  const ordinaryMemory: string[] = [];
  for (const item of memory) {
    const fact = decodeLifeFactMemory(item);
    if (fact) facts.push(fact);
    else ordinaryMemory.push(item);
  }
  return { facts, ordinaryMemory };
}
