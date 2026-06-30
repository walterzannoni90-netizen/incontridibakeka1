/* ============================================================
   INCONTRI DI BAKEKA — APP
   Animated, interactive, premium experience
   ============================================================ */

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
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    if (current > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = current;
  });
}

function toggleMenu() {
  document.getElementById('hamburger').classList.toggle('active');
  document.getElementById('navbarMenu').classList.toggle('active');
  document.body.style.overflow = document.getElementById('navbarMenu').classList.contains('active') ? 'hidden' : 'visible';
}

// Close menu on link click
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
  const count = 40;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.width = particle.style.height = (Math.random() * 4 + 2) + 'px';
    particle.style.animationDuration = (Math.random() * 20 + 15) + 's';
    particle.style.animationDelay = (Math.random() * 10) + 's';
    particle.style.opacity = Math.random() * 0.3 + 0.1;
    
    // Random colors
    const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#10b981'];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    container.appendChild(particle);
  }
}

// ============================================================
// CATEGORIES
// ============================================================
function initCategories() {
  const grid = document.getElementById('categoriesGrid');
  const categories = [
    { id: 'donna-cerca-uomo', name: 'Donna Cerca Uomo', icon: 'fa-female', color: '#ff2d55', desc: 'Escort e ragazze squillo nella tua città. Passione senza limiti.' },
    { id: 'uomo-cerca-donna', name: 'Uomo Cerca Donna', icon: 'fa-male', color: '#007aff', desc: 'Accompagnatori pronti a realizzare ogni tua fantasia.' },
    { id: 'uomo-cerca-uomo', name: 'Uomo Cerca Uomo', icon: 'fa-venus-mars', color: '#ff9500', desc: 'Incontri gay, escort maschi e accompagnatori professionisti.' },
    { id: 'donna-cerca-donna', name: 'Donna Cerca Donna', icon: 'fa-venus', color: '#ff3b30', desc: 'Lesbo, amori al femminile. Solo donne per donne.' },
    { id: 'coppie', name: 'Coppie', icon: 'fa-heart', color: '#af52de', desc: 'Coppie in cerca di avventure swingers e scambismo.' },
    { id: 'cerco-amici', name: 'Cerco Amici', icon: 'fa-handshake', color: '#34c759', desc: 'Amicizie vere e uscite nella tua città.' },
    { id: 'anima-gemella', name: 'Cerco Anima Gemella', icon: 'fa-dove', color: '#ff6482', desc: 'L\'amore vero esiste. Trova l\'altra metà.' },
    { id: 'trans', name: 'Trans', icon: 'fa-transgender', color: '#e84393', desc: 'Incontri trans e travestiti. Avventure senza confini.' }
  ];

  categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.style.setProperty('--cat-color', cat.color);
    card.setAttribute('data-aos', 'fade-up');
    card.innerHTML = `
      <div class="category-icon">
        <i class="fas ${cat.icon}"></i>
      </div>
      <h3 class="category-name">${cat.name}</h3>
      <p class="category-desc">${cat.desc}</p>
    `;
    card.addEventListener('click', () => filterByCategory(cat.id));
    grid.appendChild(card);
  });
}

