-- A purchased boost must last exactly the selected number of calendar days.
-- Historical rows are retained, while invalid future writes are rejected.

ALTER TABLE public.ad_boosts
  DROP CONSTRAINT IF EXISTS ad_boosts_exact_duration;

ALTER TABLE public.ad_boosts
  ADD CONSTRAINT ad_boosts_exact_duration
  CHECK (end_at = start_at + make_interval(days => duration_days))
  NOT VALID;

ALTER TABLE public.ad_boosts
  VALIDATE CONSTRAINT ad_boosts_exact_duration;

CREATE OR REPLACE FUNCTION public.expire_boosts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_expired INTEGER;
BEGIN
  IF COALESCE(auth.jwt()->>'role', '') <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Non autorizzato' USING ERRCODE = '42501';
  END IF;

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
  WHERE COALESCE(boost_end_at, boosted_until) <= NOW();

  GET DIAGNOSTICS v_expired = ROW_COUNT;
  RETURN v_expired;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_boosts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_boosts() TO authenticated, service_role;
