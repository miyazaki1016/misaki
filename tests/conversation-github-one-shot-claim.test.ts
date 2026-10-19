import test from "node:test";
import assert from "node:assert/strict";
import { claimOneShotInGitHub } from "../lib/conversation-lab/github-one-shot-claim.ts";

const base = {
  token: "test-token",
  repository: "example/misaki-quota-private",
  branch: "main",
  runKey: "q02-preview-v1" as const,
};
test("requires a distinct quota repository and valid configuration", async () => {
  let called = false;
  const fetcher = (async () => { called = true; return { status: 201 }; }) as unknown as typeof fetch;
  assert.equal(await claimOneShotInGitHub({ ...base, repository: "miyazaki1016/misaki", fetcher }), "denied");
  assert.equal(await claimOneShotInGitHub({ ...base, token: "", fetcher }), "denied");
  assert.equal(await claimOneShotInGitHub({ ...base, branch: "../main", fetcher }), "denied");
  assert.equal(called, false);
});
test("exactly one successful remote creation grants the claim", async () => {
  const fetcher = (async (_url: string, init: RequestInit) => {
    assert.equal(init.method, "PUT");
    const body = JSON.parse(String(init.body));
    assert.equal(body.branch, "main");
    assert.equal(body.sha, undefined);
    assert.match(String(body.content), /^[A-Za-z0-9+/=]+$/);
    return { status: 201 };
  }) as unknown as typeof fetch;
  assert.equal(await claimOneShotInGitHub({ ...base, fetcher }), "claimed");
});
test("conflicts, denied permissions, unusual update responses all fail closed", async () => {
  for (const status of [200, 401, 403, 404, 409, 422, 500]) {
    const fetcher = (async () => ({ status })) as unknown as typeof fetch;
    assert.equal(await claimOneShotInGitHub({ ...base, fetcher }), "denied");
  }
});
