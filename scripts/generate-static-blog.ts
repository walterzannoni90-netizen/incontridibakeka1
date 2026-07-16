import { blogArticles, type BlogArticle } from "../client/src/data/blog-data";
import * as fs from "node:fs";
import * as path from "node:path";

const BASE_URL = "https://incontridibakeka.com";
const OUTPUT_DIR = path.resolve(process.env.STATIC_OUTPUT_DIR || "dist/public");
const BLOG_DIR = path.join(OUTPUT_DIR, "blog");
const SOCIAL_IMAGE = `${BASE_URL}/images/site-promo-banner.png`;

interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
}

const categories = JSON.parse(
  fs.readFileSync(path.resolve("shared/categories.json"), "utf8"),
) as CategoryDefinition[];

function htmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function headingId(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function renderContent(content: string): string {
  const output: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) output.push(`</${listType}>`);
    listType = null;
  };

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      continue;
    }
    if (line.startsWith("### ")) {
      closeList();
      output.push(`<h3>${htmlEscape(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      output.push(
        `<h2 id="${headingId(line.slice(3))}">${htmlEscape(line.slice(3))}</h2>`,
      );
      continue;
    }
    if (line.startsWith("- ")) {
      if (listType !== "ul") {
        closeList();
        listType = "ul";
        output.push("<ul>");
      }
      output.push(`<li>${htmlEscape(line.slice(2))}</li>`);
      continue;
    }
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      if (listType !== "ol") {
        closeList();
        listType = "ol";
        output.push("<ol>");
      }
      output.push(`<li>${htmlEscape(ordered[1])}</li>`);
      continue;
    }
    closeList();
    output.push(`<p>${htmlEscape(line)}</p>`);
  }
  closeList();
  return output.join("\n");
}

const sharedStyles = `
  :root{color-scheme:dark;--ink:#f8f7ff;--muted:#c7c2d6;--panel:#171229;--line:#342a52;--violet:#8b5cf6;--pink:#ec4899;--cyan:#22d3ee}
  *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#090713;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.72}
  a{color:#c4b5fd}.wrap{width:min(1120px,calc(100% - 36px));margin:auto}.topbar{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 0}.brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-weight:900}.brand img{height:38px;width:auto}.nav{display:flex;flex-wrap:wrap;gap:14px}.nav a{text-decoration:none;color:var(--muted);font-weight:700;font-size:.92rem}.hero{position:relative;overflow:hidden;border-block:1px solid var(--line);background:radial-gradient(circle at 82% 5%,#db277744,transparent 34%),radial-gradient(circle at 15% 40%,#7c3aed55,transparent 38%),linear-gradient(145deg,#15102a,#0a0814);padding:72px 0}.eyebrow{display:inline-flex;border:1px solid #ffffff22;background:#ffffff0d;border-radius:999px;padding:7px 12px;color:#a5f3fc;font-size:.76rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.hero h1{max-width:900px;margin:18px 0 14px;font-size:clamp(2.25rem,7vw,5rem);line-height:1.02;letter-spacing:-.04em}.hero p{max-width:760px;color:var(--muted);font-size:1.12rem}.button{display:inline-flex;align-items:center;justify-content:center;margin-top:18px;border-radius:14px;padding:12px 19px;background:linear-gradient(135deg,var(--violet),var(--pink));color:#fff;text-decoration:none;font-weight:900;box-shadow:0 14px 40px #7c3aed44}.main{padding:46px 0 72px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.card{display:block;border:1px solid var(--line);border-radius:22px;background:linear-gradient(145deg,#1a1430,#110d20);padding:24px;text-decoration:none;box-shadow:0 16px 44px #0005}.card:hover{border-color:#8b5cf688;transform:translateY(-2px)}.card h2,.card h3{margin:.35rem 0;color:#fff;line-height:1.25}.card p{color:var(--muted);margin:.55rem 0}.tag{color:#67e8f9;font-size:.75rem;font-weight:900;text-transform:uppercase;letter-spacing:.1em}.article{display:grid;grid-template-columns:minmax(0,760px) 260px;gap:36px;align-items:start}.prose{border:1px solid var(--line);border-radius:28px;background:var(--panel);padding:clamp(24px,5vw,48px);box-shadow:0 24px 80px #0007}.prose h2{margin-top:2.25rem;color:#fff;font-size:1.55rem;line-height:1.25}.prose h3{margin-top:1.7rem}.prose p,.prose li{color:#ddd8e9}.prose ul,.prose ol{padding-left:1.35rem}.aside{position:sticky;top:18px;border:1px solid var(--line);border-radius:20px;background:#12101e;padding:20px}.aside h2{font-size:1rem}.aside a{display:block;margin:10px 0;text-decoration:none}.section{margin:42px 0}.section h2{font-size:clamp(1.6rem,4vw,2.35rem);line-height:1.15}.faq details{border-top:1px solid var(--line);padding:15px 0}.faq summary{cursor:pointer;font-weight:850}.cities,.chips{display:flex;flex-wrap:wrap;gap:9px}.chips a,.cities a{border:1px solid var(--line);border-radius:999px;padding:8px 12px;text-decoration:none;color:var(--muted);background:#ffffff08}.notice{border-left:4px solid var(--cyan);background:#22d3ee0d;padding:16px 18px;border-radius:0 14px 14px 0;color:var(--muted)}footer{border-top:1px solid var(--line);padding:34px 0;color:#918aa4}.meta{display:flex;flex-wrap:wrap;gap:12px;color:#a8a1b8;font-size:.86rem}@media(max-width:800px){.article{grid-template-columns:1fr}.aside{position:static}.grid{grid-template-columns:1fr}.nav{display:none}.hero{padding:54px 0}}
`;

function documentShell({
  title,
  description,
  canonical,
  body,
  schema,
  type = "website",
}: {
  title: string;
  description: string;
  canonical: string;
  body: string;
  schema: Record<string, unknown>;
  type?: "website" | "article";
}): string {
  return `<!doctype html>
<html lang="it"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${htmlEscape(title)}</title>
  <meta name="description" content="${htmlEscape(description.slice(0, 160))}">
  <meta name="robots" content="index,follow,max-image-preview:large"><meta name="rating" content="adult">
  <link rel="canonical" href="${canonical}"><link rel="icon" href="/logo.svg" type="image/svg+xml">
  <meta property="og:type" content="${type}"><meta property="og:site_name" content="Incontri di Bakeka">
  <meta property="og:title" content="${htmlEscape(title)}"><meta property="og:description" content="${htmlEscape(description.slice(0, 160))}">
  <meta property="og:url" content="${canonical}"><meta property="og:image" content="${SOCIAL_IMAGE}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${htmlEscape(title)}">
  <meta name="twitter:description" content="${htmlEscape(description.slice(0, 160))}"><meta name="twitter:image" content="${SOCIAL_IMAGE}">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
  <style>${sharedStyles}</style>
</head><body>
  <header class="wrap topbar"><a class="brand" href="/"><img src="/logo.svg" alt=""><span>Incontri di Bakeka</span></a><nav class="nav" aria-label="Principale"><a href="/">Annunci</a><a href="/blog/">Blog</a><a href="/bacheca-incontri/">Come funziona</a><a href="/pubblica-annuncio/">Pubblica</a></nav></header>
  ${body}
  <footer><div class="wrap">Contenuti destinati esclusivamente a maggiorenni · © 2026 Incontri di Bakeka</div></footer>
</body></html>`;
}

function writePage(route: string, html: string) {
  const directory = path.join(OUTPUT_DIR, route.replace(/^\//, ""));
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "index.html"), html, "utf8");
}

function articlePage(article: BlogArticle): string {
  const canonical = `${BASE_URL}/blog/${article.slug}/`;
  const headings = article.content
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.slice(3));
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: canonical,
    author: {
      "@type": "Organization",
      name: "Incontri di Bakeka",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Incontri di Bakeka",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.svg` },
    },
  };
  const body = `<section class="hero"><div class="wrap"><span class="eyebrow">${htmlEscape(article.categoryTitle)}</span><h1>${htmlEscape(article.title)}</h1><p>${htmlEscape(article.excerpt)}</p><div class="meta"><span>Pubblicato il ${htmlEscape(article.date)}</span><span>Guida ufficiale della piattaforma</span></div></div></section>
  <main class="wrap main article"><article class="prose">${renderContent(article.content)}<p class="notice">Le funzioni possono evolvere: per costi, durata e disponibilità fa fede ciò che viene mostrato nella piattaforma prima della conferma.</p><a class="button" href="/pubblica-annuncio/">Pubblica il tuo annuncio</a></article><aside class="aside"><h2>In questa guida</h2>${headings.map((heading) => `<a href="#${headingId(heading)}">${htmlEscape(heading)}</a>`).join("")}<h2>Continua</h2><a href="/blog/">Tutte le guide</a><a href="/bacheca-incontri/">Come funziona il sito</a><a href="/">Annunci attivi</a></aside></main>`;
  return documentShell({
    title: `${article.title} | Incontri di Bakeka`,
    description: article.excerpt,
    canonical,
    body,
    schema,
    type: "article",
  });
}

