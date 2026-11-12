// Pure policy: tested offline without credentials. Do not weaken guards to bypass review.
export const allowedRepos = new Set(["misaki", "emergencyalert"]);
export function checkRequest(x) {
  if (!x || !allowedRepos.has(x.repo) || !Number.isSafeInteger(x.number) || x.number < 1 ||
      !/^[0-9a-f]{40}$/.test(String(x.expectedHead || ""))) {
    return "リポジトリ・PR番号・期待SHAが不正です";
  }
  if (x.confirm !== "承認してマージ") return "確認操作が未完了です";
  return null;
}
export function checkPull(p, expectedHead) {
  if (!p || p.state !== "open" || p.draft || p.base?.ref !== "main" ||
      p.head?.sha !== expectedHead || p.mergeable !== true || p.head?.repo?.full_name !== p.base?.repo?.full_name) {
    return "PRの状態・マージ可能性・期待SHA・baseが安全条件を満たしません";
  }
  if (!Array.isArray(p.labels) || !p.labels.some(x => x.name === "owner-decision")) return "オーナー判断ラベルがありません";
  const body = String(p.body || "");
  if (!body.includes("### 判断してほしいこと") || !body.includes("### 推奨と理由")) return "判断の根拠が記録されていません";
  return null;
}
export function checkPaths(files) {
  if (!Array.isArray(files) || files.length === 0 || files.length >= 100) return "変更ファイル数が不明または上限以上です";
  if (files.some(f => typeof f.filename !== "string" || !/^docs\/[a-zA-Z0-9_./-]+\.md$/.test(f.filename) ||
    f.filename.includes("..") || f.status === "removed" || f.status === "renamed")) {
    return "ドキュメント以外・削除・改名など手動レビューが必要な変更があります";
  }
  return null;
}
export function checkChecks(body) {
  if (!body || !Array.isArray(body.check_runs) || body.check_runs.length === 0 ||
      body.total_count !== body.check_runs.length || body.check_runs.length >= 100) return "CIの全件が確認できません";
  if (body.check_runs.some(c => c.status !== "completed" || c.conclusion !== "success")) return "CIが全成功ではありません";
  return null;
}
