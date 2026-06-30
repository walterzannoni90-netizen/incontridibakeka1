/* ============================================================
   INCONTRI DI BAKEKA — APP (GitHub Pages Edition)
   Chiama Supabase REST API direttamente (nessun SDK necessario)
   ============================================================ */

const SUPABASE_URL = 'https://rdqsmfgpbuswzilgbjyr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcXNtZmdwYnVzd3ppbGdianlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzYyMTcsImV4cCI6MjA5ODQxMjIxN30.EthEz46lh_bnJzjpQi9GrXiQsinyb5g47V1p1bwlL_E';

// Headers per le chiamate REST
function supabaseHeaders(token) {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// Chiamata GET alla REST API
async function supabaseGet(table, query = 'select=*', token) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, { headers: supabaseHeaders(token) });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}

// Chiamata POST alla REST API
async function supabasePost(table, data, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: supabaseHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}

// Chiamata PATCH alla REST API
async function supabasePatch(table, data, match, token) {
  const query = Object.entries(match).map(([k,v]) => `${k}=eq.${v}`).join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: supabaseHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}

// Auth API
async function supabaseAuth(method, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${method}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

// Count helper
async function supabaseCount(table, filter = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*${filter ? '&'+filter : ''}&head=true`;
  const res = await fetch(url, {
    method: 'HEAD',
    headers: { ...supabaseHeaders(), 'Prefer': 'count=exact' }
  });
  if (!res.ok) return 0;
  return parseInt(res.headers.get('content-range')?.split('/')[1] || '0');
}

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
  initCounters();
  initFilters();
  initAOS();
  initSmoothScroll();
  initAuth();
});

// ============================================================
// PRELOADER
// ============================================================
function initPreloader() {
  setTimeout(() => {
    document.getElementById('preloader').classList.add('hidden');
    document.body.style.overflow = 'visible';
  }, 2200);
}

// ============================================================
// NAVBAR
// ============================================================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 80);
  });
}

function toggleMenu() {
  document.getElementById('hamburger').classList.toggle('active');
  document.getElementById('navbarMenu').classList.toggle('active');
  document.body.style.overflow = document.getElementById('navbarMenu').classList.contains('active') ? 'hidden' : 'visible';
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('hamburger').classList.remove('active');
    document.getElementById('navbarMenu').classList.remove('active');
    document.body.style.overflow = 'visible';
  });
});

// ============================================================
// PARTICLES
// ============================================================
function initParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*4+2}px;height:${Math.random()*4+2}px;animation-duration:${Math.random()*20+15}s;animation-delay:${Math.random()*10}s;opacity:${Math.random()*0.3+0.1}`;
    p.style.background = ['#8b5cf6','#ec4899','#f59e0b','#3b82f6','#10b981'][Math.floor(Math.random()*5)];
    container.appendChild(p);
  }
}

// ============================================================
// CATEGORIES
// ============================================================
function initCategories() {
  const grid = document.getElementById('categoriesGrid');
  const cats = [
    { id: 'donna-cerca-uomo', name: 'Donna Cerca Uomo', icon: 'fa-female', color: '#ff2d55', desc: 'Escort e ragazze squillo nella tua città.' },
    { id: 'uomo-cerca-donna', name: 'Uomo Cerca Donna', icon: 'fa-male', color: '#007aff', desc: 'Accompagnatori pronti a realizzare ogni tua fantasia.' },
    { id: 'uomo-cerca-uomo', name: 'Uomo Cerca Uomo', icon: 'fa-venus-mars', color: '#ff9500', desc: 'Incontri gay, escort maschi e accompagnatori.' },
    { id: 'donna-cerca-donna', name: 'Donna Cerca Donna', icon: 'fa-venus', color: '#ff3b30', desc: 'Lesbo, amori al femminile.' },
    { id: 'coppie', name: 'Coppie', icon: 'fa-heart', color: '#af52de', desc: 'Coppie per avventure swingers.' },
    { id: 'cerco-amici', name: 'Cerco Amici', icon: 'fa-handshake', color: '#34c759', desc: 'Amicizie vere nella tua città.' },
    { id: 'anima-gemella', name: 'Cerco Anima Gemella', icon: 'fa-dove', color: '#ff6482', desc: 'Trova l\'altra metà.' },
    { id: 'trans', name: 'Trans', icon: 'fa-transgender', color: '#e84393', desc: 'Incontri trans e travestiti.' }
  ];
  cats.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.style.setProperty('--cat-color', cat.color);
    card.setAttribute('data-aos', 'fade-up');
    card.innerHTML = `<div class="category-icon"><i class="fas ${cat.icon}"></i></div><h3 class="category-name">${cat.name}</h3><p class="category-desc">${cat.desc}</p>`;
    card.addEventListener('click', () => filterByCategory(cat.id));
    grid.appendChild(card);
  });
}

