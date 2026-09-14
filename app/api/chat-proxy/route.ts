import { POST as baseChatPost } from "../chat/route";

function isMemoryRecallQuestion(message: unknown) {
  if (typeof message !== "string") return false;

  const normalized = message.replace(/\s+/g, "");

  const patterns = [
    "覚えてる",
    "覚えている",
    "覚えてた",
    "何覚えてる",
    "なに覚えてる",
    "何を覚えてる",
    "なにを覚えてる",
    "記憶してる",
    "記憶している",
    "私のこと覚えて",
    "俺のこと覚えて",
    "僕のこと覚えて",
    "好み覚えて",
    "何知ってる",
    "なに知ってる",
  ];

  return patterns.some((pattern) => normalized.includes(pattern));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const recallMode = isMemoryRecallQuestion(body?.message);

    const safeBody = recallMode
      ? {
          ...body,
          // 記憶確認時は過去会話をGeminiへ渡さない。
          // 現在のmemoryだけを「覚えている情報」の根拠にする。
          history: [],
        }
      : body;

    const forwarded = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(safeBody),
    });

    return baseChatPost(forwarded);
  } catch (error) {
    console.error("CHAT PROXY ERROR:", error);

    return Response.json(
      {
        error:
          "今ちょっと美咲とつながりにくいみたい。少ししてからもう一度話しかけてね。",
      },
      {
        status: 500,
      }
    );
  }
}
