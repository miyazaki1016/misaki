import { buildNaturalnessScenarioPreview } from "../../../../lib/relationship-naturalness-scenario";
import { createGeminiConversationGenerator } from "../../../../lib/relationship-conversation-generator";

export const runtime = "nodejs";

async function runNaturalnessPreview() {
  if (process.env.VERCEL_ENV === "production") {
    return Response.json({ error: "preview_only" }, { status: 404 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "missing_gemini_key" }, { status: 500 });
  }

  const scenarios = [
    {
      name: "喧嘩の翌朝",
      context: { exists:true, elapsedSeconds:28800, elapsedHours:8, timeBand:"same_day" as const, intimacyLevel:"intimate", intimacyPoints:120, emotionPrimary:"affectionate" as const, emotionIntensity:58, actionState:"NORMAL" as const, lastInteractionAt:"2026-09-24T18:00:00.000Z", stateUpdatedAt:"2026-09-24T18:00:00.000Z" },
      signals: { signals:[{ name:"hurtful" as const, strength:.8, confidence:.95, evidence:"昨夜きつい言い方をされた" }], relationshipFacts:{ mutualAffectionExplicit:true, datingEstablishedExplicit:true } },
      recentConversation:"ユーザー: もういいって。しつこい\n美咲: ……そういう言い方、ちょっと嫌。",
      relationshipMemory:"普段は冗談を言い合い、親しく話している。",
      userMessage:"おはよう",
    },
    {
      name: "謝罪後",
      context: { exists:true, elapsedSeconds:7200, elapsedHours:2, timeBand:"recent" as const, intimacyLevel:"intimate", intimacyPoints:120, emotionPrimary:"hurt" as const, emotionIntensity:62, actionState:"PULL" as const, lastInteractionAt:"2026-09-24T20:00:00.000Z", stateUpdatedAt:"2026-09-24T20:00:00.000Z" },
      signals: { signals:[{ name:"apology" as const, strength:.9, confidence:.98, evidence:"ごめん、言いすぎた" },{ name:"repair" as const, strength:.75, confidence:.9, evidence:"ちゃんと話したい" }], relationshipFacts:{ mutualAffectionExplicit:true, datingEstablishedExplicit:true } },
      patterns:{ repeatedHarm:2, reliableRepair:0, sustainedCare:2 },
      recentConversation:"ユーザー: ごめん、言いすぎた。ちゃんと話したい\n美咲: ……うん。",
      relationshipMemory:"普段は親しいが、最近きつい言い方で傷ついたことが複数回ある。",
      userMessage:"まだ怒ってる？",
    },
    {
      name: "喧嘩中の心配",
      context: { exists:true, elapsedSeconds:18000, elapsedHours:5, timeBand:"recent" as const, intimacyLevel:"intimate", intimacyPoints:120, emotionPrimary:"guarded" as const, emotionIntensity:48, actionState:"PULL" as const, lastInteractionAt:"2026-09-25T00:00:00.000Z", stateUpdatedAt:"2026-09-25T00:00:00.000Z" },
      signals: { signals:[{ name:"concern" as const, strength:.8, confidence:.95, evidence:"帰りが遅くなると聞いている" }], relationshipFacts:{ mutualAffectionExplicit:true, datingEstablishedExplicit:true } },
      recentConversation:"美咲: 今はちょっと距離置きたい。\nユーザー: 今日かなり遅くなる。",
      userMessage:"今から帰る",
    },
    {
      name: "拒絶後の再会",
      context: { exists:true, elapsedSeconds:259200, elapsedHours:72, timeBand:"long_gap" as const, intimacyLevel:"familiar", intimacyPoints:55, emotionPrimary:"guarded" as const, emotionIntensity:52, actionState:"PULL" as const, lastInteractionAt:"2026-09-22T00:00:00.000Z", stateUpdatedAt:"2026-09-22T00:00:00.000Z" },
      signals: { signals:[], relationshipFacts:{ mutualAffectionExplicit:false, datingEstablishedExplicit:false } },
      recentConversation:"ユーザー: 恋愛としては見てない。\n美咲: ……そっか。わかった。",
      userMessage:"久しぶり",
    },
  ];

  const generate = createGeminiConversationGenerator(apiKey);
  const results = [];
  for (const scenario of scenarios) {
    const preview = buildNaturalnessScenarioPreview(scenario);
    const reply = await generate({ systemPrompt: preview.systemPrompt, message: preview.userMessage });
    results.push({ name: scenario.name, emotion: preview.emotion, action: preview.action, userMessage: preview.userMessage, reply });
  }
  return Response.json({ results });
}


// Preview限定。Vercel MCPの安全なGET取得から実台詞検証を実行する。
export async function GET() {
  return runNaturalnessPreview();
}

export async function POST() {
  return runNaturalnessPreview();
}
