/* ============================================================
   INCONTRI DI BAKEKA — APP COMPLETA V2
   Tutte le feature: credito, addons, boost, vetrina, contatti
   Chiama Supabase REST API direttamente (nessun SDK)
   ============================================================ */

const SUPABASE_URL = 'https://rdqsmfgpbuswzilgbjyr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcXNtZmdwYnVzd3ppbGdianlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzYyMTcsImV4cCI6MjA5ODQxMjIxN30.EthEz46lh_bnJzjpQi9GrXiQsinyb5g47V1p1bwlL_E';

// Stripe — Chiave pubblicabile
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51TnhPkDxJ0tOArXhfg0ZH8uJZOJFG9Hk38XTAK0JUXI1s84R1WzmHD44jDN9hUBRdDM8XNHDdxnKklFZa97j48gi00vd1sqvV1';

// ============================================================
// SUPABASE HELPERS
// ============================================================
function sbHeaders(token) {
  return { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
}
async function sbGet(table, query, token) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: sbHeaders(token) });
  if (!r.ok) throw new Error(`GET ${table}: ${r.status}`);
  return r.json();
}
async function sbPost(table, data, token) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: 'POST', headers: sbHeaders(token), body: JSON.stringify(data) });
  if (!r.ok) throw new Error(`POST ${table}: ${r.status}`);
  return r.json();
}
async function sbPatch(table, data, match, token) {
  const q = Object.entries(match).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${q}`, { method: 'PATCH', headers: sbHeaders(token), body: JSON.stringify(data) });
  if (!r.ok) throw new Error(`PATCH ${table}: ${r.status}`);
  return r.json();
}
async function sbDelete(table, match, token) {
  const q = Object.entries(match).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${q}`, { method: 'DELETE', headers: sbHeaders(token) });
  if (!r.ok) throw new Error(`DELETE ${table}: ${r.status}`);
  return r.json();
}
async function sbAuth(method, body, token) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/${method}`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  return r.json();
}
async function sbCount(table, filter) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*${filter ? '&' + filter : ''}&head=true`, { method: 'HEAD', headers: { ...sbHeaders(), 'Prefer': 'count=exact' } });
  return r.ok ? parseInt(r.headers.get('content-range')?.split('/')[1] || '0') : 0;
}
async function sbUpload(path, file, token) {
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/ad-photos/${path}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`, 'Content-Type': file.type, 'x-upsert': 'true' }, body: file });
  if (!r.ok) throw new Error(`Upload fallito: ${await r.text()}`);
  return r.json();
}

// ============================================================
// STATE
// ============================================================
let currentUser = null;
let selectedPhotos = [];
let currentPublishPlan = 'free';
let currentAddonAdd = null;
let savedAdsList = [];

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initNavbar();
  initParticles();
  initCategories();
  initAds();
  initCities();
  initStats();
  initFilters();
  initAOS();
  initAuth();
  loadAddons();
  setTimeout(initRouter, 150);
  loadCityList();
});

// ============================================================
// PRELOADER
// ============================================================
function initPreloader() {
  setTimeout(() => {
    document.getElementById('preloader')?.classList.add('hidden');
    document.body.style.overflow = 'visible';
  }, 1800);
}

// ============================================================
// NAVBAR
// ============================================================
function initNavbar() {
  window.addEventListener('scroll', () => document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 80));
}
function toggleMenu() {
  document.getElementById('hamburger')?.classList.toggle('active');
  document.getElementById('navbarMenu')?.classList.toggle('active');
  document.body.style.overflow = document.getElementById('navbarMenu')?.classList.contains('active') ? 'hidden' : 'visible';
}
document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
  document.getElementById('hamburger')?.classList.remove('active');
  document.getElementById('navbarMenu')?.classList.remove('active');
  document.body.style.overflow = 'visible';
}));

// ============================================================
// PARTICLES
// ============================================================
function initParticles() {
  const c = document.getElementById('particles');
  if (!c) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#10b981'];
    p.style.cssText = `left:${Math.random() * 100}%;width:${Math.random() * 4 + 2}px;height:${Math.random() * 4 + 2}px;animation-duration:${Math.random() * 20 + 15}s;animation-delay:${Math.random() * 10}s;opacity:${Math.random() * 0.3 + 0.1};background:${colors[Math.floor(Math.random() * 5)]}`;
    c.appendChild(p);
  }
}

// ============================================================
// CATEGORIES — CON FOTO REALI DAGLI ANNUNCI
// ============================================================
function initCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  
  // Prima mostra skeleton loading
  grid.innerHTML = '<div style="grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px">' +
    Array(8).fill('<div class="category-card skeleton" style="height:220px;background:rgba(255,255,255,0.03);border-radius:16px;animation:pulse 1.5s infinite"></div>').join('') + '</div>';
  
  const cats = [
    { id: 'donna-cerca-uomo', name: 'Donna Cerca Uomo', icon: 'fa-female', color: '#ff2d55', desc: 'Escort e ragazze squillo' },
    { id: 'uomo-cerca-donna', name: 'Uomo Cerca Donna', icon: 'fa-male', color: '#007aff', desc: 'Accompagnatori per donne' },
    { id: 'uomo-cerca-uomo', name: 'Uomo Cerca Uomo', icon: 'fa-venus-mars', color: '#ff9500', desc: 'Incontri gay e escort' },
    { id: 'donna-cerca-donna', name: 'Donna Cerca Donna', icon: 'fa-venus', color: '#ff3b30', desc: 'Lesbo e amori al femminile' },
    { id: 'coppie', name: 'Coppie', icon: 'fa-heart', color: '#af52de', desc: 'Swingers e scambismo' },
    { id: 'cerco-amici', name: 'Cerco Amici', icon: 'fa-handshake', color: '#34c759', desc: 'Amicizie vere in città' },
    { id: 'anima-gemella', name: 'Cerco Anima Gemella', icon: 'fa-dove', color: '#ff6482', desc: 'Trova l\'altra metà' },
    { id: 'trans', name: 'Trans', icon: 'fa-transgender', color: '#e84393', desc: 'Incontri trans e travestiti' }
  ];

  // Recupera una foto reale per ogni categoria
  sbGet('ads', 'select=image,category&is_active=eq.true&not.is.image:eq.&order=created_at.desc&limit=50').then(ads => {
    const catPhotos = {};
    (ads || []).forEach(ad => {
      const cat = ad.category;
      if (!catPhotos[cat] && ad.image) catPhotos[cat] = ad.image;
    });
    
    grid.innerHTML = '';
    cats.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.style.setProperty('--cat-color', cat.color);
      card.setAttribute('data-aos', 'fade-up');
      
      const img = catPhotos[cat.id];
      card.innerHTML = `<div class="category-card-bg"${img ? ` style="background-image:url('${img}')"` : ''}>
          <div class="category-card-overlay"></div>
        </div>
        <div class="category-icon"><i class="fas ${cat.icon}"></i></div>
        <h3>${cat.name}</h3>
        <p>${cat.desc}</p>`;
      
      card.onclick = () => navigateTo('/?page=category&slug=' + cat.id);
      grid.appendChild(card);
    });
  }).catch(() => {
    // Fallback senza foto
    grid.innerHTML = '';
    cats.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.style.setProperty('--cat-color', cat.color);
      card.innerHTML = `<div class="category-icon"><i class="fas ${cat.icon}"></i></div><h3>${cat.name}</h3><p>${cat.desc}</p>`;
      card.onclick = () => navigateTo('/?page=category&slug=' + cat.id);
      grid.appendChild(card);
    });
  });
}

// ============================================================
// ADS — CARDS + GRIGLIA
// ============================================================
async function initAds(filter) {
  const grid = document.getElementById('adsGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Caricamento annunci...</div>';
  try {
    let q = 'select=*&is_active=eq.true&order=is_sponsored.desc.nullslast,is_premium.desc.nullslast,created_at.desc.nullslast&limit=12';
    if (filter && filter !== 'all') q += '&category=eq.' + filter;
    const ads = await sbGet('ads', q);
    grid.innerHTML = '';
    if (!ads || ads.length === 0) {
      grid.innerHTML = '<div class="empty-state"><i class="fas fa-heart-broken"></i><h3>Nessun annuncio</h3><p>Pubblica il primo annuncio!</p></div>';
      return;
    }
    ads.forEach(ad => grid.appendChild(createAdCard(ad)));
  } catch (e) {
    grid.innerHTML = '<div class="empty-state"><p>Errore caricamento</p></div>';
  }
}

function createAdCard(ad) {
  const card = document.createElement('div');
  card.className = 'ad-card' + (ad.is_sponsored ? ' sponsored' : '');
  card.setAttribute('data-aos', 'fade-up');

  // Badges
  const badges = [];
  if (ad.is_sponsored) badges.push('<span class="ad-badge sponsored"><i class="fas fa-star"></i> SuperTop</span>');
  if (ad.is_premium) badges.push('<span class="ad-badge premium"><i class="fas fa-crown"></i> Premium</span>');
  if (ad.is_verified) badges.push('<span class="ad-badge verified"><i class="fas fa-check-circle"></i> Verificato</span>');
  if (ad.has_video) badges.push('<span class="ad-badge video"><i class="fas fa-video"></i> Video</span>');

  // Photo classification badge
  const photoClass = ad.photo_classification || 'safe';
  const classBadge = { safe: '<span class="ad-badge safe-badge">Safe</span>', hot: '<span class="ad-badge hot-badge">Hot</span>', hard: '<span class="ad-badge hard-badge">Hard</span>' };

  card.innerHTML = `
    <div class="ad-card-image">
      <div class="ad-card-img-wrapper">${ad.image ? `<img src="${ad.image}" alt="${ad.title}" loading="lazy">` : `<div class="no-photo-icon"><i class="fas fa-user"></i></div>`}</div>
      <div class="ad-card-badges">${badges.join('')}</div>
      ${classBadge[photoClass] || ''}
      ${ad.price ? `<div class="ad-card-price">${ad.price}</div>` : ''}
      <button class="ad-save-btn" onclick="event.stopPropagation();toggleSaveAd('${ad.id}')" title="Salva contatto"><i class="fas fa-bookmark"></i></button>
    </div>
    <div class="ad-card-body">
      <h3 class="ad-card-title">${ad.title}</h3>
      <div class="ad-card-meta">
        <span><i class="fas fa-map-marker-alt"></i> ${ad.city || 'N/D'}</span>
        <span><i class="fas fa-user"></i> ${ad.age || '?'} anni</span>
      </div>
      <p class="ad-card-desc">${(ad.description || '').slice(0, 120)}...</p>
    </div>
    <div class="ad-card-footer">
      <div class="ad-card-rating">
        <i class="fas fa-star"></i> ${ad.rating || '0'} <span>(${ad.review_count || 0})</span>
      </div>
      <div class="ad-card-actions">
        ${currentUser && currentUser.id === ad.user_id ? `
          <button class="ad-action-btn edit" onclick="event.stopPropagation();editAd('${ad.id}')" title="Modifica"><i class="fas fa-edit"></i></button>
          <button class="ad-action-btn delete" onclick="event.stopPropagation();deleteAd('${ad.id}')" title="Elimina"><i class="fas fa-trash"></i></button>
        ` : ''}
        <div class="ad-card-action">Vedi <i class="fas fa-arrow-right"></i></div>
      </div>
    </div>`;
  card.onclick = () => navigateTo('/?page=ad&id=' + ad.id);
  return card;
}

// ============================================================
// CITIES
// ============================================================
async function initCities() {
  const grid = document.getElementById('citiesGrid');
  if (!grid) return;
  try {
    const cities = await sbGet('cities', 'select=name&order=name.asc');
    (cities || []).forEach(c => {
      const pill = document.createElement('span');
      pill.className = 'city-pill';
      pill.textContent = c.name;
      pill.setAttribute('data-aos', 'fade-up');
      pill.onclick = () => navigateTo('/?page=category&slug=donna-cerca-uomo&city=' + encodeURIComponent(c.name));
      grid.appendChild(pill);
    });
  } catch (e) {
    ['Napoli', 'Roma', 'Milano', 'Torino', 'Firenze', 'Bologna', 'Venezia', 'Palermo', 'Genova', 'Bari'].forEach(city => {
      const pill = document.createElement('span');
      pill.className = 'city-pill';
      pill.textContent = city;
      pill.onclick = () => navigateTo('/?page=category&slug=donna-cerca-uomo&city=' + encodeURIComponent(city));
      grid.appendChild(pill);
    });
  }
}

// ============================================================
// STATS
// ============================================================
async function initStats() {
  try {
    const [total, premium, verified, citiesC] = await Promise.all([
      sbCount('ads', 'is_active=eq.true'),
      sbCount('ads', 'is_active=eq.true&is_premium=eq.true'),
      sbCount('profiles', 'is_verified=eq.true'),
      sbCount('cities')
    ]);
    animateNum('statAds', total || 0);
    animateNum('statPremium', premium || 0);
    animateNum('statCities', citiesC || 0);
    animateNum('statVerified', verified || 0);
  } catch (e) {
    animateNum('statAds', 15800);
    animateNum('statPremium', 3200);
    animateNum('statCities', 105);
    animateNum('statVerified', 8920);
  }
}
function animateNum(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = 0;
  const inc = Math.ceil(target / 30);
  const t = setInterval(() => { cur += inc; if (cur >= target) { cur = target; clearInterval(t); } el.textContent = cur.toLocaleString(); }, 50);
}

// ============================================================
// FILTERS
// ============================================================
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      initAds(btn.getAttribute('data-filter'));
    });
  });
}
function filterByCategory(id) {
  const section = document.getElementById('annunci');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('active');
    if (b.getAttribute('data-filter') === id) b.classList.add('active');
  });
  initAds(id);
}

// ============================================================
// SEARCH
// ============================================================
function openSearch() {
  document.getElementById('searchOverlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('searchInput')?.focus(), 300);
}
function closeSearch() {
  document.getElementById('searchOverlay')?.classList.remove('active');
  document.body.style.overflow = 'visible';
}
function performSearch() {
  const q = document.getElementById('searchInput')?.value.trim();
  if (q) quickSearch(q);
}
async function quickSearch(query) {
  closeSearch();
  const section = document.getElementById('annunci');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));

  const cm = { 'donna cerca uomo': 'donna-cerca-uomo', 'donna-cerca-uomo': 'donna-cerca-uomo', 'uomo cerca donna': 'uomo-cerca-donna', 'uomo-cerca-donna': 'uomo-cerca-donna', 'uomo cerca uomo': 'uomo-cerca-uomo', 'uomo-cerca-uomo': 'uomo-cerca-uomo', 'donna cerca donna': 'donna-cerca-donna', 'donna-cerca-donna': 'donna-cerca-donna', 'coppie': 'coppie', 'coppia': 'coppie', 'trans': 'trans', 'amici': 'cerco-amici', 'anima gemella': 'anima-gemella' };
  if (cm[query.toLowerCase()]) { filterByCategory(cm[query.toLowerCase()]); return; }

  const grid = document.getElementById('adsGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Ricerca...</div>';
  try {
    const q = encodeURIComponent(query);
    const ads = await sbGet('ads', `select=*&is_active=eq.true&or=(title.ilike.%25${q}%25,description.ilike.%25${q}%25,city.ilike.%25${q}%25)&order=is_premium.desc.nullslast&limit=20`);
    grid.innerHTML = '';
    if (!ads || ads.length === 0) {
      grid.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><h3>Nessun risultato per "${query}"</h3><p>Prova con un altro termine</p></div>`;
    } else {
      ads.forEach(ad => grid.appendChild(createAdCard(ad)));
    }
  } catch (e) { grid.innerHTML = '<div class="empty-state"><p>Errore ricerca</p></div>'; }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeSearch(); closePublish(); closeLogin(); closeRegister(); closeSponsor(); closeShop(); }
  if (e.key === 'Enter' && document.getElementById('searchOverlay')?.classList.contains('active')) performSearch();
});

