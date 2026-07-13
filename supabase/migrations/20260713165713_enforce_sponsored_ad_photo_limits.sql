-- Photo limits belong to the individual advertisement, not to the user's
-- payment history or current credit balance.
--
-- New advertisements: one photo maximum.
-- Existing advertisements: up to five photos only while a paid boost is active.
-- Existing multi-photo galleries remain visible after expiry, but cannot be
-- expanded again until the advertisement is sponsored again.

CREATE OR REPLACE FUNCTION public.enforce_ad_photo_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_photo_count INTEGER := cardinality(COALESCE(NEW.images, ARRAY[]::TEXT[]));
  v_has_active_sponsorship BOOLEAN;
BEGIN
  IF v_photo_count = 0 AND NULLIF(BTRIM(COALESCE(NEW.image, '')), '') IS NOT NULL THEN
    v_photo_count := 1;
  END IF;

  IF v_photo_count > 5 THEN
    RAISE EXCEPTION 'Un annuncio può contenere al massimo 5 foto'
      USING ERRCODE = '22023';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF v_photo_count > 1 THEN
      RAISE EXCEPTION 'Pubblica prima l''annuncio con una foto, poi sponsorizzalo per aggiungerne fino a 5'
        USING ERRCODE = '22023';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.images IS NOT DISTINCT FROM OLD.images
     AND NEW.image IS NOT DISTINCT FROM OLD.image THEN
    RETURN NEW;
  END IF;

  v_has_active_sponsorship :=
    COALESCE(NEW.boosted_until, NEW.boost_end_at) > NOW()
    AND (COALESCE(NEW.is_premium, FALSE) OR COALESCE(NEW.is_sponsored, FALSE));

  IF v_photo_count > 1 AND NOT v_has_active_sponsorship THEN
    RAISE EXCEPTION 'Sponsorizza questo annuncio per aggiungere fino a 5 foto'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_enforce_ad_photo_limits ON public.ads;
CREATE TRIGGER zz_enforce_ad_photo_limits
BEFORE INSERT OR UPDATE OF image, images ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.enforce_ad_photo_limits();