// ============================================================
// ADS
// ============================================================
function initAds(filter = 'all') {
  const grid = document.getElementById('adsGrid');
  grid.innerHTML = '';

  fetch(`/api/ads${filter !== 'all' ? `?category=${filter}` : '?premium=true'}`)
    .then(res => res.json())
    .then(ads => {
      if (ads.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <i class="fas fa-heart-broken" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
            <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">Nessun annuncio trovato</h3>
            <p style="color: var(--text-muted);">Prova a cambiare filtro o categoria</p>
          </div>
        `;
        return;
      }

      ads.forEach(ad => {
        const card = createAdCard(ad);
        grid.appendChild(card);
      });
    })
    .catch(() => {
      // Fallback data if API not available
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">Caricamento annunci...</div>';
    });
}

function createAdCard(ad) {
  const card = document.createElement('div');
  card.className = 'ad-card';
  card.setAttribute('data-aos', 'fade-up');

  const badges = [];
  if (ad.isPremium) badges.push('<span class="ad-badge premium"><i class="fas fa-crown"></i> Premium</span>');
  if (ad.isVerified) badges.push('<span class="ad-badge verified"><i class="fas fa-check-circle"></i> Verificato</span>');
  if (ad.hasVideo) badges.push('<span class="ad-badge video"><i class="fas fa-video"></i> Video</span>');

  card.innerHTML = `
    <div class="ad-card-image">
      <img src="${ad.image}" alt="${ad.title}" loading="lazy">
      <div class="ad-card-badges">${badges.join('')}</div>
      ${ad.price ? `<div class="ad-card-price">${ad.price}</div>` : ''}
    </div>
    <div class="ad-card-body">
      <div class="ad-card-header">
        <h3 class="ad-card-title">${ad.title}</h3>
      </div>
      <div class="ad-card-meta">
        <span><i class="fas fa-map-marker-alt"></i> ${ad.city}</span>
        <span><i class="fas fa-calendar-alt"></i> ${ad.age} anni</span>
      </div>
      <p class="ad-card-desc">${ad.description}</p>
    </div>
    <div class="ad-card-footer">
      <div class="ad-card-rating">
        <i class="fas fa-star"></i>
        ${ad.rating} <span>(${ad.reviews} recensioni)</span>
      </div>
      <div class="ad-card-action">Vedi profilo <i class="fas fa-arrow-right"></i></div>
    </div>
  `;

  return card;
}

// ============================================================
// CITIES
// ============================================================
function initCities() {
  const grid = document.getElementById('citiesGrid');

  fetch('/api/cities')
    .then(res => res.json())
    .then(cities => {
      cities.forEach(city => {
        const pill = document.createElement('span');
        pill.className = 'city-pill';
        pill.textContent = city;
        pill.setAttribute('data-aos', 'fade-up');
        pill.addEventListener('click', () => quickSearch(city));
        grid.appendChild(pill);
      });
    })
    .catch(() => {
      // Fallback cities
      const fallback = ['Napoli', 'Roma', 'Milano', 'Torino', 'Firenze', 'Bologna', 'Venezia', 'Palermo', 'Genova', 'Bari'];
      fallback.forEach(city => {
        const pill = document.createElement('span');
        pill.className = 'city-pill';
        pill.textContent = city;
        pill.addEventListener('click', () => quickSearch(city));
        grid.appendChild(pill);
      });
    });
}

// ============================================================
// STATS COUNTERS
// ============================================================
function initStats() {
  // Hero stats
  fetch('/api/stats')
    .then(res => res.json())
    .then(stats => {
      animateNumber('statAds', stats.totalAds);
      animateNumber('statPremium', stats.premiumAds);
      animateNumber('statCities', stats.citiesAvailable);
      animateNumber('statVerified', stats.verifiedUsers);
    })
    .catch(() => {
      animateNumber('statAds', 15800);
      animateNumber('statPremium', 3200);
      animateNumber('statCities', 105);
      animateNumber('statVerified', 8920);
    });
}

function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.getAttribute('data-target'));
        animateCounter(entry.target, target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

function animateCounter(element, target) {
  let current = 0;
  const increment = Math.ceil(target / 40);
  const duration = 1500;
  const stepTime = Math.floor(duration / 40);

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    if (target > 100) {
      element.textContent = current.toLocaleString() + '+';
    } else {
      element.textContent = current + '%';
    }
  }, stepTime);
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let current = 0;
  const increment = Math.ceil(target / 30);
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current.toLocaleString();
  }, 50);
}

// ============================================================
// FILTERS
// ============================================================
function initFilters() {
  const filters = document.querySelectorAll('.filter-btn');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      initAds(filter);
    });
  });
}

function filterByCategory(categoryId) {
  document.getElementById('annunci').scrollIntoView({ behavior: 'smooth' });
  
  // Update filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-filter') === categoryId) {
      btn.classList.add('active');
    }
  });
  
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
  const query = document.getElementById('searchInput').value.trim();
  if (query) {
    quickSearch(query);
  }
}

function quickSearch(query) {
  closeSearch();
  document.getElementById('annunci').scrollIntoView({ behavior: 'smooth' });
  
  // Try to filter ads by the query
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  
  // If it matches a category, filter by it
  const categoryMap = {
    'donna cerca uomo': 'donna-cerca-uomo',
    'donna-cerca-uomo': 'donna-cerca-uomo',
    'uomo cerca donna': 'uomo-cerca-donna',
    'uomo-cerca-donna': 'uomo-cerca-donna',
    'uomo cerca uomo': 'uomo-cerca-uomo',
    'uomo-cerca-uomo': 'uomo-cerca-uomo',
    'donna cerca donna': 'donna-cerca-donna',
    'donna-cerca-donna': 'donna-cerca-donna',
    'coppie': 'coppie',
    'coppia': 'coppie',
    'trans': 'trans',
    'amici': 'cerco-amici',
    'anima gemella': 'anima-gemella'
  };

  const matchedCategory = categoryMap[query.toLowerCase()];
  if (matchedCategory) {
    filterByCategory(matchedCategory);
    return;
  }

  // Otherwise, search by city or keyword via API
  fetch(`/api/ads?search=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(ads => {
      const grid = document.getElementById('adsGrid');
      grid.innerHTML = '';
      if (ads.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <i class="fas fa-search" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
            <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">Nessun risultato per "${query}"</h3>
            <p style="color: var(--text-muted);">Prova con un altro termine di ricerca</p>
          </div>
        `;
      } else {
        ads.forEach(ad => {
          const card = createAdCard(ad);
          grid.appendChild(card);
        });
      }
    });
}

// Close modals on Escape (single listener)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSearch();
    closePublish();
    closeLogin();
    closeRegister();
    closeSponsor();
  }
  if (e.key === 'Enter') {
    if (document.getElementById('searchOverlay')?.classList.contains('active')) {
      performSearch();
    }
  }
});

// ============================================================
// PUBLISH MODAL
// ============================================================
function openPublish() {
  document.getElementById('publishModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePublish() {
  document.getElementById('publishModal').classList.remove('active');
  document.body.style.overflow = 'visible';
}

// Close publish on overlay click
document.getElementById('publishModal')?.addEventListener('click', function(e) {
  if (e.target === this) closePublish();
});

function submitAd(e) {
  e.preventDefault();
  closePublish();
  // Show a toast notification
  showToast('Annuncio pubblicato con successo! 🎉', 'success');
}

// ============================================================
// AUTH — LOGIN & REGISTER
// ============================================================

let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Check if user is already logged in on load
function initAuth() {
  const token = localStorage.getItem('authToken');
  if (token) {
    // Verify token with server
    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          currentUser = data.user;
          updateUIForLoggedUser();
        } else {
          localStorage.removeItem('authToken');
        }
      })
      .catch(() => {
        // If server unavailable, try to restore from saved session
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          currentUser = JSON.parse(savedUser);
          updateUIForLoggedUser();
        }
      });
  }
}

// Login Modal
function openLogin() {
  document.getElementById('loginModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('loginError').textContent = '';
  setTimeout(() => document.getElementById('loginEmail')?.focus(), 300);
}

function closeLogin() {
  document.getElementById('loginModal').classList.remove('active');
  document.body.style.overflow = 'visible';
}

// Close login on overlay click
document.getElementById('loginModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeLogin();
});

// Register Modal
function openRegister() {
  document.getElementById('registerModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('registerError').textContent = '';
  setTimeout(() => document.getElementById('regName')?.focus(), 300);
}

function closeRegister() {
  document.getElementById('registerModal').classList.remove('active');
  document.body.style.overflow = 'visible';
}

// Close register on overlay click
document.getElementById('registerModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeRegister();
});

// Toggle password visibility
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

// Password strength meter
function checkPasswordStrength(password) {
  const fill = document.getElementById('strengthFill');
  const text = document.getElementById('strengthText');
  const rules = {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password)
  };

  // Update rule indicators
  document.getElementById('ruleLength').className = rules.length ? 'valid' : '';
  document.getElementById('ruleLower').className = rules.lower ? 'valid' : '';
  document.getElementById('ruleUpper').className = rules.upper ? 'valid' : '';
  document.getElementById('ruleNumber').className = rules.number ? 'valid' : '';

  const validCount = Object.values(rules).filter(Boolean).length;
  const percent = (validCount / 4) * 100;

  fill.style.width = percent + '%';
  
  if (password.length === 0) {
    fill.style.background = 'var(--bg-secondary)';
    text.textContent = 'Inserisci una password';
    text.style.color = 'var(--text-muted)';
  } else if (validCount <= 1) {
    fill.style.background = '#ef4444';
    text.textContent = 'Debole';
    text.style.color = '#ef4444';
  } else if (validCount <= 2) {
    fill.style.background = '#f59e0b';
    text.textContent = 'Media';
    text.style.color = '#f59e0b';
  } else if (validCount <= 3) {
    fill.style.background = '#3b82f6';
    text.textContent = 'Buona';
    text.style.color = '#3b82f6';
  } else {
    fill.style.background = '#10b981';
    text.textContent = 'Fortissima!';
    text.style.color = '#10b981';
  }
}

// Listen to password input
const regPassword = document.getElementById('regPassword');
if (regPassword) {
  regPassword.addEventListener('input', function() {
    checkPasswordStrength(this.value);
  });
}

// Handle Login
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const remember = document.getElementById('loginRemember')?.checked || false;
  const btn = document.getElementById('loginBtn');
  const error = document.getElementById('loginError');

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accesso in corso...';
  error.textContent = '';

  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, remember })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        currentUser = data.user;
        authToken = data.token;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        closeLogin();
        updateUIForLoggedUser();
        showToast(`Bentornato, ${data.user.name}! 🎉`, 'success');
      } else {
        error.textContent = data.error || 'Errore durante l\'accesso';
        error.style.color = '#ef4444';
      }
    })
    .catch(err => {
      error.textContent = 'Errore di connessione. Riprova.';
      error.style.color = '#ef4444';
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Accedi';
    });
}

// Handle Register
function handleRegister(e) {
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

  // Client validation
  if (!name) {
    error.textContent = 'Inserisci il tuo nome';
    error.style.color = '#ef4444';
    return;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    error.textContent = 'Inserisci un email valida';
    error.style.color = '#ef4444';
    return;
  }

  if (password.length < 8) {
    error.textContent = 'La password deve essere almeno 8 caratteri';
    error.style.color = '#ef4444';
    return;
  }

  if (!acceptTerms) {
    error.textContent = 'Devi accettare i Termini e Condizioni';
    error.style.color = '#ef4444';
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creazione account...';
  error.textContent = '';

  fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, surname, email, password, city, gender, birthDate, acceptTerms })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        currentUser = data.user;
        authToken = data.token;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        closeRegister();
        updateUIForLoggedUser();
        showToast(`Benvenuto, ${data.user.name}! Account creato con successo! 🎉`, 'success');
      } else {
        error.textContent = data.error || 'Errore durante la registrazione';
        error.style.color = '#ef4444';
      }
    })
    .catch(err => {
      error.textContent = 'Errore di connessione. Riprova.';
      error.style.color = '#ef4444';
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-feather-alt"></i> Crea Account';
    });
}

// Social login (simulation)
function socialLogin(provider) {
  showToast(`Accesso con ${provider} in arrivo... 🔜`, 'success');
}

// Update UI when user is logged in
function updateUIForLoggedUser() {
  if (!currentUser) return;
  
  document.getElementById('authButtons').style.display = 'none';
  document.getElementById('userMenu').style.display = 'block';
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('dropdownUserName').textContent = currentUser.name + (currentUser.surname ? ' ' + currentUser.surname : '');
  document.getElementById('dropdownUserEmail').textContent = currentUser.email;
}

// User dropdown toggle
function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  const toggle = document.querySelector('.user-dropdown-toggle');
  dropdown.classList.toggle('show');
  toggle.classList.toggle('active');
}

// Close dropdown on click outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu')) {
    document.getElementById('userDropdown')?.classList.remove('show');
    document.querySelector('.user-dropdown-toggle')?.classList.remove('active');
  }
});

// User actions
function userAction(action) {
  document.getElementById('userDropdown')?.classList.remove('show');
  document.querySelector('.user-dropdown-toggle')?.classList.remove('active');
  
  switch(action) {
    case 'profile':
      showToast('Profilo utente in arrivo!', 'success');
      break;
    case 'ads':
      showToast('I tuoi annunci — in sviluppo!', 'success');
      break;
    case 'vetrina':
      closeSponsor();
      document.getElementById('vetrina')?.scrollIntoView({ behavior: 'smooth' });
      break;
    case 'settings':
      showToast('Impostazioni in arrivo!', 'success');
      break;
  }
}

// Logout
function logout() {
  const token = localStorage.getItem('authToken');
  
  if (token) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {});
  }

  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  currentUser = null;
  authToken = null;
  
  document.getElementById('authButtons').style.display = 'flex';
  document.getElementById('userMenu').style.display = 'none';
  document.getElementById('userDropdown')?.classList.remove('show');
  
  showToast('Sei uscito. A presto! 👋', 'success');
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 16px 24px;
    background: var(--bg-card);
    border: 1px solid rgba(139,92,246,0.2);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-family: var(--font-primary);
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.5);
    z-index: 99999;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.4s ease;
  `;
  
  if (type === 'success') {
    toast.style.borderColor = 'rgba(16,185,129,0.3)';
    toast.querySelector('i').style.color = '#10b981';
  }
  
  document.body.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });
  
  // Remove after 3s
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ============================================================
// AOS — ANIMATE ON SCROLL
// ============================================================
function initAOS() {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      once: true,
      offset: 80,
      easing: 'ease-out-cubic'
    });
  }
}

// ============================================================
// SMOOTH SCROLL FOR NAV LINKS
// ============================================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ============================================================
// NAV LINK ACTIVE STATE ON SCROLL
// ============================================================
window.addEventListener('scroll', () => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  
  let current = '';
  sections.forEach(section => {
    const top = section.offsetTop - 200;
    if (window.scrollY >= top) {
      current = section.getAttribute('id');
    }
  });
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-section') === current) {
      link.classList.add('active');
    }
  });
});

