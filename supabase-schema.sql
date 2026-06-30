-- ============================================================
-- INCONTRI DI BAKEKA — RESET COMPLETO DEL DATABASE
-- Esegui questo SQL nel Supabase SQL Editor per pulire tutto
-- e ripartire da zero con soli dati reali.
-- ============================================================

-- 1. Pulisci i dati esistenti (annunci fake, profili di test)
TRUNCATE TABLE ads CASCADE;
TRUNCATE TABLE profiles CASCADE;
DELETE FROM categories;
DELETE FROM cities;

-- 2. TABELLE
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '',
  class TEXT DEFAULT '',
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#8b5cf6',
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cities (
  name TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  region TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  city TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  birth_date DATE,
  avatar_url TEXT DEFAULT '',
  is_verified BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DATI INIZIALI (solo categorie e città — niente annunci fake!)
INSERT INTO categories (slug, name, icon, class, description, color, sort_order) VALUES
  ('donna-cerca-uomo', 'Donna Cerca Uomo', 'fa-female', 'womenseekmen', 'Sfoglia annunci reali di donne in cerca di uomini.', '#ff2d55', 1),
  ('uomo-cerca-donna', 'Uomo Cerca Donna', 'fa-male', 'menseekwomen', 'Uomini in cerca di donne. Profili verificati.', '#007aff', 2),
  ('uomo-cerca-uomo', 'Uomo Cerca Uomo', 'fa-venus-mars', 'menseekmen', 'Incontri gay. Annunci di escort maschi.', '#ff9500', 3),
  ('donna-cerca-donna', 'Donna Cerca Donna', 'fa-venus', 'womenseekwomen', 'Donne che amano altre donne.', '#ff3b30', 4),
  ('coppie', 'Coppie', 'fa-heart', 'couples', 'Coppie per esperienze swinger.', '#af52de', 5),
  ('cerco-amici', 'Cerco Amici', 'fa-handshake', 'seekfriends', 'Amicizie nella tua città.', '#34c759', 6),
  ('anima-gemella', 'Cerco Anima Gemella', 'fa-dove', 'seeksoulmate', 'Trova l''altra metà.', '#ff6482', 7),
  ('trans', 'Trans', 'fa-transgender', 'trans', 'Incontri trans.', '#e84393', 8)
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

-- 4. RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Rimuovi policy vecchie e ricreale
DROP POLICY IF EXISTS "Profili pubblici" ON profiles CASCADE;
DROP POLICY IF EXISTS "Proprio profilo insert" ON profiles CASCADE;
DROP POLICY IF EXISTS "Proprio profilo update" ON profiles CASCADE;
DROP POLICY IF EXISTS "Annunci pubblici" ON ads CASCADE;
DROP POLICY IF EXISTS "Propri annunci insert" ON ads CASCADE;
DROP POLICY IF EXISTS "Propri annunci update" ON ads CASCADE;
DROP POLICY IF EXISTS "Propri annunci delete" ON ads CASCADE;

CREATE POLICY "Profili pubblici" ON profiles FOR SELECT USING (true);
CREATE POLICY "Proprio profilo insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Proprio profilo update" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Annunci pubblici" ON ads FOR SELECT USING (is_active = true OR auth.uid() = user_id);
CREATE POLICY "Propri annunci insert" ON ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Propri annunci update" ON ads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Propri annunci delete" ON ads FOR DELETE USING (auth.uid() = user_id);

-- 5. Index
CREATE INDEX IF NOT EXISTS idx_ads_category ON ads(category);
CREATE INDEX IF NOT EXISTS idx_ads_city ON ads(city);
CREATE INDEX IF NOT EXISTS idx_ads_premium ON ads(is_premium);
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active);
CREATE INDEX IF NOT EXISTS idx_ads_created ON ads(created_at DESC);

-- 6. Storage bucket per foto (se non esiste già)
-- Vai su https://supabase.com/dashboard/project/rdqsmfgpbuswzilgbjyr/storage/buckets
-- e crea un bucket pubblico chiamato "ad-photos"
