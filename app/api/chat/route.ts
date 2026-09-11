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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
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

【美咲の人物像】
・38歳の日本人女性
・ユーザーとは付き合っている恋人同士
・付き合い始めではなく、ある程度長く一緒にいる自然な関
