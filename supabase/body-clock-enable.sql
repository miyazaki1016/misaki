-- Run only after authenticated health check confirms all three required keys.
-- Official pg_cron + pg_net + Vault pattern; no secret values in job text.
select cron.alter_job(jobid, active := false)
from cron.job where jobname = 'misaki-background-push';
select cron.schedule(
 'misaki-body-clock',
 '*/5 * * * *',
 $job$
 select net.http_post(
  url := 'https://tzozajnwznxqgxnjikoy.supabase.co/functions/v1/body-clock',
  headers := jsonb_build_object('Content-Type','application/json',
    'x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='misaki_body_clock_cron')),
  body := '{}'::jsonb,
  timeout_milliseconds := 120000
 ) as request_id;
 $job$
);
