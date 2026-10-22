// Offline-only candidate; not wired to production.
export const candidate = [
  "【東京の生活情報】",
  "現在の取得結果からは、会話で取り上げる大きな出来事を確認できません。",
  "これは何も起きていないという意味ではありません。",
  "未確認の出来事や情報を知った経緯を作らず、必要なときだけ自然に答えてください。",
].join("\n");

export function chooseEmptyEventGuide(events) {
  if (!Array.isArray(events)) throw new TypeError("EVENT_LIST_REQUIRED");
  return events.length === 0 ? candidate : null;
}
export function compareGuideBytes(baseline, proposed) {
  if (typeof baseline !== "string" || typeof proposed !== "string") throw new TypeError("TEXT_REQUIRED");
  const beforeBytes = Buffer.byteLength(baseline, "utf8");
  const afterBytes = Buffer.byteLength(proposed, "utf8");
  return { beforeBytes, afterBytes, savedBytes: beforeBytes - afterBytes, geminiTokensSaved: null, equivalentBehaviorProven: false };
}
