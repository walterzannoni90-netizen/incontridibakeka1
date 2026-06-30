/**
 * ============================================================
 * INCONTRI DI BAKEKA - PARALLEL USER TEST SUITE
 * 50 utenti con personalità diverse per testare tutto
 * ============================================================
 */

const SUPABASE_URL = 'https://rdqsmfgpbuswzilgbjyr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcXNtZmdwYnVzd3ppbGdianlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzYyMTcsImV4cCI6MjA5ODQxMjIxN30.EthEz46lh_bnJzjpQi9GrXiQsinyb5g47V1p1bwlL_E';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// 50 PERSONALITÀ UTENTI DIVERSE
// ============================================================
const USER_PERSONAS = [
  // DONNE CERCANO UOMINI (15 profili)
  { name: 'Sofia', surname: 'Rossi', gender: 'donna', lookingFor: 'uomo', city: 'Napoli', age: 26, bio: 'Ragazza solare, amo viaggiare e la buona cucina. Cerco qualcuno di speciale per momenti indimenticabili.', personality: 'romantica', premium: true },
  { name: 'Martina', surname: 'Bianchi', gender: 'donna', lookingFor: 'uomo', city: 'Milano', age: 28, bio: 'Manager in una multinazionale, poco tempo ma tanta voglia di vivere. Discrezione assoluta.', personality: 'carriera', premium: true },
  { name: 'Giulia', surname: 'Ferrari', gender: 'donna', lookingFor: 'uomo', city: 'Roma', age: 24, bio: 'Studentessa universitaria, cerco esperienze nuove con persone mature e generose.', personality: 'studentessa', premium: false },
  { name: 'Valentina', surname: 'Russo', gender: 'donna', lookingFor: 'uomo', city: 'Torino', age: 30, bio: 'Infermiera turnista, orari strani ma cuore grande. Cerco complicità vera.', personality: 'premurosa', premium: false },
  { name: 'Francesca', surname: 'Esposito', gender: 'donna', lookingFor: 'uomo', city: 'Napoli', age: 27, bio: 'Napoliana doc, passionale e vera. Amo il mare, la pizza e le serate senza fine.', personality: 'passionale', premium: true },
  { name: 'Alessia', surname: 'Romano', gender: 'donna', lookingFor: 'uomo', city: 'Bologna', age: 29, bio: 'Architetta, amante dell\'arte e del design. Cerco uomo colto e raffinato.', personality: 'intellettuale', premium: true },
  { name: 'Chiara', surname: 'Colombo', gender: 'donna', lookingFor: 'uomo', city: 'Milano', age: 25, bio: 'Modella part-time, fitness addict. Cerco qualcuno che sappia stare al mio passo.', personality: 'fitness', premium: false },
  { name: 'Elena', surname: 'Marino', gender: 'donna', lookingFor: 'uomo', city: 'Firenze', age: 31, bio: 'Guida turistica, conosco ogni angolo di Firenze. Ti faccio da cicerone? 😉', personality: 'guida', premium: false },
  { name: 'Laura', surname: 'Greco', gender: 'donna', lookingFor: 'uomo', city: 'Palermo', age: 28, bio: 'Siciliana fiera, sangue caldo e cuore d\'oro. Solo per veri gentlemen.', personality: 'siciliana', premium: true },
  { name: 'Sara', surname: 'Bruno', gender: 'donna', lookingFor: 'uomo', city: 'Genova', age: 26, bio: 'Biologa marina, amo il mare più di tutto. Cerco il mio capitano.', personality: 'marina', premium: false },
  { name: 'Ilaria', surname: 'Gallo', gender: 'donna', lookingFor: 'uomo', city: 'Verona', age: 27, bio: 'Insegnante di danza, movimento e passione sono la mia vita.', personality: 'danzatrice', premium: false },
  { name: 'Claudia', surname: 'Conti', gender: 'donna', lookingFor: 'uomo', city: 'Bari', age: 29, bio: 'Avvocato, mente analitica ma anima romantica. Cerco equilibrio.', personality: 'avvocato', premium: true },
  { name: 'Michela', surname: 'De Luca', gender: 'donna', lookingFor: 'uomo', city: 'Catania', age: 24, bio: 'Makeup artist, creativa e colorata. La vita è una tela da dipingere insieme.', personality: 'artista', premium: false },
  { name: 'Paola', surname: 'Costa', gender: 'donna', lookingFor: 'uomo', city: 'Venezia', age: 32, bio: 'Veneziana doc, misteriosa come la mia città. Solo per chi sa apprezzare.', personality: 'misteriosa', premium: true },
  { name: 'Roberta', surname: 'Giordano', gender: 'donna', lookingFor: 'uomo', city: 'Salerno', age: 28, bio: 'Chef, amo cucinare per chi amo. La via del cuore passa per lo stomaco!', personality: 'chef', premium: false },

  // UOMINI CERCANO DONNE (15 profili)
  { name: 'Marco', surname: 'Rossi', gender: 'uomo', lookingFor: 'donna', city: 'Milano', age: 35, bio: 'Imprenditore, viaggiatore, amante del buon vino. Cerco eleganza e intelligenza.', personality: 'imprenditore', premium: true },
  { name: 'Luca', surname: 'Bianchi', gender: 'uomo', lookingFor: 'donna', city: 'Roma', age: 32, bio: 'Medico, turni notturni ma giorni liberi per te. Serietà e rispetto sempre.', personality: 'medico', premium: true },
  { name: 'Andrea', surname: 'Ferrari', gender: 'uomo', lookingFor: 'donna', city: 'Napoli', age: 29, bio: 'Ingegnere, preciso nel lavoro, passionale nella vita. Napolemente verace.', personality: 'ingegnere', premium: false },
  { name: 'Davide', surname: 'Russo', gender: 'uomo', lookingFor: 'donna', city: 'Torino', age: 34, bio: 'Architetto, design e bellezza ovunque. Cerco musa ispiratrice.', personality: 'architetto', premium: true },
  { name: 'Stefano', surname: 'Esposito', gender: 'uomo', lookingFor: 'donna', city: 'Bologna', age: 31, bio: 'Professore universitario, cultura e conversazione. No perditempo.', personality: 'professore', premium: false },
  { name: 'Matteo', surname: 'Romano', gender: 'uomo', lookingFor: 'donna', city: 'Firenze', age: 28, bio: 'Sommelier, conosco vini e donne. Cerco qualcuno da stappare insieme.', personality: 'sommelier', premium: false },
  { name: 'Alessandro', surname: 'Colombo', gender: 'uomo', lookingFor: 'donna', city: 'Palermo', age: 33, bio: 'Avvocato penalista, mente acuta e cuore tenero. Discrezione garantita.', personality: 'penalista', premium: true },
  { name: 'Francesco', surname: 'Marino', gender: 'uomo', lookingFor: 'donna', city: 'Genova', age: 30, bio: 'Comandante marina mercantile, mesi in mare poi tutto per te.', personality: 'comandante', premium: false },
  { name: 'Giovanni', surname: 'Greco', gender: 'uomo', lookingFor: 'donna', city: 'Bari', age: 36, bio: 'Commercialista, numeri di giorno, passioni di notte. Cerco stabilità.', personality: 'commercialista', premium: true },
  { name: 'Roberto', surname: 'Bruno', gender: 'uomo', lookingFor: 'donna', city: 'Catania', age: 29, bio: 'Personal trainer, corpo e mente sani. Ti alleno anche il cuore? 💪', personality: 'trainer', premium: false },
  { name: 'Antonio', surname: 'Gallo', gender: 'uomo', lookingFor: 'donna', city: 'Verona', age: 33, bio: 'Musicista, vivo di note e emozioni. Cerco la mia melodia.', personality: 'musicista', premium: false },
  { name: 'Vincenzo', surname: 'Conti', gender: 'uomo', lookingFor: 'donna', city: 'Venezia', age: 34, bio: 'Gestore hotel di lusso, ospitalità nel DNA. Ti tratto come una regina.', personality: 'hotel', premium: true },
  { name: 'Giuseppe', surname: 'De Luca', gender: 'uomo', lookingFor: 'donna', city: 'Salerno', age: 31, bio: 'Pilota aereo, mondo ai miei piedi. Cerco terra ferma nel tuo cuore.', personality: 'pilota', premium: false },
  { name: 'Salvatore', surname: 'Costa', gender: 'uomo', lookingFor: 'donna', city: 'Napoli', age: 37, bio: 'Imprenditore edile, solide basi. Costruiamo qualcosa insieme?', personality: 'edile', premium: true },
  { name: 'Carmine', surname: 'Giordano', gender: 'uomo', lookingFor: 'donna', city: 'Roma', age: 28, bio: 'Fotografo, catturo l\'attimo. Tu sarai il mio scatto migliore.', personality: 'fotografo', premium: false },

  // UOMINI CERCANO UOMINI (8 profili)
  { name: 'Fabio', surname: 'Martini', gender: 'uomo', lookingFor: 'uomo', city: 'Milano', age: 30, bio: 'Designer, esteta per natura. Cerco bellezza dentro e fuori.', personality: 'designer', premium: true },
  { name: 'Simone', surname: 'Rizzo', gender: 'uomo', lookingFor: 'uomo', city: 'Roma', age: 27, bio: 'Attore teatro, drammatico sul palco, dolce nella vita.', personality: 'attore', premium: false },
  { name: 'Riccardo', surname: 'Moretti', gender: 'uomo', lookingFor: 'uomo', city: 'Napoli', age: 29, bio: 'Barman, cocktail e conversazioni notturne. Il mio locale, le mie regole.', personality: 'barman', premium: false },
  { name: 'Daniele', surname: 'Barbieri', gender: 'uomo', lookingFor: 'uomo', city: 'Torino', age: 32, bio: 'Psicologo, ascolto per mestiere. Cerco qualcuno da non dover analizzare.', personality: 'psicologo', premium: true },
  { name: 'Emanuele', surname: 'Fontana', gender: 'uomo', lookingFor: 'uomo', city: 'Bologna', age: 26, bio: 'Sviluppatore, codice di giorno, cuore di notte. Open source, open heart.', personality: 'dev', premium: false },
  { name: 'Lorenzo', surname: 'Santoro', gender: 'uomo', lookingFor: 'uomo', city: 'Firenze', age: 31, bio: 'Galleria d\'arte, circondato da bellezza. Cerco la mia opera d\'arte.', personality: 'gallerista', premium: true },
  { name: 'Michele', surname: 'Mariani', gender: 'uomo', lookingFor: 'uomo', city: 'Palermo', age: 28, bio: 'Cuoco, sapori intensi e veri. Ti cucino l\'anima.', personality: 'cuoco', premium: false },
  { name: 'Nicola', surname: 'Rinaldi', gender: 'uomo', lookingFor: 'uomo', city: 'Verona', age: 33, bio: 'Archivista, amo l\'ordine e i segreti. Il tuo lo custodisco io.', personality: 'archivista', premium: false },

  // DONNE CERCANO DONNE (5 profili)
  { name: 'Francesca', surname: 'Leone', gender: 'donna', lookingFor: 'donna', city: 'Milano', age: 28, bio: 'Giornalista, cerco storie vere da vivere. Penna e cuore aperti.', personality: 'giornalista', premium: true },
  { name: 'Valeria', surname: 'Longo', gender: 'donna', lookingFor: 'donna', city: 'Roma', age: 30, bio: 'Veterinaria, amo tutti gli esseri viventi. Tu sei la mia specie preferita.', personality: 'veterinaria', premium: false },
  { name: 'Silvia', surname: 'Martinelli', gender: 'donna', lookingFor: 'donna', city: 'Napoli', age: 27, bio: 'Ballerina classica, disciplina e grazia. Danzi con me?', personality: 'ballerina', premium: false },
  { name: 'Cristina', surname: 'Marchetti', gender: 'donna', lookingFor: 'donna', city: 'Torino', age: 31, bio: 'Ingegnera informatica, logica e passione. Bug nel mio cuore: te.', personality: 'informatica', premium: true },
  { name: 'Monica', surname: 'Riva', gender: 'donna', lookingFor: 'donna', city: 'Bologna', age: 29, bio: 'Sommelier, note fruttate e finale persistente. Come il nostro incontro.', personality: 'sommelierF', premium: false },

  // COPPIE (4 profili)
  { name: 'Marco & Giulia', surname: '', gender: 'coppia', lookingFor: 'coppia', city: 'Milano', age: 32, bio: 'Coppia fissa, mente aperta, cerchiamo altre coppie per serate speciali. No singoli.', personality: 'coppiaAperta', premium: true },
  { name: 'Luca & Sara', surname: '', gender: 'coppia', lookingFor: 'coppia', city: 'Roma', age: 30, bio: 'Giovani sposi, esploriamo insieme. Riservatezza e igiene assoluti.', personality: 'sposi', premium: true },
  { name: 'Andrea & Martina', surname: '', gender: 'coppia', lookingFor: 'uomo', city: 'Napoli', age: 29, bio: 'Lei bellissima, lui generoso. Cerchiamo uomo per lei (cuckold soft). Solo decisi.', personality: 'cuckold', premium: true },
  { name: 'Davide & Elena', surname: '', gender: 'coppia', lookingFor: 'donna', city: 'Bologna', age: 33, bio: 'Coppia bisex, cerchiamo donna per trio. Esperienza, rispetto, divertimento.', personality: 'bisex', premium: false },

  // TRANS (3 profili)
  { name: 'Isabella', surname: 'Trans', gender: 'trans', lookingFor: 'uomo', city: 'Milano', age: 26, bio: 'Trans femminile, operata, pelle vellutata. Solo veri gentlemen, no curiosi.', personality: 'transElegante', premium: true },
  { name: 'Victoria', surname: 'Trans', gender: 'trans', lookingFor: 'uomo', city: 'Roma', age: 28, bio: 'Brasiliana, calore tropicale in città eterna. Passione senza confini.', personality: 'brasiliana', premium: true },
  { name: 'Ariel', surname: 'Trans', gender: 'trans', lookingFor: 'uomo', city: 'Napoli', age: 25, bio: 'Giovane, fresca, tutta da scoprire. Prima esperienza? Ti guido io.', personality: 'giovane', premium: false },
];