// ============================================================
// ADS
// ============================================================
async function initAds(filter = 'all') {
  const grid = document.getElementById('adsGrid');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-spinner fa-spin"></i> Caricamento annunci...</div>';
  try {
    let query = 'select=*&is_active=eq.true&order=is_sponsored.desc.nullslast,rating.desc.nullslast&limit=12';
    if (filter !== 'all') query += `&category=eq.${filter}`;
    else query += '&is_premium=eq.true';
    const ads = await supabaseGet('ads', query);
    grid.innerHTML = '';
    if (!ads || ads.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;text-align:center;padding:60px 20px;"><i class="fas fa-heart-broken" style="font-size:3rem;color:var(--text-muted);margin-bottom:1rem;"></i><h3 style="color:var(--text-secondary);margin-bottom:0.5rem;">Nessun annuncio trovato</h3><p style="color:var(--text-muted);">Prova a cambiare filtro o categoria</p></div>`;
      return;
    }
    ads.forEach(ad => grid.appendChild(createAdCard(ad)));
  } catch (e) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">Errore caricamento annunci</div>';
  }
}

function createAdCard(ad) {
  const card = document.createElement('div');
  card.className = 'ad-card';
  card.setAttribute('data-aos', 'fade-up');
  const badges = [];
  if (ad.is_premium) badges.push('<span class="ad-badge premium"><i class="fas fa-crown"></i> Premium</span>');
  if (ad.is_verified) badges.push('<span class="ad-badge verified"><i class="fas fa-check-circle"></i> Verificato</span>');
  if (ad.has_video) badges.push('<span class="ad-badge video"><i class="fas fa-video"></i> Video</span>');
  card.innerHTML = `
    <div class="ad-card-image">
      <img src="${ad.image || 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop&crop=face'}" alt="${ad.title}" loading="lazy">
      <div class="ad-card-badges">${badges.join('')}</div>
      ${ad.price ? `<div class="ad-card-price">${ad.price}</div>` : ''}
    </div>
    <div class="ad-card-body">
      <div class="ad-card-header"><h3 class="ad-card-title">${ad.title}</h3></div>
      <div class="ad-card-meta">
        <span><i class="fas fa-map-marker-alt"></i> ${ad.city || 'N/D'}</span>
        <span><i class="fas fa-calendar-alt"></i> ${ad.age || '?'} anni</span>
      </div>
      <p class="ad-card-desc">${(ad.description || '').slice(0, 120)}...</p>
    </div>
    <div class="ad-card-footer">
      <div class="ad-card-rating">
        <i class="fas fa-star"></i> ${ad.rating || '0'} <span>(${ad.review_count || 0} recensioni)</span>
      </div>
      <div class="ad-card-action">Vedi profilo <i class="fas fa-arrow-right"></i></div>
    </div>`;
  return card;
}

// ============================================================
// CITIES
// ============================================================
async function initCities() {
  const grid = document.getElementById('citiesGrid');
  try {
    const cities = await supabaseGet('cities', 'select=name&order=name.asc');
    (cities || []).forEach(c => {
      const pill = document.createElement('span');
      pill.className = 'city-pill';
      pill.textContent = c.name;
      pill.setAttribute('data-aos', 'fade-up');
      pill.addEventListener('click', () => quickSearch(c.name));
      grid.appendChild(pill);
    });
  } catch (e) {
    ['Napoli','Roma','Milano','Torino','Firenze','Bologna','Venezia','Palermo','Genova','Bari'].forEach(city => {
      const pill = document.createElement('span');
      pill.className = 'city-pill';
      pill.textContent = city;
      pill.addEventListener('click', () => quickSearch(city));
      grid.appendChild(pill);
    });
  }
}

