import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const sql = fs.readFileSync(path.join(process.cwd(),
  "supabase/migrations/20260926003000_relationship_emotion_action_v2_rpc.sql"), "utf8");

test("permanent v2 RPC writes the exact event type consumed by relationship history", () => {
  assert.match(sql, /'emotion_action_v2_after_chat'/);
  assert.match(sql, /'signal_summary'/);
});

test("permanent v2 RPC is guarded against anonymous writes and stale state", () => {
  assert.match(sql, /is_anonymous/);
  assert.match(sql, /p_expected_state_updated_at/);
  assert.match(sql, /'conflict',true/);
});

test("permanent v2 RPC validates bounded emotion and action state", () => {
  assert.match(sql, /p_intensity < 0 or p_intensity > 100/);
  assert.match(sql, /invalid emotion/);
  assert.match(sql, /invalid action/);
});


test("permanent v2 RPC binds service writes to an explicit permanent user", () => {
  assert.match(sql, /p_user_id uuid default null/);
  assert.match(sql, /coalesce\(auth\.uid\(\), p_user_id\)/);
  assert.match(sql, /from auth\.users where id=v_user_id/);
  assert.match(sql, /to service_role;/);
  assert.doesNotMatch(sql, /to authenticated,service_role;/);
});

test("legacy post-chat emotion and derived-action triggers are retired under v2", () => {
  const retirement = fs.readFileSync(path.join(process.cwd(),
    "supabase/migrations/20260926005000_relationship_v2_retires_legacy_emotion_triggers.sql"), "utf8");
  assert.match(retirement, /drop trigger if exists trg_relationship_emotion_from_conversation_state/);
  assert.match(retirement, /drop trigger if exists trg_relationship_action_from_emotion/);
  assert.doesNotMatch(retirement, /lazy_silence/i);
});
