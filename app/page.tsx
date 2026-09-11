import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return Response.json(
        { error: "message がありません" },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      instructions:
        "あなたは美咲、38歳の女性。タクシードライバーの彼女として、優しく親しみのある日本語で会話してください。返事は短めで自然にしてください。",
      input: message,
    });

    return Response.json({
      reply: response.output_text,
    });
  } catch (error: any) {
    console.error("OPENAI ERROR:", error);

    return Response.json(
      {
        error: error?.message || "美咲との通信に失敗しました",
        type: error?.type || null,
        code: error?.code || null,
        status: error?.status || 500,
      },
      { status: 500 }
    );
  }
}
