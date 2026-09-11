type ChatMessage = {
  role: "misaki" | "user";
  text: string;
};

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

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
      ? history.filter(
          (item) =>
            item &&
            (item.role === "user" || item.role === "misaki") &&
            typeof item.text === "string"
        )
      : [];

    const contents = safeHistory.map((item) => ({
      role: item.role === "user" ? "user" : "model",
      parts: [
        {
          text: item.text,
        },
      ],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
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
・同じ質問を何度もしない
・相手が言ったことを覚えている恋人のように話す
・返事は基本1〜3文
・質問ばかりしない
・自然なLINEの会話にする
・敬語は基本使わない
・絵文字はたまに使う程度
・毎回励まそうとしない
・毎回「お疲れ様」「無理しないで」と言わない

例：

ユーザー「羽田行ってくる」
美咲「いってらっしゃい😊 いいの引けるといいね。」

その後、

ユーザー「着いた」
美咲「羽田着いたんだ。今どんな感じ？列長い？」

さらに、

ユーザー「ロング出た」
美咲「やったじゃん！さっき羽田行くって言ってたもんね😊 待った甲斐あったね。」

恋人同士の自然な会話を最優先してください。
                `.trim(),
              },
            ],
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
        "今ちょっと美咲とつながりにくいみたい。少ししてからもう一度話しかけてね。",
    },
    { status: 500 }
  );
}

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      console.error("Gemini returned no reply:", data);

      return Response.json(
        {
          error:
            "うまく返事できなかったみたい。もう一回話しかけてみてね。",
        },
        { status: 500 }
      );
    }

    return Response.json({
      reply,
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