// ============================================================
// AUTH
// ============================================================
async function initAuth() {
  const token = localStorage.getItem('authToken');
  if (!token) return;
  try {
    const data = await sbAuth('user', {}, token);
    if (data && data.id) {
      const p = await sbGet('profiles', `select=*&id=eq.${data.id}`, token);
      const prof = p?.[0] || {};
      currentUser = {
        id: data.id, name: prof.name || data.user_metadata?.name || '',
        surname: prof.surname || '', email: data.email,
        city: prof.city || '', credits: prof.credits || 0,
        isVerified: !!prof.is_verified, isPremium: !!prof.is_premium
      };
      updateUIForLoggedUser();
      loadSavedContacts();
    } else { localStorage.removeItem('authToken'); }
  } catch (e) { localStorage.removeItem('authToken'); }
}

function openLogin() {
  document.getElementById('loginModal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
  const err = document.getElementById('loginError');
  if (err) err.textContent = '';
  setTimeout(() => document.getElementById('loginEmail')?.focus(), 300);
}
function closeLogin() {
  document.getElementById('loginModal')?.classList.remove('active');
  document.body.style.overflow = 'visible';
}
document.getElementById('loginModal')?.addEventListener('click', function (e) { if (e.target === this) closeLogin(); });

function openRegister() {
  document.getElementById('registerModal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
  const err = document.getElementById('registerError');
  if (err) err.textContent = '';
  setTimeout(() => document.getElementById('regName')?.focus(), 300);
}
function closeRegister() {
  document.getElementById('registerModal')?.classList.remove('active');
  document.body.style.overflow = 'visible';
}
document.getElementById('registerModal')?.addEventListener('click', function (e) { if (e.target === this) closeRegister(); });

function togglePass(id, btn) {
  const inp = document.getElementById(id);
  if (inp.type === 'password') { inp.type = 'text'; btn.innerHTML = '<i class="fas fa-eye-slash"></i>'; } else { inp.type = 'password'; btn.innerHTML = '<i class="fas fa-eye"></i>'; }
}

function checkPasswordStrength(pw) {
  const fill = document.getElementById('strengthFill');
  const text = document.getElementById('strengthText');
  if (!fill || !text) return;
  const rules = { l: pw.length >= 8, low: /[a-z]/.test(pw), up: /[A-Z]/.test(pw), num: /\d/.test(pw) };
  ['ruleLength', 'ruleLower', 'ruleUpper', 'ruleNumber'].forEach((id, i) => { const el = document.getElementById(id); if (el) el.className = Object.values(rules)[i] ? 'valid' : ''; });
  const vc = Object.values(rules).filter(Boolean).length;
  const pct = (vc / 4) * 100;
  fill.style.width = pct + '%';
  if (!pw) { fill.style.background = 'var(--bg-secondary)'; text.textContent = 'Password'; text.style.color = 'var(--text-muted)'; }
  else if (vc <= 1) { fill.style.background = '#ef4444'; text.textContent = 'Debole'; text.style.color = '#ef4444'; }
  else if (vc <= 2) { fill.style.background = '#f59e0b'; text.textContent = 'Media'; text.style.color = '#f59e0b'; }
  else if (vc <= 3) { fill.style.background = '#3b82f6'; text.textContent = 'Buona'; text.style.color = '#3b82f6'; }
  else { fill.style.background = '#10b981'; text.textContent = 'Fortissima!'; text.style.color = '#10b981'; }
}
document.getElementById('regPassword')?.addEventListener('input', function () { checkPasswordStrength(this.value); });

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const btn = document.getElementById('loginBtn');
  const error = document.getElementById('loginError');
  if (!email || !password) { error.textContent = 'Inserisci email e password'; error.style.color = '#ef4444'; return; }
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accesso...';
  try {
    const data = await sbAuth('token?grant_type=password', { email, password });
    if (data.error) throw new Error(data.error_description || data.error);
    const p = await sbGet('profiles', `select=*&id=eq.${data.user.id}`, data.access_token);
    const prof = p?.[0] || {};
    currentUser = { id: data.user.id, name: prof.name || '', surname: prof.surname || '', email: data.user.email, city: prof.city || '', credits: prof.credits || 0, isVerified: !!prof.is_verified, isPremium: !!prof.is_premium };
    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    closeLogin();
    updateUIForLoggedUser();
    loadSavedContacts();
    showToast(`Bentornato, ${currentUser.name || 'Utente'}! 🎉`, 'success');
  } catch (e) { error.textContent = 'Email o password non validi'; error.style.color = '#ef4444'; }
  finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Accedi'; }
}

// Admin emails
const ADMIN_EMAILS = ['walterzannoni90@outlook.it', 'walterzannoni90@gmail.com', 'Lucianopoleselli@icloud.com'];

function isAdmin(email) {
  return ADMIN_EMAILS.includes((email || '').toLowerCase());
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName')?.value.trim();
  const surname = document.getElementById('regSurname')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();
  const password = document.getElementById('regPassword')?.value;
  const city = document.getElementById('regCity')?.value;
  const gender = document.getElementById('regGender')?.value;
  const birthDate = document.getElementById('regBirthDate')?.value;
  const phonePrefix = document.getElementById('regPhonePrefix')?.value || '+39';
  const phone = document.getElementById('regPhone')?.value.trim();
  const accept = document.getElementById('regAcceptTerms')?.checked;
  const btn = document.getElementById('registerBtn');
  const error = document.getElementById('registerError');
  
  // Validazioni
  if (!name) { error.textContent = 'Inserisci il nome'; error.style.color = '#ef4444'; return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.textContent = 'Email non valida'; error.style.color = '#ef4444'; return; }
  if (password.length < 8) { error.textContent = 'Password almeno 8 caratteri'; error.style.color = '#ef4444'; return; }
  
  // Verifica età (18+)
  if (!birthDate) { error.textContent = 'Inserisci la data di nascita'; error.style.color = '#ef4444'; return; }
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const realAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) ? age - 1 : age;
  if (realAge < 18) { error.textContent = 'Devi essere maggiorenne per registrarti (18+)'; error.style.color = '#ef4444'; return; }
  
  if (!accept) { error.textContent = 'Accetta i Termini e Condizioni'; error.style.color = '#ef4444'; return; }
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrazione...';
  
  try {
    const fullPhone = phone ? phonePrefix + phone : '';
    const data = await sbAuth('signup', { 
      email, 
      password, 
      data: { 
        name, 
        surname: surname || '',
        birth_date: birthDate,
        phone: fullPhone,
        gender: gender || ''
      }
    });
    
    if (data.error) throw new Error(data.error);
    
    if (data.user) {
      const userData = {
        id: data.user.id,
        name,
        surname: surname || '',
        city: city || '',
        gender: gender || '',
        birth_date: birthDate,
        phone: fullPhone,
        is_verified: false,
        is_premium: isAdmin(email),
        credits: isAdmin(email) ? 999 : 20
      };
      await sbPost('profiles', userData, data.access_token);
      
      // Bonus crediti
      await sbPost('credit_transactions', { 
        user_id: data.user.id, 
        amount: isAdmin(email) ? 999 : 20, 
        type: 'bonus', 
        description: isAdmin(email) ? 'Crediti admin' : 'Bonus benvenuto 20 crediti'
      }, data.access_token);
    }
    
    currentUser = { 
      id: data.user?.id || '', 
      name, 
      email, 
      city: city || '', 
      credits: isAdmin(email) ? 999 : 20, 
      isVerified: false, 
      isPremium: isAdmin(email),
      isAdmin: isAdmin(email)
    };
    
    if (data.access_token) localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    closeRegister();
    updateUIForLoggedUser();
    
    if (isAdmin(email)) {
      showToast('Benvenuto Admin! 👑', 'success');
    } else {
      showToast(`Benvenuto, ${name}! Ricevi 20 crediti gratis 🎉 Controlla la tua email per confermare la registrazione.`, 'success');
    }
  } catch (e) { 
    error.textContent = e.message.includes('already') ? 'Email già registrata' : 'Errore registrazione: ' + (e.message || ''); 
    error.style.color = '#ef4444'; 
  }
  finally { 
    btn.disabled = false; 
    btn.innerHTML = '<i class="fas fa-feather-alt"></i> Crea Account'; 
  }
}

