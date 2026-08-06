-- Enable required extensions
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- You can adjust this URL for local testing (e.g., http://host.docker.internal:3000)
-- or point to your production Vercel URL.
-- Replace YOUR_CRON_SECRET with your actual CRON_SECRET value.

-- 1. Schedule Calendar Sync (runs every 4 hours)
select cron.schedule(
  'calendar-sync',
  '* * * * *',
  $$
    select net.http_get(
        url:='https://baseproapp.vercel.app/api/integrations/calendar/sync?token=Basely@1234'
    );
  $$
);

-- 2. Schedule PIR Reminders (runs daily at 9:00 AM)
select cron.schedule(
  'pir-reminders',
  '0 9 * * *',
  $$
    select net.http_get(
        url:='https://baseproapp.vercel.app/api/cron/pir-reminders?token=Basely@1234'
    );
  $$
);
