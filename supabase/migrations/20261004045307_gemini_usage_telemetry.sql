-- Provider usage facts only; intentionally independent of relationship/quota tables.
create table public.misaki_gemini_usage_telemetry (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  request_id text check (request_id is null or length(request_id) <= 128),
  call_kind text not null check (call_kind in ('normal_reply', 'relationship_analyzer', 'critical_validator',
    'proactive_reply', 'body_clock', 'image_generation')),
  model text not null,
  attempt_no integer not null check (attempt_no > 0),
  prompt_tokens bigint check (prompt_tokens >= 0),
  candidate_tokens bigint check (candidate_tokens >= 0),
  thoughts_tokens bigint check (thoughts_tokens >= 0),
  total_tokens bigint check (total_tokens >= 0),
  cached_tokens bigint check (cached_tokens >= 0),
  http_status integer check (http_status between 100 and 599),
  success boolean not null,
  latency_ms bigint check (latency_ms >= 0),
  occurred_at timestamptz not null default now()
);
alter table public.misaki_gemini_usage_telemetry enable row level security;
revoke all on table public.misaki_gemini_usage_telemetry from public, anon, authenticated, service_role;
grant select, insert on table public.misaki_gemini_usage_telemetry to service_role;
-- Explicit service-only policies also make the intended access model visible to advisors.
create policy gemini_usage_service_select on public.misaki_gemini_usage_telemetry
  for select to service_role using (true);
create policy gemini_usage_service_insert on public.misaki_gemini_usage_telemetry
  for insert to service_role with check (true);
create index gemini_usage_occurred_at_idx on public.misaki_gemini_usage_telemetry (occurred_at);
create index gemini_usage_user_time_idx on public.misaki_gemini_usage_telemetry (user_id, occurred_at);
create index gemini_usage_request_idx on public.misaki_gemini_usage_telemetry (request_id);
comment on table public.misaki_gemini_usage_telemetry is
  'Non-authoritative Gemini physical API attempt usage. NULL means unknown. No content, secrets, pricing or FX. No client access.';
