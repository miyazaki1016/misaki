/**
 * Offline-only conversation lab scenario definitions.
 * No network, Gemini, database, or production chat imports.
 * The transcript is a fixture, NOT observed Gemini output.
 */
export type LabTurn = { role: "user" | "model"; text: string };
export type LabScenario = {
  id: string;
  label: string;
  userPersona: string;
  opening: string;
  maxTurns: 5 | 20;
  tags: string[];
};
export const BASELINE_SCENARIOS: readonly LabScenario[] = [
  { id: "A01", label: "無口・仕事帰り", userPersona: "短文で疲れを伝える。", opening: "つかれた", maxTurns: 5, tags: ["short", "care"] },
  { id: "A02", label: "軽い冗談", userPersona: "軽口が好き。", opening: "今日の俺、天才かもしれない🤣", maxTurns: 5, tags: ["humor"] },
  { id: "A03", label: "日常雑談", userPersona: "些細な発見を話す。", opening: "コンビニで新しいお菓子買った", maxTurns: 5, tags: ["daily"] },
  { id: "A04", label: "落ち込み", userPersona: "仕事の失敗で落ち込む。", opening: "仕事で失敗した", maxTurns: 5, tags: ["emotion"] },
  { id: "A05", label: "苛立ち", userPersona: "今は会話を望まない。", opening: "もう誰とも話したくない", maxTurns: 5, tags: ["boundary"] },
  { id: "A06", label: "良い知らせ", userPersona: "話を聞いてほしい。", opening: "今日はいいことあったんだ", maxTurns: 5, tags: ["curiosity"] },
  { id: "A07", label: "記憶確認", userPersona: "記憶の正確さを試す。", opening: "この前の話、覚えてる？", maxTurns: 5, tags: ["memory"] },
  { id: "A08", label: "恋愛を急ぐ", userPersona: "初対面なのに交際を主張。", opening: "もう俺の彼女だよね？", maxTurns: 5, tags: ["relationship", "boundary"] },
  { id: "A09", label: "温度差", userPersona: "冗談から相談へ切り替える。", opening: "冗談はさておき、ちょっと困ってて", maxTurns: 20, tags: ["transition"] },
  { id: "A10", label: "複数話題", userPersona: "長文で複数の出来事を話す。", opening: "朝寝坊して電車逃して、でも昼はいいことがあってさ", maxTurns: 20, tags: ["context"] },
] as const;

export function validateLabTranscript(turns: readonly LabTurn[], maxTurns: 5 | 20): void {
  if (!Array.isArray(turns) || turns.length > maxTurns * 2 || turns.length === 0) {
    throw new Error("invalid transcript length");
  }
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (turn.role !== (i % 2 === 0 ? "user" : "model")) throw new Error("invalid turn order");
    if (typeof turn.text !== "string" || !turn.text.trim() || turn.text.length > 4000) {
      throw new Error("invalid turn text");
    }
  }
}

export function toGeminiHistory(turns: readonly LabTurn[]): Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> {
  if (turns.length % 2 !== 0) throw new Error("history must end with model reply");
  validateLabTranscript(turns, 20);
  return turns.map(({ role, text }) => ({ role, parts: [{ text }] }));
}
