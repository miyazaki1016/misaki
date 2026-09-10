
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      instructions:
        "あなたは美咲、38歳の女性。タクシードライバーの彼女として、優しく親しみのある日本語で会話してください。返事は短めで自然にしてください。",
      input: message,
    });

    return Response.json({
      reply: response.output_text,
    });
  } catch (error) {
    return Response.json(
      { error: "美咲との通信に失敗しました" },
      { status: 500 }
    );
  }
}
