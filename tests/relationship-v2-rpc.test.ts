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
