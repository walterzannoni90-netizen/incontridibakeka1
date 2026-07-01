# 🔥 IncontriDiBakeka — Annunci Incontri Premium

**Portale premium di annunci incontri.** Escort, accompagnatori, coppie, trans e molto più. Esperienza esclusiva nella tua città.

---

## 📋 Panoramica

IncontriDiBakeka è una piattaforma web completa per annunci di incontri, costruita con stack moderno:

- **Frontend**: Single Page Application (SPA) con HTML, CSS e JavaScript vanilla
- **Backend**: Node.js + Express.js
- **Database**: Supabase PostgreSQL (dati pubblici) + SQLite locale (autenticazione)
- **Pagamenti**: Stripe per crediti premium
- **Animazioni**: AOS (Animate On Scroll)

---

## ✨ Funzionalità

### 👤 Autenticazione
- ✅ Registrazione con validazione
- ✅ Login con JWT
- ✅ Profilo utente con crediti
- ✅ Gestione sessione

### 📢 Annunci
- ✅ Categorie (Donna cerca Uomo, Uomo cerca Donna, Coppie, Trans, etc.)
- ✅ Filtri per città, categoria, genere
- ✅ Annunci premium in evidenza
- ✅ Annunci sponsorizzati
- ✅ Pubblicazione annunci gratuiti

### 💰 Premium
- ✅ Crediti per funzionalità premium
- ✅ Vetrina annunci premium
- ✅ Stripe checkout integrato
- ✅ Webhook per pagamenti

### 🏙️ Città
- ✅ 30+ città italiane
- ✅ Geolocalizzazione annunci
- ✅ Ricerca per città

---

## 🛠 Tecnologie

| Categoria | Tecnologia |
|-----------|-----------|
| **Runtime** | Node.js 22 |
| **Framework** | Express.js |
| **Database** | Supabase PostgreSQL + SQLite (auth) |
| **Frontend** | HTML5 + CSS3 + Vanilla JS |
| **Auth** | JWT + bcryptjs |
| **Pagamenti** | Stripe |
| **Animazioni** | AOS Library |
| **Icone** | Font Awesome 6 |
| **Font** | Google Fonts (Inter, Playfair Display, DM Sans) |

---

## 📦 Installazione

```bash
# 1. Clona il repository
git clone https://github.com/walterzannoni90-netizen/incontridibakeka1.git
cd incontridibakeka1

# 2. Installa le dipendenze
npm install

# 3. Avvia il server
npm start

# 4. Apri il browser
http://localhost:3030
```

---

## 🌐 Endpoint API

### Auth (SQLite Locale)

| Metodo | Path | Descrizione |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrazione nuovo utente |
| POST | `/api/auth/login` | Login utente |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Profilo utente corrente |

### Dati (Supabase)

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | `/api/categories` | Elenco categorie |
| GET | `/api/cities` | Elenco città |
| GET | `/api/stats` | Statistiche piattaforma |
| GET | `/api/ads` | Annunci con filtri |
| GET | `/api/ads/featured` | Annunci premium in evidenza |

### Pagamenti

| Metodo | Path | Descrizione |
|--------|------|-------------|
| POST | `/api/create-checkout` | Crea sessione Stripe checkout |
| POST | `/api/stripe-webhook` | Webhook Stripe |

---

## 📁 Struttura del Progetto

```
incontridibakeka1/
│
├── server.js              ← Server Express + API routes
├── app.js                 ← Frontend SPA logic (2330+ righe)
├── index.html             ← Frontend HTML (1220+ righe)
├── style.css              ← Stili CSS (79700+ righe)
├── package.json           ← Dipendenze
├── .env.example           ← Esempio variabili d'ambiente
│
├── api/
│   ├── create-checkout.js ← Stripe checkout handler
│   └── stripe-webhook.js  ← Stripe webhook handler
│
├── supabase/
│   ├── functions/         ← Edge functions Supabase
│   └── supabase-schema.sql ← Schema database
│
├── database/              ← Database SQLite (generato)
│   └── auth.db            ← Auth database locale
│
├── tests/                 ← Test
│   ├── e2e-smoke.js
│   └── ...
│
└── .github/workflows/     ← CI/CD
    ├── deploy.yml
    └── gh-pages.yml
```

---

## 🖼️ Immagini

Il progetto utilizza immagini di alta qualità da **Unsplash** per:

- **Categorie**: Immagini reali per ogni categoria (donne, uomini, coppie, trans, amicizia, anima gemella)
- **Hero**: Background romantico nella sezione principale
- **Card annunci**: Placeholder images per profili

---

## 🔐 Autenticazione

L'autenticazione è gestita localmente con SQLite + JWT:

1. **Registrazione**: I dati utente vengono salvati in SQLite con password hashata (bcryptjs)
2. **Login**: Viene generato un JWT con scadenza 30 giorni
3. **Sessione**: I token sono salvati in tabella `sessions` per gestione lato server
4. **Profilo**: Le API `/api/auth/me` restituiscono i dati utente dal token

I dati pubblici (categorie, città, annunci) sono gestiti da Supabase PostgreSQL.

---

## 💳 Pagamenti

I pagamenti sono gestiti tramite **Stripe**:

1. L'utente acquista crediti dal negozio
2. Viene creata una sessione Stripe Checkout
3. Il webhook Stripe conferma il pagamento
4. I crediti vengono aggiunti all'utente

---

## 🚀 Avvio Rapido

```bash
# Sviluppo
npm start

# Il server parte su http://localhost:3030
```

---

## 🌐 Deploy su Render (gratuito)

Questo progetto è configurato per il deploy su **Render** (hosting Node.js gratuito):

1. **Crea account** su [Render.com](https://render.com) (gratis)
2. **Collega GitHub**: Vai su Dashboard → **New +** → **Blueprint**
3. **Seleziona** il repository `incontridibakeka1`
4. **Render legge** automaticamente il file `render.yaml` e configura tutto
5. **Variabili d'ambiente** da impostare manualmente:
   - `SUPABASE_URL` — URL del tuo Supabase
   - `SUPABASE_ANON_KEY` — Chiave anonima Supabase

Oppure crea un **Web Service** manualmente:
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Plan**: **Free** ✅

L'app sarà disponibile su `https://incontridibakeka.onrender.com`

---

## 📄 Licenza

© 2026 IncontriDiBakeka. Tutti i diritti riservati.

---

<p align="center">
  <strong>IncontriDiBakeka</strong> — <em>Il tuo desiderio, la nostra passione</em><br>
  🌐 <a href="https://incontridibakeka.onrender.com">Versione Live su Render</a> · 
  💻 <a href="http://localhost:3030">Sviluppo Locale</a>
</p>