// ============================================================
// VETRINA — SPONSORIZZAZIONE
// ============================================================

// Dati piani sponsorizzazione
const sponsorPlans = {
  '1day': { name: 'Vetrina Express', duration: '1 Giorno', price: 4.95, originalPrice: 4.95, badge: 'BASE' },
  '3days': { name: 'Vetrina Plus', duration: '3 Giorni', price: 9.95, originalPrice: 14.85, badge: 'PIÙ SCELTO' },
  '7days': { name: 'Vetrina Premium', duration: '7 Giorni', price: 19.95, originalPrice: 34.65, badge: 'PREMIUM' },
  '30days': { name: 'Vetrina Gold', duration: '30 Giorni', price: 49.95, originalPrice: 99.90, badge: 'TOP' }
};

let selectedPlan = '3days';
let selectedAdId = null;
let currentSponsorStep = 1;

function selectPlan(planId) {
  selectedPlan = planId;
  // Highlight card
  document.querySelectorAll('.pricing-card').forEach(c => c.style.borderColor = '');
  const card = document.querySelector(`.pricing-card[data-plan="${planId}"]`);
  if (card) card.style.borderColor = 'var(--primary)';
}

function openSponsor(planId) {
  selectedPlan = planId || '3days';
  selectedAdId = null;
  currentSponsorStep = 1;
  
  const modal = document.getElementById('sponsorModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Reset steps
  showSponsorStep(1);
  
  // Load user's ads (simulate from the ads list)
  loadSponsorAds();
}

function closeSponsor() {
  document.getElementById('sponsorModal').classList.remove('active');
  document.body.style.overflow = 'visible';
  currentSponsorStep = 1;
  showSponsorStep(1);
}

// Close sponsor on overlay click
document.getElementById('sponsorModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeSponsor();
});