function updateUIForLoggedUser() {
  if (!currentUser) return;
  const authBtns = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  if (authBtns) authBtns.style.display = 'none';
  if (userMenu) userMenu.style.display = 'block';
  const userName = document.getElementById('userName');
  if (userName) userName.textContent = currentUser.name || 'Utente';
  const dName = document.getElementById('dropdownUserName');
  if (dName) dName.textContent = (currentUser.name + ' ' + (currentUser.surname || '')).trim();
  const dEmail = document.getElementById('dropdownUserEmail');
  if (dEmail) dEmail.textContent = currentUser.email;
  const creditBadge = document.getElementById('userCredits');
  if (creditBadge) creditBadge.textContent = currentUser.credits + ' crediti';
  
  // Mostra admin badge se admin
  if (isAdmin(currentUser.email)) {
    currentUser.isAdmin = true;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    const adminBadge = document.getElementById('adminBadge');
    if (adminBadge) adminBadge.style.display = 'inline-flex';
    const adminLink = document.querySelector('[data-action="admin"]');
    if (adminLink) adminLink.style.display = 'flex';
  }
}

function toggleUserDropdown() {
  document.getElementById('userDropdown')?.classList.toggle('show');
  document.querySelector('.user-dropdown-toggle')?.classList.toggle('active');
}
document.addEventListener('click', e => {
  if (!e.target.closest('.user-menu')) {
    document.getElementById('userDropdown')?.classList.remove('show');
    document.querySelector('.user-dropdown-toggle')?.classList.remove('active');
  }
});

function userAction(action) {
  document.getElementById('userDropdown')?.classList.remove('show');
  switch (action) {
    case 'profile': navigateTo('/?page=profile'); break;
    case 'myads': navigateTo('/?page=myads'); break;
    case 'contacts': navigateTo('/?page=contacts'); break;
    case 'credits': openShop(); break;
    case 'vetrina':
      document.getElementById('vetrina')?.scrollIntoView({ behavior: 'smooth' });
      document.getElementById('navbarMenu')?.classList.remove('active');
      break;
    case 'settings': showToast('Impostazioni in arrivo!', 'success'); break;
    case 'support': openSupport(); break;
    case 'admin':
      if (isAdmin(currentUser?.email)) navigateTo('/?page=admin');
      else showToast('Accesso negato', 'error');
      break;
    case 'support': openSupport(); break;
  }
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  currentUser = null;
  const authBtns = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  if (authBtns) authBtns.style.display = 'flex';
  if (userMenu) userMenu.style.display = 'none';
  document.getElementById('userDropdown')?.classList.remove('show');
  showToast('Sei uscito. A presto! 👋', 'success');
}

// ============================================================
// PUBLISH AD
// ============================================================
function selectPublishPlan(plan) {
  currentPublishPlan = plan;
  document.querySelectorAll('.plan-option').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('plan' + plan.charAt(0).toUpperCase() + plan.slice(1));
  if (el) el.classList.add('active');
  const limits = { free: 1, premium: 5, gold: 10 };
  const limitEl = document.getElementById('photoLimit');
  if (limitEl) limitEl.textContent = '(max ' + limits[plan] + ')';
  if (selectedPhotos.length > limits[plan]) { selectedPhotos = selectedPhotos.slice(0, limits[plan]); renderPhotos(); }
}

function openPublish() {
  if (!currentUser) { showToast('Devi effettuare il login prima di pubblicare', 'warning'); openLogin(); return; }
  // Reset edit mode
  editingAdId = null;
  document.getElementById('publishModal')?.classList.remove('editing');
  document.querySelector('.modal-title').textContent = 'Pubblica il tuo annuncio';
  document.getElementById('publishBtn').innerHTML = '<i class="fas fa-paper-plane"></i> Pubblica annuncio';
  // Reset form
  document.getElementById('publishForm')?.reset();
  selectedPhotos = [];
  currentPublishPlan = 'free';
  selectPublishPlan('free');
  renderPhotos();
  document.getElementById('publishModal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
  const err = document.getElementById('publishError');
  if (err) err.style.display = 'none';
}

function closePublish() {
  document.getElementById('publishModal')?.classList.remove('active');
  document.body.style.overflow = 'visible';
  editingAdId = null;
  document.getElementById('publishModal')?.classList.remove('editing');
}
document.getElementById('publishModal')?.addEventListener('click', function (e) { if (e.target === this) closePublish(); });

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('uploadZone')?.classList.remove('dragover');
  if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
}
function handleFiles(files) {
  const limits = { free: 1, premium: 5, gold: 10 };
  const max = limits[currentPublishPlan];
  const remaining = max - selectedPhotos.length;
  if (remaining <= 0) { showToast('Hai raggiunto il limite di foto per questo piano', 'warning'); return; }
  const toAdd = Math.min(files.length, remaining);
  for (let i = 0; i < toAdd; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) continue;
    const reader = new FileReader();
    reader.onload = function (e) { selectedPhotos.push({ file, dataUrl: e.target.result }); renderPhotos(); };
    reader.readAsDataURL(file);
  }
}
function renderPhotos() {
  const container = document.getElementById('photoPreview');
  if (!container) return;
  container.innerHTML = '';
  selectedPhotos.forEach((photo, idx) => {
    const div = document.createElement('div');
    div.className = 'thumb';
    div.innerHTML = `<img src="${photo.dataUrl}" alt="Foto"><button class="remove-btn" onclick="removePhoto(${idx})">&times;</button>`;
    container.appendChild(div);
  });
}
function removePhoto(idx) { selectedPhotos.splice(idx, 1); renderPhotos(); }

async function loadCityList() {
  try {
    const cities = await sbGet('cities', 'select=name&order=name.asc');
    const dl = document.getElementById('cityList');
    if (dl && cities) dl.innerHTML = cities.map(c => '<option value="' + c.name + '">').join('');
  } catch (e) { }
}

