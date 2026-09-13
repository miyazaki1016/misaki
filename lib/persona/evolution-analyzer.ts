import type {
  ChatMessage,
} from "../user-profile";

export const EVOLVABLE_USER_TRAITS = [
  "affection_level",
  "teasing_level",
  "jealousy_level",
  "question_frequency",
  "name_call_frequency",
  "directness",
] as const;

export type EvolvableUserTrait =
  typeof EVOLVABLE_USER_TRAITS[number];

export type ExistingRelationshipTrait = {
  trait_key: string;
  content: string;
  strength: number | null;
};

export type EvolutionCandidate = {
  traitKey: EvolvableUserTrait;
  proposedContent: string;
  reason: string;
  confidence: number;
  riskLevel:
    | "low"
    | "medium";
  evidence: string[];
};

type GeminiEvolutionResult = {
  candidates?: Array<{
    traitKey?: unknown;
    proposedContent?: unknown;
    reason?: unknown;
    confidence?: unknown;
    riskLevel?: unknown;
    evidence?: unknown;
  }>;
};

function isEvolvableTrait(
  value: unknown
): value is EvolvableUserTrait {
  return (
    typeof value ===
      "string" &&
    (
      EVOLVABLE_USER_TRAITS as
        readonly string[]
    ).includes(
      value
    )
  );
}

function cleanText(
  value: unknown,
  maxLength: number
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .slice(
      0,
      maxLength
    );
}

function normalizeEvidence(
  value: unknown
) {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value
    .filter(
      (item) =>
        typeof item ===
        "string"
    )
    .map(
      (item) =>
        item
          .trim()
          .slice(
            0,
            120
          )
    )
    .filter(Boolean)
    .slice(0, 4);
}

function evidenceExistsInUserContext(
  evidence: string,
  userEvidenceTexts: string[]
) {
  const normalized =
    evidence.trim();

  if (
    normalized.length < 3
  ) {
    return false;
  }

  return userEvidenceTexts.some(
    (text) =>
      text.includes(
        normalized
      )
  );
}

function parseResult(
  rawText: unknown,
  userEvidenceTexts: string[]
): EvolutionCandidate[] {
  if (
    typeof rawText !==
      "string" ||
    !rawText.trim()
  ) {
    return [];
  }

  let parsed:
    GeminiEvolutionResult;

  try {
    parsed =
      JSON.parse(
        rawText
      ) as GeminiEvolutionResult;
  } catch {
    return [];
  }

  if (
    !Array.isArray(
      parsed.candidates
    )
  ) {
    return [];
  }

  const seenTraits =
    new Set<string>();

  const accepted:
    EvolutionCandidate[] = [];

  for (
    const raw of
      parsed.candidates
  ) {
    if (
      accepted.length >= 2
    ) {
      break;
    }

    if (
      !isEvolvableTrait(
        raw.traitKey
      ) ||
      seenTraits.has(
        raw.traitKey
      )
    ) {
      continue;
    }

    const proposedContent =
      cleanText(
        raw.proposedContent,
        240
      );

    const reason =
      cleanText(
        raw.reason,
        300
      );

    const confidence =
      typeof raw.confidence ===
        "number" &&
      Number.isFinite(
        raw.confidence
      )
        ? raw.confidence
        : 0;

    const riskLevel =
      raw.riskLevel ===
        "low" ||
      raw.riskLevel ===
        "medium"
        ? raw.riskLevel
        : null;

    const evidence =
      normalizeEvidence(
        raw.evidence
      ).filter(
        (item) =>
          evidenceExistsInUserContext(
            item,
            userEvidenceTexts
          )
      );

    if (
      !proposedContent ||
      !reason ||
      confidence < 0.72 ||
      confidence > 1 ||
      !riskLevel ||
      evidence.length === 0
    ) {
      continue;
    }

    seenTraits.add(
      raw.traitKey
    );

    accepted.push({
      traitKey:
        raw.traitKey,
      proposedContent,
      reason,
      confidence,
      riskLevel,
      evidence,
    });
  }

  return accepted;
}

