-- Security hardening and schema alignment for the static Supabase client.
-- This migration is idempotent and is safe to apply after the original schema.

-- ---------------------------------------------------------------------------
-- Align the migration schema with the columns used by the application.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ads_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT FALSE;

UPDATE public.profiles AS profile
SET email = auth_user.email
FROM auth.users AS auth_user
WHERE profile.id = auth_user.id
  AND COALESCE(profile.email, '') = '';

ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'IT';
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS calls_only BOOLEAN DEFAULT FALSE;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS boost_type TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS boost_start_at TIMESTAMPTZ;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS boost_end_at TIMESTAMPTZ;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS vetrina_scheduled_at TIMESTAMPTZ;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS vetrina_duration_days INTEGER;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS hair_color TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS body_type TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS services TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS availability_hours TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS weight INTEGER;

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  stripe_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ad_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_at TIMESTAMPTZ NOT NULL,
  credits_used INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ad_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_code TEXT REFERENCES public.subscription_plans(code) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.age_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  document_type TEXT DEFAULT '',
  document_image TEXT DEFAULT '',
  selfie_image TEXT DEFAULT '',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT DEFAULT '',
  reference_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ad_title TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT DEFAULT '',
  body TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS body TEXT DEFAULT '';
ALTER TABLE public.messages ALTER COLUMN body SET DEFAULT '';

UPDATE public.messages
SET content = COALESCE(NULLIF(content, ''), body, '')
WHERE COALESCE(content, '') = '';

CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_stripe_session_unique
  ON public.transactions(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ad_boosts_user ON public.ad_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_reports_status ON public.ad_reports(status);

-- ---------------------------------------------------------------------------
-- Admin checks that do not recurse through profiles RLS.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT profile.is_admin FROM public.profiles AS profile WHERE profile.id = auth.uid()),
    FALSE
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, name, avatar_url, is_verified
FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM PUBLIC;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Create profiles from Auth using trusted defaults.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    phone,
    credits,
    is_admin,
    is_verified,
    subscription_tier,
    has_paid,
    ads_count
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    20,
    FALSE,
    FALSE,
    'free',
    FALSE,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Prevent users from editing balances, roles, verification and paid flags.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND current_user NOT IN ('postgres', 'service_role')
     AND NOT public.is_admin()
     AND (
       NEW.id IS DISTINCT FROM OLD.id OR
       NEW.email IS DISTINCT FROM OLD.email OR
       NEW.is_admin IS DISTINCT FROM OLD.is_admin OR
       NEW.is_verified IS DISTINCT FROM OLD.is_verified OR
       NEW.is_premium IS DISTINCT FROM OLD.is_premium OR
       NEW.credits IS DISTINCT FROM OLD.credits OR
       NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier OR
       NEW.has_paid IS DISTINCT FROM OLD.has_paid OR
       NEW.ads_count IS DISTINCT FROM OLD.ads_count OR
       NEW.auto_renewal IS DISTINCT FROM OLD.auto_renewal OR
       NEW.created_at IS DISTINCT FROM OLD.created_at
     )
  THEN
    RAISE EXCEPTION 'Non puoi modificare i campi riservati del profilo'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER protect_profile_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();

CREATE OR REPLACE FUNCTION public.protect_ad_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_has_paid BOOLEAN;
  v_recent_ads INTEGER;
