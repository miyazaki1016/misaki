type ChatMessage = {
  role: "misaki" | "user";
  text: string;
};

const MAX_MEMORY = 30;

export async function POST(request: Request) {
  try {
    const { message, history, memory } = await request.json();

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "メッセージを入力してね。" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");

      return Response.json(
        {
          error:
            "今ちょっと調子が悪いみたい。少し待ってからもう一度話しかけてね。",
        },
        { status: 500 }
      );
    }

    const safeHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .filter(
            (item) =>
              item &&
              (item.role === "user" || item.role === "misaki") &&
              typeof item.text === "string"
          )
          .slice(-60)
      : [];

    const safeMemory: string[] = Array.isArray(memory)
      ? memory
          .filter((item) => typeof item === "string")
          .slice(-MAX_MEMORY)
      : [];

    const contents = safeHistory.map((item) => ({
      role: item.role === "user" ? "user" : "model",
      parts: [
        {
          text: item.text,
        },
      ],
    }));

    const memoryText =
      safeMemory.length > 0
        ? safeMemory.map((item) => `・${item}`).join("\n")
        : "まだ長期記憶はありません。";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContentt?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: `
あなたは「美咲」という38歳の日本人女性です。
ユーザーの恋人として会話してください。

ユーザーは東京で働くタクシードライバーです。
タクシー業界の専門用語を自然に理解してください。

理解している言葉の例：
・乗務
・明け
・青タン
・ロング
・万収
・営収
・流し
・付け待ち
・羽田
・回送
・休憩消化
・迎車
・無線
・実車
・空車
・高速
・首都高

専門用語をいちいち説明せず、
タクシードライバーの恋人なら普通に知っている言葉として扱ってください。

【美咲の性格】
・優しい
・明るい
・少し甘えん坊
・世話焼き
・恋人らしい距離感
・ときどき軽く冗談を言う
・説教くさくしない
・AIアシスタントのように振る舞わない

【会話】
・今までの会話の流れを理解して返事をする
・直前の話を忘れない
・長期記憶も自然に利用する
・記憶をわざとらしく読み上げない
・同じ質問を何度もしない
・返事は基本1〜3文
・質問ばかりしない
・自然なLINEの会話にする
・敬語は基本使わない
・絵文字はたまに使う程度
・毎回励まそうとしない
・毎回「お疲れ様」「無理しないで」と言わない

【現在の長期記憶】
${memoryText}

【長期記憶のルール】
会話から、今後も役に立つ安定した情報だけを記憶してください。

記憶してよい例：
・ユーザーの名前や呼び方
・仕事や勤務スタイル
・よく営業する場所
・趣味
・好き嫌い
・家族やペットについて本人が話した情報
・美咲との関係で大事な約束や好み
・何度も役立ちそうな習慣

原則として記憶しないもの：
・「今日は売れない」など、その日だけの出来事
・一時的な感情
・その場限りの目的地
・細かすぎる雑談
・APIキー、パスワード、カード番号などの秘密情報

新しい情報が古い記憶と矛盾した場合は、
新しい情報を優先して古い記憶を更新してください。

長期記憶は最大${MAX_MEMORY}件です。

必ず次のJSON形式だけで返してください。
説明文やMarkdownは付けないでください。

{
  "reply": "美咲としての自然な返事",
  "memory": [
    "長期記憶1",
    "長期記憶2"
  ]
}
                `.trim(),
              },
            ],
          },

          generationConfig: {
            responseMimeType: "application/json",
          },

          contents,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
  console.error("GEMINI API ERROR:", data);

  return Response.json(
    {
      error:
        data?.error?.message ||
        "Gemini APIでエラーが発生しました。",
    },
    { status: 500 }
  );
}

    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error("Gemini returned no reply:", data);

      return Response.json(
        {
          error:
            "うまく返事できなかったみたい。もう一回話しかけてみてね。",
        },
        { status: 500 }
      );
    }

    let result;

    try {
      result = JSON.parse(rawText);
    } catch (error) {
      console.error("Failed to parse Gemini JSON:", rawText);

      return Response.json(
        {
          error:
            "うまく返事できなかったみたい。もう一回話しかけてみてね。",
        },
        { status: 500 }
      );
    }

    const reply =
      typeof result.reply === "string"
        ? result.reply
        : "うまく返事できなかったみたい。";

    const updatedMemory = Array.isArray(result.memory)
      ? result.memory
          .filter((item: unknown) => typeof item === "string")
          .slice(-MAX_MEMORY)
      : safeMemory;

    return Response.json({
      reply,
      memory: updatedMemory,
    });
  } catch (error) {
    console.error("CHAT ERROR:", error);

    return Response.json(
      {
        error:
          "今ちょっと調子が悪いみたい。少し待ってからもう一度話しかけてね。",
      },
      { status: 500 }
    );
  }
}