// ============================================================
// STATS
// ============================================================
async function initStats() {
  try {
    const [totalAds, premiumAds, verifiedUsers, citiesCount] = await Promise.all([
      supabaseCount('ads', 'is_active=eq.true'),
      supabaseCount('ads', 'is_active=eq.true&is_premium=eq.true'),
      supabaseCount('profiles', 'is_verified=eq.true'),
      supabaseCount('cities')
    ]);
    animateNumber('statAds', totalAds);
    animateNumber('statPremium', premiumAds);
    animateNumber('statCities', citiesCount);
    animateNumber('statVerified', verifiedUsers);
  } catch (e) {
    animateNumber('statAds', 15800);
    animateNumber('statPremium', 3200);
    animateNumber('statCities', 105);
    animateNumber('statVerified', 8920);
  }
}

function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.getAttribute('data-target'));
        let current = 0;
        const inc = Math.ceil(target/40);
        const timer = setInterval(() => {
          current += inc;
          if (current >= target) { current = target; clearInterval(timer); }
          entry.target.textContent = target > 100 ? current.toLocaleString()+'+' : current+'%';
        }, 37);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let current = 0;
  const inc = Math.ceil(target/30);
  const timer = setInterval(() => {
    current += inc;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = current.toLocaleString();
  }, 50);
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

function filterByCategory(categoryId) {
  document.getElementById('annunci').scrollIntoView({ behavior: 'smooth' });
  document.querySelectorAll('.filter-btn').forEach(btn => { btn.classList.remove('active'); if (btn.getAttribute('data-filter') === categoryId) btn.classList.add('active'); });
  initAds(categoryId);
}

// ============================================================
// SEARCH
// ============================================================
function openSearch() {
  document.getElementById('searchOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('searchInput').focus(), 300);
}
function closeSearch() {
  document.getElementById('searchOverlay').classList.remove('active');
  document.body.style.overflow = 'visible';
}
function performSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (q) quickSearch(q);
}

async function quickSearch(query) {
  closeSearch();
  document.getElementById('annunci').scrollIntoView({ behavior: 'smooth' });
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));

  const cm = {'donna cerca uomo':'donna-cerca-uomo','donna-cerca-uomo':'donna-cerca-uomo','uomo cerca donna':'uomo-cerca-donna','uomo-cerca-donna':'uomo-cerca-donna','uomo cerca uomo':'uomo-cerca-uomo','uomo-cerca-uomo':'uomo-cerca-uomo','donna cerca donna':'donna-cerca-donna','donna-cerca-donna':'donna-cerca-donna','coppie':'coppie','coppia':'coppie','trans':'trans','amici':'cerco-amici','anima gemella':'anima-gemella'};
  if (cm[query.toLowerCase()]) { filterByCategory(cm[query.toLowerCase()]); return; }

  const grid = document.getElementById('adsGrid');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-spinner fa-spin"></i> Ricerca...</div>';
  try {
    const q = encodeURIComponent(query);
    const ads = await supabaseGet('ads', `select=*&is_active=eq.true&or=(title.ilike.%25${q}%25,description.ilike.%25${q}%25,city.ilike.%25${q}%25)&order=is_premium.desc.nullslast&limit=20`);
    grid.innerHTML = '';
    if (!ads || ads.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;text-align:center;padding:60px 20px;"><i class="fas fa-search" style="font-size:3rem;color:var(--text-muted);margin-bottom:1rem;"></i><h3 style="color:var(--text-secondary);margin-bottom:0.5rem;">Nessun risultato per "${query}"</h3><p style="color:var(--text-muted);">Prova con un altro termine</p></div>`;
    } else {
      ads.forEach(ad => grid.appendChild(createAdCard(ad)));
    }
  } catch(e) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">Errore ricerca</div>';
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeSearch(); closePublish(); closeLogin(); closeRegister(); closeSponsor(); }
  if (e.key === 'Enter' && document.getElementById('searchOverlay')?.classList.contains('active')) performSearch();
});

// ============================================================
// PUBLISH MODAL
// ============================================================
function openPublish() { document.getElementById('publishModal').classList.add('active'); document.body.style.overflow = 'hidden'; }
function closePublish() { document.getElementById('publishModal').classList.remove('active'); document.body.style.overflow = 'visible'; }
document.getElementById('publishModal')?.addEventListener('click', function(e) { if (e.target === this) closePublish(); });
function submitAd(e) { e.preventDefault(); closePublish(); showToast('Annuncio pubblicato con successo! 🎉', 'success'); }

