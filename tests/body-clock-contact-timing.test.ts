import assert from "node:assert/strict";
import test from "node:test";
import { hoursSinceLastContact } from "../supabase/functions/body-clock/contact-timing.ts";

const now=Date.parse("2026-09-24T12:00:00.000Z");

test("uses the newest valid contact timestamp",()=>{
 const h=hoursSinceLastContact([{sentAt:"2026-09-24T02:00:00.000Z"},{sentAt:"2026-09-24T10:30:00.000Z"}],now);
 assert.equal(h,1.5);
});

test("missing or invalid timestamps do not pretend the user was contacted recently",()=>{
 assert.equal(hoursSinceLastContact([{}, {sentAt:"not-a-date"}],now),undefined);
});

test("future clock skew never creates negative elapsed time",()=>{
 assert.equal(hoursSinceLastContact([{sentAt:"2026-09-24T13:00:00.000Z"}],now),0);
});
