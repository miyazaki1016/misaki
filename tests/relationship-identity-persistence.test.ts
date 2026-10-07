import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sql=fs.readFileSync(new URL("../supabase/migrations/20261007064000_relationship_identity_v1_canonical.sql",import.meta.url),"utf8");

test("identity persistence is isolated from five-axis canonical mutations",()=>{
  assert.match(sql,/create table if not exists public\.misaki_relationship_identity_state/);
  assert.doesNotMatch(sql,/set\s+friendship_score\s*=/i);
  assert.doesNotMatch(sql,/set\s+relationship_status\s*=/i);
});
test("identity apply rejects stale relationship state",()=>{
  assert.match(sql,/v_relationship_version<>p_source_relationship_state_version/);
  assert.match(sql,/stale_relationship_state_version/);
});
test("identity apply is replay-safe by source version and resolver version",()=>{
  assert.match(sql,/unique\(user_id,source_relationship_state_version,resolver_version\)/);
  assert.match(sql,/return jsonb_build_object\('replayed',true/);
});
test("candidate confirmation cannot be persisted as already-complete",()=>{
  assert.match(sql,/candidate_confirmations between 0 and 1/);
  assert.match(sql,/p_candidate_confirmations not between 0 and 1/);
});
test("pre-romantic identity can never be lover",()=>{
  assert.match(sql,/p_pre_romantic_identity='lover'/);
  assert.match(sql,/invalid_pre_romantic_identity/);
});
test("tables and RPC are not callable by browser roles",()=>{
  assert.match(sql,/revoke all on table public\.misaki_relationship_identity_state from public,anon,authenticated/);
  assert.match(sql,/revoke execute on function public\.apply_misaki_relationship_identity_v1[\s\S]*from public,anon,authenticated/);
});