BEGIN
  IF auth.uid() IS NULL OR current_user IN ('postgres', 'service_role') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Serialize publications for this user so concurrent requests cannot bypass
    -- the daily limit.
    PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::TEXT, 0));
    SELECT profile.has_paid
    INTO v_has_paid
    FROM public.profiles AS profile
    WHERE profile.id = auth.uid();

    SELECT COUNT(*)
    INTO v_recent_ads
    FROM public.ads AS advertisement
    WHERE advertisement.user_id = auth.uid()
      AND advertisement.created_at >= NOW() - INTERVAL '24 hours';

    IF v_recent_ads >= CASE WHEN COALESCE(v_has_paid, FALSE) THEN 2 ELSE 1 END THEN
      RAISE EXCEPTION 'Limite giornaliero di annunci raggiunto'
        USING ERRCODE = 'P0001';
    END IF;

    NEW.user_id := auth.uid();
    NEW.profile_id := auth.uid();
    NEW.has_paid := COALESCE(
      (SELECT profile.has_paid FROM public.profiles AS profile WHERE profile.id = auth.uid()),
      FALSE
    );
    NEW.is_premium := FALSE;
    NEW.is_sponsored := FALSE;
    NEW.is_boosted := FALSE;
    NEW.is_verified := FALSE;
    NEW.rating := 5;
    NEW.review_count := 0;
    NEW.views := 0;
    NEW.boost_type := NULL;
    NEW.boost_start_at := NULL;
    NEW.boost_end_at := NULL;
    NEW.boosted_until := NULL;
    NEW.vetrina_scheduled_at := NULL;
    NEW.vetrina_duration_days := NULL;
    NEW.created_at := NOW();
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR
     NEW.profile_id IS DISTINCT FROM OLD.profile_id OR
     NEW.has_paid IS DISTINCT FROM OLD.has_paid OR
     NEW.is_premium IS DISTINCT FROM OLD.is_premium OR
     NEW.is_sponsored IS DISTINCT FROM OLD.is_sponsored OR
     NEW.is_boosted IS DISTINCT FROM OLD.is_boosted OR
     NEW.is_verified IS DISTINCT FROM OLD.is_verified OR
     NEW.rating IS DISTINCT FROM OLD.rating OR
     NEW.review_count IS DISTINCT FROM OLD.review_count OR
     NEW.views IS DISTINCT FROM OLD.views OR
     NEW.boost_type IS DISTINCT FROM OLD.boost_type OR
     NEW.boost_start_at IS DISTINCT FROM OLD.boost_start_at OR
     NEW.boost_end_at IS DISTINCT FROM OLD.boost_end_at OR
     NEW.boosted_until IS DISTINCT FROM OLD.boosted_until OR
     NEW.vetrina_scheduled_at IS DISTINCT FROM OLD.vetrina_scheduled_at OR
     NEW.vetrina_duration_days IS DISTINCT FROM OLD.vetrina_duration_days OR
     NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Non puoi modificare i campi riservati dell''annuncio'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_ad_privileged_fields ON public.ads;
CREATE TRIGGER protect_ad_privileged_fields
  BEFORE INSERT OR UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.protect_ad_privileged_fields();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS ads_set_updated_at ON public.ads;
CREATE TRIGGER ads_set_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.update_profile_ads_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET ads_count = COALESCE(ads_count, 0) + 1
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;

  UPDATE public.profiles
  SET ads_count = GREATEST(COALESCE(ads_count, 0) - 1, 0)
  WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_ad_insert_count ON public.ads;
CREATE TRIGGER on_ad_insert_count
  AFTER INSERT ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_ads_count();
DROP TRIGGER IF EXISTS on_ad_delete_count ON public.ads;
CREATE TRIGGER on_ad_delete_count
  AFTER DELETE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_ads_count();

CREATE OR REPLACE FUNCTION public.protect_conversation_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR current_user IN ('postgres', 'service_role') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.buyer_id := auth.uid();
    NEW.last_message := COALESCE(NULLIF(NEW.last_message, ''), 'Conversazione iniziata');
    NEW.last_message_at := NOW();
    NEW.created_at := NOW();
    RETURN NEW;
  END IF;

  IF NEW.ad_id IS DISTINCT FROM OLD.ad_id OR
     NEW.buyer_id IS DISTINCT FROM OLD.buyer_id OR
     NEW.seller_id IS DISTINCT FROM OLD.seller_id OR
     NEW.ad_title IS DISTINCT FROM OLD.ad_title OR
     NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Non puoi cambiare i partecipanti della conversazione'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_conversation_fields ON public.conversations;