function blogListingPage(): string {
  const canonical = `${BASE_URL}/blog/`;
  const description =
    "Guide ufficiali di Incontri di Bakeka su pubblicazione, sicurezza, moderazione, visibilità e scadenze reali.";
  const cards = blogArticles
    .map(
      (article) =>
        `<a class="card" href="/blog/${article.slug}/"><span class="tag">${htmlEscape(article.categoryTitle)}</span><h2>${htmlEscape(article.title)}</h2><p>${htmlEscape(article.excerpt)}</p><small>${htmlEscape(article.date)}</small></a>`,
    )
    .join("\n");
  const body = `<section class="hero"><div class="wrap"><span class="eyebrow">Blog ufficiale</span><h1>Capire e usare meglio Incontri di Bakeka</h1><p>${description}</p></div></section><main class="wrap main"><div class="grid">${cards}</div><section class="section"><h2>Esplora la piattaforma</h2><div class="chips"><a href="/bacheca-incontri/">Come funziona</a><a href="/pubblica-annuncio/">Pubblica un annuncio</a><a href="/blog/incontri-sicuri-italia/">Sicurezza</a><a href="/blog/premium-vs-gratuito/">Premium e Vetrina</a></div></section></main>`;
  return documentShell({
    title: "Blog ufficiale | Incontri di Bakeka",
    description,
    canonical,
    body,
    schema: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Blog ufficiale di Incontri di Bakeka",
      url: canonical,
      description,
    },
  });
}

