-- Remove legacy Relationship Engine write bypasses.
-- v2 mutation RPCs own their canonical write logic directly and enforce
-- the active lease token in the same DB transaction. Legacy v1 write RPCs
-- are no longer executable by service_role.

-- NOTE: production definitions are canonical. This migration records the
-- direct-v2 implementation and revocations already applied to production.

revoke execute on function public.advance_misaki_relationship_processing_v1(uuid,uuid,text,text,text) from service_role;
revoke execute on function public.record_misaki_relationship_evidence_v1(uuid,uuid,text,text,integer,integer,text,text,jsonb,text) from service_role;
revoke execute on function public.upsert_misaki_relationship_episode_v1(uuid,text,text,text,uuid,uuid,uuid[],jsonb) from service_role;
revoke execute on function public.upsert_misaki_relationship_pattern_v1(uuid,text,text,text,uuid[],uuid,uuid,jsonb) from service_role;
revoke execute on function public.upsert_misaki_relationship_critical_pending_v1(uuid,uuid,text,jsonb,text) from service_role;
revoke execute on function public.advance_misaki_relationship_critical_pending_v1(uuid,uuid,text,text,text,text) from service_role;
revoke execute on function public.import_misaki_temporary_relationship_v1(uuid,uuid,integer,integer,integer,integer,integer,text,text,jsonb) from service_role;

-- The full CREATE OR REPLACE definitions for the direct-v2 implementations
-- are maintained in production and must remain aligned with this contract:
-- advance_misaki_relationship_processing_v2
-- record_misaki_relationship_evidence_v2
-- upsert_misaki_relationship_episode_v2
-- upsert_misaki_relationship_pattern_v2
-- upsert_misaki_relationship_critical_pending_v2
-- advance_misaki_relationship_critical_pending_v2
-- import_misaki_temporary_relationship_v2