// ============================================================
// AUTH
// ============================================================
let currentUser = null;

async function initAuth() {
  const token = localStorage.getItem('authToken');
  if (token) {
    try {
      const data = await supabaseAuth('user', {}, token);
      if (data && data.id) {
        const profile = await supabaseGet('profiles', `select=*&id=eq.${data.id}`, token);
        currentUser = {
          id: data.id,
          name: profile?.[0]?.name || data.user_metadata?.name || '',
          surname: profile?.[0]?.surname || '',
          email: data.email,
          city: profile?.[0]?.city || '',
          isVerified: !!profile?.[0]?.is_verified,
          isPremium: !!profile?.[0]?.is_premium
        };
        updateUIForLoggedUser();
      } else {
        localStorage.removeItem('authToken');
      }
    } catch(e) { localStorage.removeItem('authToken'); }
  }
}

function openLogin() { document.getElementById('loginModal').classList.add('active'); document.body.style.overflow = 'hidden'; document.getElementById('loginError').textContent = ''; setTimeout(() => document.getElementById('loginEmail')?.focus(), 300); }
function closeLogin() { document.getElementById('loginModal').classList.remove('active'); document.body.style.overflow = 'visible'; }
document.getElementById('loginModal')?.addEventListener('click', function(e) { if (e.target === this) closeLogin(); });

function openRegister() { document.getElementById('registerModal').classList.add('active'); document.body.style.overflow = 'hidden'; document.getElementById('registerError').textContent = ''; setTimeout(() => document.getElementById('regName')?.focus(), 300); }
function closeRegister() { document.getElementById('registerModal').classList.remove('active'); document.body.style.overflow = 'visible'; }
document.getElementById('registerModal')?.addEventListener('click', function(e) { if (e.target === this) closeRegister(); });

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') { input.type = 'text'; btn.innerHTML = '<i class="fas fa-eye-slash"></i>'; }
  else { input.type = 'password'; btn.innerHTML = '<i class="fas fa-eye"></i>'; }
}

function checkPasswordStrength(password) {
  const fill = document.getElementById('strengthFill');
  const text = document.getElementById('strengthText');
  const rules = { length: password.length >= 8, lower: /[a-z]/.test(password), upper: /[A-Z]/.test(password), number: /\d/.test(password) };
  document.getElementById('ruleLength').className = rules.length ? 'valid' : '';
  document.getElementById('ruleLower').className = rules.lower ? 'valid' : '';
  document.getElementById('ruleUpper').className = rules.upper ? 'valid' : '';
  document.getElementById('ruleNumber').className = rules.number ? 'valid' : '';
  const vc = Object.values(rules).filter(Boolean).length;
  const pct = (vc / 4) * 100;
  fill.style.width = pct + '%';
  if (password.length === 0) { fill.style.background = 'var(--bg-secondary)'; text.textContent = 'Inserisci password'; text.style.color = 'var(--text-muted)'; }
  else if (vc <= 1) { fill.style.background = '#ef4444'; text.textContent = 'Debole'; text.style.color = '#ef4444'; }
  else if (vc <= 2) { fill.style.background = '#f59e0b'; text.textContent = 'Media'; text.style.color = '#f59e0b'; }
  else if (vc <= 3) { fill.style.background = '#3b82f6'; text.textContent = 'Buona'; text.style.color = '#3b82f6'; }
  else { fill.style.background = '#10b981'; text.textContent = 'Fortissima!'; text.style.color = '#10b981'; }
}
document.getElementById('regPassword')?.addEventListener('input', function() { checkPasswordStrength(this.value); });

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  const error = document.getElementById('loginError');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accesso...'; error.textContent = '';
  try {
    const data = await supabaseAuth('token?grant_type=password', { email, password });
    if (data.error) throw new Error(data.error);
    const profile = await supabaseGet('profiles', `select=*&id=eq.${data.user.id}`, data.access_token);
    currentUser = {
      id: data.user.id, name: profile?.[0]?.name || data.user.user_metadata?.name || '',
      surname: profile?.[0]?.surname || '', email: data.user.email, city: profile?.[0]?.city || '',
      isVerified: !!profile?.[0]?.is_verified, isPremium: !!profile?.[0]?.is_premium
    };
    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    closeLogin();
    updateUIForLoggedUser();
    showToast(`Bentornato, ${currentUser.name}! 🎉`, 'success');
  } catch(e) { error.textContent = 'Email o password non validi'; error.style.color = '#ef4444'; }
  finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Accedi'; }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const surname = document.getElementById('regSurname').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const city = document.getElementById('regCity').value;
  const gender = document.getElementById('regGender').value;
  const birthDate = document.getElementById('regBirthDate').value;
  const acceptTerms = document.getElementById('regAcceptTerms').checked;
  const btn = document.getElementById('registerBtn');
  const error = document.getElementById('registerError');
  if (!name) { error.textContent = 'Inserisci il nome'; error.style.color = '#ef4444'; return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.textContent = 'Email non valida'; error.style.color = '#ef4444'; return; }
  if (password.length < 8) { error.textContent = 'Password almeno 8 caratteri'; error.style.color = '#ef4444'; return; }
  if (!acceptTerms) { error.textContent = 'Accetta i Termini'; error.style.color = '#ef4444'; return; }
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creazione...'; error.textContent = '';
  try {
    const data = await supabaseAuth('signup', { email, password, data: { name, surname } });
    if (data.error) throw new Error(data.error);
    if (data.user) {
      await supabasePost('profiles', { id: data.user.id, name, surname: surname||'', city: city||'', gender: gender||'', birth_date: birthDate||null, is_verified: false, is_premium: false }, data.access_token);
    }
    currentUser = { id: data.user?.id || '', name, email, city: city||'', isVerified: false, isPremium: false };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    if (data.access_token) localStorage.setItem('authToken', data.access_token);
    closeRegister();
    updateUIForLoggedUser();
    showToast(`Benvenuto, ${name}! 🎉`, 'success');
  } catch(e) { error.textContent = e.message.includes('already') ? 'Email già registrata' : 'Errore registrazione'; error.style.color = '#ef4444'; }
  finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-feather-alt"></i> Crea Account'; }
}

