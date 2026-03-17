
-- Schedule daily push notifications at 7 AM UTC
SELECT cron.schedule(
  'send-push-notifications-daily',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://akqkqzdoatqfpbtejeyt.supabase.co/functions/v1/send-push-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcWtxemRvYXRxZnBidGVqZXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjU0NDcsImV4cCI6MjA4OTI0MTQ0N30.WeAzB0D5X_N1T21lNPdDv12Qem2WZ9WFAl_JbXQR2Eo"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
