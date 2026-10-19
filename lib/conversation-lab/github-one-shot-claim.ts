/**
 * One-time research quota reservation using a separate private GitHub repo.
 * No persistent DB, no retries, no local memory counter.
 * The dedicated repo must be stable, restricted to this purpose and use a
 * fine-grained Contents-write-only PAT. GitHub's contents creation without
 * an existing SHA is create-only; subsequent requests fail closed.
 */
export type OneShotClaimResult = "claimed" | "denied";

export async function claimOneShotInGitHub(input: {
  token: string;
  repository: string;
  branch: string;
  runKey: "q02-preview-v1";
  fetcher?: typeof fetch;
}): Promise<OneShotClaimResult> {
  const { token, repository, branch, runKey, fetcher = fetch } = input;
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repository) ||
      repository === "miyazaki1016/misaki" ||
      !/^[a-zA-Z0-9._/-]+$/.test(branch) || branch.startsWith("-") ||
      branch.includes("..") || branch.includes("//")) return "denied";
  const path = "one-shot-claims/" + runKey + ".json";
  const url = "https://api.github.com/repos/" + repository + "/contents/" + path;
  const response = await fetcher(url, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      message: "claim: " + runKey,
      content: Buffer.from(JSON.stringify({ runKey, claimedAt: new Date().toISOString() })).toString("base64"),
      branch,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  // 201 is uniquely successful create; 200 (update), 409, 422, 403,
  // auth errors or uncertain network outcome must NEVER trigger Gemini.
  return response.status === 201 ? "claimed" : "denied";
}
