import { blogArticles } from '../client/src/data/blog-data';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://incontridibakeka.com';
const PUBLIC_DIR = path.resolve('client/public');

function htmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function contentToHtml(content: string): string {
  const paragraphs = content.split('\n').filter(p => p.trim());
  return paragraphs.map(p => `<p>${htmlEscape(p.trim())}</p>`).join('\n    ');
}

function generateArticleHtml(article: typeof blogArticles[0]): string {
  const contentHtml = contentToHtml(article.content);
  const excerpt = htmlEscape(article.excerpt.substring(0, 160));
  const title = htmlEscape(article.title);
  const cityTag = article.city ? ` | ${htmlEscape(article.city)}` : '';
  const categoryTitle = htmlEscape(article.categoryTitle);

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Incontri di Bakeka</title>
  <meta name="description" content="${excerpt}">
  <meta name="robots" content="index, follow">
  <meta name="rating" content="adult">
  <link rel="canonical" href="${BASE_URL}/blog/${article.slug}/">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${excerpt}">
  <meta property="og:url" content="${BASE_URL}/blog/${article.slug}/">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt.substring(0, 160),
    datePublished: '2026-07-01',
    dateModified: '2026-07-01',
    mainEntityOfPage: `${BASE_URL}/blog/${article.slug}/`,
    author: { '@type': 'Organization', name: 'Incontri di Bakeka' },
    publisher: { '@type': 'Organization', name: 'Incontri di Bakeka', logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.svg` } },
  }).replace(/</g, '\\u003c')}</script>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:800px;margin:0 auto;padding:20px}
    h1{color:#e91e63}a{color:#e91e63}
    .nav{text-align:center;margin-top:2em;padding:1em;background:#f9f9f9;border-radius:8px}
    .nav a{display:inline-block;padding:10px 24px;background:#e91e63;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold}
    footer{text-align:center;margin-top:2em;color:#999;font-size:0.9em}
  </style>
</head>
<body>
  <main>
    <article>
      <h1>${title}</h1>
      <p><small>Pubblicato: ${article.date} | Categoria: ${categoryTitle}${cityTag}</small></p>
      ${contentHtml}
    </article>
    <div class="nav"><a href="/">Visita Incontri di Bakeka →</a></div>
  </main>
  <footer>
    <p>&copy; 2026 Incontri di Bakeka - Guide, annunci e nuove connessioni</p>
  </footer>
</body>
</html>`;
}

const blogDir = path.join(PUBLIC_DIR, 'blog');
fs.rmSync(blogDir, { recursive: true, force: true });
fs.mkdirSync(blogDir, { recursive: true });

let count = 0;
for (const article of blogArticles) {
  const dir = path.join(PUBLIC_DIR, 'blog', article.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), generateArticleHtml(article));
  count++;
}

// Blog listing page
const listItems = blogArticles.map(a => {
  const t = htmlEscape(a.title);
  const cat = htmlEscape(a.categoryTitle);
  return `    <li><a href="/blog/${a.slug}/">${t}</a> <small>(${cat}, ${a.date})</small></li>`;
}).join('\n');

