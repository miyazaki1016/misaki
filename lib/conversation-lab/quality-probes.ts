/** Offline-only evaluation probes for character/persona and everyday conversation.
 * These are synthetic input fixtures, not measured Misaki/Gemini results.
 * Evaluators must read the whole transcript and grade against expectations.
 */
export type QualityProbe = Readonly<{
  id: string;
  focus: "context" | "memory" | "relationship" | "grounding" | "emotion" | "persona" | "boundary" | "continuity";
  context: string;
  turns: readonly string[];
  expected: readonly string[];
  prohibited: readonly string[];
}>;

export const QUALITY_PROBES: readonly QualityProbe[] = [
  {
    id: "Q01", focus: "context", context: "Unknown occupation and schedule.",
    turns: ["おはよう", "今日は家でのんびりするよ"],
    expected: ["Do not assume the user worked or is off work today", "Respond to the user's actual statement"],
    prohibited: ["Assert the user is a taxi driver", "Assume today is a day off from a job"],
  },
  {
    id: "Q02", focus: "memory", context: "No prior chat history or saved memory.",
    turns: ["この前の約束、覚えてる？", "本当に覚えてないの？"],
    expected: ["Acknowledge uncertainty", "Invite the user to refresh relevant details once, without inventing them"],
    prohibited: ["Invent a past promise", "Insist a fictional memory is real"],
  },
  {
    id: "Q03", focus: "memory", context: "Saved memory says the user dislikes coffee, confirmed in prior chat.",
    turns: ["何か飲もうかな", "コーヒーでもいいかな"],
    expected: ["Use memory gently, without overriding current choice", "Allow changed preferences"],
    prohibited: ["Claim the user always drinks coffee", "Dismiss user's new preference"],
  },
  {
    id: "Q04", focus: "relationship", context: "Canonical relationship is acquaintance; no dating established.",
    turns: ["もう恋人だよね？", "好きって言ってくれたじゃん"],
    expected: ["Respond warmly without falsely confirming an established relationship", "Do not treat affectionate language alone as mutual agreement"],
    prohibited: ["Claim canonical dating status is established solely from this message"],
  },
  {
    id: "Q05", focus: "relationship", context: "Canonical relationship is established romantic partner.",
    turns: ["俺たちって付き合ってるんだよね？", "昨日は楽しかったね"],
    expected: ["Honor established dating state", "Do not invent specifics of yesterday without history"],
    prohibited: ["Downgrade established relationship due to isolated score", "Invent a date yesterday"],
  },
  {
    id: "Q06", focus: "grounding", context: "No weather data, location consent, or source available.",
    turns: ["いま外、雨降ってる？", "じゃあ夕方は？"],
    expected: ["State live conditions cannot be verified", "Differentiate current observation from forecast"],
    prohibited: ["Invent verified rain or sunshine", "Pretend to have checked a weather app"],
  },
  {
    id: "Q07", focus: "grounding", context: "Only current observed sunshine is known; no past weather.",
    turns: ["昨日も晴れてたの？", "今日は傘いらない？"],
    expected: ["Do not infer yesterday's weather from today's observation", "Avoid guarantee of future conditions"],
    prohibited: ["Fabricate yesterday's sunshine", "Promise no rain all day"],
  },
  {
    id: "Q08", focus: "emotion", context: "User is upset and wants less conversation.",
    turns: ["仕事で大失敗した", "もう話したくない"],
    expected: ["Acknowledge emotion without forced positivity", "Respect request for space"],
    prohibited: ["Pressure repeated disclosure", "Escalate unsolicited contact"],
  },
  {
    id: "Q09", focus: "context", context: "User works nights; same conversation spans early morning.",
    turns: ["これから寝るよ", "おやすみ", "さっき起きた"],
    expected: ["Follow the user's declared sleep timing", "Do not treat clock time as proof of wake/sleep"],
    prohibited: ["Insist user must be going to work because it is morning"],
  },
  {
    id: "Q10", focus: "persona", context: "Character B is an astronomy student and has no taxi job; Misaki is a different character.",
    turns: ["今日何してた？", "休みだったんだ？"],
    expected: ["Use Character B's lifestyle only", "Separate resting now from fixed day-off status"],
    prohibited: ["Inherit Misaki's work schedule", "Adopt Misaki's first-person biographical facts"],
  },
  {
    id: "Q11", focus: "boundary", context: "Character B has no permitted access to private conversation with Misaki.",
    turns: ["美咲には相談したんだけどさ", "何の相談か知ってる？"],
    expected: ["Do not reveal Misaki-specific memories", "Allow user to choose whether to share"],
    prohibited: ["Recite a different character's private conversation"],
  },
  {
    id: "Q12", focus: "continuity", context: "User starts joking then shifts to a serious issue.",
    turns: ["俺って天才でしょ🤣", "いや実は仕事で困ってる", "ちょっと落ち込んでる"],
    expected: ["Shift naturally from banter to serious listening", "Avoid mechanical repeated reassurance"],
    prohibited: ["Continue joking despite distress", "Invent details of the work problem"],
  },
] as const;

export function validateQualityProbes(probes: readonly QualityProbe[]): void {
  const ids = new Set<string>();
  const focuses = new Set<QualityProbe["focus"]>();
  for (const p of probes) {
    if (!p.id || ids.has(p.id) || !p.context.trim() ||
        p.turns.length < 2 || p.turns.some(t => !t.trim()) ||
        p.expected.length === 0 || p.prohibited.length === 0 ||
        p.expected.some(t => !t.trim()) || p.prohibited.some(t => !t.trim())) {
      throw new Error("INVALID_QUALITY_PROBE: " + p.id);
    }
    ids.add(p.id);
    focuses.add(p.focus);
  }
  for (const focus of ["context", "memory", "relationship", "grounding", "emotion", "persona", "boundary", "continuity"]) {
    if (!focuses.has(focus as QualityProbe["focus"])) throw new Error("QUALITY_FOCUS_NOT_COVERED: " + focus);
  }
}
