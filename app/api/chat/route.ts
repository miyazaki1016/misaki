export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return Response.json(
        { error: "message がありません" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY が設定されていません");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: "あなたは美咲、38歳の女性。タクシードライバーの彼女として、優しく親しみのある日本語で会話してください。返事は短めで自然にしてください。",
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
      throw new Error(
        data?.error?.message || `Gemini API error: ${response.status}`
      );
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      throw new Error("Geminiから返事を取得できませんでした");
    }

    return Response.json({
      reply,
    });
  } catch (error: any) {
    console.error("GEMINI ERROR:", error);

    return Response.json(
      {
        error: error?.message || "美咲との通信に失敗しました",
        status: 500,
      },
      { status: 500 }
    );
  }
}
