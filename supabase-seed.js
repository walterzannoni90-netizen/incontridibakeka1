// ============================================================
// SUPABASE SEED — Popola il database con dati iniziali
// Uso: node supabase-seed.js
// ============================================================
const supabase = require('./supabase');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function seed() {
  console.log('\n🌱  Seeding Supabase Database...\n');

  // 1. Categories
  const categories = [
    { slug: 'donna-cerca-uomo', name: 'Donna Cerca Uomo', icon: 'fa-female', class: 'womenseekmen', description: 'Sfoglia annunci reali di donne in cerca di uomini.', color: '#ff2d55', sort_order: 1 },
    { slug: 'uomo-cerca-donna', name: 'Uomo Cerca Donna', icon: 'fa-male', class: 'menseekwomen', description: 'Uomini in cerca di donne. Profili verificati.', color: '#007aff', sort_order: 2 },
    { slug: 'uomo-cerca-uomo', name: 'Uomo Cerca Uomo', icon: 'fa-venus-mars', class: 'menseekmen', description: 'Incontri gay. Annunci di escort maschi.', color: '#ff9500', sort_order: 3 },
    { slug: 'donna-cerca-donna', name: 'Donna Cerca Donna', icon: 'fa-venus', class: 'womenseekwomen', description: 'Donne che amano altre donne.', color: '#ff3b30', sort_order: 4 },
    { slug: 'coppie', name: 'Coppie', icon: 'fa-heart', class: 'couples', description: 'Coppie per esperienze swinger.', color: '#af52de', sort_order: 5 },
    { slug: 'cerco-amici', name: 'Cerco Amici', icon: 'fa-handshake', class: 'seekfriends', description: 'Amicizie vere nella tua città.', color: '#34c759', sort_order: 6 },
    { slug: 'anima-gemella', name: 'Cerco Anima Gemella', icon: 'fa-dove', class: 'seeksoulmate', description: 'Trova l\'altra metà.', color: '#ff6482', sort_order: 7 },
    { slug: 'trans', name: 'Trans', icon: 'fa-transgender', class: 'trans', description: 'Incontri trans e travestiti.', color: '#e84393', sort_order: 8 }
  ];

  for (const cat of categories) {
    const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'slug' });
    if (error) console.error(`✗ Category ${cat.slug}: ${error.message}`);
    else console.log(`✓ Category: ${cat.name}`);
  }

  // 2. Cities
  const cities = [
    'Napoli', 'Roma', 'Milano', 'Torino', 'Firenze', 'Bologna', 'Venezia',
    'Palermo', 'Genova', 'Bari', 'Catania', 'Verona', 'Pisa', 'Lecce',
    'Brescia', 'Parma', 'Modena', 'Salerno', 'Bergamo', 'Cagliari'
  ];

  for (const name of cities) {
    const slug = name.toLowerCase().replace(/ /g, '-');
    const { error } = await supabase.from('cities').upsert({ name, slug }, { onConflict: 'name' });
    if (error) console.error(`✗ City ${name}: ${error.message}`);
    else console.log(`✓ City: ${name}`);
  }

  console.log('\n✅  Seed completato!\n');
  console.log('Ora crea un utente da Supabase Auth > Users > Add User');
  console.log('Poi usa il suo UUID per inserire annunci di esempio dal pannello.\n');
}

// Check if Supabase is configured
rl.question('Questo script popolerà il database Supabase. Continuare? (s/N) ', async (answer) => {
  if (answer.toLowerCase() === 's') {
    await seed();
  } else {
    console.log('Operazione annullata.');
  }
  rl.close();
  process.exit(0);
});
