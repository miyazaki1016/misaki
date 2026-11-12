// Candidate-only Edge Function. Do NOT deploy with APPROVAL_MERGE_ENABLED=true until
// GitHub OAuth, owner identity and repository-scoped server token are configured.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { checkRequest, checkPull, checkPaths, checkChecks } from "./policy.mjs";

const ORIGIN = "https://miyazaki1016.github.io";
const ROOT = "https://api.github.com/repos/miyazaki1016/";
const headers = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Vary": "Origin",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};
function response(status: number, reason: string, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ ok: status < 400, reason, ...extra }), { status, headers });
}
async function gh(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(ROOT + path, {
    ...init,
    headers: {
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
      "Authorization": "Bearer " + token,
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("GitHub status " + res.status);
  return body;
}
Deno.serve(async req => {
  if (req.method === "OPTIONS") {
    return req.headers.get("origin") === ORIGIN
      ? new Response(null, { status: 204, headers })
      : new Response(null, { status: 403 });
  }
  if (req.method !== "POST") return response(405, "POSTのみ対応しています");
  if (req.headers.get("origin") !== ORIGIN) return response(403, "許可されていない画面からの操作です");
  if (Deno.env.get("APPROVAL_MERGE_ENABLED") !== "true") return response(503, "マージ機能は現在無効です");
  const ownerId = Deno.env.get("APPROVAL_OWNER_GITHUB_ID");
  const githubToken = Deno.env.get("APPROVAL_GITHUB_TOKEN");
  if (!ownerId || !/^\d+$/.test(ownerId) || !githubToken) return response(503, "管理者側の初期設定が未完了です");

  try {
    // A Supabase JWT alone is NOT sufficient: verify the signed-in GitHub identity.
    const bearer = req.headers.get("authorization") || "";
    if (!/^Bearer [A-Za-z0-9._~-]+$/.test(bearer)) return response(401, "ログインしてください");
    const jwt = bearer.substring(7);
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    if (!supabaseUrl || !anon) return response(503, "認証サービスの設定が不足しています");
    const client = createClient(supabaseUrl, anon, { auth: { persistSession: false } });
    const { data, error } = await client.auth.getUser(jwt);
    if (error || !data.user || data.user.is_anonymous) return response(401, "認証を確認できません");
    const github = data.user.identities?.find(i => i.provider === "github" &&
       String(i.identity_data?.sub || "") === ownerId);
    if (!github) return response(403, "指定されたGitHubオーナーのみ操作できます");

    if (Number(req.headers.get("content-length") || "0") > 2048) return response(413, "リクエストが大きすぎます");
    const body = await req.json();
    const reason = checkRequest(body);
    if (reason) return response(400, reason);
    const repo = String(body.repo);
    const number = Number(body.number);
    const expectedHead = String(body.expectedHead);
    const base = repo + "/pulls/" + number;
    const pull = await gh(base, githubToken);
    const pullReason = checkPull(pull, expectedHead);
    if (pullReason) return response(409, pullReason);
    const files = await gh(base + "/files?per_page=100", githubToken);
    const filesReason = checkPaths(files);
    if (filesReason) return response(409, filesReason);
    const checks = await gh(repo + "/commits/" + expectedHead + "/check-runs?per_page=100", githubToken);
    const checksReason = checkChecks(checks);
    if (checksReason) return response(409, checksReason);
    const status = await gh(repo + "/commits/" + expectedHead + "/status", githubToken);
    if (status.statuses?.length && status.state !== "success") return response(409, "Commit statusがすべて成功していません");
    if (body.dryRun === true) return response(200, "安全チェックに合格しました。まだマージしていません", { expectedHead });

    // Optimistic concurrency: GitHub rejects the merge if head moved.
    const merge = await gh(base + "/merge", githubToken, {
      method: "PUT",
      body: JSON.stringify({ sha: expectedHead, merge_method: "squash" }),
      headers: { "Content-Type": "application/json" },
    });
    if (!merge.merged) return response(409, "GitHubはマージ完了を報告していません");
    // GitHub records the authenticated bot/token merge in the PR timeline.
    console.info("owner-approved docs merge", { repo, number, mergedSha: merge.sha, approver: ownerId });
    return response(200, "マージが完了しました", { mergedSha: merge.sha, number, repo });
  } catch (error) {
    console.error("owner-merge refused:", error instanceof Error ? error.message : "unknown");
    return response(502, "安全に処理を完了できませんでした。GitHubで状態を確認してください");
  }
});
