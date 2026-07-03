-- ============================================
-- Incontri di Bakeka - Schema Supabase
-- Esegui questo script nel SQL Editor di Supabase
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Roma',
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
  is_verified BOOLEAN DEFAULT FALSE,
  rating NUMERIC DEFAULT 5,
  review_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. REPORTS TABLE
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
-- 4. REVIEWS TABLE (per sistema recensioni)
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
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ads_category ON ads(category);
CREATE INDEX IF NOT EXISTS idx_ads_city ON ads(city);
CREATE INDEX IF NOT EXISTS idx_ads_premium ON ads(is_premium);
CREATE INDEX IF NOT EXISTS idx_ads_sponsored ON ads(is_sponsored);
CREATE INDEX IF NOT EXISTS idx_ads_created ON ads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_user ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_pending ON reports(status) WHERE status = 'pending';

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Chiunque puo vedere i profili (nome, avatar, verificato)
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);

-- Utente puo modificare solo il proprio profilo
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Utente puo inserire solo il proprio profilo
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES - ADS
-- ============================================
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Chiunque puo vedere annunci attivi
CREATE POLICY "ads_select_all" ON ads FOR SELECT USING (is_active = true OR auth.uid() = user_id);

-- Utente autenticato puo creare propri annunci
CREATE POLICY "ads_insert_own" ON ads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Utente puo modificare solo propri annunci (non is_premium/is_sponsored che richiedono admin)
CREATE POLICY "ads_update_own" ON ads FOR UPDATE USING (auth.uid() = user_id);

-- Utente puo eliminare solo propri annunci
CREATE POLICY "ads_delete_own" ON ads FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - REPORTS
-- ============================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Chiunque autenticato puo creare segnalazioni
CREATE POLICY "reports_insert_auth" ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Solo admin puo vedere tutte le segnalazioni
-- (policy per admin via email check o is_admin in profiles)
CREATE POLICY "reports_select_admin" ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Solo admin puo aggiornare segnalazioni
CREATE POLICY "reports_update_admin" ON reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================
-- RLS POLICIES - REVIEWS
-- ============================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Chiunque puo vedere le recensioni
CREATE POLICY "reviews_select_all" ON reviews FOR SELECT USING (true);

-- Utente autenticato puo lasciare recensioni
CREATE POLICY "reviews_insert_auth" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Utente puo eliminare solo proprie recensioni
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - AD_CONTACTS
-- ============================================
ALTER TABLE ad_contacts ENABLE ROW LEVEL SECURITY;

-- Utente autenticato puo registrare contatti
CREATE POLICY "ad_contacts_insert_auth" ON ad_contacts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Solo l'utente stesso puo vedere i propri contatti
CREATE POLICY "ad_contacts_select_own" ON ad_contacts FOR SELECT USING (auth.uid() = user_id);

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

DROP TRIGGER IF EXISTS profiles_updated ON profiles;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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
-- IMPOSTA ADMIN
-- Sostituisci l'email con la tua
-- ============================================
-- Esegui dopo la prima registrazione:
-- UPDATE profiles SET is_admin = true WHERE email = 'walterzannoni90@outlook.it';

-- ============================================
-- STORAGE BUCKET per upload foto
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: chiunque autenticato puo uploadare
CREATE POLICY "ads_storage_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ads' AND auth.uid() IS NOT NULL);

-- Policy: chiunque puo vedere le foto
CREATE POLICY "ads_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'ads');

-- Policy: solo il proprietario puo eliminare
CREATE POLICY "ads_storage_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'ads' AND owner = auth.uid());