function bachecaLandingPage(): string {
  const canonical = `${BASE_URL}/bacheca-incontri/`;
  const description =
    "Come funziona Incontri di Bakeka: annunci personali attivi per adulti, ricerca per città e categoria, messaggi e segnalazioni.";
  const categoryLinks = categories
    .map(
      (category) =>
        `<a href="/categoria/${category.id}/">${htmlEscape(category.name)}</a>`,
    )
    .join("");
  const body = `<section class="hero"><div class="wrap"><span class="eyebrow">Solo per maggiorenni</span><h1>Una bacheca di annunci personali organizzata e trasparente</h1><p>${description}</p><a class="button" href="/">Guarda gli annunci attivi</a></div></section><main class="wrap main">
    <section class="section"><h2>Contenuti collegati a dati reali</h2><p>Le pagine indicizzabili delle città e delle categorie vengono create soltanto quando contengono annunci attivi. Un profilo disattivato non viene aggiunto alla sitemap pubblica. Le visualizzazioni di un annuncio aumentano quando viene aperta la sua scheda, non quando qualcuno visita genericamente la homepage.</p></section>
    <section class="section"><h2>Cerca per categoria</h2><p>Ogni categoria raccoglie i profili che gli autori hanno classificato in quella sezione.</p><div class="chips">${categoryLinks}</div></section>
    <section class="section"><h2>Pubblicazione e promozioni sono separate</h2><p>Puoi creare e gestire l'annuncio di base secondo i limiti mostrati nel sito. Premium e Vetrina sono promozioni facoltative: annuncio selezionato, costo, durata e saldo vengono mostrati prima della conferma. La promozione termina alla scadenza calcolata sulla durata acquistata.</p></section>
    <section class="section"><h2>Sicurezza e segnalazioni</h2><p>La piattaforma mette a disposizione strumenti di segnalazione, ma nessun sito può eliminare ogni rischio. Non inviare denaro, documenti, password o codici di accesso. Per il primo incontro scegli un luogo pubblico e comunica il programma a una persona fidata.</p><a class="button" href="/blog/incontri-sicuri-italia/">Leggi la guida alla sicurezza</a></section>
    <section class="section faq"><h2>Domande frequenti</h2><details><summary>Gli annunci mostrati sono dimostrativi?</summary><p>No. Le pagine pubbliche utilizzano gli annunci attivi presenti nella piattaforma; i dati dimostrativi non vengono usati per riempire la ricerca.</p></details><details><summary>Premium equivale a una verifica?</summary><p>No. Premium e Vetrina riguardano la visibilità temporanea. Un eventuale stato di verifica è distinto e viene mostrato separatamente.</p></details><details><summary>Come si segnala un contenuto?</summary><p>Apri l'annuncio, usa la funzione di segnalazione e indica un motivo preciso. In caso di pericolo immediato contatta le autorità competenti.</p></details></section>
  </main>`;
  return documentShell({
    title: "Bacheca incontri in Italia | Incontri di Bakeka",
    description,
    canonical,
    body,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Come funziona Incontri di Bakeka",
      url: canonical,
      description,
    },
  });
}