CREATE TRIGGER protect_conversation_fields
  BEFORE INSERT OR UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.protect_conversation_fields();

CREATE OR REPLACE FUNCTION public.touch_conversation_from_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message = COALESCE(NULLIF(NEW.content, ''), NEW.body, ''),
      last_message_at = COALESCE(NEW.created_at, NOW())
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_conversation_from_message ON public.messages;
CREATE TRIGGER touch_conversation_from_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_from_message();

-- ---------------------------------------------------------------------------
-- Canonical RLS policies.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profili pubblici" ON public.profiles;
DROP POLICY IF EXISTS "Proprio profilo insert" ON public.profiles;
DROP POLICY IF EXISTS "Proprio profilo update" ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_secure ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_secure ON public.profiles;
DROP POLICY IF EXISTS profiles_update_secure ON public.profiles;

CREATE POLICY profiles_select_secure ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY profiles_insert_secure ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id AND
    COALESCE(is_admin, FALSE) = FALSE AND
    COALESCE(is_verified, FALSE) = FALSE AND
    COALESCE(is_premium, FALSE) = FALSE AND
    COALESCE(credits, 20) = 20 AND
    COALESCE(subscription_tier, 'free') = 'free' AND
    COALESCE(has_paid, FALSE) = FALSE AND
    COALESCE(ads_count, 0) = 0 AND
    COALESCE(auto_renewal, FALSE) = FALSE
  );
CREATE POLICY profiles_update_secure ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Annunci pubblici" ON public.ads;
DROP POLICY IF EXISTS "Propri annunci insert" ON public.ads;
DROP POLICY IF EXISTS "Propri annunci update" ON public.ads;
DROP POLICY IF EXISTS "Propri annunci delete" ON public.ads;
DROP POLICY IF EXISTS ads_select_all ON public.ads;
DROP POLICY IF EXISTS ads_insert_own ON public.ads;
DROP POLICY IF EXISTS ads_update_own ON public.ads;
DROP POLICY IF EXISTS ads_delete_own ON public.ads;
DROP POLICY IF EXISTS ads_admin_all ON public.ads;
DROP POLICY IF EXISTS ads_select_secure ON public.ads;
DROP POLICY IF EXISTS ads_insert_secure ON public.ads;
DROP POLICY IF EXISTS ads_update_secure ON public.ads;
DROP POLICY IF EXISTS ads_delete_secure ON public.ads;

CREATE POLICY ads_select_secure ON public.ads
  FOR SELECT USING (is_active = TRUE OR auth.uid() = user_id OR public.is_admin());
CREATE POLICY ads_insert_secure ON public.ads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ads_update_secure ON public.ads
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY ads_delete_secure ON public.ads
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS transactions_select_own ON public.transactions;
DROP POLICY IF EXISTS transactions_select_admin ON public.transactions;
DROP POLICY IF EXISTS transactions_select_secure ON public.transactions;
CREATE POLICY transactions_select_secure ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS ad_boosts_select_own ON public.ad_boosts;
DROP POLICY IF EXISTS ad_boosts_select_admin ON public.ad_boosts;
DROP POLICY IF EXISTS ad_boosts_insert_own ON public.ad_boosts;
DROP POLICY IF EXISTS ad_boosts_select_secure ON public.ad_boosts;
CREATE POLICY ad_boosts_select_secure ON public.ad_boosts
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS ad_reports_insert_auth ON public.ad_reports;
DROP POLICY IF EXISTS ad_reports_select_admin ON public.ad_reports;
DROP POLICY IF EXISTS ad_reports_update_admin ON public.ad_reports;
DROP POLICY IF EXISTS ad_reports_insert_secure ON public.ad_reports;
DROP POLICY IF EXISTS ad_reports_select_secure ON public.ad_reports;
DROP POLICY IF EXISTS ad_reports_update_secure ON public.ad_reports;
CREATE POLICY ad_reports_insert_secure ON public.ad_reports
  FOR INSERT WITH CHECK (
    auth.uid() = reporter_id AND
    status = 'pending' AND
    char_length(reason) BETWEEN 3 AND 1000
  );
