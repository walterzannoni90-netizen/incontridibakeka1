CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL CHECK (event_name IN (
    'page_view', 'sign_up', 'login', 'ad_publish', 'contact_open',
    'checkout_start', 'checkout_created', 'payment_completed'
  )),
  path TEXT NOT NULL DEFAULT '/',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx
  ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_name_created_idx
  ON public.analytics_events (event_name, created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.analytics_events FROM anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;

DROP POLICY IF EXISTS analytics_admin_select ON public.analytics_events;
CREATE POLICY analytics_admin_select
  ON public.analytics_events FOR SELECT TO authenticated
  USING (public.is_admin());

COMMENT ON TABLE public.analytics_events IS
  'First-party conversion events. No IP address or user-agent is stored.';