function publishLandingPage(): string {
  const canonical = `${BASE_URL}/pubblica-annuncio/`;
  const description =
    "Pubblica il tuo annuncio personale: crea un account, scegli città e categoria, aggiungi contenuti originali e gestisci il profilo.";
  const body = `<section class="hero"><div class="wrap"><span class="eyebrow">Pubblicazione di base</span><h1>Il tuo annuncio, gestito da te</h1><p>${description}</p><a class="button" href="/?action=publish&amp;utm_source=organic-landing&amp;utm_medium=website&amp;utm_campaign=publish-free">Inizia a pubblicare</a></div></section><main class="wrap main">
    <div class="grid"><section class="card"><span class="tag">1 · Account</span><h2>Crea l'accesso</h2><p>Registrati e conserva le credenziali in modo sicuro. L'account permette di gestire i contenuti pubblicati.</p></section><section class="card"><span class="tag">2 · Contenuto</span><h2>Scrivi informazioni originali</h2><p>Scegli città e categoria corrette, descrivi ciò che cerchi e usa soltanto immagini che hai il diritto di pubblicare.</p></section><section class="card"><span class="tag">3 · Contatti</span><h2>Decidi come comunicare</h2><p>Seleziona i recapiti che vuoi mostrare e non inserire documenti, indirizzi o dati finanziari nella descrizione.</p></section><section class="card"><span class="tag">4 · Gestione</span><h2>Aggiorna o disattiva</h2><p>Modifica le informazioni quando cambiano e disattiva l'annuncio quando non vuoi più ricevere richieste.</p></section></div>
    <section class="section"><h2>Premium e Vetrina sono facoltativi</h2><p>Le promozioni non sono necessarie per creare l'annuncio di base. Se scegli di usarle, controlla costo, durata, annuncio selezionato e data di scadenza mostrati prima della conferma.</p><a class="button" href="/blog/premium-vs-gratuito/">Capisci le differenze</a></section>
  </main>`;
  return documentShell({
    title: "Pubblica il tuo annuncio | Incontri di Bakeka",
    description,
    canonical,
    body,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Pubblica il tuo annuncio personale",
      url: canonical,
      description,
    },
  });
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR))
    throw new Error(`Cartella build non trovata: ${OUTPUT_DIR}`);
  fs.rmSync(BLOG_DIR, { recursive: true, force: true });
  fs.mkdirSync(BLOG_DIR, { recursive: true });

  for (const article of blogArticles) {
    writePage(`/blog/${article.slug}`, articlePage(article));
  }
  writePage("/blog", blogListingPage());
  writePage("/bacheca-incontri", bachecaLandingPage());
  writePage("/pubblica-annuncio", publishLandingPage());

  const manifest = blogArticles.map((article) => ({
    loc: `${BASE_URL}/blog/${article.slug}/`,
    lastmod: article.updatedAt,
  }));
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "blog-urls.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );
  console.log(
    `Blog statico: ${blogArticles.length} guide originali + 2 landing page`,
  );
}

main();
