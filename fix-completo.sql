-- ============================================================
-- FIX COMPLETO — Esegui TUTTO nel Supabase SQL Editor
-- ============================================================
-- Vai su: https://supabase.com/dashboard/project/rdqsmfgpbuswzilgbjyr/sql/new
-- Incolla tutto ed esegui.
-- ============================================================

-- ============================================================
-- 1. AGGIUNGI COLONNA 'images' MANCANTE
-- ============================================================
ALTER TABLE ads ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS boost_count INT DEFAULT 0;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS boost_available INT DEFAULT 0;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS photo_classification TEXT DEFAULT 'safe';

-- ============================================================
-- 2. CREA TABELLA 'support_messages' (MANCANTE)
-- ============================================================
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Support messages insert" ON support_messages CASCADE;
CREATE POLICY "Support messages insert" ON support_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Support messages select admin" ON support_messages CASCADE;
CREATE POLICY "Support messages select admin" ON support_messages
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM profiles WHERE email IN (
      'walterzannoni90@outlook.it',
      'walterzannoni90@gmail.com',
      'Lucianopoleselli@icloud.com'
    )
  ));

-- ============================================================
-- 3. CREA RPC 'get_stats' (MANCANTE)
-- ============================================================
CREATE OR REPLACE FUNCTION get_stats()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  total_ads INT;
  premium_ads INT;
  verified_users INT;
  total_cities INT;
  total_categories INT;
BEGIN
  SELECT COUNT(*) INTO total_ads FROM ads WHERE is_active = true;
  SELECT COUNT(*) INTO premium_ads FROM ads WHERE is_premium = true AND is_active = true;
  SELECT COUNT(*) INTO verified_users FROM profiles WHERE is_verified = true;
  SELECT COUNT(*) INTO total_cities FROM cities;
  SELECT COUNT(*) INTO total_categories FROM categories;

  RETURN json_build_object(
    'totalAds', total_ads,
    'premiumAds', premium_ads,
    'verifiedUsers', verified_users,
    'citiesAvailable', total_cities,
    'categoriesAvailable', total_categories
  );
END;
$$;

-- ============================================================
-- 4. AGGIUNGI COLONNA 'boost_available' NELLE RLS (se serve)
-- ============================================================
-- (già fatto sopra, ma reinseriamo le RLS per completezza)

-- Reinserisce RLS per ads (assicuriamoci che la colonna images sia coperta)
DROP POLICY IF EXISTS "Annunci pubblici" ON ads CASCADE;
CREATE POLICY "Annunci pubblici" ON ads
  FOR SELECT USING (is_active = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Propri annunci insert" ON ads CASCADE;
CREATE POLICY "Propri annunci insert" ON ads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Propri annunci update" ON ads CASCADE;
CREATE POLICY "Propri annunci update" ON ads
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Propri annunci delete" ON ads CASCADE;
CREATE POLICY "Propri annunci delete" ON ads
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 5. AGGIUNGI COLONNA 'is_read' A support_messages (se manca)
-- ============================================================
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- ============================================================
-- 6. VERIFICA FINALE
-- ============================================================
SELECT '✅ images column' AS check_col WHERE EXISTS (
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'ads' AND column_name = 'images'
)
UNION ALL
SELECT '✅ support_messages table' WHERE EXISTS (
  SELECT table_name FROM information_schema.tables
  WHERE table_name = 'support_messages'
)
UNION ALL
SELECT '✅ get_stats function' WHERE EXISTS (
  SELECT routine_name FROM information_schema.routines
  WHERE routine_name = 'get_stats'
);