const blogListing = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog - Incontri di Bakeka</title>
  <meta name="description" content="Blog di Incontri di Bakeka - Articoli su incontri, escort, trans e uomo cerca uomo in tutte le città italiane">
  <meta name="robots" content="index, follow">
  <meta name="rating" content="adult">
  <link rel="canonical" href="${BASE_URL}/blog/">
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:800px;margin:0 auto;padding:20px}
    h1{color:#e91e63}a{color:#e91e63}
    li{margin:6px 0}
    .nav{text-align:center;margin-top:2em}
    .nav a{display:inline-block;padding:10px 24px;background:#e91e63;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold}
  </style>
</head>
<body>
  <main>
    <h1>Blog - Incontri di Bakeka</h1>
    <p>Articoli su incontri, escort, trans e uomo cerca uomo in tutte le città italiane:</p>
    <ul>
${listItems}
    </ul>
    <div class="nav"><a href="/">Torna a Incontri di Bakeka →</a></div>
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(blogDir, 'index.html'), blogListing);

// Evergreen landing page for the generic search intent "bacheca incontri".
// It is intentionally useful and original rather than a doorway/keyword page.
const landingDir = path.join(PUBLIC_DIR, 'bacheca-incontri');
fs.mkdirSync(landingDir, { recursive: true });
const landingUrl = `${BASE_URL}/bacheca-incontri/`;
const landingDescription = 'Bacheca incontri in Italia per adulti: scopri annunci personali per città, pubblica il tuo profilo e usa messaggi e strumenti di segnalazione.';
const landingFaq = [
  { q: 'Come funziona una bacheca incontri?', a: 'Puoi consultare gli annunci attivi per città e categoria. Per pubblicare, salvare profili o inviare messaggi devi creare un account.' },
  { q: 'Gli annunci sono gratuiti?', a: 'La pubblicazione di base segue i limiti giornalieri indicati sul sito. Vetrina e Premium sono promozioni facoltative acquistabili con crediti.' },
  { q: 'Come posso cercare nella mia città?', a: 'Dalla pagina principale seleziona la città oppure apri una delle pagine locali presenti nella sitemap del sito.' },
  { q: 'Come vengono gestite sicurezza e segnalazioni?', a: 'Ogni annuncio può essere segnalato agli amministratori. Per gli incontri dal vivo consigliamo luoghi pubblici, prudenza e tutela dei dati personali.' },
];
const landingSchema = {
  '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', name: 'Bacheca incontri in Italia', url: landingUrl, description: landingDescription, isPartOf: { '@type': 'WebSite', name: 'Incontri di Bakeka', url: BASE_URL } },
    { '@type': 'FAQPage', mainEntity: landingFaq.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) },
  ],
};
const landingPage = `<!DOCTYPE html>
<html lang="it"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Bacheca incontri in Italia — Annunci personali per città</title>
  <meta name="description" content="${landingDescription}">
  <meta name="robots" content="index, follow, max-image-preview:large"><meta name="rating" content="adult">
  <link rel="canonical" href="${landingUrl}">
  <meta property="og:type" content="website"><meta property="og:title" content="Bacheca incontri in Italia">
  <meta property="og:description" content="${landingDescription}"><meta property="og:url" content="${landingUrl}">
  <meta property="og:image" content="${BASE_URL}/images/site-promo-banner.png">
  <script type="application/ld+json">${JSON.stringify(landingSchema).replace(/</g, '\\u003c')}</script>
  <style>body{font-family:Inter,system-ui,sans-serif;line-height:1.7;color:#241532;background:#faf7ff;margin:0}.wrap{max-width:900px;margin:auto;padding:28px 20px}h1,h2{color:#6d28d9}header{background:linear-gradient(135deg,#6d28d9,#db2777);color:#fff;padding:46px 0}header h1{color:#fff;margin:0 0 8px}.card{background:#fff;border:1px solid #eadcff;border-radius:18px;padding:22px;margin:20px 0;box-shadow:0 8px 28px #3b076410}a{color:#7c3aed;font-weight:700}.cta{display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px}nav a{margin-right:16px}footer{padding:30px 0;color:#6b7280}</style>
</head><body>
  <header><div class="wrap"><h1>Bacheca incontri in Italia</h1><p>Annunci personali per adulti, ricerca locale e strumenti per comunicare in modo più consapevole.</p><a class="cta" href="/">Guarda gli annunci attivi</a></div></header>
  <main class="wrap">
    <nav><a href="/">Home</a><a href="/blog/">Guide</a><a href="/blog/incontri-sicuri-italia/">Incontri sicuri</a></nav>
    <section class="card"><h2>Una bacheca organizzata per città</h2><p>Incontri di Bakeka raccoglie annunci personali pubblicati da utenti adulti. Puoi partire dalla tua città, consultare le categorie e aprire soltanto i profili che ti interessano. Le pagine locali mostrano annunci realmente attivi: non creiamo elenchi vuoti soltanto per apparire nei motori di ricerca.</p></section>
    <section class="card"><h2>Pubblicare e dare visibilità a un annuncio</h2><p>Dopo la registrazione puoi pubblicare un annuncio seguendo i limiti indicati nella piattaforma. La pubblicazione di base e le promozioni sono separate: Vetrina aumenta temporaneamente la visibilità, mentre Premium applica il badge e permette una galleria più ampia durante il periodo acquistato. Costi e saldo residuo sono mostrati prima della conferma.</p></section>
    <section class="card"><h2>Ricerca, contatti e messaggi</h2><p>Gli annunci possono essere cercati per città e categoria. Gli utenti registrati possono usare i messaggi interni; quando presenti, rimangono disponibili anche i contatti scelti dall’autore dell’annuncio. Non inviare documenti, denaro o dati sensibili a persone che non conosci.</p></section>
    <section class="card"><h2>Sicurezza prima dell’incontro</h2><p>Controlla attentamente il profilo, parla prima attraverso i canali disponibili e scegli un luogo pubblico per il primo incontro. Comunica a una persona fidata dove andrai. Se un contenuto appare falso, illegale o non consensuale, usa la funzione di segnalazione affinché gli amministratori possano verificarlo.</p></section>
    <section class="card"><h2>Domande frequenti</h2>${landingFaq.map(item => `<h3>${htmlEscape(item.q)}</h3><p>${htmlEscape(item.a)}</p>`).join('')}</section>
    <p><a class="cta" href="/">Entra nella bacheca incontri</a></p>
  </main><footer><div class="wrap">Contenuti destinati esclusivamente a maggiorenni · © 2026 Incontri di Bakeka</div></footer>
</body></html>`;
fs.writeFileSync(path.join(landingDir, 'index.html'), landingPage);

console.log(`✅ Generati ${count} articoli blog + pagina bacheca incontri`);
