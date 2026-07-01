-- ============================================================
-- INCONTRI DI BAKEKA — SCHEMA COMPLETO (bakecaincontrii style)
-- Esegui nel Supabase SQL Editor: https://supabase.com/dashboard/project/rdqsmfgpbuswzilgbjyr/sql/new
-- ============================================================

-- TABELLA PROFILI
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  surname TEXT DEFAULT '',
  email TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  phone TEXT DEFAULT '',
  city TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  birth_date DATE,
  avatar_url TEXT DEFAULT '',
  is_verified BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  credits INT DEFAULT 0,
  auto_renewal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELLA ANNUNCI
CREATE TABLE IF NOT EXISTS ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  city TEXT DEFAULT '',
  age INT DEFAULT 0,
  gender TEXT DEFAULT '',
  looking_for TEXT DEFAULT '',
  image TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  price TEXT DEFAULT '',
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  has_video BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_sponsored BOOLEAN DEFAULT false,
  sponsor_plan TEXT DEFAULT '',
  sponsor_expires_at TIMESTAMPTZ,
  boost_count INT DEFAULT 0,
  boost_available INT DEFAULT 0,
  photo_classification TEXT DEFAULT 'safe',
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADDONS / EXTRA (tipo SuperTop, SuperHot, Highlight, etc.)
CREATE TABLE IF NOT EXISTS addons (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_credits INT DEFAULT 0,
  duration_days INT DEFAULT 0,
  icon TEXT DEFAULT '',
  color TEXT DEFAULT '#8b5cf6',
  sort_order INT DEFAULT 0
);

-- ADDONS ACQUISTATI PER SINGOLO ANNUNCIO
CREATE TABLE IF NOT EXISTS ad_addons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  addon_code TEXT REFERENCES addons(code) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);

-- CREDIT TRANSACTIONS
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase','spend','bonus','refund')),
  description TEXT DEFAULT '',
  reference_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SAVED CONTACTS (rubrica)
CREATE TABLE IF NOT EXISTS saved_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ad_id)
);