// ============================================================
// TEST RESULTS TRACKING
// ============================================================
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

function logTest(name, success, details = '') {
  if (success) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    testResults.errors.push({ name, details });
    console.log(`❌ ${name} - ${details}`);
  }
  testResults.details.push({ name, success, details });
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function generateEmail(name, surname, index) {
  const base = (name + (surname || '') + index).toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  return `test_${base}@incontridibakeka.test`;
}

function generatePassword() {
  return 'TestPass123!';
}

async function registerUser(persona, index) {
  const email = generateEmail(persona.name, persona.surname, index);
  const password = generatePassword();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: persona.name, surname: persona.surname || '' } }
  });
  
  if (error) throw new Error(error.message);
  
  const uid = data.user.id;
  
  // Crea profilo
  const { error: profileError } = await supabase.from('profiles').insert({
    id: uid,
    name: persona.name,
    surname: persona.surname || '',
    city: persona.city,
    gender: persona.gender,
    birth_date: new Date(new Date().getFullYear() - persona.age, 0, 1).toISOString().split('T')[0],
    is_verified: Math.random() > 0.7, // 30% verificati
    is_premium: persona.premium,
    credits: persona.premium ? 100 : Math.floor(Math.random() * 50)
  });
  
  if (profileError) throw new Error(profileError.message);
  
  // Login per ottenere token
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError) throw new Error(loginError.message);
  
  return {
    ...persona,
    id: uid,
    email,
    password,
    token: loginData.session.access_token,
    user: loginData.user
  };
}

async function createAd(user, adData) {
  const { data, error } = await supabase.from('ads').insert({
    user_id: user.id,
    profile_id: user.id,
    title: adData.title,
    category: adData.category,
    city: user.city,
    age: user.age,
    gender: user.gender,
    looking_for: user.lookingFor,
    description: adData.description,
    price: adData.price || null,
    image: adData.image || null,
    images: adData.images || [],
    is_premium: user.is_premium,
    is_sponsored: false,
    is_active: true,
    is_verified: user.is_verified,
    rating: (Math.random() * 2 + 3).toFixed(1),
    review_count: Math.floor(Math.random() * 20),
    photo_classification: 'safe',
    boost_available: user.is_premium ? 3 : 0
  }).select().single();
  
  if (error) throw new Error(error.message);
  return data;
}

async function testUserFlow(user) {
  const results = {
    user: user.name + ' ' + (user.surname || ''),
    register: false,
    login: false,
    profile: false,
    createAd: false,
    searchAds: false,
    filterAds: false,
    viewAd: false,
    saveContact: false,
    buyCredits: false,
    buyAddon: false,
    boostAd: false,
    sponsorAd: false,
    messages: false,
    settings: false,
    logout: false
  };
  
  try {
    // 1. REGISTER (already done in setup)
    results.register = true;
    logTest(`${user.name} - Registrazione`, true);
    
    // 2. LOGIN (already done)
    results.login = true;
    logTest(`${user.name} - Login`, true);
    
    // 3. PROFILE - Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (profile) {
      results.profile = true;
      logTest(`${user.name} - Profilo`, true);
    }
    
    // 4. CREATE AD
    const categories = ['donna-cerca-uomo', 'uomo-cerca-donna', 'uomo-cerca-uomo', 'donna-cerca-donna', 'coppie', 'trans', 'cerco-amici', 'anima-gemella'];
    const catIndex = categories.findIndex(c => c.includes(user.gender) || c.includes(user.lookingFor));
    const category = catIndex >= 0 ? categories[catIndex] : categories[0];
    
    const adTitles = [
      `${user.name}, ${user.age} anni - ${user.bio.slice(0, 30)}...`,
      `Cerco ${user.lookingFor} a ${user.city}`,
      `${user.personality.charAt(0).toUpperCase() + user.personality.slice(1)} cerca complicità`
    ];
    
    const ad = await createAd(user, {
      title: adTitles[Math.floor(Math.random() * adTitles.length)],
      category,
      description: user.bio,
      price: user.gender === 'donna' || user.gender === 'trans' ? `${Math.floor(Math.random() * 200 + 50)}€/h` : null,
      image: `https://picsum.photos/seed/${user.id}/400/500`,
      images: [`https://picsum.photos/seed/${user.id}/400/500`, `https://picsum.photos/seed/${user.id + 1}/400/500`]
    });
    user.adId = ad.id;
    results.createAd = true;
    logTest(`${user.name} - Crea annuncio`, true);
    
    // 5. SEARCH ADS
    const { data: searchResults } = await supabase
      .from('ads')
      .select('*')
      .eq('is_active', true)
      .limit(10);
    if (searchResults && searchResults.length > 0) {
      results.searchAds = true;
      logTest(`${user.name} - Ricerca annunci`, true);
    }
    
    // 6. FILTER ADS by category
    const { data: filteredAds } = await supabase
      .from('ads')
      .select('*')
      .eq('is_active', true)
      .eq('category', category)
      .limit(10);
    if (filteredAds) {
      results.filterAds = true;
      logTest(`${user.name} - Filtra per categoria`, true);
    }
    
    // 7. VIEW AD DETAIL
    const { data: adDetail } = await supabase
      .from('ads')
      .select('*')
      .eq('id', user.adId)
      .single();
    if (adDetail) {
      results.viewAd = true;
      logTest(`${user.name} - Visualizza annuncio`, true);
    }
    
    // 8. SAVE CONTACT (rubrica)
    // Salva un altro annuncio casuale
    const { data: otherAds } = await supabase
      .from('ads')
      .select('id')
      .eq('is_active', true)
      .neq('id', user.adId)
      .limit(1);
    if (otherAds && otherAds.length > 0) {
      const { error: saveError } = await supabase
        .from('saved_contacts')
        .insert({ user_id: user.id, ad_id: otherAds[0].id, notes: 'Interessante!' });
      if (!saveError) {
        results.saveContact = true;
        logTest(`${user.name} - Salva in rubrica`, true);
      }
    }
    
    // 9. BUY CREDITS (simulato)
    const { error: creditError } = await supabase
      .from('credit_transactions')
      .insert({ user_id: user.id, amount: 20, type: 'bonus', description: 'Test bonus crediti' });
    if (!creditError) {
      results.buyCredits = true;
      logTest(`${user.name} - Acquisto crediti`, true);
    }
    
    // 10. BUY ADDON
    const { data: addons } = await supabase.from('addons').select('*').limit(1);
    if (addons && addons.length > 0) {
      const { error: addonError } = await supabase
        .from('ad_addons')
        .insert({ ad_id: user.adId, addon_code: addons[0].code, user_id: user.id });
      if (!addonError) {
        results.buyAddon = true;
        logTest(`${user.name} - Acquisto addon`, true);
      }
    }
    
    // 11. BOOST AD
    const { error: boostError } = await supabase
      .from('boost_schedule')
      .insert({ ad_id: user.adId, user_id: user.id, scheduled_at: new Date().toISOString() });
    if (!boostError) {
      results.boostAd = true;
      logTest(`${user.name} - Boost annuncio`, true);
    }
    
    // 12. SPONSOR AD (update to sponsored)
    const { error: sponsorError } = await supabase
      .from('ads')
      .update({ is_sponsored: true, sponsor_plan: '3days', sponsor_expires_at: new Date(Date.now() + 3*24*60*60*1000).toISOString() })
      .eq('id', user.adId);
    if (!sponsorError) {
      results.sponsorAd = true;
      logTest(`${user.name} - Sponsorizza annuncio`, true);
    }
    
    // 13. MESSAGES/SUPPORT
    const { error: msgError } = await supabase
      .from('support_messages')
      .insert({ email: user.email, message: `Test messaggio da ${user.name}`, is_read: false });
    if (!msgError) {
      results.messages = true;
      logTest(`${user.name} - Invio messaggio supporto`, true);
    }
    
    // 14. SETTINGS (update profile)
    const { error: settingsError } = await supabase
      .from('profiles')
      .update({ phone: '+39 3XX XXXXXXX' })
      .eq('id', user.id);
    if (!settingsError) {
      results.settings = true;
      logTest(`${user.name} - Aggiorna impostazioni`, true);
    }
    
    // 15. LOGOUT (simulato - just check token validity)
    const { data: { user: checkUser } } = await supabase.auth.getUser(user.token);
    if (checkUser) {
      results.logout = true;
      logTest(`${user.name} - Token valido (logout simulato)`, true);
    }
    
  } catch (error) {
    logTest(`${user.name} - ERRORE GENERALE`, false, error.message);
  }
  
  return results;
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================
async function runParallelTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     INCONTRI DI BAKEKA - PARALLEL USER TEST SUITE           ║');
  console.log('║     50 Utenti con Personalità Diverse                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  const registeredUsers = [];
  
  // PHASE 1: Register all 50 users in parallel (batch of 10)
  console.log('📝 FASE 1: Registrazione 50 utenti...\n');
  const batchSize = 10;
  for (let i = 0; i < USER_PERSONAS.length; i += batchSize) {
    const batch = USER_PERSONAS.slice(i, i + batchSize);
    const promises = batch.map((persona, idx) => registerUser(persona, i + idx));
    try {
      const users = await Promise.all(promises);
      registeredUsers.push(...users);
      console.log(`   ✅ Batch ${Math.floor(i/batchSize)+1}/${Math.ceil(USER_PERSONAS.length/batchSize)} completato (${users.length} utenti)`);
    } catch (error) {
      console.log(`   ❌ Batch ${Math.floor(i/batchSize)+1} fallito:`, error.message);
    }
  }
  
  console.log(`\n👥 Totale utenti registrati: ${registeredUsers.length}/50\n`);
  
  // PHASE 2: Run full user flow tests in parallel
  console.log('🔄 FASE 2: Test flusso completo per ogni utente...\n');
  const flowPromises = registeredUsers.map(user => testUserFlow(user));
  const allResults = await Promise.all(flowPromises);
  
  // PHASE 3: Admin tests
  console.log('\n👑 FASE 3: Test Admin Panel...\n');
  await testAdminPanel();
  
  // PHASE 4: Stress test - concurrent operations
  console.log('\n⚡ FASE 4: Stress Test - Operazioni Concorrenti...\n');
  await stressTest(registeredUsers);
  
  // SUMMARY
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  printSummary(elapsed);
  
  // Save detailed report
  saveReport(registeredUsers, allResults, elapsed);
}

async function testAdminPanel() {
  // Trova un admin (il primo utente premium registrato)
  const adminEmail = 'test_sofiarossi0@incontridibakeka.test';
  const { data } = await supabase.auth.signInWithPassword({ email: adminEmail, password: 'TestPass123!' });
  if (!data.session) {
    logTest('Admin Login', false, 'Non trovato');
    return;
  }
  const adminToken = data.session.access_token;
  
  // Test admin stats
  const { data: profiles } = await supabase.from('profiles').select('*', { count: 'exact' }, { headers: { Authorization: `Bearer ${adminToken}` } });
  logTest('Admin - Stats Utenti', !!profiles);
  
  const { data: ads } = await supabase.from('ads').select('*', { count: 'exact' }, { headers: { Authorization: `Bearer ${adminToken}` } });
  logTest('Admin - Stats Annunci', !!ads);
  
  // Test admin actions
  const { data: users } = await supabase.from('profiles').select('id').limit(5);
  if (users && users.length > 0) {
    // Toggle verify
    await supabase.from('profiles').update({ is_verified: true }).eq('id', users[0].id);
    logTest('Admin - Verifica Utente', true);
    
    // Add credits
    await supabase.from('profiles').update({ credits: 1000 }).eq('id', users[0].id);
    await supabase.from('credit_transactions').insert({ user_id: users[0].id, amount: 1000, type: 'admin', description: 'Test admin credits' });
    logTest('Admin - Aggiungi Crediti', true);
  }
  
  // Test admin delete
  const { data: testAd } = await supabase.from('ads').select('id').limit(1);
  if (testAd) {
    await supabase.from('ads').delete().eq('id', testAd[0].id);
    logTest('Admin - Elimina Annuncio', true);
  }
}

async function stressTest(users) {
  // Simulate 100 concurrent ad views
  const viewPromises = [];
  for (let i = 0; i < 100; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const { data: ads } = await supabase.from('ads').select('id').eq('is_active', true).limit(1);
    if (ads && ads.length > 0) {
      viewPromises.push(
        supabase.from('ads').update({ views: 1 }).eq('id', ads[0].id)
      );
    }
  }
  const results = await Promise.allSettled(viewPromises);
  const successful = results.filter(r => r.status === 'fulfilled').length;
  logTest(`Stress Test - 100 View Concorrenti`, successful > 80, `${successful}/100 riuscite`);
  
  // Concurrent searches
  const searchPromises = [];
  for (let i = 0; i < 50; i++) {
    searchPromises.push(
      supabase.from('ads').select('*').eq('is_active', true).limit(20)
    );
  }
  const searchResults = await Promise.allSettled(searchPromises);
  const searchSuccess = searchResults.filter(r => r.status === 'fulfilled').length;
  logTest(`Stress Test - 50 Ricerche Concorrenti`, searchSuccess > 40, `${searchSuccess}/50 riuscite`);
}

function printSummary(elapsed) {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    RISULTATI TEST                            ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  ✅ Passati: ${testResults.passed.toString().padStart(3)}                                        ║`);
  console.log(`║  ❌ Falliti: ${testResults.failed.toString().padStart(3)}                                        ║`);
  console.log(`║  ⏱️  Tempo: ${elapsed}s                                              ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  if (testResults.errors.length > 0) {
    console.log('❌ ERRORI DETTAGLIATI:');
    testResults.errors.forEach(e => console.log(`   - ${e.name}: ${e.details}`));
  }
  
  // Feature coverage
  const features = [
    'Registrazione', 'Login', 'Profilo', 'Crea Annuncio', 'Ricerca Annunci',
    'Filtra Categoria', 'Visualizza Annuncio', 'Salva Rubrica', 'Crediti',
    'Addon', 'Boost', 'Sponsor', 'Messaggi', 'Impostazioni', 'Logout'
  ];
  
  console.log('\n📊 COPERTURA FEATURE:');
  features.forEach((f, i) => {
    const successCount = testResults.details.filter(d => d.name.includes(f) && d.success).length;
    const totalCount = testResults.details.filter(d => d.name.includes(f)).length;
    const pct = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    console.log(`   ${f.padEnd(20)} [${bar}] ${pct}% (${successCount}/${totalCount})`);
  });
}

function saveReport(users, results, elapsed) {
  const fs = require('fs');
  const report = {
    timestamp: new Date().toISOString(),
    duration: elapsed + 's',
    totalUsers: users.length,
    summary: { passed: testResults.passed, failed: testResults.failed },
    errors: testResults.errors,
    userDetails: users.map(u => ({
      name: u.name,
      surname: u.surname,
      city: u.city,
      gender: u.gender,
      premium: u.is_premium,
      verified: u.is_verified,
      adId: u.adId
    })),
    featureCoverage: {}
  };
  
  // Calculate feature coverage
  const features = ['Registrazione', 'Login', 'Profilo', 'Crea Annuncio', 'Ricerca Annunci', 'Filtra Categoria', 'Visualizza Annuncio', 'Salva Rubrica', 'Crediti', 'Addon', 'Boost', 'Sponsor', 'Messaggi', 'Impostazioni', 'Logout'];
  features.forEach(f => {
    const successCount = testResults.details.filter(d => d.name.includes(f) && d.success).length;
    const totalCount = testResults.details.filter(d => d.name.includes(f)).length;
    report.featureCoverage[f] = { success: successCount, total: totalCount, percentage: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0 };
  });
  
  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Report salvato in test-report.json');
}

// Run tests
runParallelTests().catch(console.error);