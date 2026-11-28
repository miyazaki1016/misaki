/**
 * Pure retry prompt suffix copied from the production chat route.
 * Production is not yet wired to this helper.
 */
export function buildReplyRetryGuide(
  retryProblems: readonly string[] | undefined,
  misakiDayType: string,
): string {
  return retryProblems && retryProblems.length > 0
    ? `

【前の返答は不採用】

問題：
${retryProblems.map((problem) => `・${problem}`).join("\n")}

最初から作り直してください。

今日の美咲は
「${misakiDayType === "work" ? "仕事の日" : "休みの日"}」です。

美咲自身の具体的な過去行動は、
会話履歴または今日の記憶に
根拠がある場合だけ使ってください。

ユーザーの職業・居住地・名前も、
会話または長期記憶に
根拠があるものだけ使ってください。

名前を知っていても
毎回名前を呼ばないでください。

天気について、
架空の情報入手経路や
確認できない時間経過を
作らないでください。

必ずJSONだけを返してください。
`
    : "";
}

/**
 * Pure expression-rewrite suffix copied from production.
 * Relationship assessment and model invocation stay outside this helper.
 */
export function buildExpressionAdjustmentGuide(actionGuide: string): string {
  return `

【今回の関係状態に合わせた表現調整】

${actionGuide}

意味・事実・記憶候補は変えず、返答の温度と距離感だけをこの状態に合わせてください。
relationshipSignals は最初の判定をやり直さず、同じ意味を保ってください。
`;
}
