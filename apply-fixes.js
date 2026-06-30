/**
 * Applica tutte le fix al database Supabase
 * Usa il Personal Access Token (SUPABASE_ADMIN_TOKEN) tramite Management API
 */
require('dotenv').config();

const PROJECT_REF = 'rdqsmfgpbuswzilgbjyr';
const ADMIN_TOKEN = process.env.SUPABASE_ADMIN_TOKEN || process.env.ADMIN_TOKEN || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
const API_BASE = 'https://api.supabase.com/v1';

async function sql(query) {
  const res = await fetch(`${API_BASE}/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  if (!res.ok) {
    const t = await res.text();
    console.error(`  ❌ SQL error: ${t.slice(0, 200)}`);
    return null;
  }
  try { return JSON.parse(await res.text()); } catch { return await res.text(); }
}

async function main() {
  console.log('🚀 Avvio fix database...\n');

  if (!ADMIN_TOKEN) {
    console.log('❌ SUPABASE_ADMIN_TOKEN non trovato. Salta SQL remoto.\n');
    console.log('Per eseguire le fix manualmente:');
    console.log('  1. Vai su https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
    console.log('  2. Incolla il contenuto di fix-completo.sql');
    console.log('  3. Esegui\n');
    return;
  }

  const fixes = [
    // Fix 1: colonna images
    `ALTER TABLE ads ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';`,
    `ALTER TABLE ads ADD COLUMN IF NOT EXISTS boost_count INT DEFAULT 0;`,
    `ALTER TABLE ads ADD COLUMN IF NOT EXISTS boost_available INT DEFAULT 0;`,
    `ALTER TABLE ads ADD COLUMN IF NOT EXISTS photo_classification TEXT DEFAULT 'safe';`,

    // Fix 2: support_messages
    `CREATE TABLE IF NOT EXISTS support_messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    `ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;`,

    `DROP POLICY IF EXISTS "Support messages insert" ON support_messages CASCADE;`,
    `CREATE POLICY "Support messages insert" ON support_messages
      FOR INSERT WITH CHECK (true);`,

    `DROP POLICY IF EXISTS "Support messages select admin" ON support_messages CASCADE;`,
    `CREATE POLICY "Support messages select admin" ON support_messages
      FOR SELECT USING (auth.uid() IN (
        SELECT id FROM profiles WHERE email IN (
          'walterzannoni90@outlook.it',
          'walterzannoni90@gmail.com',
          'Lucianopoleselli@icloud.com'
        )
      ));`,

    // Fix 3: get_stats RPC
    `CREATE OR REPLACE FUNCTION get_stats()
    RETURNS JSON LANGUAGE plpgsql AS $$
    DECLARE total_ads INT; premium_ads INT; verified_users INT; total_cities INT; total_categories INT;
    BEGIN
      SELECT COUNT(*) INTO total_ads FROM ads WHERE is_active = true;
      SELECT COUNT(*) INTO premium_ads FROM ads WHERE is_premium = true AND is_active = true;
      SELECT COUNT(*) INTO verified_users FROM profiles WHERE is_verified = true;
      SELECT COUNT(*) INTO total_cities FROM cities;
      SELECT COUNT(*) INTO total_categories FROM categories;
      RETURN json_build_object('totalAds',total_ads,'premiumAds',premium_ads,'verifiedUsers',verified_users,'citiesAvailable',total_cities,'categoriesAvailable',total_categories);
    END; $$;`,

    // Fix 4: RLS ads
    `DROP POLICY IF EXISTS "Annunci pubblici" ON ads CASCADE;`,
    `CREATE POLICY "Annunci pubblici" ON ads
      FOR SELECT USING (is_active = true OR auth.uid() = user_id);`,
    `DROP POLICY IF EXISTS "Propri annunci insert" ON ads CASCADE;`,
    `CREATE POLICY "Propri annunci insert" ON ads
      FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `DROP POLICY IF EXISTS "Propri annunci update" ON ads CASCADE;`,
    `CREATE POLICY "Propri annunci update" ON ads
      FOR UPDATE USING (auth.uid() = user_id);`,
    `DROP POLICY IF EXISTS "Propri annunci delete" ON ads CASCADE;`,
    `CREATE POLICY "Propri annunci delete" ON ads
      FOR DELETE USING (auth.uid() = user_id);`
  ];

  for (let i = 0; i < fixes.length; i++) {
    console.log(`📌 Fix ${i + 1}/${fixes.length}...`);
    await sql(fixes[i]);
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n✅ Fix completate!');
}

main().catch(console.error);
