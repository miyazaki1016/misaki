import test from "node:test";
import assert from "node:assert/strict";
import { claimOneShotInGitHub, readOneShotStatusInGitHub } from "../lib/conversation-lab/github-one-shot-claim.ts";

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

test("read-only quota probe disables already-claimed runs and never sends PUT", async () => {
  const hits: string[] = [];
  const build = (status: number) => (async (_url: string, init: RequestInit) => {
    hits.push(String(init.method));
    assert.equal(init.method, "GET");
    assert.match(_url, /one-shot-claims\/q02-preview-v1\.json\?ref=main$/);
    return { status };
  }) as unknown as typeof fetch;
  const input = { ...base, repository: "miyazaki1016/misaki-q02-smoke-quota" };
  assert.equal(await readOneShotStatusInGitHub({ ...input, fetcher: build(200) }), "used");
  assert.equal(await readOneShotStatusInGitHub({ ...input, fetcher: build(404) }), "available");
  for (const status of [401, 403, 409, 500]) {
    assert.equal(await readOneShotStatusInGitHub({ ...input, fetcher: build(status) }), "unknown");
  }
  assert.deepEqual(hits, Array(6).fill("GET"));
});
test("read-only quota probe fails closed on misconfiguration or network error", async () => {
  let called = false;
  const fetcher = (async () => { called = true; throw new Error("offline"); }) as unknown as typeof fetch;
  assert.equal(await readOneShotStatusInGitHub({ ...base, fetcher }), "unknown");
  assert.equal(called, false);
  assert.equal(await readOneShotStatusInGitHub({ ...base, repository: "miyazaki1016/misaki-q02-smoke-quota", fetcher }), "unknown");
});
