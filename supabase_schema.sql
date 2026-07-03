-- ============================================
-- Incontri di Bakeka V2 - Schema Supabase
-- Script idempotente: sicuro da rieseguire piu volte.
-- Esegui questo script nel SQL Editor di Supabase.
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  whatsapp TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  credits INTEGER DEFAULT 20,
  -- NUOVO: abbonamento utente ('free' | 'premium')
  subscription_tier TEXT DEFAULT 'free',
  -- NUOVO: true se l'utente ha mai acquistato crediti
  has_paid BOOLEAN DEFAULT FALSE,
  -- NUOVO: numero totale di annunci pubblicati
  ads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggiunte colonne per installazioni esistenti (idempotente)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ads_count INTEGER DEFAULT 0;

-- ============================================
-- 2. ADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Roma',
  country TEXT NOT NULL DEFAULT 'IT',
  age INTEGER,
  category TEXT NOT NULL DEFAULT 'donna-cerca-uomo',
  image TEXT,
  images TEXT[],
  price TEXT,
  phone TEXT,
  whatsapp TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE,
  is_sponsored BOOLEAN DEFAULT FALSE,
  is_boosted BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  rating NUMERIC DEFAULT 5,
  review_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  -- NUOVO: mirror di has_paid del proprietario al momento della creazione
  has_paid BOOLEAN DEFAULT FALSE,
  -- NUOVO: tipo di boost attivo ('premium' | 'sponsored')
  boost_type TEXT DEFAULT NULL,
  -- NUOVO: inizio boost
  boost_start_at TIMESTAMPTZ DEFAULT NULL,
  -- NUOVO: scadenza boost
  boost_end_at TIMESTAMPTZ DEFAULT NULL,
  -- NUOVO: inizio programmazione vetrina sponsorizzata
  schedule_start_at TIMESTAMPTZ DEFAULT NULL,
  -- NUOVO: fine programmazione vetrina sponsorizzata
  schedule_end_at TIMESTAMPTZ DEFAULT NULL,
  -- NUOVO: campi dettaglio profilo annuncio
  hair_color TEXT,
  body_type TEXT,
  ethnicity TEXT,
  services TEXT,
  availability_hours TEXT,
  height INTEGER,
  weight INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggiunte colonne per installazioni esistenti (idempotente)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'IT';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS boost_type TEXT DEFAULT NULL;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS boost_start_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS boost_end_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS schedule_start_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS schedule_end_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS hair_color TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS body_type TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS services TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS availability_hours TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS weight INTEGER;

-- ============================================
-- 3. REPORTS TABLE (vecchia tabella segnalazioni)
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ad_title TEXT,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. REVIEWS TABLE (sistema recensioni)
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. AD_CONTACTS TABLE (traccia contatti WhatsApp)
-- ============================================
CREATE TABLE IF NOT EXISTS ad_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  contact_type TEXT DEFAULT 'whatsapp',
  contacted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. AD_BOOSTS TABLE (acquisto boost/visibilita)
