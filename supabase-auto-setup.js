require('dotenv').config();

// Legge le credenziali da .env o usa variabili d'ambiente
const ADMIN_TOKEN = process.env.SUPABASE_ADMIN_TOKEN || '';
const REF = (process.env.VITE_SUPABASE_URL || '').replace('https://', '').replace('.supabase.co', '');
const DB_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!ADMIN_TOKEN || !REF || !SERVICE_KEY) {
  console.log('❌ Manca configurazione. Crea un file .env con:');
  console.log('   VITE_SUPABASE_URL=https://tuo-progetto.supabase.co');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=...');
  console.log('   SUPABASE_ADMIN_TOKEN=sbp_... (Personal Access Token)');
  process.exit(1);
}

async function sql(query) {
  const res = await fetch('https://api.supabase.com/v1/projects/' + REF + '/database/query', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + ADMIN_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) { const t = await res.text(); console.log('  ❌ ' + t.slice(0,120)); return null; }
  try { return JSON.parse(await res.text()); } catch { return await res.text(); }
}

async function main() {
  console.log('🚀 Setup Supabase...\n');

  // 1. TABELLE
  console.log('📦 Creazione tabelle...');
  
  const r1 = await sql(`
    CREATE TABLE IF NOT EXISTS categories (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '',
      class TEXT DEFAULT '',
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#8b5cf6',
      sort_order INT DEFAULT 0
    )
  `);
  console.log('  categories: ' + (r1 ? '✅' : '❌'));
  
  const r2 = await sql(`
    CREATE TABLE IF NOT EXISTS cities (
      name TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      region TEXT DEFAULT ''
    )
  `);
  console.log('  cities: ' + (r2 ? '✅' : '❌'));

  const r3 = await sql(`
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY,
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
    )
  `);
  console.log('  profiles: ' + (r3 ? '✅' : '❌'));

  const r4 = await sql(`
    CREATE TABLE IF NOT EXISTS ads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      title TEXT NOT NULL,
      category TEXT DEFAULT '',
      city TEXT DEFAULT '',
      age INT DEFAULT 0,
      gender TEXT DEFAULT '',
      looking_for TEXT DEFAULT '',
      image TEXT DEFAULT '',
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
    )
  `);
  console.log('  ads: ' + (r4 ? '✅' : '❌'));

  // 2. CATEGORIE
  console.log('\n📦 Categorie...');
  await sql("INSERT INTO categories VALUES ('donna-cerca-uomo','Donna Cerca Uomo','fa-female','womenseekmen','Annunci di donne in cerca di uomini.','#ff2d55',1) ON CONFLICT (slug) DO NOTHING");
  await sql("INSERT INTO categories VALUES ('uomo-cerca-donna','Uomo Cerca Donna','fa-male','menseekwomen','Uomini in cerca di donne. Profili verificati.','#007aff',2) ON CONFLICT (slug) DO NOTHING");
  await sql("INSERT INTO categories VALUES ('uomo-cerca-uomo','Uomo Cerca Uomo','fa-venus-mars','menseekmen','Incontri gay.','#ff9500',3) ON CONFLICT (slug) DO NOTHING");
  await sql("INSERT INTO categories VALUES ('donna-cerca-donna','Donna Cerca Donna','fa-venus','womenseekwomen','Donne che amano altre donne.','#ff3b30',4) ON CONFLICT (slug) DO NOTHING");
  await sql("INSERT INTO categories VALUES ('coppie','Coppie','fa-heart','couples','Coppie per esperienze swinger.','#af52de',5) ON CONFLICT (slug) DO NOTHING");
  await sql("INSERT INTO categories VALUES ('cerco-amici','Cerco Amici','fa-handshake','seekfriends','Amicizie vere.','#34c759',6) ON CONFLICT (slug) DO NOTHING");
  await sql("INSERT INTO categories VALUES ('anima-gemella','Cerco Anima Gemella','fa-dove','seeksoulmate','Trova l''altra metà.','#ff6482',7) ON CONFLICT (slug) DO NOTHING");
  await sql("INSERT INTO categories VALUES ('trans','Trans','fa-transgender','trans','Incontri trans.','#e84393',8) ON CONFLICT (slug) DO NOTHING");
  
  // 3. CITTÀ
  console.log('📦 Città...');
  const cities = ['Napoli','Roma','Milano','Torino','Firenze','Bologna','Venezia','Palermo','Genova','Bari','Catania','Verona','Pisa','Lecce','Brescia','Parma','Modena','Salerno','Bergamo','Cagliari'];
  for (const c of cities) {
    await sql("INSERT INTO cities VALUES ('" + c + "','" + c.toLowerCase() + "','') ON CONFLICT (name) DO NOTHING");
  }

  // 4. UTENTI
  console.log('📦 Utenti di test...');
  const { createClient } = require('@supabase/supabase-js');
  const sup = createClient(DB_URL, SERVICE_KEY, { auth: { persistSession: false } });
  
  const userData = [
    { email: 'sofia@example.com', pw: 'Sofia123!', name: 'Sofia', sur: 'Rossi', city: 'Napoli', gender: 'donna', birth: '2000-05-15' },
    { email: 'alex@example.com', pw: 'Alex123!', name: 'Alessandro', sur: 'Verdi', city: 'Milano', gender: 'uomo', birth: '1995-08-22' },
    { email: 'martina@example.com', pw: 'Martina123!', name: 'Martina', sur: 'Bianchi', city: 'Roma', gender: 'donna', birth: '2001-12-03' }
  ];
  
  for (const u of userData) {
    const { data, error } = await sup.auth.admin.createUser({
      email: u.email, password: u.pw, email_confirm: true,
      user_metadata: { name: u.name, surname: u.sur }
    });
    if (error) {
      console.log('  ⚠️ ' + u.email + ': ' + error.message + ' (forse già esistente)');
    } else {
      const uid = data.user.id;
      await sql("INSERT INTO profiles (id, name, surname, city, gender, birth_date, is_verified, is_premium) VALUES ('" + uid + "','" + u.name + "','" + u.sur + "','" + u.city + "','" + u.gender + "','" + u.birth + "',true,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name");
      console.log('  ✅ ' + u.email);
    }
  }

  // 5. ANNUNCI
  console.log('📦 Annunci...');
  const profiles = await sql("SELECT id, name FROM profiles");
  if (profiles && profiles.length > 0) {
    for (const p of profiles) {
      const name = p.name || 'Utente';
      await sql("INSERT INTO ads (user_id, title, category, city, age, gender, looking_for, image, description, price, rating, review_count, is_premium, is_verified, has_video) VALUES ('" + p.id + "','" + name + " ❤️ Annuncio Premium','donna-cerca-uomo','Napoli',25,'donna','uomo','https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400','Ciao! Sono " + name + ", una persona solare e appassionata. Cerco compagnia per serate speciali.','120€/h',4.8,23,true,true,false)");
    }
    console.log('  ✅ ' + profiles.length + ' annunci creati');
  }

  // 6. VERIFICA
  console.log('\n📋 Verifica finale...');
  const cc = await sql("SELECT COUNT(*) as c FROM categories");
  const ct = await sql("SELECT COUNT(*) as c FROM cities");
  const cp = await sql("SELECT COUNT(*) as c FROM profiles");
  const ca = await sql("SELECT COUNT(*) as c FROM ads");
  console.log('   Categorie: ' + (cc?.[0]?.c || 0));
  console.log('   Città:     ' + (ct?.[0]?.c || 0));
  console.log('   Profili:   ' + (cp?.[0]?.c || 0));
  console.log('   Annunci:   ' + (ca?.[0]?.c || 0));
  
  console.log('\n✅ SETUP SUPABASE COMPLETATO!');
  console.log('Ora riavvia il server: npm start');
}

main().catch(e => console.log('❌', e.message));
