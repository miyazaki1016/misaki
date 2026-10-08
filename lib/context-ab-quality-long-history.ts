import type { QualityScenario } from "./context-ab-quality.ts";

/** Expand synthetic scenarios to 60 messages without real user data.
 * The first two turns preserve the scenario's original evidence.
 * Neutral filler is intentionally generic; this is NOT production-equivalent.
 */
export function makeLongQualityHistory(scenario: QualityScenario) {
  const history = [...scenario.history];
  const topics = [
    ["最近は散歩の途中で季節の変化に気づくことがあるよ","季節が少しずつ変わるのって面白いね。"],
    ["今日は新しい音楽を聴いてみたよ","どんな曲が印象に残った？"],
    ["夕方の空の色がきれいだった","夕方の空って表情が豊かだよね。"],
    ["週末に読みたい本を探してる","気になるジャンルはある？"],
    ["近所の公園に花が咲いていたよ","花が咲いているとちょっと嬉しくなるね。"],
    ["最近は朝の時間を大切にしたいな","朝をどう過ごすかで気分も変わるよね。"],
    ["たまにはゆっくり映画を見たい","どんな雰囲気の映画が見たい？"],
    ["今日は小さな発見があったよ","それは気になるな。聞かせて？"],
  ] as const;
  let i=0;
  while (history.length < 60) {
    const pair=topics[i++%topics.length];
    history.push({role:"user",text:pair[0]},{role:"model",text:pair[1]});
  }
  return history.slice(0,60);
}
export function recentModelReplies(history:readonly {role:"user"|"model";text:string}[]) {
  return history.filter(h=>h.role==="model").slice(-8).map(h=>h.text);
}
