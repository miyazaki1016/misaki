export type ProactiveLifeContext = {
  situation: string;
  plan: string;
  evidence: string[];
  confidence: "none" | "explicit";
};

type ChatMessage = { role: "user" | "misaki"; text: string; sentAt?: string };

const SITUATION_PATTERNS = [
  /(?:今日は|今夜は|今は|これから)(.{0,24}(?:仕事|勤務|乗務|夜勤|日勤|休み|休日|出勤|帰宅|帰る|寝る|休憩))/,
  /(?:仕事|勤務|乗務|夜勤|日勤)(?:中|だよ|です|してる|している|行ってくる)/,
  /(?:今日は|今夜は).{0,20}(?:忙しい|暇|休み|明け)/,
];

const PLAN_PATTERNS = [
  /(?:明日|あした|今夜|今日|今週|週末|来週|これから).{0,40}(?:予定|行く|行って|仕事|勤務|乗務|休み|会う|帰る|寝る|起きる|出かけ|旅行|病院|飲み|食べ)/,
  /(?:\d{1,2}時(?:半)?|朝|昼|夕方|夜|深夜).{0,32}(?:から|まで|に).{0,32}(?:仕事|勤務|乗務|出勤|帰る|寝る|起きる|行く|会う)/,
];

function normalize(text: string) { return text.replace(/\s+/g, " ").trim(); }

function explicitUserTexts(history: ChatMessage[], memory: string[]) {
  const recentUser = history.filter((item) => item.role === "user").slice(-16).map((item) => normalize(item.text));
  const remembered = memory.slice(-20).map(normalize);
  return [...remembered, ...recentUser].filter(Boolean);
}

function lastMatch(texts: string[], patterns: RegExp[]) {
  for (let i = texts.length - 1; i >= 0; i -= 1) {
    const text = texts[i];
    if (patterns.some((pattern) => pattern.test(text))) return text.slice(0, 120);
  }
  return null;
}

export function buildProactiveLifeContext(history: ChatMessage[], memory: string[]): ProactiveLifeContext {
  const texts = explicitUserTexts(history, memory);
  const situation = lastMatch(texts, SITUATION_PATTERNS);
  const plan = lastMatch(texts, PLAN_PATTERNS);
  const evidence = [...new Set([situation, plan].filter((x): x is string => Boolean(x)))];
  return {
    situation: situation ?? "none",
    plan: plan ?? "none",
    evidence,
    confidence: evidence.length ? "explicit" : "none",
  };
}

export function createProactiveLifeGuide(context: ProactiveLifeContext) {
  if (context.confidence === "none") {
    return `【ユーザーの生活文脈】\n今回、自発メッセージで使える明示的な生活・予定の根拠はありません。\n現在地、勤務中、休み、睡眠、体調、予定を推測で補わないでください。`;
  }
  return `
【ユーザーの生活文脈：本人発言ベース】
現在の状況として参照できる発言: ${context.situation}
予定として参照できる発言: ${context.plan}

使える根拠:
${context.evidence.map((x) => `・${x}`).join("\n")}

重要:
・これは本人の発言または保存済み記憶に実際にある内容だけです
・古い発言を「今もそうだ」と断定しないでください
・時刻や日付が曖昧なら、具体的な現在状況へ変換しないでください
・根拠の範囲を越えて場所、勤務、体調、予定を作らないでください
`.trim();
}