function loadSponsorAds() {
  const list = document.getElementById('sponsorAdsList');
  list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)"><i class="fas fa-spinner fa-spin"></i> Caricamento annunci...</div>';
  
  fetch('/api/ads')
    .then(res => res.json())
    .then(ads => {
      list.innerHTML = '';
      if (ads.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">Nessun annuncio trovato. <a href="#" onclick="closeSponsor(); openPublish(); return false;" style="color:var(--primary-light)">Pubblica ora</a></div>';
        return;
      }
      
      // Show first 6 as demo
      const displayAds = ads.slice(0, 6);
      displayAds.forEach(ad => {
        const item = document.createElement('div');
        item.className = 'sponsor-ad-item';
        item.dataset.adId = ad.id;
        item.innerHTML = `
          <img src="${ad.image}" alt="${ad.title}">
          <div class="ad-info">
            <strong>${ad.title}</strong>
            <span>${ad.city} • ${ad.category.replace(/-/g, ' ')}</span>
          </div>
          <i class="fas fa-check-circle" style="margin-left:auto;color:transparent;font-size:1.2rem;transition:var(--transition-normal)"></i>
        `;
        item.onclick = function() {
          document.querySelectorAll('.sponsor-ad-item').forEach(i => i.classList.remove('selected'));
          this.classList.add('selected');
          this.querySelector('.fa-check-circle').style.color = 'var(--primary)';
          selectedAdId = ad.id;
          // Auto advance to next step
          setTimeout(() => nextSponsorStep(2), 500);
        };
        list.appendChild(item);
      });
    })
    .catch(() => {
      list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">Usa annunci di esempio per la demo</div>';
    });
}

