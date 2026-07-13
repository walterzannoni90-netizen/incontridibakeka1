-- Business rules approved on 2026-07-13:
-- zero welcome credits; independent Premium/Vetrina expiries; exact prices.

ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 0;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS vetrina_until TIMESTAMPTZ;

UPDATE public.ads
SET premium_until = COALESCE(premium_until, CASE WHEN is_premium THEN COALESCE(boost_end_at, boosted_until) END),
    vetrina_until = COALESCE(vetrina_until, CASE WHEN is_sponsored OR boost_type = 'vetrina' THEN COALESCE(boost_end_at, boosted_until) END);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, phone, credits, is_admin, is_verified, subscription_tier, has_paid, ads_count)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    0, FALSE, FALSE, 'free', FALSE, 0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS profiles_insert_secure ON public.profiles;
CREATE POLICY profiles_insert_secure ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id AND COALESCE(is_admin, FALSE) = FALSE
    AND COALESCE(is_verified, FALSE) = FALSE
    AND COALESCE(is_premium, FALSE) = FALSE
    AND COALESCE(credits, 0) = 0
    AND COALESCE(subscription_tier, 'free') = 'free'
    AND COALESCE(has_paid, FALSE) = FALSE
    AND COALESCE(ads_count, 0) = 0
    AND COALESCE(auto_renewal, FALSE) = FALSE
  );

