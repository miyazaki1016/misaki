import assert from "node:assert/strict";
import test from "node:test";
import { verifyTuningOwnerBearer } from "../lib/conversation-tuning-owner-auth.ts";
const configured = { MISAKI_TUNING_OWNER_USER_ID: "11111111-1111-4111-8111-111111111111" };
test("tuning owner authorization fails closed when owner is not configured", async () => {
  assert.deepEqual(await verifyTuningOwnerBearer("Bearer example", {}), {ok:false,status:503});
});
test("tuning owner authorization rejects missing or malformed bearer without network", async () => {
  assert.deepEqual(await verifyTuningOwnerBearer(null, configured), {ok:false,status:401});
  assert.deepEqual(await verifyTuningOwnerBearer("Basic example", configured), {ok:false,status:401});
  assert.deepEqual(await verifyTuningOwnerBearer("Bearer a b", configured), {ok:false,status:401});
});
test("tuning owner authorization rejects malformed owner configuration", async () => {
  assert.deepEqual(await verifyTuningOwnerBearer("Bearer example", {MISAKI_TUNING_OWNER_USER_ID:"someone@example.com"}), {ok:false,status:503});
});