function showSponsorStep(step) {
  currentSponsorStep = step;
  
  // Update progress
  document.querySelectorAll('.sponsor-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active', 'done');
    if (s === step) el.classList.add('active');
    else if (s < step) el.classList.add('done');
  });
  
  // Show content
  for (let i = 1; i <= 4; i++) {
    const content = document.getElementById(`sponsorStep${i}`);
    if (content) content.style.display = i === step ? 'block' : 'none';
  }
  
  if (step === 2) updateSponsorSummary();
  if (step === 3) updatePayAmount();
}

function nextSponsorStep(step) {
  showSponsorStep(step);
}

function updateSponsorSummary() {
  const plan = sponsorPlans[selectedPlan];
  const summary = document.getElementById('sponsorSummary');
  
  if (!plan) return;
  
  summary.innerHTML = `
    <div class="summary-row">
      <span class="summary-label">Piano scelto</span>
      <span class="summary-value">${plan.name}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Durata</span>
      <span class="summary-value">${plan.duration}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Prezzo originale</span>
      <span class="summary-value" style="text-decoration:line-through;color:var(--text-muted)">€${plan.originalPrice.toFixed(2)}</span>
    </div>
    <div class="summary-row total">
      <span class="summary-label">Totale</span>
      <span class="summary-value">€${plan.price.toFixed(2)}</span>
    </div>
    <div style="margin-top:12px;padding:10px 14px;background:rgba(16,185,129,0.1);border-radius:var(--radius-sm);font-size:0.8rem;color:#10b981;text-align:center;">
      <i class="fas fa-check-circle"></i> Stai risparmiando €${(plan.originalPrice - plan.price).toFixed(2)}!
    </div>
  `;
}

function updatePayAmount() {
  const plan = sponsorPlans[selectedPlan];
  if (plan) {
    document.getElementById('sponsorPayAmount').textContent = plan.price.toFixed(2);
  }
}

function selectPayment(el, type) {
  document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
  el.classList.add('active');
}

// (no duplicate - single Escape handler above)

// ============================================================
// NAV LINK SMOOTH SCROLL FOR VETRINA
// ============================================================
// Add vetrina link to mobile nav
setTimeout(() => {
  const vetrinaLink = document.querySelector('.nav-link[data-section="vetrina"]');
  if (vetrinaLink) {
    vetrinaLink.addEventListener('click', () => {
      document.getElementById('vetrina').scrollIntoView({ behavior: 'smooth' });
    });
  }
}, 500);

// Log startup
console.log('%c🔥 IncontriDiBakeka Premium', 'font-size: 24px; font-weight: bold; color: #8b5cf6;');
console.log('%c💎 Sistema Vetrina attivo — Da €4.95 a €49.95', 'font-size: 14px; color: #f59e0b;');
console.log('%cEsperienza premium di annunci incontri', 'font-size: 14px; color: #94a3b8;');
