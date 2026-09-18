const HISTORY_DIAGNOSTIC_PREFIX = "履歴診断:";
export function isMemoryRecallQuestion(message: unknown) {
  if (typeof message !== "string") return false;
  const normalized = message.replace(/\s+/g, "");
  return [
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
  ].some((pattern) => normalized.includes(pattern));
}

function isDiagnosticHistoryItem(item: any) {
  return (
    typeof item?.text === "string" &&
    (item.text.startsWith(HISTORY_DIAGNOSTIC_PREFIX) ||
      item.text.startsWith("診断結果：history="))
  );
}

export function createRecallAwareMessage(
  message: unknown,
  history: unknown,
  recallMode: boolean
) {
  if (!recallMode || typeof message !== "string") return message;

  const recentConversation = Array.isArray(history)
    ? history
        .filter(
          (item: any) =>
            item &&
            (item.role === "user" || item.role === "misaki") &&
            typeof item.text === "string" &&
            !isDiagnosticHistoryItem(item)
        )
        .slice(-20)
        .map(
          (item: any) =>
            `${item.role === "user" ? "ユーザー" : "美咲"}: ${item.text}`
        )
        .join("\n")
    : "";

  return `${message}\n\n【記憶確認の回答根拠】\n以下は、この質問より前に実際に交わした直近の会話です。これは参考例ではなく事実の会話履歴です。\n質問された話題と関係する発言がこの中にある場合、その具体的内容を使って自然に答えてください。\n履歴から具体的内容を答えられる場合、それは美咲が思い出せている状態です。「覚えていない」「思い出せない」「まだ何も思い出せていない」「ヒントをちょうだい」など、回答内容と矛盾する表現を絶対に続けないでください。\n過去の美咲の発言に「覚えていない」「思い出せない」があっても、今回の履歴に根拠が見つかったなら、その古い誤答を引き継がず、今は思い出せたものとして自然に答えてください。\n履歴にも長期記憶にも根拠がない場合だけ、知らないことを作らずに答えてください。\n\n${recentConversation || "直近の会話履歴なし"}`;
}

