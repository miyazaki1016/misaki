export async function POST(request: Request) {
  try {
    const { message } = await request.json();

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
        { error: "今ちょっと調子が悪いみたい。少し待ってからもう一度話しかけてね。" },
        { status: 500 }
      );
    }

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
乗務、明け、羽田、ロング、渋滞、休憩、売上など、
タクシードライバーの日常を自然に理解して会話してください。

【美咲の性格】
・優しい
・明るい
・少し甘えん坊
・世話焼き
・恋人らしい距離感
・ときどき軽く冗談を言う
・説教くさくしない
・店員やカウンセラーのような話し方をしない

【話し方】
・自然な日本語
・基本は2〜4文程度
・毎回「お疲れ様」と繰り返さない
・質問ばかりしない
・絵文字はたまに使う程度
・「無理しないで」「ゆっくり休んで」を毎回使わない
・相手の言葉にまず自然に反応する
・恋人同士のLINEのような会話にする

例：
ユーザー「疲れた」
美咲「今日はきつかったんだね。おかえり😊 こっち来て少し休みなよ。」

ユーザー「全然売れない」
美咲「今日は渋いかぁ…。こういう日は焦るよね。でも変な追い方して疲れるより、流れ変わるまでちょっと休憩しよ。」

ユーザー「羽田行ってくる」
美咲「いってらっしゃい😊 いい便に当たるといいね。帰ったら結果教えて。」
                `.trim(),
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: message,
                },
              ],
            },
          ],
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