function createAnalysisPrompt(
  history: ChatMessage[],
  memory: string[],
  existingTraits:
    ExistingRelationshipTrait[]
) {
  const recentHistory =
    history
      .slice(-40)
      .map(
        (item, index) =>
          `${
            index + 1
          }. ${
            item.role ===
              "user"
              ? "USER"
              : "MISAKI"
          }: ${item.text}`
      )
      .join("\n");

  const memoryText =
    memory.length > 0
      ? memory
          .slice(-30)
          .map(
            (item) =>
              `・${item}`
          )
          .join("\n")
      : "なし";

  const traitsText =
    existingTraits.length > 0
      ? existingTraits
          .map(
            (trait) =>
              `・${trait.trait_key}: ${trait.content} (strength=${trait.strength ?? "unknown"})`
          )
          .join("\n")
      : "なし";

  return `
あなたはAI恋人「美咲」の
ユーザー別関係性パーソナライズを
分析するレビュアーです。

目的は、
このユーザーとの関係だけに使う
小さな人格調整候補を提案することです。

【絶対ルール】

・美咲の固定人格は変更しない
・年齢、居住地、名前、恋人設定などのCore Personaは変更しない
・ユーザーの職業、住所、現在地などの事実プロフィールを人格特性として提案しない
・全ユーザーへ広げるGlobal変更は提案しない
・候補はこのユーザー専用だけ
・会話が続いているだけで「好まれている」と推測しない
・ユーザーの明示的な要望、訂正、好み、繰り返し示された反応を根拠にする
・根拠が弱ければ candidates を空配列にする
・最大2件
・大きく性格を変えない
・危険度 high は出さない
・証拠 evidence はUSER発言から短い原文をそのままコピーする
・MISAKIの発言を証拠にしない
・証拠の言い換えは禁止

【変更可能なtrait】

affection_level:
甘さ・愛情表現の強さ

teasing_level:
軽いからかいの頻度・強さ

jealousy_level:
軽い嫉妬や拗ね方の出し方

question_frequency:
質問で返す頻度

name_call_frequency:
ユーザーの名前・呼び名を呼ぶ頻度

directness:
遠回しさと率直さのバランス

【現在のユーザー別trait】

${traitsText}

【長期記憶】

${memoryText}

【最近の会話】

${recentHistory || "なし"}

【判定】

候補を出すのは例えば、
「毎回質問しないで」
「もっと甘えて」
「名前呼びすぎ」
「そういう嫉妬は好き」
のような明確な好みがある場合です。

単なる挨拶、雑談、返答継続、
一度だけの偶然の反応からは
人格変更を提案しないでください。

【出力】

JSONだけを返してください。

{
  "candidates": [
    {
      "traitKey": "question_frequency",
      "proposedContent": "このユーザーには、毎回質問で返さず、必要な時だけ質問する",
      "reason": "ユーザーが質問の多さを明示的に嫌がっているため",
      "confidence": 0.90,
      "riskLevel": "low",
      "evidence": [
        "毎回質問しないで"
      ]
    }
  ]
}

候補がなければ必ず:

{
  "candidates": []
}
`.trim();
}

export async function analyzeUserEvolution(
  apiKey: string,
  history: ChatMessage[],
  memory: string[],
  existingTraits:
    ExistingRelationshipTrait[]
): Promise<EvolutionCandidate[]> {
  const userEvidenceTexts = [
    ...history
      .filter(
        (item) =>
          item.role ===
          "user"
      )
      .map(
        (item) =>
          item.text
      ),

    ...memory,
  ];

  if (
    userEvidenceTexts.length ===
    0
  ) {
    return [];
  }

  const response =
    await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            system_instruction: {
              parts: [
                {
                  text:
                    createAnalysisPrompt(
                      history,
                      memory,
                      existingTraits
                    ),
                },
              ],
            },

            contents: [
              {
                role:
                  "user",

                parts: [
                  {
                    text:
                      "このユーザーとの関係性について、承認待ちにすべき進化候補だけを抽出してください。",
                  },
                ],
              },
            ],

            generationConfig: {
              responseMimeType:
                "application/json",
              temperature:
                0.2,
            },
          }),
      }
    );

  const data =
    await response.json();

  if (
    !response.ok
  ) {
    console.error(
      "EVOLUTION GEMINI ERROR:",
      data
    );

    return [];
  }

  const rawText =
    data?.candidates?.[0]
      ?.content?.parts?.[0]
      ?.text;

  return parseResult(
    rawText,
    userEvidenceTexts
  );
}