CREATE POLICY ad_reports_select_secure ON public.ad_reports
  FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin());
CREATE POLICY ad_reports_update_secure ON public.ad_reports
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- User subscriptions and age checks must never be self-approved.
DROP POLICY IF EXISTS "Subscriptions view" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Subscriptions insert" ON public.user_subscriptions;
DROP POLICY IF EXISTS user_subscriptions_select_secure ON public.user_subscriptions;
CREATE POLICY user_subscriptions_select_secure ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Age verifications view" ON public.age_verifications;
DROP POLICY IF EXISTS "Age verifications insert" ON public.age_verifications;
DROP POLICY IF EXISTS age_verifications_select_secure ON public.age_verifications;
DROP POLICY IF EXISTS age_verifications_insert_pending ON public.age_verifications;
CREATE POLICY age_verifications_select_secure ON public.age_verifications
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY age_verifications_insert_pending ON public.age_verifications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending' AND
    verified_at IS NULL
  );

-- Ledger rows are server-owned; users can only read their own rows.
DROP POLICY IF EXISTS "Credit tx view" ON public.credit_transactions;
DROP POLICY IF EXISTS "Credit tx insert" ON public.credit_transactions;
DROP POLICY IF EXISTS credit_transactions_select_secure ON public.credit_transactions;
CREATE POLICY credit_transactions_select_secure ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Add-ons and scheduled boosts are purchased through trusted server logic only.
DROP POLICY IF EXISTS "Ad addons view" ON public.ad_addons;
DROP POLICY IF EXISTS "Ad addons insert" ON public.ad_addons;
DROP POLICY IF EXISTS ad_addons_select_secure ON public.ad_addons;
CREATE POLICY ad_addons_select_secure ON public.ad_addons
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Boost schedule" ON public.boost_schedule;

DROP POLICY IF EXISTS messages_select ON public.messages;
DROP POLICY IF EXISTS messages_insert ON public.messages;
DROP POLICY IF EXISTS "Messages view" ON public.messages;
DROP POLICY IF EXISTS "Messages insert" ON public.messages;
DROP POLICY IF EXISTS messages_select_secure ON public.messages;
DROP POLICY IF EXISTS messages_insert_secure ON public.messages;
CREATE POLICY messages_select_secure ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.conversations AS conversation
      WHERE conversation.id = conversation_id
        AND auth.uid() IN (conversation.buyer_id, conversation.seller_id)
    ) OR
    (conversation_id IS NULL AND auth.uid() IN (sender_id, receiver_id))
  );
CREATE POLICY messages_insert_secure ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    char_length(COALESCE(content, '')) BETWEEN 1 AND 2000 AND
    EXISTS (
      SELECT 1
      FROM public.conversations AS conversation
      WHERE conversation.id = conversation_id
        AND auth.uid() IN (conversation.buyer_id, conversation.seller_id)
    )
  );

DROP POLICY IF EXISTS conversations_select ON public.conversations;
DROP POLICY IF EXISTS conversations_insert ON public.conversations;
DROP POLICY IF EXISTS conversations_select_secure ON public.conversations;
DROP POLICY IF EXISTS conversations_insert_secure ON public.conversations;
DROP POLICY IF EXISTS conversations_update_secure ON public.conversations;
CREATE POLICY conversations_select_secure ON public.conversations
  FOR SELECT USING (auth.uid() IN (buyer_id, seller_id) OR public.is_admin());
