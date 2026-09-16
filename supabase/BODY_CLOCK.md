# Body clock

Supabase pg_cron (every 5 minutes) calls the `body-clock` Edge Function.
It uses `claim_misaki_body_clock_due_users`, the existing persona and photo
selector, and an atomic completion RPC to save delivery, conversation history,
and the daily count (maximum 4, Asia/Tokyo). Notifications-disabled users still
receive saved conversation deliveries, matching the original body-clock route.

Push is relayed to `https://misaki38-ai.com/api/push/body-clock`. The existing
VAPID private key stays in Vercel. A timestamped, purpose-bound HMAC authenticates
the delivery ID. A dedicated encrypted Vault key signs via a service-role-only
RPC; each server uses its own valid Supabase admin credential. The signing key
never leaves Vault. The relay loads message and recipient
from the saved delivery. `misaki_body_clock_push_attempts` prevents replays from
sending duplicates. It records one attempt per delivery; uncertain/time-out
attempts are not automatically retried, to avoid duplicate notifications.

## Required configuration

- Supabase: `GEMINI_API_KEY`; built-in `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY`.
- Vercel: the existing valid `SUPABASE_SERVICE_ROLE_KEY`,
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, optional `VAPID_SUBJECT`.
- Cron auth: `misaki_body_clock_cron` in encrypted Supabase Vault. Created
  inside the migration without printing or embedding the generated value.
- Relay signing: `misaki_body_clock_relay` in Vault, initialized by
  `body-clock-relay-signing.sql` (also applied as a database migration).

`POST body-clock?mode=health` with Cron auth checks Gemini configuration and
the authenticated Vercel relay without generating a message or sending Push.
Only enable `body-clock-enable.sql` after this returns `ok: true`.
The former `misaki-background-push` job must stay disabled. Vercel Cron is
removed from vercel.json. The client generation timer was disabled after the
browser-off production test saved a delivery and history and sent one Push.
The existing delivery display polling remains active.

## Verification

Check `cron.job_run_details`, `net._http_response`, the matching
`misaki_proactive_deliveries` row, its message in
`misaki_user_conversation_state.history`, the incremented
`background_push_state.pushes_today`, and `misaki_body_clock_push_attempts.result`.
A successful pg_cron row only confirms HTTP was queued: also inspect HTTP and
delivery/Push outcomes. Push-provider acceptance does not prove OS display.

An authenticated `?limit=1` invocation is available for a bounded smoke test.
Set only the authorized test user's next_push_at due; do not reset daily counts
or bypass the maximum of four. Keep browser/PWA closed during server tests.

## Stop

Disable `misaki-body-clock` using `cron.alter_job(jobid, active := false)`.
Do not re-enable the old notification-only job as a rollback.

## Local checks

From the function directory: `deno check index.ts`.
For the Next.js application: `npx tsc --noEmit` and `npm run build`.
`tsconfig.json` excludes Deno functions from the Next.js build.

Official scheduling documentation:
https://supabase.com/docs/guides/functions/schedule-functions
