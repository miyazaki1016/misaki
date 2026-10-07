import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const sql=fs.readFileSync(new URL("../supabase/migrations/20261007070000_relationship_identity_v1_atomic_temporary_import.sql",import.meta.url),"utf8");
test("temporary import materializes relationship and identity in one RPC transaction",()=>{
 assert.match(sql,/update public\.misaki_relationship_state/);
 assert.match(sql,/insert into public\.misaki_relationship_identity_state/);
 assert.match(sql,/insert into public\.misaki_relationship_temporary_v1_imports/);
});
test("replay cannot silently leave imported axes without identity",()=>{
 assert.match(sql,/temporary_import_identity_missing/);
 assert.match(sql,/return jsonb_build_object\('replayed',true/);
});
test("atomic import remains relationship-lease fenced",()=>{
 assert.match(sql,/assert_misaki_relationship_lease_v1/);
});
test("browser roles cannot call atomic import",()=>{
 assert.match(sql,/revoke execute on function public\.import_misaki_temporary_relationship_v3[\s\S]*from public,anon,authenticated/);
});