-- ============================================
CREATE TABLE IF NOT EXISTS ad_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- tipo di boost: 'premium', 'sponsored_1d', 'sponsored_3d', 'sponsored_7d'
  type TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  start_at TIMESTAMPTZ DEFAULT NOW(),
  end_at TIMESTAMPTZ NOT NULL,
  credits_used INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. TRANSACTIONS TABLE (pagamenti Stripe / crediti)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  stripe_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  -- stato: 'pending' | 'completed' | 'failed'
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. AD_REPORTS TABLE (nuove segnalazioni annunci)
-- ============================================
CREATE TABLE IF NOT EXISTS ad_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  -- stato: 'pending' | 'reviewed' | 'dismissed'
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ads_category ON ads(category);
CREATE INDEX IF NOT EXISTS idx_ads_city ON ads(city);
CREATE INDEX IF NOT EXISTS idx_ads_country ON ads(country);
CREATE INDEX IF NOT EXISTS idx_ads_premium ON ads(is_premium);
CREATE INDEX IF NOT EXISTS idx_ads_sponsored ON ads(is_sponsored);
CREATE INDEX IF NOT EXISTS idx_ads_created ON ads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_user ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_boost_type ON ads(boost_type);
CREATE INDEX IF NOT EXISTS idx_ads_boost_end ON ads(boost_end_at);
CREATE INDEX IF NOT EXISTS idx_reports_pending ON reports(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_ad_boosts_ad ON ad_boosts(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_boosts_user ON ad_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_boosts_end ON ad_boosts(end_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_ad_reports_ad ON ad_reports(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_reports_status ON ad_reports(status) WHERE status = 'pending';

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- L'utente puo vedere e modificare il proprio profilo
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admin puo vedere tutti i profili
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Utente puo modificare solo il proprio profilo
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Utente puo inserire solo il proprio profilo
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES - ADS
-- ============================================
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Chiunque puo vedere gli annunci (pubblico)
DROP POLICY IF EXISTS "ads_select_all" ON ads;
CREATE POLICY "ads_select_all" ON ads FOR SELECT USING (true);

-- Utente autenticato puo creare propri annunci
DROP POLICY IF EXISTS "ads_insert_own" ON ads;
CREATE POLICY "ads_insert_own" ON ads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Utente puo modificare solo propri annunci
DROP POLICY IF EXISTS "ads_update_own" ON ads;
CREATE POLICY "ads_update_own" ON ads FOR UPDATE
  USING (auth.uid() = user_id);

-- Utente puo eliminare solo propri annunci
DROP POLICY IF EXISTS "ads_delete_own" ON ads;
CREATE POLICY "ads_delete_own" ON ads FOR DELETE
  USING (auth.uid() = user_id);

-- Admin puo gestire tutti gli annunci
DROP POLICY IF EXISTS "ads_admin_all" ON ads;
CREATE POLICY "ads_admin_all" ON ads FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ============================================
-- RLS POLICIES - REPORTS (vecchia tabella)
-- ============================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert_auth" ON reports;
CREATE POLICY "reports_insert_auth" ON reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "reports_select_admin" ON reports;
CREATE POLICY "reports_select_admin" ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "reports_update_admin" ON reports;
CREATE POLICY "reports_update_admin" ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ============================================
-- RLS POLICIES - REVIEWS
-- ============================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
CREATE POLICY "reviews_select_all" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert_auth" ON reviews;
CREATE POLICY "reviews_insert_auth" ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - AD_CONTACTS
-- ============================================
ALTER TABLE ad_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_contacts_insert_auth" ON ad_contacts;
CREATE POLICY "ad_contacts_insert_auth" ON ad_contacts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ad_contacts_select_own" ON ad_contacts;
CREATE POLICY "ad_contacts_select_own" ON ad_contacts FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - AD_BOOSTS
-- ============================================
ALTER TABLE ad_boosts ENABLE ROW LEVEL SECURITY;

-- Utente puo vedere i propri boost
DROP POLICY IF EXISTS "ad_boosts_select_own" ON ad_boosts;
CREATE POLICY "ad_boosts_select_own" ON ad_boosts FOR SELECT
  USING (auth.uid() = user_id);

-- Admin puo vedere tutti i boost
DROP POLICY IF EXISTS "ad_boosts_select_admin" ON ad_boosts;
CREATE POLICY "ad_boosts_select_admin" ON ad_boosts FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Utente puo creare boost per i propri annunci
DROP POLICY IF EXISTS "ad_boosts_insert_own" ON ad_boosts;
CREATE POLICY "ad_boosts_insert_own" ON ad_boosts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - TRANSACTIONS
-- ============================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Utente puo vedere le proprie transazioni
DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Admin puo vedere tutte le transazioni
DROP POLICY IF EXISTS "transactions_select_admin" ON transactions;
CREATE POLICY "transactions_select_admin" ON transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ============================================
-- RLS POLICIES - AD_REPORTS
-- ============================================
ALTER TABLE ad_reports ENABLE ROW LEVEL SECURITY;

-- Utente autenticato puo segnalare annunci
DROP POLICY IF EXISTS "ad_reports_insert_auth" ON ad_reports;
CREATE POLICY "ad_reports_insert_auth" ON ad_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Admin puo vedere tutte le segnalazioni
DROP POLICY IF EXISTS "ad_reports_select_admin" ON ad_reports;
CREATE POLICY "ad_reports_select_admin" ON ad_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Admin puo aggiornare tutte le segnalazioni
DROP POLICY IF EXISTS "ad_reports_update_admin" ON ad_reports;
CREATE POLICY "ad_reports_update_admin" ON ad_reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ============================================
-- TRIGGER: Auto-crea profilo alla registrazione
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger updated_at per profiles
DROP TRIGGER IF EXISTS profiles_updated ON profiles;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger updated_at per ads
DROP TRIGGER IF EXISTS ads_updated ON ads;
CREATE TRIGGER ads_updated BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TRIGGER: Aggiorna rating annuncio dopo recensione
-- ============================================
CREATE OR REPLACE FUNCTION update_ad_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ads
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 5) FROM reviews WHERE ad_id = NEW.ad_id
    ),
    review_count = (
      SELECT COUNT(*) FROM reviews WHERE ad_id = NEW.ad_id
    )
  WHERE id = NEW.ad_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_insert ON reviews;
CREATE TRIGGER on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_ad_rating();

DROP TRIGGER IF EXISTS on_review_delete ON reviews;
CREATE TRIGGER on_review_delete
  AFTER DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_ad_rating();

-- ============================================
-- TRIGGER: Aggiorna ads_count nei profiles dopo insert/delete annuncio
-- ============================================
CREATE OR REPLACE FUNCTION update_profile_ads_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles SET ads_count = ads_count + 1 WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles SET ads_count = GREATEST(ads_count - 1, 0) WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ad_insert_count ON ads;
CREATE TRIGGER on_ad_insert_count
  AFTER INSERT ON ads
  FOR EACH ROW EXECUTE FUNCTION update_profile_ads_count();

DROP TRIGGER IF EXISTS on_ad_delete_count ON ads;
CREATE TRIGGER on_ad_delete_count
  AFTER DELETE ON ads
  FOR EACH ROW EXECUTE FUNCTION update_profile_ads_count();

-- ============================================
-- FUNZIONE: check_active_boosts()
-- Restituisce gli annunci con boost attivo (boost_end_at > now())
-- ============================================
CREATE OR REPLACE FUNCTION check_active_boosts()
RETURNS TABLE (
  ad_id UUID,
  boost_type TEXT,
  boost_start_at TIMESTAMPTZ,
  boost_end_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.boost_type,
    a.boost_start_at,
    a.boost_end_at
  FROM ads a
  WHERE a.boost_type IS NOT NULL
    AND a.boost_end_at IS NOT NULL
    AND a.boost_end_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEW: active_boosts_v
-- Vista che mostra gli annunci con boost attualmente attivo
-- ============================================
CREATE OR REPLACE VIEW active_boosts_v AS
SELECT
  a.id AS ad_id,
  a.user_id,
  a.title,
  a.boost_type,
  a.boost_start_at,
  a.boost_end_at,
  a.schedule_start_at,
  a.schedule_end_at
FROM ads a
WHERE a.boost_type IS NOT NULL
  AND a.boost_end_at IS NOT NULL
  AND a.boost_end_at > NOW();

-- ============================================
-- FUNZIONE: expire_boosts()
-- Scade automaticamente i boost passati (boost_end_at < now())
-- Imposta boost_type = NULL e flag is_premium/is_sponsored = FALSE
-- ============================================
CREATE OR REPLACE FUNCTION expire_boosts()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE ads
  SET 
    boost_type = NULL,
    boost_start_at = NULL,
    boost_end_at = NULL,
    is_premium = CASE WHEN boost_type = 'premium' THEN FALSE ELSE is_premium END,
    is_sponsored = CASE WHEN boost_type = 'sponsored' THEN FALSE ELSE is_sponsored END
  WHERE boost_type IS NOT NULL
    AND boost_end_at IS NOT NULL
    AND boost_end_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- IMPOSTA ADMIN
-- Sostituisci l'email con la tua
-- ============================================
-- Esegui dopo la prima registrazione:
-- UPDATE profiles SET is_admin = true WHERE email = 'walterzannoni90@outlook.it';

-- ============================================
-- STORAGE BUCKET per upload foto (pubblico)
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: chiunque autenticato puo uploadare nel bucket 'ads'
DROP POLICY IF EXISTS "ads_storage_upload" ON storage.objects;
CREATE POLICY "ads_storage_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ads' AND auth.uid() IS NOT NULL);

-- Policy: chiunque puo vedere le foto del bucket 'ads'
DROP POLICY IF EXISTS "ads_storage_read" ON storage.objects
CREATE POLICY "ads_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'ads');

-- Policy: solo il proprietario puo eliminare dal bucket 'ads'
DROP POLICY IF EXISTS "ads_storage_delete" ON storage.objects;
CREATE POLICY "ads_storage_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'ads' AND owner = auth.uid());

-- ============================================
-- STORAGE BUCKET per foto private/blurred (ads_private)
-- Bucket privato per foto sfocate o riservate
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('ads_private', 'ads_private', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: solo il proprietario puo leggere dal bucket 'ads_private'
DROP POLICY IF EXISTS "ads_private_storage_read" ON storage.objects;
CREATE POLICY "ads_private_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'ads_private' AND owner = auth.uid());

-- Policy: solo utenti autenticati possono uploadare nel bucket 'ads_private'
DROP POLICY IF EXISTS "ads_private_storage_upload" ON storage.objects;
CREATE POLICY "ads_private_storage_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ads_private' AND auth.uid() IS NOT NULL);

-- Policy: solo il proprietario puo eliminare dal bucket 'ads_private'
DROP POLICY IF EXISTS "ads_private_storage_delete" ON storage.objects;
CREATE POLICY "ads_private_storage_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'ads_private' AND owner = auth.uid());

-- ============================================
-- FINE SCHEMA
-- ============================================