CREATE POLICY conversations_insert_secure ON public.conversations
  FOR INSERT WITH CHECK (
    buyer_id = auth.uid() AND
    buyer_id <> seller_id AND
    EXISTS (
      SELECT 1 FROM public.ads AS advertisement
      WHERE advertisement.id = ad_id
        AND advertisement.user_id = seller_id
        AND advertisement.is_active = TRUE
    )
  );
CREATE POLICY conversations_update_secure ON public.conversations
  FOR UPDATE
  USING (auth.uid() IN (buyer_id, seller_id) OR public.is_admin())
  WITH CHECK (auth.uid() IN (buyer_id, seller_id) OR public.is_admin());

-- ---------------------------------------------------------------------------
-- Atomic boost purchase. Prices are controlled by the database, not the UI.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purchase_ad_boost(
  p_ad_id UUID,
  p_duration_days INTEGER,
  p_type TEXT,
  p_start_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  ad_id UUID,
  credits_used INTEGER,
  remaining_credits INTEGER,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ
)
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
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non autenticato' USING ERRCODE = '42501';
  END IF;

  v_cost := CASE
    WHEN p_type = 'vetrina' AND p_duration_days = 1 THEN 10
    WHEN p_type = 'vetrina' AND p_duration_days = 3 THEN 25
    WHEN p_type = 'vetrina' AND p_duration_days = 7 THEN 50
    WHEN p_type = 'premium' AND p_duration_days = 30 THEN 10
    ELSE NULL
  END;

  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'Tipo o durata boost non validi' USING ERRCODE = '22023';
  END IF;

  SELECT advertisement.user_id
  INTO v_owner
  FROM public.ads AS advertisement
  WHERE advertisement.id = p_ad_id
  FOR UPDATE;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Annuncio non trovato' USING ERRCODE = 'P0002';
  END IF;
  IF v_owner <> v_user_id THEN
    RAISE EXCEPTION 'Non autorizzato' USING ERRCODE = '42501';
  END IF;

  SELECT profile.credits
  INTO v_balance
  FROM public.profiles AS profile
  WHERE profile.id = v_user_id
  FOR UPDATE;

  IF COALESCE(v_balance, 0) < v_cost THEN
    RAISE EXCEPTION 'Crediti insufficienti' USING ERRCODE = 'P0001';
  END IF;

  v_start := GREATEST(COALESCE(p_start_at, NOW()), NOW());
  IF v_start > NOW() + INTERVAL '90 days' THEN
    RAISE EXCEPTION 'La data di inizio è troppo lontana' USING ERRCODE = '22023';
  END IF;
  v_end := v_start + make_interval(days => p_duration_days);

  UPDATE public.profiles
  SET credits = credits - v_cost,
      updated_at = NOW()
  WHERE id = v_user_id;

  UPDATE public.ads
  SET is_premium = CASE WHEN p_type = 'premium' THEN TRUE ELSE is_premium END,
      is_sponsored = CASE WHEN p_type = 'vetrina' THEN v_start <= NOW() ELSE is_sponsored END,
      is_boosted = TRUE,
      boost_type = p_type,
      boost_start_at = v_start,
      boost_end_at = v_end,
      boosted_until = v_end,
      vetrina_scheduled_at = CASE WHEN p_type = 'vetrina' THEN v_start ELSE vetrina_scheduled_at END,
      vetrina_duration_days = CASE WHEN p_type = 'vetrina' THEN p_duration_days ELSE vetrina_duration_days END,
      updated_at = NOW()
  WHERE id = p_ad_id;

  INSERT INTO public.ad_boosts (
    ad_id,
    user_id,
    type,
    duration_days,
    start_at,
    end_at,
    credits_used
  )
  VALUES (
    p_ad_id,
    v_user_id,
    p_type,
    p_duration_days,
    v_start,
    v_end,
    v_cost
  );

  RETURN QUERY SELECT p_ad_id, v_cost, v_balance - v_cost, v_start, v_end;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_ad_boost(UUID, INTEGER, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_ad_boost(UUID, INTEGER, TEXT, TIMESTAMPTZ)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- Stripe completion is atomic and idempotent, so webhook retries are safe.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_stripe_transaction(
  p_session_id TEXT,
  p_payment_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  processed BOOLEAN,
  user_id UUID,
  credits_added INTEGER,
  total_credits INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_transaction public.transactions%ROWTYPE;
  v_total INTEGER;
BEGIN
  SELECT transaction_row.*
  INTO v_transaction
  FROM public.transactions AS transaction_row
  WHERE transaction_row.stripe_session_id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transazione Stripe non trovata' USING ERRCODE = 'P0002';
  END IF;

  IF v_transaction.status = 'completed' THEN
    SELECT profile.credits INTO v_total
    FROM public.profiles AS profile
    WHERE profile.id = v_transaction.user_id;

    RETURN QUERY
      SELECT FALSE, v_transaction.user_id, 0, COALESCE(v_total, 0);
    RETURN;
  END IF;

  IF v_transaction.status <> 'pending' THEN
    RAISE EXCEPTION 'Stato transazione non valido: %', v_transaction.status
      USING ERRCODE = '22023';
  END IF;

  IF v_transaction.credits NOT IN (10, 30, 70, 150) THEN
    RAISE EXCEPTION 'Quantità crediti non valida' USING ERRCODE = '22023';
  END IF;

  UPDATE public.transactions
  SET status = 'completed',
      stripe_payment_id = COALESCE(p_payment_id, stripe_payment_id)
  WHERE id = v_transaction.id;

  UPDATE public.profiles
  SET credits = COALESCE(credits, 0) + v_transaction.credits,
      has_paid = TRUE,
      updated_at = NOW()
  WHERE id = v_transaction.user_id
  RETURNING credits INTO v_total;

  IF v_total IS NULL THEN
    RAISE EXCEPTION 'Profilo transazione non trovato' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY
    SELECT TRUE, v_transaction.user_id, v_transaction.credits, v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_stripe_transaction(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_stripe_transaction(TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_stripe_transaction(TEXT, TEXT) TO service_role;

-- Legacy RPCs are kept for compatibility but are no longer public backdoors.
CREATE OR REPLACE FUNCTION public.increment_credits(p_user_id UUID, p_credits INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un amministratore può aggiungere crediti'
      USING ERRCODE = '42501';
  END IF;
  IF p_credits <= 0 OR p_credits > 10000 THEN
    RAISE EXCEPTION 'Quantità crediti non valida' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
  SET credits = COALESCE(credits, 0) + p_credits,
      has_paid = TRUE,
      updated_at = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profilo non trovato' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_credits(UUID, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_credits(UUID, INTEGER)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.expire_boosts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_expired INTEGER;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Non autorizzato' USING ERRCODE = '42501';
  END IF;

  UPDATE public.ads
  SET boost_type = NULL,
      boost_start_at = NULL,
      boost_end_at = NULL,
      boosted_until = NULL,
      is_boosted = FALSE,
      is_premium = FALSE,
      is_sponsored = FALSE,
      updated_at = NOW()
  WHERE COALESCE(boost_end_at, boosted_until) < NOW();

  GET DIAGNOSTICS v_expired = ROW_COUNT;
  RETURN v_expired;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_boosts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.expire_boosts() FROM anon;
GRANT EXECUTE ON FUNCTION public.expire_boosts() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Storage paths must be owned by the authenticated user and image-only.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS ads_storage_upload ON storage.objects;
DROP POLICY IF EXISTS ads_storage_read ON storage.objects;
DROP POLICY IF EXISTS ads_storage_delete ON storage.objects;

CREATE POLICY ads_storage_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ads' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT AND
    LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );
CREATE POLICY ads_storage_read ON storage.objects
  FOR SELECT USING (bucket_id = 'ads');
CREATE POLICY ads_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'ads' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );
