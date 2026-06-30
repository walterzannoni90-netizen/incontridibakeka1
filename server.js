const express = require('express');
const path = require('path');
const app = express();
const PORT = 3030;

app.use(express.static(path.join(__dirname)));

// ============================================================
// CATEGORIE
// ============================================================
const categories = [
  { id: 'donna-cerca-uomo', name: 'Donna Cerca Uomo', icon: 'icon-womenseekmen', class: 'womenseekmen', description: 'Sfoglia annunci reali di donne in cerca di uomini. Escort, ragazze squillo e accompagnatrici nella tua città.', color: '#ff2d55' },
  { id: 'uomo-cerca-donna', name: 'Uomo Cerca Donna', icon: 'icon-menseekwomen', class: 'menseekwomen', description: 'Uomini in cerca di donne. Profili verificati per incontri indimenticabili.', color: '#007aff' },
  { id: 'uomo-cerca-uomo', name: 'Uomo Cerca Uomo', icon: 'icon-menseekmen', class: 'menseekmen', description: 'Incontri gay. Annunci di escort maschi, accompagnatori e molto altro.', color: '#ff9500' },
  { id: 'donna-cerca-donna', name: 'Donna Cerca Donna', icon: 'icon-womenseekwomen', class: 'womenseekwomen', description: 'Donne che amano altre donne. Lesbo, amori e passioni al femminile.', color: '#ff3b30' },
  { id: 'coppie', name: 'Coppie', icon: 'icon-couples', class: 'couples', description: 'Coppie in cerca di coppie e single per esperienze swinger e scambismo.', color: '#af52de' },
  { id: 'cerco-amici', name: 'Cerco Amici', icon: 'icon-seekfriends', class: 'seekfriends', description: 'Amicizie vere e uscite nella tua città. Persone speciali per momenti indimenticabili.', color: '#34c759' },
  { id: 'anima-gemella', name: 'Cerco Anima Gemella', icon: 'icon-seeksoulmate', class: 'seeksoulmate', description: 'L\'amore vero esiste. Trova l\'altra metà della tua mela.', color: '#ff6482' },
  { id: 'trans', name: 'Trans', icon: 'icon-trans', class: 'trans', description: 'Incontri trans e travestiti. Annunci di transgender in cerca di avventure.', color: '#e84393' }
];

// ============================================================
// CITTÀ
// ============================================================
const cities = [
  'Napoli', 'Roma', 'Milano', 'Torino', 'Firenze', 'Bologna', 'Venezia',
  'Palermo', 'Genova', 'Bari', 'Catania', 'Verona', 'Pisa', 'Lecce',
  'Brescia', 'Parma', 'Modena', 'Salerno', 'Bergamo', 'Cagliari'
];

// ============================================================
// ANNUNCI (PREMIUM DATA)
// ============================================================
const ads = [
  {
    id: 1, title: 'Sofia ❤️ 24 anni', category: 'donna-cerca-uomo', city: 'Napoli',
    age: 24, gender: 'donna', lookingFor: 'uomo',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop&crop=face',
    description: 'Ciao bellissimo! Sono Sofia, una ragazza solare e appassionata. Adoro le cene a lume di candela e i tramonti sul mare. Cerco un uomo maturo e interessante per serate indimenticabili 💫',
    isPremium: true, isVerified: true, hasVideo: true,
    price: '120€/h', rating: 4.9, reviews: 47
  },
  {
    id: 2, title: 'Ginevra 💎 27 anni', category: 'donna-cerca-uomo', city: 'Roma',
    age: 27, gender: 'donna', lookingFor: 'uomo',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&crop=face',
    description: 'Sono Ginevra, modella e viaggiatrice. Cerco uomini di classe per esperienze esclusive. Massaggi, cene e passione nella capitale eterna 🌹',
    isPremium: true, isVerified: true, hasVideo: true,
    price: '200€/h', rating: 4.8, reviews: 89
  },
  {
    id: 3, title: 'Alessandro 🔥 29 anni', category: 'uomo-cerca-donna', city: 'Milano',
    age: 29, gender: 'uomo', lookingFor: 'donna',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face',
    description: 'Manager milanese, alto e sportivo. Cerco donne affascinanti per aperitivi e serate eleganti in centro a Milano. Discreto e professionale 🥂',
    isPremium: true, isVerified: true, hasVideo: false,
    price: '150€/h', rating: 4.7, reviews: 34
  },
  {
    id: 4, title: 'Elena 🌺 22 anni', category: 'donna-cerca-uomo', city: 'Bologna',
    age: 22, gender: 'donna', lookingFor: 'uomo',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face',
    description: 'Studentessa universitaria, dolce e affettuosa. Cerco uomini generosi per compagnia e momenti speciali. Discrezione assicurata 💕',
    isPremium: false, isVerified: true, hasVideo: false,
    price: '100€/h', rating: 4.6, reviews: 23
  },
  {
    id: 5, title: 'Marco & Chiara 💑', category: 'coppie', city: 'Torino',
    age: 32, gender: 'coppia', lookingFor: 'coppia',
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=500&fit=crop&crop=face',
    description: 'Coppia aperta, educata e professionale. Cerchiamo coppie o single per serate piacevoli e scambismo soft. Ambiente elegante e riservato 🍷',
    isPremium: true, isVerified: true, hasVideo: true,
    price: '250€/h', rating: 4.9, reviews: 56
  },
  {
    id: 6, title: 'Valentina 🦋 26 anni', category: 'donna-cerca-uomo', city: 'Firenze',
    age: 26, gender: 'donna', lookingFor: 'uomo',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face',
    description: 'Firenze... che romantica! Sono Valentina, guida turistica di giorno, compagna speciale di sera. Amo l\'arte, la musica e le belle conversazioni 🎭',
    isPremium: true, isVerified: true, hasVideo: true,
    price: '180€/h', rating: 4.9, reviews: 71
  },
  {
    id: 7, title: 'Diego 💪 31 anni', category: 'uomo-cerca-uomo', city: 'Napoli',
    age: 31, gender: 'uomo', lookingFor: 'uomo',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face',
    description: 'Personal trainer napoletano, fisico atletico e sorriso mozzafiato. Cerco uomini veri per passione e divertimento senza limiti ⚡',
    isPremium: true, isVerified: true, hasVideo: false,
    price: '130€/h', rating: 4.8, reviews: 42
  },
  {
    id: 8, title: 'Sofia & Anna 👩‍❤️‍👩', category: 'donna-cerca-donna', city: 'Palermo',
    age: 25, gender: 'donna', lookingFor: 'donna',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop&crop=face',
    description: 'Due amiche speciali in cerca di una terza per completare la serata. Dolcezza e passione siciliana per momenti da sogno 🌊',
    isPremium: false, isVerified: true, hasVideo: false,
    price: '150€/h', rating: 4.6, reviews: 19
  },
  {
    id: 9, title: 'Luna ✨ 28 anni', category: 'trans', city: 'Roma',
    age: 28, gender: 'trans', lookingFor: 'uomo',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop&crop=face',
    description: 'Trans più bella di Roma! Sono Luna, elegante e sensuale. Cerco uomini veri con gusto per la bellezza. Esperienze indimenticabili nella capitale 🌙',
    isPremium: true, isVerified: true, hasVideo: true,
    price: '170€/h', rating: 4.9, reviews: 63
  },
  {
    id: 10, title: 'Cristiano 🏆 35 anni', category: 'uomo-cerca-donna', city: 'Verona',
    age: 35, gender: 'uomo', lookingFor: 'donna',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face',
    description: 'Imprenditore veronese, passionale e generoso. Cerco donne raffinate per cene eleganti e notti magiche. Regali e attenzioni per la persona giusta 🎁',
    isPremium: true, isVerified: true, hasVideo: false,
    price: '220€/h', rating: 4.7, reviews: 28
  },
  {
    id: 11, title: 'Giada 🌊 23 anni', category: 'donna-cerca-uomo', city: 'Bari',
    age: 23, gender: 'donna', lookingFor: 'uomo',
    image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop&crop=face',
    description: 'Pugliese doc, solare e generosa. Amo il mare, la buona cucina e la compagnia maschile. Cerco uomini divertenti e rispettosi 🏖️',
    isPremium: false, isVerified: false, hasVideo: false,
    price: '90€/h', rating: 4.5, reviews: 15
  },
  {
    id: 12, title: 'Nicolas 🇫🇷 26 anni', category: 'uomo-cerca-uomo', city: 'Milano',
    age: 26, gender: 'uomo', lookingFor: 'uomo',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&crop=face',
    description: 'Francese a Milano, modello e creator. Cerco ragazzi affascinanti per serate glamour e avventure senza confini. Vieni a scoprire il lusso parigino a Milano 🇫🇷✨',
    isPremium: true, isVerified: true, hasVideo: true,
    price: '190€/h', rating: 4.9, reviews: 51
  },
  {
    id: 13, title: 'Martina 🎀 21 anni', category: 'donna-cerca-uomo', city: 'Catania',
    age: 21, gender: 'donna', lookingFor: 'uomo',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&crop=face',
    description: 'Siciliana doc, dolce e appassionata. Cerco uomini maturi e generosi per accompagnarmi in serate speciali. Discrezione e simpatia assicurate 🍋',
    isPremium: false, isVerified: true, hasVideo: false,
    price: '110€/h', rating: 4.4, reviews: 11
  },
  {
    id: 14, title: 'Romeo & Giulietta 💕', category: 'coppie', city: 'Verona',
    age: 30, gender: 'coppia', lookingFor: 'single',
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=500&fit=crop&crop=face',
    description: 'Coppia giovane e spumeggiante cerca single per esperienze a tre. Lui atletico, lei sensuale. Ambiente leggero e senza impegno. Siete pronti? 🎭',
    isPremium: true, isVerified: true, hasVideo: false,
    price: '200€/h', rating: 4.8, reviews: 38
  },
  {
    id: 15, title: 'Beatrice 🦢 29 anni', category: 'donna-cerca-uomo', city: 'Venezia',
    age: 29, gender: 'donna', lookingFor: 'uomo',
    image: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop&crop=face',
    description: 'Veneziana doc, elegante e raffinata. Amo l\'arte e i giri in gondola. Cerco uomini interessanti per cene esclusive e passeggiate romantiche tra i canali 🚣',
    isPremium: true, isVerified: true, hasVideo: true,
    price: '250€/h', rating: 5.0, reviews: 93
  }
];

// ============================================================
// API ENDPOINTS
// ============================================================

// Categorie
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

// Città
app.get('/api/cities', (req, res) => {
  res.json(cities);
});

// Annunci con filtri
app.get('/api/ads', (req, res) => {
  const { category, city, search, gender, minAge, maxAge, premium, verified } = req.query;
  let result = [...ads];

  if (category && category !== 'all') {
    result = result.filter(a => a.category === category);
  }
  if (city && city !== 'all') {
    result = result.filter(a => a.city.toLowerCase() === city.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
  }
  if (gender) {
    result = result.filter(a => a.gender === gender);
  }
  if (minAge) result = result.filter(a => a.age >= parseInt(minAge));
  if (maxAge) result = result.filter(a => a.age <= parseInt(maxAge));
  if (premium === 'true') result = result.filter(a => a.isPremium);
  if (verified === 'true') result = result.filter(a => a.isVerified);

  res.json(result);
});

// Annunci in evidenza (premium)
app.get('/api/ads/featured', (req, res) => {
  res.json(ads.filter(a => a.isPremium).slice(0, 6));
});

// Statistiche
app.get('/api/stats', (req, res) => {
  res.json({
    totalAds: ads.length,
    premiumAds: ads.filter(a => a.isPremium).length,
    verifiedUsers: ads.filter(a => a.isVerified).length,
    citiesAvailable: cities.length,
    categoriesAvailable: categories.length
  });
});

// ============================================================
// AUTH — UTENTI E SESSIONI
// ============================================================

// Utenti registrati (simulazione database)
let users = [
  {
    id: 'u1', name: 'Sofia', surname: 'Rossi', email: 'sofia@example.com',
    password: 'Sofia123!', city: 'Napoli', gender: 'donna', birthDate: '2000-05-15',
    isVerified: true, isPremium: true, createdAt: '2025-01-10T10:00:00Z'
  },
  {
    id: 'u2', name: 'Alessandro', surname: 'Verdi', email: 'alex@example.com',
    password: 'Alex123!', city: 'Milano', gender: 'uomo', birthDate: '1995-08-22',
    isVerified: true, isPremium: true, createdAt: '2025-02-14T15:30:00Z'
  },
  {
    id: 'u3', name: 'Martina', surname: 'Bianchi', email: 'martina@example.com',
    password: 'Martina123!', city: 'Roma', gender: 'donna', birthDate: '2001-12-03',
    isVerified: true, isPremium: false, createdAt: '2025-03-20T09:15:00Z'
  }
];

let sessions = {};
let nextUserId = 4;

// Middleware per parse JSON body
app.use(express.json());

// POST /api/auth/register — Registrazione
app.post('/api/auth/register', (req, res) => {
  const { name, surname, email, password, city, gender, birthDate, acceptTerms } = req.body;

  // Validazioni
  if (!name || !email || !password || !acceptTerms) {
    return res.json({ success: false, error: 'Compila tutti i campi obbligatori' });
  }

  if (password.length < 8) {
    return res.json({ success: false, error: 'La password deve essere almeno 8 caratteri' });
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return res.json({ success: false, error: 'La password deve contenere minuscole, MAIUSCOLE e numeri' });
  }

  if (users.find(u => u.email === email)) {
    return res.json({ success: false, error: 'Email già registrata' });
  }

  if (birthDate) {
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    if (age < 18) {
      return res.json({ success: false, error: 'Devi essere maggiorenne per registrarti' });
    }
  }

  const newUser = {
    id: `u${nextUserId++}`,
    name, surname: surname || '', email, password,
    city: city || '', gender: gender || '', birthDate: birthDate || '',
    isVerified: false, isPremium: false,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  const token = `token_${newUser.id}_${Date.now()}`;
  sessions[token] = { userId: newUser.id, createdAt: new Date().toISOString() };

  res.json({
    success: true,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, city: newUser.city, isVerified: newUser.isVerified, isPremium: newUser.isPremium },
    token
  });
});

// POST /api/auth/login — Login
app.post('/api/auth/login', (req, res) => {
  const { email, password, remember } = req.body;

  if (!email || !password) {
    return res.json({ success: false, error: 'Inserisci email e password' });
  }

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.json({ success: false, error: 'Email o password non validi' });
  }

  const token = `token_${user.id}_${Date.now()}`;
  sessions[token] = { userId: user.id, createdAt: new Date().toISOString(), remember: !!remember };

  res.json({
    success: true,
    user: {
      id: user.id, name: user.name, surname: user.surname,
      email: user.email, city: user.city, gender: user.gender,
      isVerified: user.isVerified, isPremium: user.isPremium,
      createdAt: user.createdAt
    },
    token
  });
});

// POST /api/auth/logout — Logout
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && sessions[token]) {
    delete sessions[token];
  }
  res.json({ success: true });
});

// GET /api/auth/me — Ottieni profilo utente corrente
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions[token]) {
    return res.json({ success: false, error: 'Non autenticato' });
  }

  const user = users.find(u => u.id === sessions[token].userId);
  if (!user) {
    return res.json({ success: false, error: 'Utente non trovato' });
  }

  res.json({
    success: true,
    user: {
      id: user.id, name: user.name, surname: user.surname,
      email: user.email, city: user.city, gender: user.gender,
      isVerified: user.isVerified, isPremium: user.isPremium,
      createdAt: user.createdAt
    }
  });
});

// Avvia server
app.listen(PORT, () => {
  console.log(`\n  ✦ IncontriDiBakeka — Annunci Premium ✦`);
  console.log(`  ──────────────────────────────────────`);
  console.log(`  🌐  http://localhost:${PORT}`);
  console.log(`  💎  Premium Dating Experience\n`);
});
