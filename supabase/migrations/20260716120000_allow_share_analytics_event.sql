-- Keep the database constraint aligned with the analytics Edge Function.
ALTER TABLE public.analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_event_name_check;

ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_event_name_check
  CHECK (event_name IN (
    'page_view', 'sign_up', 'login', 'ad_publish', 'contact_open',
    'checkout_start', 'checkout_created', 'payment_completed', 'share'
  ));
