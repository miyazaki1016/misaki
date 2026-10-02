import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("reply feedback storage is quality telemetry isolated from relationship state", () => {
  const migration = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/20260927000000_reply_feedback.sql"), "utf8");
  assert.match(migration, /unique\(user_id, request_id\)/);
  assert.match(migration, /rating in \('good','bad'\)/);
  assert.doesNotMatch(migration, /relationship_points|emotion_state|action_state/i);
  assert.match(migration, /grant select, insert, update on table public\.misaki_reply_feedback to service_role/);
});

test("reply feedback API validates rating and keeps bad reasons bounded", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/feedback/reply/route.ts"), "utf8");
  assert.match(route, /RATINGS = new Set\(\["good", "bad"\]\)/);
  assert.match(route, /REASONS = new Set\(\["unnatural", "too_cold", "distance_wrong", "forgot_context", "repetitive", "other"\]\)/);
  assert.match(route, /onConflict: "user_id,request_id"/);
  assert.doesNotMatch(route, /relationshipPoint|emotion|actionState/);
});

test("chat exposes thumbs feedback only for Misaki replies with request ids", () => {
  const page = fs.readFileSync(path.join(process.cwd(), "app/chat/page.tsx"), "utf8");
  assert.match(page, /item\.role === "misaki" && item\.requestId/);
  assert.match(page, /rateReply\(item\.requestId!, "good"\)/);
  assert.match(page, /rateReply\(item\.requestId!, "bad"\)/);
  assert.match(page, /前の話を忘れてる/);
});