-- BOOST SCHEDULE
CREATE TABLE IF NOT EXISTS boost_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  is_processed BOOLEAN DEFAULT false
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_ads_category ON ads(category);
CREATE INDEX IF NOT EXISTS idx_ads_city ON ads(city);
CREATE INDEX IF NOT EXISTS idx_ads_premium ON ads(is_premium);
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active);
CREATE INDEX IF NOT EXISTS idx_ads_created ON ads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_addons_ad ON ad_addons(ad_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_contacts_user ON saved_contacts(user_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_schedule ENABLE ROW LEVEL SECURITY;

-- POLICY PROFILES
DROP POLICY IF EXISTS "Profili pubblici" ON profiles CASCADE;
CREATE POLICY "Profili pubblici" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Proprio profilo insert" ON profiles CASCADE;
CREATE POLICY "Proprio profilo insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Proprio profilo update" ON profiles CASCADE;
CREATE POLICY "Proprio profilo update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- POLICY ADS
DROP POLICY IF EXISTS "Annunci pubblici" ON ads CASCADE;
CREATE POLICY "Annunci pubblici" ON ads FOR SELECT USING (is_active = true OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Propri annunci insert" ON ads CASCADE;
CREATE POLICY "Propri annunci insert" ON ads FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Propri annunci update" ON ads CASCADE;
CREATE POLICY "Propri annunci update" ON ads FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Propri annunci delete" ON ads CASCADE;
CREATE POLICY "Propri annunci delete" ON ads FOR DELETE USING (auth.uid() = user_id);

-- POLICY ADDONS (pubblici)
DROP POLICY IF EXISTS "Addons pubblici" ON addons CASCADE;
CREATE POLICY "Addons pubblici" ON addons FOR SELECT USING (true);

-- POLICY AD_ADDONS
DROP POLICY IF EXISTS "Ad addons view" ON ad_addons CASCADE;
CREATE POLICY "Ad addons view" ON ad_addons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Ad addons insert" ON ad_addons CASCADE;
CREATE POLICY "Ad addons insert" ON ad_addons FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POLICY CREDIT TRANSACTIONS
DROP POLICY IF EXISTS "Credit tx view" ON credit_transactions CASCADE;
CREATE POLICY "Credit tx view" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Credit tx insert" ON credit_transactions CASCADE;
CREATE POLICY "Credit tx insert" ON credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POLICY SAVED CONTACTS
DROP POLICY IF EXISTS "Saved contacts view" ON saved_contacts CASCADE;
CREATE POLICY "Saved contacts view" ON saved_contacts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Saved contacts insert" ON saved_contacts CASCADE;
CREATE POLICY "Saved contacts insert" ON saved_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Saved contacts delete" ON saved_contacts CASCADE;
CREATE POLICY "Saved contacts delete" ON saved_contacts FOR DELETE USING (auth.uid() = user_id);

-- POLICY BOOST SCHEDULE
DROP POLICY IF EXISTS "Boost schedule" ON boost_schedule CASCADE;
CREATE POLICY "Boost schedule" ON boost_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Boost schedule view" ON boost_schedule FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '',
  class TEXT DEFAULT '',
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#8b5cf6',
  sort_order INT DEFAULT 0
);

-- ============================================================
-- CITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS cities (
  name TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  region TEXT DEFAULT ''
);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO categories (slug, name, icon, class, description, color, sort_order) VALUES
  ('donna-cerca-uomo', 'Donna Cerca Uomo', 'fa-female', 'womenseekmen', 'Escort, ragazze squillo e accompagnatrici.', '#ff2d55', 1),
  ('uomo-cerca-donna', 'Uomo Cerca Donna', 'fa-male', 'menseekwomen', 'Accompagnatori e uomini per donne.', '#007aff', 2),
  ('uomo-cerca-uomo', 'Uomo Cerca Uomo', 'fa-venus-mars', 'menseekmen', 'Incontri gay. Escort e accompagnatori maschi.', '#ff9500', 3),
  ('donna-cerca-donna', 'Donna Cerca Donna', 'fa-venus', 'womenseekwomen', 'Donne che amano altre donne.', '#ff3b30', 4),
  ('coppie', 'Coppie', 'fa-heart', 'couples', 'Coppie per avventure swingers.', '#af52de', 5),
  ('cerco-amici', 'Cerco Amici', 'fa-handshake', 'seekfriends', 'Amicizie vere nella tua città.', '#34c759', 6),
  ('anima-gemella', 'Cerco Anima Gemella', 'fa-dove', 'seeksoulmate', 'Trova l\'altra metà.', '#ff6482', 7),
  ('trans', 'Trans', 'fa-transgender', 'trans', 'Incontri trans e travestiti.', '#e84393', 8)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO cities (name, slug, region) VALUES
  ('Napoli','napoli','Campania'),('Roma','roma','Lazio'),('Milano','milano','Lombardia'),
  ('Torino','torino','Piemonte'),('Firenze','firenze','Toscana'),('Bologna','bologna','Emilia-Romagna'),
  ('Venezia','venezia','Veneto'),('Palermo','palermo','Sicilia'),('Genova','genova','Liguria'),
  ('Bari','bari','Puglia'),('Catania','catania','Sicilia'),('Verona','verona','Veneto'),
  ('Pisa','pisa','Toscana'),('Lecce','lecce','Puglia'),('Brescia','brescia','Lombardia'),
  ('Parma','parma','Emilia-Romagna'),('Modena','modena','Emilia-Romagna'),('Salerno','salerno','Campania'),
  ('Bergamo','bergamo','Lombardia'),('Cagliari','cagliari','Sardegna')
ON CONFLICT (name) DO NOTHING;

-- ADDONS (sistema a crediti)
INSERT INTO addons (code, name, description, price_credits, duration_days, icon, color, sort_order) VALUES
  ('supertop', 'SuperTop ⭐', 'Vetrina premium esclusiva — meno annunci, massima visibilità!', 50, 7, 'fa-crown', '#f59e0b', 1),
  ('superhot', 'SuperHot 🔥', 'Annuncio in evidenza con sfondo colorato', 30, 3, 'fa-fire', '#ff2d55', 2),
  ('highlight', 'Highlight 💛', 'Sfondo dorato per distinguerti', 20, 3, 'fa-highlighter', '#fbbf24', 3),
  ('label_new', 'Etichetta NOVITÀ 🆕', 'Mostra che sei nuovo in città!', 10, 7, 'fa-tag', '#10b981', 4),
  ('verified_badge', 'Verifica in evidenza ✅', 'Badge di verifica per ispirare fiducia', 15, 30, 'fa-check-circle', '#3b82f6', 5),
  ('boost', 'Risalita ⬆️', 'Torna tra i primi risultati!', 5, 1, 'fa-rocket', '#8b5cf6', 6),
  ('top_ad', 'Annuncio Top 📌', 'Sempre tra i primi nelle ricerche', 25, 7, 'fa-thumbtack', '#ec4899', 7)
ON CONFLICT (code) DO NOTHING;