async function submitAd(e) {
  e.preventDefault();
  const btn = document.getElementById('publishBtn');
  const errorEl = document.getElementById('publishError');
  if (errorEl) errorEl.style.display = 'none';

  const title = document.getElementById('adTitle')?.value.trim();
  const category = document.getElementById('adCategory')?.value;
  const city = document.getElementById('adCity')?.value.trim();
  const age = parseInt(document.getElementById('adAge')?.value) || 0;
  const gender = document.getElementById('adGender')?.value;
  const description = document.getElementById('adDescription')?.value.trim();
  const price = document.getElementById('adPrice')?.value.trim();
  const photoClass = document.getElementById('adPhotoClass')?.value || 'safe';

  if (!title || !description) {
    if (errorEl) { errorEl.textContent = 'Inserisci titolo e descrizione'; errorEl.style.display = 'block'; }
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Pubblicazione...';

  try {
    const token = localStorage.getItem('authToken');
    let imageUrls = [];
    if (selectedPhotos.length > 0) {
      for (let i = 0; i < selectedPhotos.length; i++) {
        const file = selectedPhotos[i].file;
        const ext = file.name.split('.').pop();
        const fileName = currentUser.id + '/' + Date.now() + '_' + i + '.' + ext;
        await sbUpload(fileName, file, token);
        imageUrls.push(SUPABASE_URL + '/storage/v1/object/public/ad-photos/' + fileName);
      }
    }

    const adData = {
      user_id: currentUser.id, title, category, city, age, gender,
      description, price: price || null,
      image: imageUrls[0] || null,
      images: imageUrls,
      photo_classification: photoClass,
      is_premium: currentPublishPlan !== 'free',
      is_sponsored: currentPublishPlan === 'gold',
      is_active: true, rating: 0, review_count: 0,
      boost_available: currentPublishPlan === 'gold' ? 3 : (currentPublishPlan === 'premium' ? 1 : 0)
    };
    await sbPost('ads', adData, token);
    closePublish();
    showToast('Annuncio pubblicato con successo! 🎉', 'success');
    initAds();
  } catch (e) {
    if (errorEl) { errorEl.textContent = 'Errore: ' + (e.message || 'Riprova'); errorEl.style.display = 'block'; }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Pubblica annuncio';
  }
}

// ============================================================
// EDIT AD
// ============================================================
let editingAdId = null;

function editAd(adId) {
  editingAdId = adId;
  const token = localStorage.getItem('authToken');
  sbGet('ads', 'select=*&id=eq.' + adId, token).then(ads => {
    if (!ads || ads.length === 0) { showToast('Annuncio non trovato', 'error'); return; }
    const ad = ads[0];
    // Prefill form
    document.getElementById('adTitle').value = ad.title || '';
    document.getElementById('adCategory').value = ad.category || '';
    document.getElementById('adCity').value = ad.city || '';
    document.getElementById('adAge').value = ad.age || '';
    document.getElementById('adGender').value = ad.gender || '';
    document.getElementById('adDescription').value = ad.description || '';
    document.getElementById('adPrice').value = ad.price || '';
    document.getElementById('adPhotoClass').value = ad.photo_classification || 'safe';
    
    // Set plan
    if (ad.is_sponsored) selectPublishPlan('gold');
    else if (ad.is_premium) selectPublishPlan('premium');
    else selectPublishPlan('free');
    
    // Load existing photos
    selectedPhotos = [];
    if (ad.images && ad.images.length > 0) {
      ad.images.forEach(url => {
        selectedPhotos.push({ file: null, dataUrl: url, existing: true });
      });
    } else if (ad.image) {
      selectedPhotos.push({ file: null, dataUrl: ad.image, existing: true });
    }
    renderPhotos();
    
    // Change button text
    document.getElementById('publishBtn').innerHTML = '<i class="fas fa-save"></i> Salva modifiche';
    // Add hidden field for edit mode
    document.getElementById('publishModal').classList.add('editing');
    
    openPublish();
    document.querySelector('.modal-title').textContent = 'Modifica annuncio';
  }).catch(() => showToast('Errore caricamento annuncio', 'error'));
}

// Modifica submitAd per gestire edit
const originalSubmitAd = submitAd;

async function submitAd(e) {
  e.preventDefault();
  const btn = document.getElementById('publishBtn');
  const errorEl = document.getElementById('publishError');
  if (errorEl) errorEl.style.display = 'none';

  const title = document.getElementById('adTitle')?.value.trim();
  const category = document.getElementById('adCategory')?.value;
  const city = document.getElementById('adCity')?.value.trim();
  const age = parseInt(document.getElementById('adAge')?.value) || 0;
  const gender = document.getElementById('adGender')?.value;
  const description = document.getElementById('adDescription')?.value.trim();
  const price = document.getElementById('adPrice')?.value.trim();
  const photoClass = document.getElementById('adPhotoClass')?.value || 'safe';

  if (!title || !description) {
    if (errorEl) { errorEl.textContent = 'Inserisci titolo e descrizione'; errorEl.style.display = 'block'; }
    return;
  }
  
  if (selectedPhotos.length === 0 && !editingAdId) {
    if (errorEl) { errorEl.textContent = 'Aggiungi almeno una foto reale'; errorEl.style.display = 'block'; }
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvataggio...';

  try {
    const token = localStorage.getItem('authToken');
    let imageUrls = [];
    
    // Handle photos: keep existing + upload new
    if (selectedPhotos.length > 0) {
      for (let i = 0; i < selectedPhotos.length; i++) {
        if (selectedPhotos[i].existing) {
          imageUrls.push(selectedPhotos[i].dataUrl);
        } else if (selectedPhotos[i].file) {
          const file = selectedPhotos[i].file;
          const ext = file.name.split('.').pop();
          const fileName = currentUser.id + '/' + Date.now() + '_' + i + '.' + ext;
          await sbUpload(fileName, file, token);
          imageUrls.push(SUPABASE_URL + '/storage/v1/object/public/ad-photos/' + fileName);
        }
      }
    }

    const adData = {
      title, category, city, age, gender,
      description, price: price || null,
      image: imageUrls[0] || null,
      images: imageUrls,
      photo_classification: photoClass,
      is_premium: currentPublishPlan !== 'free',
      is_sponsored: currentPublishPlan === 'gold',
      boost_available: currentPublishPlan === 'gold' ? 3 : (currentPublishPlan === 'premium' ? 1 : 0)
    };

    if (editingAdId) {
      // UPDATE existing ad
      await sbPatch('ads', adData, { id: editingAdId }, token);
      showToast('Annuncio aggiornato con successo! ✅', 'success');
      editingAdId = null;
    } else {
      // CREATE new ad
      adData.user_id = currentUser.id;
      adData.is_active = true;
      adData.rating = 0;
      adData.review_count = 0;
      await sbPost('ads', adData, token);
      showToast('Annuncio pubblicato con successo! 🎉', 'success');
    }
    
    closePublish();
    document.querySelector('.modal-title').textContent = 'Pubblica il tuo annuncio';
    document.getElementById('publishBtn').innerHTML = '<i class="fas fa-paper-plane"></i> Pubblica annuncio';
    document.getElementById('publishModal')?.classList.remove('editing');
    initAds();
    // Refresh my ads if visible
    if (document.getElementById('myAdsPage')?.style.display !== 'none') showMyAdsPage();
  } catch (e) {
    if (errorEl) { errorEl.textContent = 'Errore: ' + (e.message || 'Riprova'); errorEl.style.display = 'block'; }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Pubblica annuncio';
  }
}

// ============================================================
// DELETE AD
// ============================================================
function deleteAd(adId) {
  if (!confirm('❌ Sei sicuro di voler eliminare questo annuncio?\n\nQuesta azione non può essere annullata.')) return;
  const token = localStorage.getItem('authToken');
  sbDelete('ads', { id: adId }, token).then(() => {
    showToast('Annuncio eliminato', 'success');
    if (document.getElementById('myAdsPage')?.style.display !== 'none') showMyAdsPage();
    initAds();
  }).catch(() => showToast('Errore eliminazione', 'error'));
}

// ============================================================
// SHOP — CREDITI E ADDONS
// ============================================================
let addonsList = [];

async function loadAddons() {
  try {
    addonsList = await sbGet('addons', 'select=*&order=sort_order.asc');
  } catch (e) { addonsList = []; }
}

function openShop() {
  document.getElementById('shopModal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
  renderShop();
}
function closeShop() {
  document.getElementById('shopModal')?.classList.remove('active');
  document.body.style.overflow = 'visible';
}
document.getElementById('shopModal')?.addEventListener('click', function (e) { if (e.target === this) closeShop(); });

function renderShop() {
  const container = document.getElementById('shopContent');
  if (!container) return;
  if (!currentUser) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-lock"></i><h3>Accedi per acquistare</h3></div>';
    return;
  }

  // Pannello crediti
  let html = `
    <div class="shop-credits-panel">
      <h3><i class="fas fa-coins" style="color:var(--accent)"></i> I tuoi crediti: <strong>${currentUser.credits || 0}</strong></h3>
      <div class="credit-packs">
        <div class="credit-pack" onclick="buyCredits(10)">
          <span class="amount">10</span>
          <span class="price">€4.99</span>
        </div>
        <div class="credit-pack popular" onclick="buyCredits(30)">
          <span class="badge">PIÙ VENDUTO</span>
          <span class="amount">30</span>
          <span class="price">€9.99</span>
        </div>
        <div class="credit-pack" onclick="buyCredits(70)">
          <span class="amount">70</span>
          <span class="price">€19.99</span>
        </div>
        <div class="credit-pack" onclick="buyCredits(150)">
          <span class="amount">150</span>
          <span class="price">€34.99</span>
        </div>
      </div>
    </div>
    <h3 style="margin-top:24px;margin-bottom:16px"><i class="fas fa-bolt" style="color:var(--accent)"></i> Potenzia il tuo annuncio</h3>
    <div class="addons-grid">`;

  addonsList.forEach(a => {
    html += `
      <div class="addon-card" onclick="openAddonPurchase('${a.code}')">
        <div class="addon-icon" style="background:${a.color}22;color:${a.color}"><i class="fas ${a.icon}"></i></div>
        <div class="addon-info">
          <strong>${a.name}</strong>
          <small>${a.description}</small>
        </div>
        <div class="addon-price">
          <i class="fas fa-coins" style="color:var(--accent)"></i> ${a.price_credits}
        </div>
      </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

async function buyCredits(amount) {
  if (!currentUser) { showToast('Accedi prima di acquistare', 'warning'); return; }
  
  // Price mapping
  const prices = { 10: 4.99, 30: 9.99, 70: 19.99, 150: 34.99 };
  const euro = prices[amount] || (amount * 0.5);
  
  // Stripe Payment Links (funziona senza backend!)
  const stripeLinks = {
    10: 'https://buy.stripe.com/7sY3cveZX5Rs7Umg94b7y01',
    30: 'https://buy.stripe.com/6oU5kD4ljcfQcaC8GCb7y02',
    70: 'https://buy.stripe.com/fZuaEXeZXgw68YqbSOb7y03',
    150: 'https://buy.stripe.com/dRm14ncRP6Vw4Ia6yub7y04'
  };
  
  const link = stripeLinks[amount];
  if (link) {
    showToast(`Reindirizzamento a Stripe...`, 'success');
    // Salva userId in sessionStorage per il ritorno
    sessionStorage.setItem('stripeUserId', currentUser.id);
    sessionStorage.setItem('stripeCredits', amount);
    window.location.href = link;
    return;
  }
  
  // FALLBACK: credito diretto (finché Stripe non è configurato)
  const token = localStorage.getItem('authToken');
  await sbPatch('profiles', { credits: (currentUser.credits || 0) + amount }, { id: currentUser.id }, token);
  await sbPost('credit_transactions', { user_id: currentUser.id, amount, type: 'purchase', description: `Acquisto ${amount} crediti (mock)` }, token);
  currentUser.credits = (currentUser.credits || 0) + amount;
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  updateUIForLoggedUser();
  renderShop();
  showToast(`✅ ${amount} crediti aggiunti! (Modalità test)`, 'success');
}

function openAddonPurchase(code) {
  if (!currentUser) { showToast('Accedi prima di acquistare', 'warning'); openLogin(); return; }
  const addon = addonsList.find(a => a.code === code);
  if (!addon) return;
  if ((currentUser.credits || 0) < addon.price_credits) {
    showToast(`❌ Crediti insufficienti! Servono ${addon.price_credits} crediti (ne hai ${currentUser.credits})`, 'warning');
    return;
  }
  currentAddonAdd = addon;
  // Mostra selezione annuncio su cui applicare
  loadAddonAds(addon);
  document.getElementById('addonPurchaseModal')?.classList.add('active');
}
function closeAddonPurchase() {
  document.getElementById('addonPurchaseModal')?.classList.remove('active');
  currentAddonAdd = null;
}

async function loadAddonAds(addon) {
  const list = document.getElementById('addonAdsList');
  if (!list) return;
  list.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
  try {
    const token = localStorage.getItem('authToken');
    const ads = await sbGet('ads', `select=id,title,image,city&is_active=eq.true&user_id=eq.${currentUser.id}&limit=20`, token);
    list.innerHTML = '';
    if (!ads || ads.length === 0) {
      list.innerHTML = '<p style="padding:20px;color:var(--text-muted)">Nessun annuncio attivo. <a href="#" onclick="closeAddonPurchase();openPublish();return false;">Pubblica ora</a></p>';
      return;
    }
    ads.forEach(ad => {
      const item = document.createElement('div');
      item.className = 'sponsor-ad-item';
      const imgHtml = ad.image ? `<img src="${ad.image}" alt="">` : '<div class="no-photo-small"><i class="fas fa-user"></i></div>';
      item.innerHTML = `${imgHtml}<div class="ad-info"><strong>${ad.title}</strong><span>${ad.city || ''}</span></div><i class="fas fa-check-circle" style="margin-left:auto;color:transparent"></i>`;
      item.onclick = async function () {
        if ((currentUser.credits || 0) < addon.price_credits) {
          showToast('Crediti insufficienti!', 'warning');
          return;
        }
        document.querySelectorAll('#addonAdsList .sponsor-ad-item').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        this.querySelector('.fa-check-circle').style.color = 'var(--primary)';

        // Applica addon
        const token = localStorage.getItem('authToken');
        try {
          await sbPost('ad_addons', {
            ad_id: ad.id, addon_code: addon.code,
            user_id: currentUser.id,
            expires_at: addon.duration_days > 0 ? new Date(Date.now() + addon.duration_days * 86400000).toISOString() : null,
            auto_renew: false, is_active: true
          }, token);
          // Scala crediti
          await sbPatch('profiles', { credits: (currentUser.credits || 0) - addon.price_credits }, { id: currentUser.id }, token);
          await sbPost('credit_transactions', {
            user_id: currentUser.id, amount: -addon.price_credits,
            type: 'spend', description: `${addon.name} per "${ad.title}"`
          }, token);

          currentUser.credits = (currentUser.credits || 0) - addon.price_credits;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          updateUIForLoggedUser();

          closeAddonPurchase();
          showToast(`✅ ${addon.name} attivato su "${ad.title}"!`, 'success');
        } catch (e) { showToast('Errore: ' + e.message, 'error'); }
      };
      list.appendChild(item);
    });
  } catch (e) { list.innerHTML = '<p>Errore caricamento</p>'; }
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast-custom');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-custom';
  const icons = { success: 'fa-check-circle', warning: 'fa-exclamation-circle', error: 'fa-times-circle' };
  toast.innerHTML = `<i class="fas ${icons[type] || 'fa-info-circle'}"></i><span>${message}</span>`;
  const colors = { success: 'rgba(16,185,129,0.3)', warning: 'rgba(245,158,11,0.3)', error: 'rgba(239,68,68,0.3)' };
  toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:16px 24px;background:var(--bg-card);border:1px solid ${colors[type] || 'rgba(139,92,246,0.3)'};border-radius:12px;color:var(--text-primary);font-size:0.9rem;display:flex;align-items:center;gap:12px;box-shadow:0 16px 48px rgba(0,0,0,0.5);z-index:99999;transform:translateY(100px);opacity:0;transition:all 0.4s ease;`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; });
  setTimeout(() => { toast.style.transform = 'translateY(100px)'; toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3500);
}

// ============================================================
// SAVE / UNSAVE CONTACTS
// ============================================================
async function toggleSaveAd(adId) {
  if (!currentUser) { showToast('Accedi per salvare i contatti', 'warning'); openLogin(); return; }
  const token = localStorage.getItem('authToken');
  try {
    const existing = await sbGet('saved_contacts', `select=id&user_id=eq.${currentUser.id}&ad_id=eq.${adId}`, token);
    if (existing && existing.length > 0) {
      await sbDelete('saved_contacts', { id: existing[0].id }, token);
      showToast('Rimosso dai contatti salvati', 'success');
    } else {
      await sbPost('saved_contacts', { user_id: currentUser.id, ad_id: adId }, token);
      showToast('Salvato nella rubrica!', 'success');
    }
    loadSavedContacts();
  } catch (e) { showToast('Errore', 'error'); }
}

async function loadSavedContacts() {
  if (!currentUser) return;
  const token = localStorage.getItem('authToken');
  try {
    const contacts = await sbGet('saved_contacts', `select=ad_id&user_id=eq.${currentUser.id}&order=created_at.desc&limit=50`, token);
    savedAdsList = contacts.map(c => c.ad_id) || [];
  } catch (e) { savedAdsList = []; }
}

// ============================================================
// VETRINA — SPONSORIZZAZIONE
// ============================================================
const sponsorPlans = {
  '1day': { name: 'Vetrina Express', duration: '1 Giorno', price: 4.95, originalPrice: 4.95, badge: 'BASE' },
  '3days': { name: 'Vetrina Plus', duration: '3 Giorni', price: 9.95, originalPrice: 14.85, badge: 'PIÙ SCELTO' },
  '7days': { name: 'Vetrina Premium', duration: '7 Giorni', price: 19.95, originalPrice: 34.65, badge: 'PREMIUM' },
  '30days': { name: 'Vetrina Gold', duration: '30 Giorni', price: 49.95, originalPrice: 99.90, badge: 'TOP' }
};
let selectedPlan = '3days';
let selectedAdId = null;

function selectPlan(planId) {
  selectedPlan = planId;
  document.querySelectorAll('.pricing-card').forEach(c => c.style.borderColor = 'transparent');
  const card = document.querySelector(`.pricing-card[data-plan="${planId}"]`);
  if (card) card.style.borderColor = 'var(--primary)';
}

function openSponsor(planId) {
  selectedPlan = planId || '3days';
  selectedAdId = null;
  document.getElementById('sponsorModal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
  showSponsorStep(1);
  loadSponsorAds();
}
function closeSponsor() {
  document.getElementById('sponsorModal')?.classList.remove('active');
  document.body.style.overflow = 'visible';
  showSponsorStep(1);
}
document.getElementById('sponsorModal')?.addEventListener('click', function (e) { if (e.target === this) closeSponsor(); });

async function loadSponsorAds() {
  const list = document.getElementById('sponsorAdsList');
  if (!list) return;
  list.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Caricamento...</div>';
  try {
    const ads = await sbGet('ads', 'select=*&is_active=eq.true&limit=6');
    list.innerHTML = '';
    if (!ads || ads.length === 0) {
      list.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Nessun annuncio. <a href="#" onclick="closeSponsor();openPublish();return false;" style="color:var(--primary-light)">Pubblica ora</a></div>';
      return;
    }
    ads.slice(0, 6).forEach(ad => {
      const item = document.createElement('div');
      item.className = 'sponsor-ad-item';
      item.innerHTML = `<img src="${ad.image || 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200'}" alt=""><div class="ad-info"><strong>${ad.title}</strong><span>${ad.city || ''} • ${(ad.category || '').replace(/-/g, ' ')}</span></div><i class="fas fa-check-circle" style="margin-left:auto;color:transparent"></i>`;
      item.onclick = function () {
        document.querySelectorAll('.sponsor-ad-item').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        this.querySelector('.fa-check-circle').style.color = 'var(--primary)';
        selectedAdId = ad.id;
        setTimeout(() => nextSponsorStep(2), 500);
      };
      list.appendChild(item);
    });
  } catch (e) { list.innerHTML = '<div style="padding:20px;color:var(--text-muted)">Nessun annuncio disponibile</div>'; }
}

function showSponsorStep(step) {
  document.querySelectorAll('.sponsor-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active', 'done');
    if (s === step) el.classList.add('active');
    else if (s < step) el.classList.add('done');
  });
  for (let i = 1; i <= 4; i++) {
    const c = document.getElementById('sponsorStep' + i);
    if (c) c.style.display = i === step ? 'block' : 'none';
  }
  if (step === 2) updateSponsorSummary();
  if (step === 3) updatePayAmount();
}
function nextSponsorStep(step) { showSponsorStep(step); }

function updateSponsorSummary() {
  const plan = sponsorPlans[selectedPlan];
  if (!plan) return;
  document.getElementById('sponsorSummary').innerHTML = `
    <div class="summary-row"><span class="summary-label">Piano</span><span class="summary-value">${plan.name}</span></div>
    <div class="summary-row"><span class="summary-label">Durata</span><span class="summary-value">${plan.duration}</span></div>
    <div class="summary-row total"><span class="summary-label">Totale</span><span class="summary-value">€${plan.price.toFixed(2)}</span></div>
    <div style="margin-top:12px;padding:10px 14px;background:rgba(16,185,129,0.1);border-radius:8px;font-size:0.8rem;color:#10b981;text-align:center;"><i class="fas fa-check-circle"></i> Risparmi €${(plan.originalPrice - plan.price).toFixed(2)}!</div>`;
}
function updatePayAmount() {
  const plan = sponsorPlans[selectedPlan];
  if (plan) document.getElementById('sponsorPayAmount').textContent = plan.price.toFixed(2);
}
function selectPayment(el, type) {
  document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
  el.classList.add('active');
}

setTimeout(() => {
  const vl = document.querySelector('.nav-link[data-section="vetrina"]');
  if (vl) vl.addEventListener('click', () => document.getElementById('vetrina')?.scrollIntoView({ behavior: 'smooth' }));
}, 500);

// ============================================================
// ROUTER
// ============================================================
function initRouter() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page');
  if (page === 'category') {
    const cat = params.get('slug') || 'donna-cerca-uomo';
    const city = params.get('city') || '';
    showCategoryPage(cat, city);
  } else if (page === 'ad') {
    const id = params.get('id');
    if (id) showAdDetail(id);
  } else if (page === 'profile') {
    showProfilePage();
  } else if (page === 'myads') {
    showMyAdsPage();
  } else if (page === 'contacts') {
    showContactsPage();
  } else if (page === 'admin') {
    showAdminPage();
  }
}

function navigateTo(path) {
  const base = window.location.origin + window.location.pathname.replace(/\/+$/, '');
  window.history.pushState({}, '', base + path);
  initRouter();
}

function backToHome() {
  window.history.pushState({}, '', window.location.pathname.replace(/\/+$/, ''));
  document.querySelectorAll('section.page-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.home-section').forEach(s => s.style.display = '');
  window.scrollTo(0, 0);
}

// ============================================================
// CATEGORY PAGE
// ============================================================
function showCategoryPage(category, city) {
  document.querySelectorAll('.home-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('section.page-section').forEach(s => s.style.display = 'none');
  document.getElementById('categoryPage').style.display = 'block';
  const title = document.getElementById('pageTitle');
  if (title) title.textContent = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + (city ? ' a ' + city : '');

  const grid = document.getElementById('categoryAdsGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1"><i class="fas fa-spinner fa-spin"></i></div>';

  let query = 'select=*&is_active=eq.true&order=is_sponsored.desc.nullslast,is_premium.desc.nullslast,created_at.desc.nullslast';
  if (category) query += '&category=eq.' + category;
  if (city) query += '&city=ilike.' + city;

  sbGet('ads', query).then(ads => {
    grid.innerHTML = '';
    if (!ads || ads.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-search"></i><h3>Nessun annuncio</h3></div>';
      return;
    }
    ads.forEach(ad => { const card = createAdCard(ad); card.onclick = () => navigateTo('/?page=ad&id=' + ad.id); grid.appendChild(card); });
  }).catch(() => { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>Errore caricamento</p></div>'; });
}

// ============================================================
// AD DETAIL PAGE
// ============================================================
async function showAdDetail(adId) {
  document.querySelectorAll('.home-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('section.page-section').forEach(s => s.style.display = 'none');
  document.getElementById('adDetailPage').style.display = 'block';

  const container = document.getElementById('adDetailContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin fa-3x"></i></div>';

  try {
    const ads = await sbGet('ads', 'select=*&id=eq.' + adId);
    if (!ads || ads.length === 0) { container.innerHTML = '<h2>Annuncio non trovato</h2>'; return; }

    const ad = ads[0];
    const images = ad.images && ad.images.length > 0 ? ad.images : (ad.image ? [ad.image] : []);
    const addonBadges = [];
    if (ad.is_sponsored) addonBadges.push('<span class="ad-badge sponsored"><i class="fas fa-star"></i> SuperTop</span>');
    if (ad.is_premium) addonBadges.push('<span class="ad-badge premium"><i class="fas fa-crown"></i> Premium</span>');
    if (ad.is_verified) addonBadges.push('<span class="ad-badge verified"><i class="fas fa-check-circle"></i> Verificato</span>');
    if (ad.has_video) addonBadges.push('<span class="ad-badge video"><i class="fas fa-video"></i> Video</span>');

    const photoClass = ad.photo_classification || 'safe';
    const classLabel = { safe: 'Safe ✅', hot: 'Hot 🔥', hard: 'Hard 🔞' };

    container.innerHTML = `
      <div class="ad-detail-layout">
        <div class="ad-detail-gallery">
          <div class="ad-detail-main-img">${images.length > 0 ? `<img src="${images[0]}" alt="${ad.title}" id="detailMainImg">` : '<div class="no-photo"><i class="fas fa-user"></i></div>'}</div>
          ${images.length > 1 ? `<div class="ad-detail-thumbs">${images.map((img, i) => `<img src="${img}" onclick="document.getElementById('detailMainImg').src='${img}'" style="width:60px;height:60px;object-fit:cover;border-radius:8px;cursor:pointer;${i === 0 ? 'border:2px solid var(--primary)' : ''}">`).join('')}</div>` : ''}
          <div class="photo-class-badge ${photoClass}">${classLabel[photoClass] || 'Safe ✅'}</div>
        </div>
        <div class="ad-detail-info">
          <div class="ad-detail-badges">${addonBadges.join('')}</div>
          <h1 class="ad-detail-title">${ad.title}</h1>
          <div class="ad-detail-meta">
            <span><i class="fas fa-map-marker-alt"></i> ${ad.city || 'N/D'}</span>
            <span><i class="fas fa-user"></i> ${ad.age || '?'} anni</span>
            ${ad.price ? `<span class="ad-detail-price"><i class="fas fa-tag"></i> ${ad.price}</span>` : ''}
            <span><i class="fas fa-eye"></i> ${ad.views || 0} visualizzazioni</span>
          </div>
          <div class="ad-detail-rating">
            ${'<i class="fas fa-star" style="color:#f59e0b"></i>'.repeat(Math.round(ad.rating || 0))}
            <span>${ad.rating || '0'} (${ad.review_count || 0} recensioni)</span>
          </div>
          <div class="ad-detail-desc">
            <p>${(ad.description || '').replace(/\n/g, '<br>')}</p>
          </div>
          <div class="ad-detail-actions">
            ${currentUser
              ? `<button class="btn btn-primary" onclick="showToast('Messaggio inviato!', 'success')"><i class="fas fa-envelope"></i> Contatta</button>
                 <button class="btn btn-outline" onclick="toggleSaveAd('${ad.id}')"><i class="fas fa-bookmark"></i> Salva</button>`
              : `<button class="btn btn-primary" onclick="openLogin()"><i class="fas fa-lock"></i> Accedi per contattare</button>`}
            <button class="btn btn-outline" onclick="showToast('Segnalazione inviata', 'success')"><i class="fas fa-flag"></i> Segnala</button>
          </div>
          ${currentUser && currentUser.id === ad.user_id ? `
          <div style="margin-top:16px;padding:16px;background:rgba(139,92,246,0.08);border-radius:12px">
            <strong style="color:var(--primary-light)"><i class="fas fa-tools"></i> Gestione annuncio</strong>
            <div style="display:flex;gap:8px;margin-top:8px">
              <button class="btn btn-sm btn-outline" onclick="showToast('Modifica in arrivo!', 'success')"><i class="fas fa-edit"></i> Modifica</button>
              <button class="btn btn-sm btn-outline" onclick="openAddonPurchaseFromDetail()"><i class="fas fa-bolt"></i> Potenzia</button>
            </div>
          </div>` : ''}
        </div>
      </div>
      <div style="margin-top:20px;text-align:center;color:var(--text-muted);font-size:0.8rem">Annuncio #${ad.id.slice(0,8)} • Pubblicato il ${new Date(ad.created_at).toLocaleDateString('it-IT')}</div>`;
  } catch (e) { container.innerHTML = '<h2>Errore caricamento annuncio</h2>'; }
}

function openAddonPurchaseFromDetail() {
  closeSponsor();
  openShop();
}

// ============================================================
// PROFILE PAGE
// ============================================================
function showProfilePage() {
  document.querySelectorAll('.home-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('section.page-section').forEach(s => s.style.display = 'none');
  document.getElementById('profilePage').style.display = 'block';
  const content = document.getElementById('profileContent');
  if (!content) return;
  if (!currentUser) { content.innerHTML = '<div class="empty-state"><i class="fas fa-lock"></i><h3>Devi effettuare il login</h3></div>'; return; }
  content.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar"><i class="fas fa-user-circle" style="font-size:5rem;color:var(--primary)"></i></div>
      <h2>${currentUser.name} ${currentUser.surname || ''}</h2>
      <p style="color:var(--text-muted)">${currentUser.email}</p>
      <p><i class="fas fa-map-marker-alt"></i> ${currentUser.city || 'N/D'}</p>
      <div class="profile-stats-row">
        <div class="profile-stat"><i class="fas fa-coins" style="color:var(--accent)"></i> ${currentUser.credits || 0} crediti</div>
        <div class="profile-stat"><i class="fas fa-check-circle" style="color:${currentUser.isVerified ? '#10b981' : 'var(--text-muted)'}"></i> ${currentUser.isVerified ? 'Verificato ✅' : 'Non verificato'}</div>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px;justify-content:center">
        <button class="btn btn-primary" onclick="openShop()"><i class="fas fa-coins"></i> Acquista crediti</button>
        <button class="btn btn-outline" onclick="navigateTo('/?page=myads')"><i class="fas fa-list"></i> I miei annunci</button>
      </div>
    </div>`;
}

// ============================================================
// MY ADS PAGE
// ============================================================
function showMyAdsPage() {
  document.querySelectorAll('.home-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('section.page-section').forEach(s => s.style.display = 'none');
  document.getElementById('myAdsPage').style.display = 'block';
  const container = document.getElementById('myAdsContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
  if (!currentUser) { container.innerHTML = '<div class="empty-state"><i class="fas fa-lock"></i><h3>Devi effettuare il login</h3></div>'; return; }
  const token = localStorage.getItem('authToken');
  sbGet('ads', 'select=*&user_id=eq.' + currentUser.id + '&order=created_at.desc', token).then(ads => {
    container.innerHTML = '';
    if (!ads || ads.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Nessun annuncio</h3><button class="btn btn-primary" onclick="closeSponsor();openPublish()"><i class="fas fa-plus"></i> Pubblica il primo</button></div>';
      return;
    }
    ads.forEach(ad => container.appendChild(createAdCard(ad)));
  }).catch(() => { container.innerHTML = '<div class="empty-state"><p>Errore caricamento</p></div>'; });
}

// ============================================================
// CONTACTS PAGE (Rubrica)
// ============================================================
function showContactsPage() {
  document.querySelectorAll('.home-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('section.page-section').forEach(s => s.style.display = 'none');
  document.getElementById('contactsPage').style.display = 'block';
  const container = document.getElementById('contactsContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
  if (!currentUser) { container.innerHTML = '<div class="empty-state"><i class="fas fa-lock"></i><h3>Devi effettuare il login</h3></div>'; return; }
  const token = localStorage.getItem('authToken');
  sbGet('saved_contacts', 'select=ad_id&user_id=eq.' + currentUser.id + '&order=created_at.desc', token).then(async contacts => {
    if (!contacts || contacts.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-bookmark"></i><h3>Rubrica vuota</h3><p>Salva gli annunci che ti interessano</p></div>';
      return;
    }
    const adIds = contacts.map(c => c.ad_id);
    const ads = await sbGet('ads', 'select=*&id=in.(' + adIds.join(',') + ')&limit=50');
    container.innerHTML = '';
    if (ads) ads.forEach(ad => container.appendChild(createAdCard(ad)));
  }).catch(() => { container.innerHTML = '<div class="empty-state"><p>Errore caricamento</p></div>'; });
}

// ============================================================
// AOS
// ============================================================
function initAOS() { if (typeof AOS !== 'undefined') AOS.init({ duration: 800, once: true, offset: 80, easing: 'ease-out-cubic' }); }

// ============================================================
// ============================================================
// SUPPORT MODAL
// ============================================================
function openSupport() {
  document.getElementById('supportModal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeSupport() {
  document.getElementById('supportModal')?.classList.remove('active');
  document.body.style.overflow = 'visible';
}
document.getElementById('supportModal')?.addEventListener('click', function(e) { if (e.target === this) closeSupport(); });

async function sendSupportMessage(e) {
  e.preventDefault();
  const msg = document.getElementById('supportMessage')?.value.trim();
  const email = document.getElementById('supportEmail')?.value.trim() || currentUser?.email || '';
  const btn = document.getElementById('supportBtn');
  if (!msg) { showToast('Scrivi un messaggio', 'warning'); return; }
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Invio...';
  
  try {
    // Per ora salviamo su una tabella support_messages
    const token = localStorage.getItem('authToken');
    await sbPost('support_messages', {
      user_id: currentUser?.id || null,
      email: email,
      message: msg,
      created_at: new Date().toISOString()
    }, token);
    showToast('✅ Messaggio inviato! Riceverai risposta via email.', 'success');
    document.getElementById('supportMessage').value = '';
    closeSupport();
  } catch(e) {
    showToast('Errore invio: ' + (e.message || 'Riprova'), 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Invia messaggio';
  }
}

// ============================================================
// ADMIN PAGE
// ============================================================
// ============================================================
// ADMIN PANEL — CONTROLLO TOTALE DEL SITO
// ============================================================
let adminState = { tab: 'dashboard', search: '', data: {} };

function showAdminPage() {
  document.querySelectorAll('.home-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('section.page-section').forEach(s => s.style.display = 'none');
  document.getElementById('adminPage').style.display = 'block';
  
  if (!currentUser || !isAdmin(currentUser.email)) {
    document.getElementById('adminContent').innerHTML = '<div class="empty-state"><i class="fas fa-lock"></i><h3>Accesso negato</h3></div>';
    return;
  }
  
  renderAdminNav();
  loadAdminData();
}

function renderAdminNav() {
  const nav = document.getElementById('adminNav');
  if (!nav) return;
  const tabs = [
    { id: 'dashboard', icon: 'fa-chart-bar', label: 'Dashboard' },
    { id: 'users', icon: 'fa-users', label: 'Utenti' },
    { id: 'ads', icon: 'fa-newspaper', label: 'Annunci' },
    { id: 'categories', icon: 'fa-tags', label: 'Categorie' },
    { id: 'support', icon: 'fa-headset', label: 'Supporto' },
    { id: 'transactions', icon: 'fa-coins', label: 'Transazioni' }
  ];
  nav.innerHTML = tabs.map(t => 
    `<button class="admin-tab ${adminState.tab === t.id ? 'active' : ''}" onclick="switchAdminTab('${t.id}')">
      <i class="fas ${t.icon}"></i> ${t.label}
    </button>`
  ).join('');
}

function switchAdminTab(tab) {
  adminState.tab = tab;
  renderAdminNav();
  loadAdminData();
}

function loadAdminData() {
  const container = document.getElementById('adminContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Caricamento...</div>';
  
  const token = localStorage.getItem('authToken');
  
  switch(adminState.tab) {
    case 'dashboard': loadAdminDashboard(container, token); break;
    case 'users': loadAdminUsers(container, token); break;
    case 'ads': loadAdminAds(container, token); break;
    case 'categories': loadAdminCategories(container, token); break;
    case 'support': loadAdminSupport(container, token); break;
    case 'transactions': loadAdminTransactions(container, token); break;
    default: loadAdminDashboard(container, token);
  }
}

// --- DASHBOARD ---
function loadAdminDashboard(container, token) {
  Promise.all([
    sbGet('profiles', 'select=*&order=created_at.desc', token),
    sbGet('ads', 'select=*&order=created_at.desc', token),
    sbGet('credit_transactions', 'select=*&order=created_at.desc', token),
    sbGet('support_messages', 'select=*&order=created_at.desc', token)
  ]).then(([profiles, ads, transactions, messages]) => {
    const totalUsers = profiles?.length || 0;
    const totalAds = ads?.length || 0;
    const totalVerified = profiles?.filter(p => p.is_verified).length || 0;
    const totalPending = messages?.filter(m => !m.is_read).length || 0;
    const totalCreditsSold = transactions?.filter(t => t.type === 'purchase').reduce((s, t) => s + Math.abs(t.amount), 0) || 0;
    const totalRevenue = (totalCreditsSold * 0.5).toFixed(0);
    
    // Categorie con conteggio annunci
    const catCount = {};
    (ads || []).forEach(a => {
      catCount[a.category] = (catCount[a.category] || 0) + 1;
    });
    const topCats = Object.entries(catCount).sort((a,b) => b[1] - a[1]).slice(0, 5);
    
    container.innerHTML = `
      <div class="admin-stats-grid">
        <div class="admin-stat-card premium"><i class="fas fa-users"></i><strong>${totalUsers}</strong><span>Utenti registrati</span></div>
        <div class="admin-stat-card" style="border-color:var(--primary)"><i class="fas fa-newspaper"></i><strong>${totalAds}</strong><span>Annunci attivi</span></div>
        <div class="admin-stat-card" style="border-color:#10b981"><i class="fas fa-check-circle"></i><strong>${totalVerified}</strong><span>Profili verificati</span></div>
        <div class="admin-stat-card" style="border-color:var(--accent)"><i class="fas fa-coins"></i><strong>€${totalRevenue}</strong><span>Vendite crediti</span></div>
        <div class="admin-stat-card" style="border-color:#f59e0b"><i class="fas fa-headset"></i><strong>${totalPending}</strong><span>Messaggi in sospeso</span></div>
        <div class="admin-stat-card" style="border-color:#ef4444"><i class="fas fa-chart-line"></i><strong>${totalCreditsSold}</strong><span>Crediti acquistati</span></div>
      </div>
      
      <div class="admin-charts-row">
        <div class="admin-chart-card">
          <h4><i class="fas fa-tags"></i> Annunci per categoria</h4>
          <div style="margin-top:12px">${topCats.map(([cat, count]) => 
            `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.85rem">
              <span style="color:var(--text-secondary);text-transform:capitalize">${cat.replace(/-/g, ' ')}</span>
              <span style="color:var(--text-primary);font-weight:600">${count}</span>
            </div>`
          ).join('')}</div>
        </div>
        <div class="admin-chart-card">
          <h4><i class="fas fa-clock"></i> Ultimi messaggi supporto</h4>
          <div style="margin-top:12px">${(messages || []).slice(0, 5).map(m => 
            `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.8rem">
              <div style="display:flex;justify-content:space-between">
                <span style="color:var(--text-muted)">${m.email || 'Anonimo'}</span>
                <span style="color:${m.is_read ? 'var(--text-muted)' : '#f59e0b'};font-size:0.65rem">${m.is_read ? 'Letto' : 'Nuovo!'}</span>
              </div>
              <p style="margin:4px 0 0;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(m.message || '').slice(0, 80)}</p>
            </div>`
          ).join('') || '<p style="color:var(--text-muted);font-size:0.85rem">Nessun messaggio</p>'}</div>
        </div>
      </div>
    `;
  }).catch(() => {
    container.innerHTML = '<div class="empty-state"><p>Errore caricamento dashboard</p></div>';
  });
}

// --- UTENTI ---
function loadAdminUsers(container, token) {
  sbGet('profiles', 'select=*&order=created_at.desc', token).then(profiles => {
    const pList = profiles || [];
    container.innerHTML = `
      <div class="admin-toolbar">
        <input type="text" id="adminUserSearch" class="form-control" placeholder="Cerca utente per nome o email..." style="max-width:300px" oninput="adminSearchUsers()">
        <span style="color:var(--text-muted);font-size:0.85rem">${pList.length} utenti totali</span>
      </div>
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead><tr>
            <th>Nome</th><th>Email</th><th>Data</th><th>Crediti</th><th>Verificato</th><th>Telefono</th><th>Azioni</th>
          </tr></thead>
          <tbody id="adminUsersTbody">
            ${pList.map(p => `
              <tr class="admin-user-row" data-name="${(p.name || '').toLowerCase()}" data-email="${(p.email || p.id || '').toLowerCase()}">
                <td><strong>${p.name || '?'}</strong>${p.surname ? ' ' + p.surname : ''}</td>
                <td><small>${p.id?.slice(0, 10) || '?'}...</small></td>
                <td>${new Date(p.created_at).toLocaleDateString('it-IT')}</td>
                <td><span class="admin-credits-badge">${p.credits || 0}</span></td>
                <td>${p.is_verified ? '✅' : '<span style="color:var(--text-muted)">❌</span>'}</td>
                <td>${p.phone || '<span style="color:var(--text-muted)">—</span>'}</td>
                <td>
                  <div class="admin-actions">
                    <button class="btn btn-sm btn-outline" onclick="adminAddCredits('${p.id}', '${p.name || '?'}')" title="Aggiungi crediti"><i class="fas fa-plus"></i></button>
                    <button class="btn btn-sm ${p.is_verified ? 'btn-ghost' : 'btn-outline'}" onclick="adminToggleVerify('${p.id}', ${p.is_verified})" title="${p.is_verified ? 'Rimuovi verifica' : 'Verifica'}">
                      ${p.is_verified ? '👑' : '✅'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminDeleteUser('${p.id}', '${p.name || '?'}')" title="Elimina"><i class="fas fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }).catch(() => {
    container.innerHTML = '<div class="empty-state"><p>Errore caricamento utenti</p></div>';
  });
}

function adminSearchUsers() {
  const q = (document.getElementById('adminUserSearch')?.value || '').toLowerCase();
  document.querySelectorAll('.admin-user-row').forEach(row => {
    const name = row.dataset.name || '';
    const email = row.dataset.email || '';
    row.style.display = (name.includes(q) || email.includes(q)) ? '' : 'none';
  });
}

function adminAddCredits(userId, userName) {
  const amount = prompt('Quanti crediti vuoi aggiungere a ' + userName + '?', '20');
  if (!amount || isNaN(parseInt(amount)) || parseInt(amount) <= 0) return;
  const token = localStorage.getItem('authToken');
  sbGet('profiles', 'select=credits&id=eq.' + userId, token).then(profiles => {
    const cur = (profiles?.[0]?.credits || 0);
    const newCredits = cur + parseInt(amount);
    sbPatch('profiles', { credits: newCredits }, { id: userId }, token).then(() => {
      sbPost('credit_transactions', { user_id: userId, amount: parseInt(amount), type: 'admin', description: 'Admin: aggiunti ' + amount + ' crediti' }, token);
      showToast('✅ ' + amount + ' crediti aggiunti a ' + userName, 'success');
      loadAdminData();
    });
  });
}

function adminToggleVerify(userId, current) {
  if (!confirm((current ? 'Rimuovere' : 'Confermare') + ' la verifica per questo utente?')) return;
  const token = localStorage.getItem('authToken');
  sbPatch('profiles', { is_verified: !current }, { id: userId }, token).then(() => {
    showToast('✅ Verifica ' + (!current ? 'attivata' : 'rimossa'), 'success');
    loadAdminData();
  });
}

function adminDeleteUser(userId, userName) {
  if (!confirm('⚠️ Eliminare PERMANENTEMTE ' + userName + '? Tutti i suoi annunci verranno eliminati.')) return;
  const token = localStorage.getItem('authToken');
  Promise.all([
    sbDelete('ads', { profile_id: userId }, token),
    sbDelete('credit_transactions', { user_id: userId }, token),
    sbDelete('saved_contacts', { user_id: userId }, token),
    sbDelete('profiles', { id: userId }, token)
  ]).then(() => {
    showToast('🗑️ Utente ' + userName + ' eliminato', 'success');
    loadAdminData();
  }).catch(e => showToast('Errore: ' + e.message, 'error'));
}

// --- ANNUNCI ---
function loadAdminAds(container, token) {
  sbGet('ads', 'select=*&order=created_at.desc', token).then(ads => {
    const aList = ads || [];
    container.innerHTML = `
      <div class="admin-toolbar">
        <span style="color:var(--text-muted);font-size:0.85rem">${aList.length} annunci totali</span>
      </div>
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead><tr>
            <th>Titolo</th><th>Categoria</th><th>Città</th><th>Premium</th><th>Sponsor</th><th>Boost</th><th>Data</th><th>Azioni</th>
          </tr></thead>
          <tbody>
            ${aList.map(a => `
              <tr>
                <td><strong>${(a.title || '').slice(0, 30)}</strong></td>
                <td style="font-size:0.7rem;text-transform:capitalize">${(a.category || '').replace(/-/g, ' ')}</td>
                <td>${a.city || '?'}</td>
                <td>${a.is_premium ? '👑' : '—'}</td>
                <td>${a.is_sponsored ? '⭐' : '—'}</td>
                <td>${a.boost_count || 0}/${a.boost_available || 0}</td>
                <td>${new Date(a.created_at).toLocaleDateString('it-IT')}</td>
                <td>
                  <div class="admin-actions">
                    <button class="btn btn-sm btn-outline" onclick="adminTogglePremium('${a.id}', ${a.is_premium})" title="Toggle Premium">👑</button>
                    <button class="btn btn-sm btn-outline" onclick="adminToggleSponsored('${a.id}', ${a.is_sponsored})" title="Toggle Sponsor">⭐</button>
                    <button class="btn btn-sm ${a.is_active ? 'btn-ghost' : 'btn-outline'}" onclick="adminToggleActive('${a.id}', ${a.is_active})">
                      ${a.is_active ? '✅' : '🚫'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminDeleteAd('${a.id}', '${(a.title || '').slice(0, 20)}')"><i class="fas fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }).catch(() => {
    container.innerHTML = '<div class="empty-state"><p>Errore caricamento annunci</p></div>';
  });
}

function adminTogglePremium(adId, current) {
  const token = localStorage.getItem('authToken');
  sbPatch('ads', { is_premium: !current }, { id: adId }, token).then(() => {
    showToast('✅ Premium ' + (!current ? 'attivato' : 'disattivato'), 'success');
    loadAdminData();
  });
}

function adminToggleSponsored(adId, current) {
  const token = localStorage.getItem('authToken');
  sbPatch('ads', { is_sponsored: !current }, { id: adId }, token).then(() => {
    showToast('⭐ Sponsor ' + (!current ? 'attivato' : 'disattivato'), 'success');
    loadAdminData();
  });
}

function adminToggleActive(adId, current) {
  const token = localStorage.getItem('authToken');
  sbPatch('ads', { is_active: !current }, { id: adId }, token).then(() => {
    showToast((!current ? '✅ Annuncio attivato' : '🚫 Annuncio disattivato'), 'success');
    loadAdminData();
  });
}

function adminDeleteAd(adId, title) {
  if (!confirm('Eliminare l\'annuncio "' + title + '"?')) return;
  const token = localStorage.getItem('authToken');
  sbDelete('ads', { id: adId }, token).then(() => {
    showToast('🗑️ Annuncio eliminato', 'success');
    loadAdminData();
  });
}


// --- CATEGORIE ---
function loadAdminCategories(container, token) {
  sbGet('categories', 'select=*&order=name.asc', token).then(cats => {
    const catList = cats || [];
    container.innerHTML = `
      <div class="admin-toolbar">
        <span style="color:var(--text-muted);font-size:0.85rem">${catList.length} categorie</span>
        <button class="btn btn-primary btn-sm" onclick="adminAddCategory()"><i class="fas fa-plus"></i> Nuova categoria</button>
      </div>
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead><tr><th>Nome</th><th>Slug</th><th>Descrizione</th><th>Azioni</th></tr></thead>
          <tbody>
            ${catList.map(c => `
              <tr>
                <td><strong>${c.name || '?'}</strong></td>
                <td style="color:var(--text-muted);font-size:0.8rem">${c.slug || c.id || '?'}</td>
                <td style="font-size:0.8rem;color:var(--text-secondary)">${c.description || '—'}</td>
                <td><button class="btn btn-sm btn-danger" onclick="adminDeleteCategory('${c.slug || c.id}')"><i class="fas fa-trash"></i></button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }).catch(() => {
    container.innerHTML = '<div class="empty-state"><p>Errore caricamento categorie</p></div>';
  });
}

function adminAddCategory() {
  const name = prompt('Nome nuova categoria:');
  if (!name) return;
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const desc = prompt('Descrizione:');
  const token = localStorage.getItem('authToken');
  sbPost('categories', { name, slug, description: desc || '' }, token).then(() => {
    showToast('✅ Categoria creata', 'success');
    loadAdminData();
  }).catch(e => showToast('Errore: ' + e.message, 'error'));
}

function adminDeleteCategory(slug) {
  if (!confirm('Eliminare la categoria "' + slug + '"?')) return;
  const token = localStorage.getItem('authToken');
  sbDelete('categories', { slug }, token).then(() => {
    showToast('🗑️ Categoria eliminata', 'success');
    loadAdminData();
  });
}

// --- SUPPORTO ---
function loadAdminSupport(container, token) {
  sbGet('support_messages', 'select=*&order=created_at.desc', token).then(msgs => {
    const mList = msgs || [];
    container.innerHTML = `
      <div class="admin-toolbar">
        <span style="color:var(--text-muted);font-size:0.85rem">${mList.length} messaggi</span>
        <button class="btn btn-sm btn-outline" onclick="adminMarkAllRead()"><i class="fas fa-check-double"></i> Segna tutti letti</button>
      </div>
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead><tr><th>Email</th><th>Messaggio</th><th>Data</th><th>Stato</th><th>Azioni</th></tr></thead>
          <tbody>
            ${mList.map(m => `
              <tr style="${m.is_read ? '' : 'background:rgba(245,158,11,0.05)'}">
                <td><small>${m.email || 'Anonimo'}</small></td>
                <td style="max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(m.message || '').slice(0, 80)}</td>
                <td style="font-size:0.75rem">${new Date(m.created_at).toLocaleDateString('it-IT') + ' ' + new Date(m.created_at).toLocaleTimeString('it-IT', {hour:'2-digit',minute:'2-digit'})}</td>
                <td>${m.is_read ? '✅ Letto' : '🆕 Nuovo'}</td>
                <td>
                  <div class="admin-actions">
                    <button class="btn btn-sm btn-outline" onclick="alert('Messaggio: ' + ${JSON.stringify(m.message)})"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-ghost" onclick="adminMarkRead('${m.id}', ${m.is_read})"><i class="fas ${m.is_read ? 'fa-envelope' : 'fa-envelope-open'}"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="adminDeleteMessage('${m.id}')"><i class="fas fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Nessun messaggio</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }).catch(() => {
    container.innerHTML = '<div class="empty-state"><p>Errore caricamento messaggi</p></div>';
  });
}

function adminMarkRead(msgId, current) {
  const token = localStorage.getItem('authToken');
  sbPatch('support_messages', { is_read: !current }, { id: msgId }, token).then(() => loadAdminData());
}

function adminMarkAllRead() {
  const token = localStorage.getItem('authToken');
  sbGet('support_messages', 'select=id&is_read=eq.false', token).then(msgs => {
    Promise.all((msgs || []).map(m => sbPatch('support_messages', { is_read: true }, { id: m.id }, token)))
      .then(() => { showToast('✅ Tutti segnati come letti', 'success'); loadAdminData(); });
  });
}

function adminDeleteMessage(msgId) {
  if (!confirm('Eliminare questo messaggio?')) return;
  const token = localStorage.getItem('authToken');
  sbDelete('support_messages', { id: msgId }, token).then(() => {
    showToast('🗑️ Messaggio eliminato', 'success');
    loadAdminData();
  });
}

// --- TRANSAZIONI ---
function loadAdminTransactions(container, token) {
  sbGet('credit_transactions', 'select=*&order=created_at.desc&limit=100', token).then(txns => {
    const tList = txns || [];
    container.innerHTML = `
      <div class="admin-toolbar">
        <span style="color:var(--text-muted);font-size:0.85rem">${tList.length} transazioni</span>
      </div>
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead><tr><th>Utente</th><th>Importo</th><th>Tipo</th><th>Descrizione</th><th>Data</th></tr></thead>
          <tbody>
            ${tList.map(t => `
              <tr>
                <td><small>${t.user_id?.slice(0, 10) || '?'}...</small></td>
                <td style="color:${(t.amount || 0) > 0 ? '#10b981' : '#ef4444'};font-weight:700">${(t.amount || 0) > 0 ? '+' : ''}${t.amount}</td>
                <td><span class="admin-type-badge" style="background:${t.type === 'purchase' ? 'rgba(16,185,129,0.15)' : t.type === 'admin' ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.15)'};color:${t.type === 'purchase' ? '#10b981' : t.type === 'admin' ? '#f59e0b' : '#8b5cf6'}">${t.type || '?'}</span></td>
                <td style="font-size:0.8rem;color:var(--text-secondary)">${t.description || '—'}</td>
                <td style="font-size:0.75rem">${new Date(t.created_at).toLocaleDateString('it-IT')}</td>
              </tr>
            `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Nessuna transazione</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }).catch(() => {
    container.innerHTML = '<div class="empty-state"><p>Errore caricamento transazioni</p></div>';
  });
}

// ============================================================
// POPSTATE
// ============================================================
window.addEventListener('popstate', () => initRouter());

// ============================================================
// STRIPE — Gestione ritorno pagamento
// ============================================================
(function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success') {
    const credits = parseInt(params.get('credits')) || 0;
    const userId = sessionStorage.getItem('stripeUserId');
    
    if (userId && credits > 0 && currentUser && currentUser.id === userId) {
      const token = localStorage.getItem('authToken');
      sbGet('profiles', 'select=credits&id=eq.' + userId, token).then(profiles => {
        const cur = (profiles?.[0]?.credits || 0);
        sbPatch('profiles', { credits: cur + credits }, { id: userId }, token).then(() => {
          sbPost('credit_transactions', { user_id: userId, amount: credits, type: 'purchase', description: 'Stripe: acquisto ' + credits + ' crediti' }, token);
          currentUser.credits = (currentUser.credits || 0) + credits;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          updateUIForLoggedUser();
          showToast('✅ Pagamento ricevuto! ' + credits + ' crediti aggiunti.', 'success');
        });
      }).catch(() => {});
      sessionStorage.removeItem('stripeUserId');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }
})();

// Se l'utente torna dopo login, riprova
const _origHandleLogin = handleLogin;
handleLogin = async function(e) {
  await _origHandleLogin.call(this, e);
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success') {
    const credits = parseInt(params.get('credits')) || 0;
    const userId = sessionStorage.getItem('stripeUserId');
    if (userId && credits > 0 && currentUser && currentUser.id === userId) {
      const token = localStorage.getItem('authToken');
      sbGet('profiles', 'select=credits&id=eq.' + userId, token).then(profiles => {
        const cur = (profiles?.[0]?.credits || 0);
        sbPatch('profiles', { credits: cur + credits }, { id: userId }, token);
        sbPost('credit_transactions', { user_id: userId, amount: credits, type: 'purchase', description: 'Stripe: acquisto ' + credits + ' crediti' }, token);
        currentUser.credits = (currentUser.credits || 0) + credits;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUIForLoggedUser();
        showToast('✅ ' + credits + ' crediti attivati!', 'success');
        window.history.replaceState({}, '', window.location.pathname);
        sessionStorage.removeItem('stripeUserId');
      }).catch(() => {});
    }
  }
};
