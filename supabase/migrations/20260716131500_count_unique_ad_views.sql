-- Count real ad-detail openings once per browser and UTC day.
ALTER TABLE public.ad_views
  ADD COLUMN IF NOT EXISTS visitor_id TEXT,
  ADD COLUMN IF NOT EXISTS viewed_on DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC')::date);

CREATE UNIQUE INDEX IF NOT EXISTS ad_views_unique_browser_day_idx
  ON public.ad_views (ad_id, visitor_id, viewed_on)
  WHERE visitor_id IS NOT NULL;

DROP POLICY IF EXISTS "Ad views insert" ON public.ad_views;
REVOKE INSERT ON public.ad_views FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_ad_views_from_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.ads
  SET views = COALESCE(views, 0) + 1
  WHERE id = NEW.ad_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_ad_views_from_event() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS increment_ad_views_after_insert ON public.ad_views;
CREATE TRIGGER increment_ad_views_after_insert
AFTER INSERT ON public.ad_views
FOR EACH ROW
EXECUTE FUNCTION public.increment_ad_views_from_event();

COMMENT ON COLUMN public.ad_views.visitor_id IS
  'Pseudonymous browser identifier; no IP address or user-agent is stored.';
