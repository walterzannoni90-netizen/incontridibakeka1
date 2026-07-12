CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-ad-boosts') THEN
    PERFORM cron.unschedule('expire-ad-boosts');
  END IF;
END $$;

SELECT cron.schedule(
  'expire-ad-boosts',
  '*/15 * * * *',
  $cleanup$
    UPDATE public.ads
    SET boost_type = NULL,
        boost_start_at = NULL,
        boost_end_at = NULL,
        boosted_until = NULL,
        vetrina_scheduled_at = NULL,
        vetrina_duration_days = NULL,
        is_boosted = FALSE,
        is_premium = FALSE,
        is_sponsored = FALSE,
        updated_at = NOW()
    WHERE COALESCE(boost_end_at, boosted_until) <= NOW()
      AND (is_boosted OR is_premium OR is_sponsored);
  $cleanup$
);