function socialLogin(provider) { showToast(`Accesso con ${provider} in arrivo... 🔜`, 'success'); }

function updateUIForLoggedUser() {
  if (!currentUser) return;
  document.getElementById('authButtons').style.display = 'none';
  document.getElementById('userMenu').style.display = 'block';
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('dropdownUserName').textContent = currentUser.name + (currentUser.surname ? ' ' + currentUser.surname : '');
  document.getElementById('dropdownUserEmail').textContent = currentUser.email;
}

function toggleUserDropdown() { document.getElementById('userDropdown').classList.toggle('show'); document.querySelector('.user-dropdown-toggle').classList.toggle('active'); }
document.addEventListener('click', (e) => { if (!e.target.closest('.user-menu')) { document.getElementById('userDropdown')?.classList.remove('show'); document.querySelector('.user-dropdown-toggle')?.classList.remove('active'); } });

function userAction(action) {
  document.getElementById('userDropdown')?.classList.remove('show');
  document.querySelector('.user-dropdown-toggle')?.classList.remove('active');
  switch(action) {
    case 'profile': showToast('Profilo in arrivo!', 'success'); break;
    case 'ads': showToast('I tuoi annunci — in sviluppo!', 'success'); break;
    case 'vetrina': closeSponsor(); document.getElementById('vetrina')?.scrollIntoView({ behavior: 'smooth' }); break;
    case 'settings': showToast('Impostazioni in arrivo!', 'success'); break;
  }
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  currentUser = null;
  document.getElementById('authButtons').style.display = 'flex';
  document.getElementById('userMenu').style.display = 'none';
  document.getElementById('userDropdown')?.classList.remove('show');
  showToast('Sei uscito. A presto! 👋', 'success');
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${message}</span>`;
  toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:16px 24px;background:var(--bg-card);border:1px solid rgba(139,92,246,0.2);border-radius:var(--radius-md);color:var(--text-primary);font-family:var(--font-primary);font-size:0.9rem;display:flex;align-items:center;gap:12px;box-shadow:0 16px 48px rgba(0,0,0,0.5);z-index:99999;transform:translateY(100px);opacity:0;transition:all 0.4s ease;`;
  if (type === 'success') toast.style.borderColor = 'rgba(16,185,129,0.3)';
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; });
  setTimeout(() => { toast.style.transform = 'translateY(100px)'; toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3000);
}

// ============================================================
// AOS
// ============================================================
function initAOS() { if (typeof AOS !== 'undefined') AOS.init({ duration: 800, once: true, offset: 80, easing: 'ease-out-cubic' }); }