CREATE OR REPLACE FUNCTION public.purchase_ad_boost(
  p_ad_id UUID,
  p_duration_days INTEGER,
  p_type TEXT,
  p_start_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (ad_id UUID, credits_used INTEGER, remaining_credits INTEGER, starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_cost INTEGER;
  v_balance INTEGER;
  v_owner UUID;
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Non autenticato' USING ERRCODE = '42501'; END IF;

  v_cost := CASE
    WHEN p_type = 'vetrina' AND p_duration_days = 1 THEN 10
    WHEN p_type = 'vetrina' AND p_duration_days = 3 THEN 30
    WHEN p_type = 'vetrina' AND p_duration_days = 7 THEN 70
    WHEN p_type = 'premium' AND p_duration_days = 30 THEN 150
    ELSE NULL
  END;
  IF v_cost IS NULL THEN RAISE EXCEPTION 'Tipo o durata promozione non validi' USING ERRCODE = '22023'; END IF;

  SELECT user_id INTO v_owner FROM public.ads WHERE id = p_ad_id FOR UPDATE;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Annuncio non trovato' USING ERRCODE = 'P0002'; END IF;
  IF v_owner <> v_user_id THEN RAISE EXCEPTION 'Non autorizzato' USING ERRCODE = '42501'; END IF;

  SELECT credits INTO v_balance FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF COALESCE(v_balance, 0) < v_cost THEN RAISE EXCEPTION 'Crediti insufficienti' USING ERRCODE = 'P0001'; END IF;

  v_start := GREATEST(COALESCE(p_start_at, NOW()), NOW());
  IF v_start > NOW() + INTERVAL '90 days' THEN RAISE EXCEPTION 'La data di inizio è troppo lontana' USING ERRCODE = '22023'; END IF;
  v_end := v_start + make_interval(days => p_duration_days);

  UPDATE public.profiles SET credits = credits - v_cost, updated_at = NOW() WHERE id = v_user_id;

  UPDATE public.ads
  SET premium_until = CASE WHEN p_type = 'premium' THEN v_end ELSE premium_until END,
      vetrina_until = CASE WHEN p_type = 'vetrina' THEN v_end ELSE vetrina_until END,
      is_premium = CASE WHEN p_type = 'premium' THEN TRUE ELSE COALESCE(premium_until > NOW(), FALSE) END,
      is_sponsored = CASE WHEN p_type = 'vetrina' THEN v_start <= NOW() ELSE COALESCE(vetrina_scheduled_at <= NOW() AND vetrina_until > NOW(), FALSE) END,
      is_boosted = TRUE,
      boost_type = p_type,
      boost_start_at = v_start,
      boost_end_at = v_end,
      boosted_until = GREATEST(v_end, COALESCE(premium_until, '-infinity'::timestamptz), COALESCE(vetrina_until, '-infinity'::timestamptz)),
      vetrina_scheduled_at = CASE WHEN p_type = 'vetrina' THEN v_start ELSE vetrina_scheduled_at END,
      vetrina_duration_days = CASE WHEN p_type = 'vetrina' THEN p_duration_days ELSE vetrina_duration_days END,
      updated_at = NOW()
  WHERE id = p_ad_id;

  INSERT INTO public.ad_boosts (ad_id, user_id, type, duration_days, start_at, end_at, credits_used)
  VALUES (p_ad_id, v_user_id, p_type, p_duration_days, v_start, v_end, v_cost);

  RETURN QUERY SELECT p_ad_id, v_cost, v_balance - v_cost, v_start, v_end;
END;
$$;
REVOKE ALL ON FUNCTION public.purchase_ad_boost(UUID, INTEGER, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_ad_boost(UUID, INTEGER, TEXT, TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_independent_boost_fields()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND current_user NOT IN ('postgres', 'service_role') AND NOT public.is_admin()
     AND (NEW.premium_until IS DISTINCT FROM OLD.premium_until OR NEW.vetrina_until IS DISTINCT FROM OLD.vetrina_until)
  THEN RAISE EXCEPTION 'Non puoi modificare le scadenze delle promozioni' USING ERRCODE = '42501'; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_independent_boost_fields ON public.ads;
CREATE TRIGGER protect_independent_boost_fields BEFORE UPDATE ON public.ads
FOR EACH ROW EXECUTE FUNCTION public.protect_independent_boost_fields();

CREATE OR REPLACE FUNCTION public.enforce_ad_photo_limits()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  v_photo_count INTEGER := cardinality(COALESCE(NEW.images, ARRAY[]::TEXT[]));
  v_active BOOLEAN;
BEGIN
  IF v_photo_count = 0 AND NULLIF(BTRIM(COALESCE(NEW.image, '')), '') IS NOT NULL THEN v_photo_count := 1; END IF;
  IF v_photo_count > 5 THEN RAISE EXCEPTION 'Un annuncio può contenere al massimo 5 foto' USING ERRCODE = '22023'; END IF;
  IF TG_OP = 'INSERT' THEN
    IF v_photo_count > 1 THEN RAISE EXCEPTION 'Pubblica prima l''annuncio con una foto, poi sponsorizzalo' USING ERRCODE = '22023'; END IF;
    RETURN NEW;
  END IF;
  IF NEW.images IS NOT DISTINCT FROM OLD.images AND NEW.image IS NOT DISTINCT FROM OLD.image THEN RETURN NEW; END IF;
  v_active := COALESCE(NEW.premium_until > NOW(), FALSE)
    OR COALESCE(NEW.vetrina_scheduled_at <= NOW() AND NEW.vetrina_until > NOW(), FALSE);
  IF v_photo_count > 1 AND NOT v_active THEN RAISE EXCEPTION 'Sponsorizza questo annuncio per aggiungere fino a 5 foto' USING ERRCODE = '42501'; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_boosts()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_changed INTEGER;
BEGIN
  IF current_user NOT IN ('postgres', 'service_role') AND COALESCE(auth.jwt()->>'role', '') <> 'service_role' AND NOT public.is_admin()
  THEN RAISE EXCEPTION 'Non autorizzato' USING ERRCODE = '42501'; END IF;

  UPDATE public.ads
  SET is_premium = COALESCE(premium_until > NOW(), FALSE),
      is_sponsored = COALESCE(vetrina_scheduled_at <= NOW() AND vetrina_until > NOW(), FALSE),
      is_boosted = COALESCE(premium_until > NOW(), FALSE) OR COALESCE(vetrina_scheduled_at <= NOW() AND vetrina_until > NOW(), FALSE),
      boosted_until = CASE
        WHEN COALESCE(premium_until > NOW(), FALSE) OR COALESCE(vetrina_until > NOW(), FALSE)
        THEN GREATEST(COALESCE(premium_until, '-infinity'::timestamptz), COALESCE(vetrina_until, '-infinity'::timestamptz))
        ELSE NULL
      END,
      updated_at = NOW()
  WHERE is_premium IS DISTINCT FROM COALESCE(premium_until > NOW(), FALSE)
     OR is_sponsored IS DISTINCT FROM COALESCE(vetrina_scheduled_at <= NOW() AND vetrina_until > NOW(), FALSE)
     OR (boosted_until IS NOT NULL AND boosted_until <= NOW());
  GET DIAGNOSTICS v_changed = ROW_COUNT;
  RETURN v_changed;
END;
$$;
REVOKE ALL ON FUNCTION public.expire_boosts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_boosts() TO service_role;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-ad-boosts') THEN PERFORM cron.unschedule('expire-ad-boosts'); END IF;
END $$;
SELECT cron.schedule('expire-ad-boosts', '*/5 * * * *', 'SELECT public.expire_boosts();');
