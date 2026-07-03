-- ============================================================
-- INCONTRIDIBEKEKA — SCHEMA COMPLETO V2.0
-- Esegui nel Supabase SQL Editor: https://supabase.com/dashboard/project/rdqsmfgpbuswzilgbjyr/sql/new
-- ============================================================

-- TABELLA PROFILI
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  surname TEXT DEFAULT '',
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
  ('anima-gemella', 'Cerco Anima Gemella', 'fa-dove', 'seeksoulmate', 'Trova l''altra metà.', '#ff6482', 7),
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

-- ============================================================
-- NUOVE TABELLE V2.0 — City districts, messages, subscriptions
-- ============================================================

-- CITY DISTRICTS (quartieri/zone)
CREATE TABLE IF NOT EXISTS city_districts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT REFERENCES cities(name) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  UNIQUE(city, slug)
);

-- MESSAGES (internal messaging system)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
  subject TEXT DEFAULT '',
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS subscription_plans (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  highlight_ads INT DEFAULT 0,
  boost_count INT DEFAULT 0,
  verified_badge BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  no_ads BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0
);

-- USER SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_code TEXT REFERENCES subscription_plans(code) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','trial')),
  auto_renew BOOLEAN DEFAULT true,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGE VERIFICATIONS
CREATE TABLE IF NOT EXISTS age_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected','expired')),
  document_type TEXT DEFAULT '',
  document_image TEXT DEFAULT '',
  selfie_image TEXT DEFAULT '',
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AD VIEWS (tracking per user)
CREATE TABLE IF NOT EXISTS ad_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT DEFAULT '',
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- AD CONTACTS (tracking contacts made)
CREATE TABLE IF NOT EXISTS ad_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('phone','whatsapp','telegram','email','message')),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SITE SETTINGS (key-value store)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADD INDEXES
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_ad_views_ad ON ad_views(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_views_date ON ad_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_ad_contacts_ad ON ad_contacts(ad_id);
CREATE INDEX IF NOT EXISTS idx_age_verifications_user ON age_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_city_districts_city ON city_districts(city);

-- RLS POLICIES
ALTER TABLE city_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "City districts pubblici" ON city_districts CASCADE;
CREATE POLICY "City districts pubblici" ON city_districts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Messages view" ON messages CASCADE;
CREATE POLICY "Messages view" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Messages insert" ON messages CASCADE;
CREATE POLICY "Messages insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Subscriptions view" ON user_subscriptions CASCADE;
CREATE POLICY "Subscriptions view" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Subscriptions insert" ON user_subscriptions CASCADE;
CREATE POLICY "Subscriptions insert" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Age verifications view" ON age_verifications CASCADE;
CREATE POLICY "Age verifications view" ON age_verifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Age verifications insert" ON age_verifications CASCADE;
CREATE POLICY "Age verifications insert" ON age_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Ad views insert" ON ad_views CASCADE;
CREATE POLICY "Ad views insert" ON ad_views FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Site settings pubblici" ON site_settings CASCADE;
CREATE POLICY "Site settings pubblici" ON site_settings FOR SELECT USING (true);

-- SEED DATA: Napoletan districts
INSERT INTO city_districts (city, name, slug, description, sort_order) VALUES
  ('Napoli','Centro Storico','centro-storico','Quartieri Spagnoli, Piazza del Plebiscito, Toledo',1),
  ('Napoli','Vomero','vomero','Zona collinare, alta Napoli',2),
  ('Napoli','Chiaia','chiaia','Lungomare, zona chic, piazza dei Martiri',3),
  ('Napoli','Fuorigrotta','fuorigrotta','Zona ovest, Stadio Maradona, Mostra',4),
  ('Napoli','Posillipo','posillipo','Zona residenziale, panoramica',5),
  ('Napoli','Arenaccia','arenaccia','Zona stazione, centro direzionale',6),
  ('Napoli','Bagnoli','bagnoli','Zona flegrea, lungomare',7),
  ('Napoli','Scampia','scampia','Zona nord',8),
  ('Roma','Centro Storico','centro-storico','Colosseo, Trastevere, Pantheon',1),
  ('Roma','EUR','eur','Zona affari, architettura moderna',2),
  ('Roma','Parioli','parioli','Zona residenziale elegante',3),
  ('Roma','San Giovanni','san-giovanni','Zona popolare centrale',4),
  ('Milano','Centro','centro','Duomo, Brera, fashion district',1),
  ('Milano','Navigli','navigli','Zona movida, canali',2),
  ('Milano','Porta Nuova','porta-nuova','Business district, grattacieli',3),
  ('Milano','Bicocca','bicocca','Zona universitaria',4)
ON CONFLICT (city, slug) DO NOTHING;

-- SEED: Subscription plans
INSERT INTO subscription_plans (code, name, description, price_monthly, highlight_ads, boost_count, verified_badge, priority_support, no_ads, sort_order) VALUES
  ('free', 'Gratis', 'Account base gratuito', 0, 0, 0, false, false, false, 1),
  ('plus', 'Plus', 'Abbonamento premium con vantaggi esclusivi', 14.99, 5, 10, true, true, false, 2),
  ('vip', 'VIP', 'Esperienza completa senza limiti', 29.99, 20, 30, true, true, true, 3)
ON CONFLICT (code) DO NOTHING;