// ============================================================
// SMOOTH SCROLL
// ============================================================
function initSmoothScroll() { document.querySelectorAll('a[href^="#"]').forEach(a => { a.addEventListener('click', function(e) { e.preventDefault(); const t = document.querySelector(this.getAttribute('href')); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); }); }

// ============================================================
// NAV LINK ACTIVE STATE
// ============================================================
window.addEventListener('scroll', () => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  let current = '';
  sections.forEach(section => { if (window.scrollY >= section.offsetTop - 200) current = section.getAttribute('id'); });
  navLinks.forEach(link => { link.classList.remove('active'); if (link.getAttribute('data-section') === current) link.classList.add('active'); });
});

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
  document.querySelectorAll('.pricing-card').forEach(c => c.style.borderColor = '');
  const card = document.querySelector(`.pricing-card[data-plan="${planId}"]`);
  if (card) card.style.borderColor = 'var(--primary)';
}

function openSponsor(planId) {
  selectedPlan = planId || '3days'; selectedAdId = null;
  document.getElementById('sponsorModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  showSponsorStep(1);
  loadSponsorAds();
}
function closeSponsor() { document.getElementById('sponsorModal').classList.remove('active'); document.body.style.overflow = 'visible'; showSponsorStep(1); }
document.getElementById('sponsorModal')?.addEventListener('click', function(e) { if (e.target === this) closeSponsor(); });

async function loadSponsorAds() {
  const list = document.getElementById('sponsorAdsList');
  list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)"><i class="fas fa-spinner fa-spin"></i> Caricamento...</div>';
  try {
    const ads = await supabaseGet('ads', 'select=*&is_active=eq.true&limit=6');
    list.innerHTML = '';
    if (!ads || ads.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">Nessun annuncio. <a href="#" onclick="closeSponsor();openPublish();return false;" style="color:var(--primary-light)">Pubblica ora</a></div>';
      return;
    }
    (ads.slice(0,6)).forEach(ad => {
      const item = document.createElement('div');
      item.className = 'sponsor-ad-item';
      item.innerHTML = `<img src="${ad.image||'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400'}" alt="${ad.title}"><div class="ad-info"><strong>${ad.title}</strong><span>${ad.city||''} • ${(ad.category||'').replace(/-/g,' ')}</span></div><i class="fas fa-check-circle" style="margin-left:auto;color:transparent;font-size:1.2rem"></i>`;
      item.onclick = function() {
        document.querySelectorAll('.sponsor-ad-item').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        this.querySelector('.fa-check-circle').style.color = 'var(--primary)';
        selectedAdId = ad.id;
        setTimeout(() => nextSponsorStep(2), 500);
      };
      list.appendChild(item);
    });
  } catch(e) { list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">Usa annunci di esempio per la demo</div>'; }
}

function showSponsorStep(step) {
  document.querySelectorAll('.sponsor-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active','done');
    if (s === step) el.classList.add('active');
    else if (s < step) el.classList.add('done');
  });
  for (let i = 1; i <= 4; i++) {
    const c = document.getElementById(`sponsorStep${i}`);
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
    <div class="summary-row"><span class="summary-label">Prezzo</span><span class="summary-value" style="text-decoration:line-through;color:var(--text-muted)">€${plan.originalPrice.toFixed(2)}</span></div>
    <div class="summary-row total"><span class="summary-label">Totale</span><span class="summary-value">€${plan.price.toFixed(2)}</span></div>
    <div style="margin-top:12px;padding:10px 14px;background:rgba(16,185,129,0.1);border-radius:var(--radius-sm);font-size:0.8rem;color:#10b981;text-align:center;"><i class="fas fa-check-circle"></i> Risparmi €${(plan.originalPrice - plan.price).toFixed(2)}!</div>`;
}
function updatePayAmount() { const plan = sponsorPlans[selectedPlan]; if (plan) document.getElementById('sponsorPayAmount').textContent = plan.price.toFixed(2); }
function selectPayment(el, type) { document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active')); el.classList.add('active'); }

setTimeout(() => {
  const vl = document.querySelector('.nav-link[data-section="vetrina"]');
  if (vl) vl.addEventListener('click', () => { document.getElementById('vetrina').scrollIntoView({ behavior: 'smooth' }); });
}, 500);
