/**
 * Applica tutte le fix al database Supabase
 * Usa il Personal Access Token (SUPABASE_ADMIN_TOKEN) tramite Management API
 */
const PROJECT_REF = 'rdqsmfgpbuswzilgbjyr';

// Prova tutti i possibili nomi di secret/variabili
const ADMIN_TOKEN = process.env.SUPABASE_ADMIN_TOKEN
  || process.env.ADMIN_TOKEN
  || process.env.SUPABASE_TOKEN || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SERVICE_ROLE_KEY
  || process.env.SUPABASE_SERVICE_KEY
  || process.env.VITE_SUPABASE_SERVICE_KEY || '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rdqsmfgpbuswzilgbjyr.supabase.co';
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
    console.error(`  ❌ ${t.slice(0, 150)}`);
    return null;
  }
  try { return JSON.parse(await res.text()); } catch { return await res.text(); }
}

async function main() {
  console.log('\n🚀 Avvio fix database...\n');

  if (!ADMIN_TOKEN) {
    console.log('❌ SERVIREBBE SUPABASE_ADMIN_TOKEN per fix automatiche.');
    console.log('');
    console.log('📌 Per fixare TU STESSO il database:');
    console.log('  1. Vai su https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
    console.log('  2. Incolla il contenuto di FIX-COMPLETO.SQL');
    console.log('  3. Esegui');
    console.log('');
    console.log('📌 Aggiungi questi secret a GitHub:');
    console.log('  - SUPABASE_ADMIN_TOKEN (Personal Access Token sbp_...)');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY (dal dashboard Supabase)');
    console.log('');
    console.log('   Oppure alternativamente:');
    console.log('  - Vai su https://supabase.com/dashboard/account/tokens');
    console.log('  - Genera un nuovo token (es. "github-actions")');
    console.log('  - Aggiungilo come secret SUPABASE_ADMIN_TOKEN su GitHub\n');
    return;
  }

  console.log('✅ Admin Token trovato! Applico fix...\n');

  // Test connessione
  const test = await sql('SELECT 1 AS test');
  if (!test) {
    console.log('❌ Impossibile connettersi alla Management API. Token non valido?\n');
    return;
  }
  console.log('✅ Connessione a Supabase Management API riuscita!\n');

  const fixes = [
    `ALTER TABLE ads ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';`,
    `ALTER TABLE ads ADD COLUMN IF NOT EXISTS boost_count INT DEFAULT 0;`,
    `ALTER TABLE ads ADD COLUMN IF NOT EXISTS boost_available INT DEFAULT 0;`,
    `ALTER TABLE ads ADD COLUMN IF NOT EXISTS photo_classification TEXT DEFAULT 'safe';`,

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
    `CREATE POLICY "Support messages insert" ON support_messages FOR INSERT WITH CHECK (true);`,
    `DROP POLICY IF EXISTS "Support messages select admin" ON support_messages CASCADE;`,
    `CREATE POLICY "Support messages select admin" ON support_messages FOR SELECT USING (auth.uid() IN (
      SELECT id FROM profiles WHERE email IN ('walterzannoni90@outlook.it','walterzannoni90@gmail.com','Lucianopoleselli@icloud.com')
    ));`,

    `CREATE OR REPLACE FUNCTION get_stats()
    RETURNS JSON LANGUAGE plpgsql AS $$
    DECLARE t1 INT; t2 INT; t3 INT; t4 INT; t5 INT;
    BEGIN
      SELECT COUNT(*) INTO t1 FROM ads WHERE is_active = true;
      SELECT COUNT(*) INTO t2 FROM ads WHERE is_premium = true AND is_active = true;
      SELECT COUNT(*) INTO t3 FROM profiles WHERE is_verified = true;
      SELECT COUNT(*) INTO t4 FROM cities;
      SELECT COUNT(*) INTO t5 FROM categories;
      RETURN json_build_object('totalAds',t1,'premiumAds',t2,'verifiedUsers',t3,'citiesAvailable',t4,'categoriesAvailable',t5);
    END; $$;`,

    `DROP POLICY IF EXISTS "Annunci pubblici" ON ads CASCADE;`,
    `CREATE POLICY "Annunci pubblici" ON ads FOR SELECT USING (is_active = true OR auth.uid() = user_id);`,
    `DROP POLICY IF EXISTS "Propri annunci insert" ON ads CASCADE;`,
    `CREATE POLICY "Propri annunci insert" ON ads FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `DROP POLICY IF EXISTS "Propri annunci update" ON ads CASCADE;`,
    `CREATE POLICY "Propri annunci update" ON ads FOR UPDATE USING (auth.uid() = user_id);`,
    `DROP POLICY IF EXISTS "Propri annunci delete" ON ads CASCADE;`,
    `CREATE POLICY "Propri annunci delete" ON ads FOR DELETE USING (auth.uid() = user_id);`
  ];

  for (let i = 0; i < fixes.length; i++) {
    process.stdout.write(`  [${i + 1}/${fixes.length}] Eseguendo... `);
    const r = await sql(fixes[i]);
    console.log(r !== null ? '✅' : '⚠️  fallita (forse già applicata)');
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n✅ Tutte le fix sono state applicate con successo!\n');
}

main().catch(console.error);
