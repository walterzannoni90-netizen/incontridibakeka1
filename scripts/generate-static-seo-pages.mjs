import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SITE_URL = "https://incontridibakeka.com";
const OUT = resolve("dist/public");
const INDEX = resolve(OUT, "index.html");
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const categories = JSON.parse(
  readFileSync(resolve("shared/categories.json"), "utf8"),
);
const categoryIds = new Set(categories.map((category) => category.id));

function readItalianCities() {
  const source = readFileSync(resolve("shared/data.ts"), "utf8");
  const block = source.match(/export const ITALIAN_CITIES = \[([\s\S]*?)\];/);
  if (!block) throw new Error("Elenco ITALIAN_CITIES non trovato");
  return [...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

function setTag(html, pattern, replacement) {
  return pattern.test(html)
    ? html.replace(pattern, replacement)
    : html.replace("</head>", `${replacement}\n</head>`);
}

const prerenderStyles = `<style id="seo-prerender-style">
  #root{min-height:100vh;background:#090713;color:#f8f7ff;font-family:Inter,system-ui,sans-serif}
  .seo-page{width:min(1040px,calc(100% - 36px));margin:auto;padding:42px 0 64px}.seo-nav{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:34px}.seo-nav a,.seo-chip{color:#c4b5fd;text-decoration:none}.seo-hero{padding:28px;border:1px solid #342a52;border-radius:26px;background:radial-gradient(circle at 90% 0,#db277733,transparent 35%),linear-gradient(145deg,#1b1530,#100c1d)}.seo-hero h1{font-size:clamp(2rem,6vw,4.2rem);line-height:1.04;margin:0 0 14px}.seo-hero p{max-width:760px;color:#c7c2d6;line-height:1.7}.seo-section{margin-top:34px}.seo-section h2{font-size:1.65rem}.seo-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding:0;list-style:none}.seo-card{height:100%;padding:20px;border:1px solid #342a52;border-radius:18px;background:#171229}.seo-card a{color:#fff;font-weight:850;text-decoration:none;font-size:1.08rem}.seo-card p{color:#c7c2d6;line-height:1.55}.seo-meta{color:#67e8f9;font-size:.82rem}.seo-chips{display:flex;flex-wrap:wrap;gap:9px}.seo-chip{border:1px solid #342a52;border-radius:999px;padding:8px 12px;background:#ffffff08}.seo-notice{border-left:4px solid #22d3ee;background:#22d3ee0d;padding:15px 18px;border-radius:0 14px 14px 0;color:#c7c2d6}@media(max-width:700px){.seo-list{grid-template-columns:1fr}.seo-hero{padding:22px}}
</style>`;

function renderShell(
  shell,
  {
    title,
    description,
    canonical,
    schema,
    body,
    robots = "index,follow,max-image-preview:large",
  },
) {
  let html = shell;
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Incontri di Bakeka",
    url: `${SITE_URL}/`,
    description:
      "Piattaforma italiana di annunci personali per adulti con ricerca locale, messaggi e segnalazioni.",
  };
  html = html.replace(
    /<script type="application\/ld\+json">\s*\{[\s\S]*?"@type":\s*"WebSite"[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">${JSON.stringify(websiteSchema).replace(/</g, "\\u003c")}</script>`,
  );
  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(title)}</title>`,
  );
  html = setTag(
    html,
    /<meta name="description"[^>]*>/i,
    `<meta name="description" content="${escapeHtml(description)}" />`,
  );
  html = setTag(
    html,
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${canonical}" />`,
  );
  html = setTag(
    html,
    /<meta name="robots"[^>]*>/i,
    `<meta name="robots" content="${robots}" />`,
  );
  html = setTag(
    html,
    /<meta property="og:title"[^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
  );
  html = setTag(
    html,
    /<meta property="og:description"[^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
  );
  html = setTag(
    html,
    /<meta property="og:url"[^>]*>/i,
    `<meta property="og:url" content="${canonical}" />`,
  );
  html = setTag(
    html,
    /<meta name="twitter:title"[^>]*>/i,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
  );
  html = setTag(
    html,
    /<meta name="twitter:description"[^>]*>/i,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
  );
  html = html.replace(
    "</head>",
    `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>\n${prerenderStyles}\n</head>`,
  );
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return html;
}

function writeRoute(route, html) {
  const directory = resolve(OUT, route.replace(/^\//, ""));
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, "index.html"), html, "utf8");
}

function categoryName(categoryId) {
  return (
    categories.find((category) => category.id === categoryId)?.name ||
    "Annunci personali"
  );
}

function adRoute(ad) {
  return `/ad/${slugify(ad.title || "annuncio")}-${ad.id}`;
}

function renderAdList(ads) {
  if (!ads.length) return "";
  return `<ul class="seo-list">${ads
    .slice(0, 30)
    .map((ad) => {
      const route = adRoute(ad);
      const description = String(ad.description || "")
        .trim()
        .slice(0, 180);
      return `<li><article class="seo-card"><span class="seo-meta">${escapeHtml(ad.city || "Italia")} · ${escapeHtml(categoryName(ad.category))}${ad.is_verified ? " · Verificato" : ""}</span><h3><a href="${route}/">${escapeHtml(ad.title || "Annuncio personale")}</a></h3>${description ? `<p>${escapeHtml(description)}</p>` : ""}</article></li>`;
    })
    .join("")}</ul>`;
}

function latestUpdate(ads) {
  return (
    ads
      .map((ad) => ad.updated_at)
      .filter(Boolean)
      .sort()
      .at(-1) || undefined
  );
}

async function loadActiveAds() {
  if (!supabaseUrl || !supabaseKey) {
    console.log(
      "SEO statico: credenziali Supabase assenti; città, categorie e annunci restano fuori dalla sitemap",
    );
    return [];
  }
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("ads")
    .select("id,title,description,city,category,is_verified,updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(5000);
  if (error)
    throw new Error(`Lettura annunci attivi fallita: ${error.message}`);
  return (data || []).filter(
    (ad) => ad.id && ad.title && ad.city && categoryIds.has(ad.category),
  );
}

async function main() {
  if (!existsSync(INDEX)) throw new Error("Build index.html non trovato");
  const shell = readFileSync(INDEX, "utf8");
  const italianCities = readItalianCities();
  const ads = await loadActiveAds();
  const seoUrls = [];

  const byCity = new Map();
  const byCategory = new Map();
  for (const ad of ads) {
    const citySlug = slugify(ad.city);
    const cityGroup = byCity.get(citySlug) || {
      name: String(ad.city).trim(),
      ads: [],
    };
    cityGroup.ads.push(ad);
    byCity.set(citySlug, cityGroup);

    const categoryAds = byCategory.get(ad.category) || [];
    categoryAds.push(ad);
    byCategory.set(ad.category, categoryAds);
  }

  const homeDescription =
    "Scopri e pubblica annunci personali per adulti nelle città italiane, con ricerca locale, messaggi e strumenti di segnalazione.";
  const activeCityLinks = [...byCity.entries()]
    .map(
      ([citySlug, group]) =>
        `<a class="seo-chip" href="/incontri/${citySlug}/">${escapeHtml(group.name)} · ${group.ads.length}</a>`,
    )
    .join("");
  const activeCategoryLinks = [...byCategory.entries()]
    .map(
      ([categoryId, categoryAds]) =>
        `<a class="seo-chip" href="/categoria/${categoryId}/">${escapeHtml(categoryName(categoryId))} · ${categoryAds.length}</a>`,
    )
    .join("");
  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Incontri di Bakeka — Annunci personali in Italia",
    description: homeDescription,
    url: `${SITE_URL}/`,
    ...(ads.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: ads.length,
            itemListElement: ads.slice(0, 30).map((ad, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: ad.title,
              url: `${SITE_URL}${adRoute(ad)}/`,
            })),
          },
        }
      : {}),
  };
  const homeBody = `<main class="seo-page"><nav class="seo-nav"><a href="/blog/">Blog ufficiale</a><a href="/bacheca-incontri/">Come funziona</a><a href="/pubblica-annuncio/">Pubblica un annuncio</a></nav><section class="seo-hero"><span class="seo-meta">Piattaforma destinata esclusivamente a maggiorenni</span><h1>Annunci personali nelle città italiane</h1><p>${escapeHtml(homeDescription)}</p></section>${ads.length ? `<section class="seo-section"><h2>Annunci attivi aggiornati</h2><p>In questo aggiornamento sono presenti ${ads.length} annunci attivi in ${byCity.size} città. I contenuti disattivati non vengono inclusi nella sitemap.</p>${renderAdList(ads)}</section><section class="seo-section"><h2>Città con annunci attivi</h2><div class="seo-chips">${activeCityLinks}</div></section><section class="seo-section"><h2>Categorie disponibili</h2><div class="seo-chips">${activeCategoryLinks}</div></section>` : `<section class="seo-section"><p class="seo-notice">Gli annunci attivi vengono caricati dalla piattaforma. Non vengono inseriti profili dimostrativi per riempire la pagina.</p></section>`}<section class="seo-section"><h2>Prima di iniziare</h2><p>Controlla le informazioni del profilo, proteggi i dati personali e usa la funzione di segnalazione quando un contenuto non sembra conforme.</p><div class="seo-chips"><a class="seo-chip" href="/blog/incontri-sicuri-italia/">Guida alla sicurezza</a><a class="seo-chip" href="/blog/come-funziona-incontri-di-bakeka/">Guida alla piattaforma</a></div></section></main>`;
  writeFileSync(
    INDEX,
    renderShell(shell, {
      title: "Incontri di Bakeka — Annunci personali in Italia",
      description: homeDescription,
      canonical: `${SITE_URL}/`,
      schema: homeSchema,
      body: homeBody,
    }),
    "utf8",
  );

  for (const ad of ads) {
    const route = adRoute(ad);
    const canonical = `${SITE_URL}${route}/`;
    const cityRoute = `/incontri/${slugify(ad.city)}`;
    const categoryRoute = `/categoria/${ad.category}`;
    const description =
      `${ad.title}. Annuncio personale per adulti a ${ad.city}. ${String(ad.description || "").slice(0, 115)}`.slice(
        0,
        160,
      );
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          name: ad.title,
          description,
          url: canonical,
          dateModified: ad.updated_at,
          isPartOf: {
            "@type": "WebSite",
            name: "Incontri di Bakeka",
            url: SITE_URL,
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: `${SITE_URL}/`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: `Incontri a ${ad.city}`,
              item: `${SITE_URL}${cityRoute}/`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: ad.title,
              item: canonical,
            },
          ],
        },
      ],
    };
    const body = `<main class="seo-page"><nav class="seo-nav"><a href="/">Home</a><a href="${cityRoute}/">Incontri a ${escapeHtml(ad.city)}</a><a href="${categoryRoute}/">${escapeHtml(categoryName(ad.category))}</a></nav><section class="seo-hero"><span class="seo-meta">${escapeHtml(ad.city)} · ${escapeHtml(categoryName(ad.category))}${ad.is_verified ? " · Profilo verificato" : ""}</span><h1>${escapeHtml(ad.title)}</h1><p>${escapeHtml(String(ad.description || "Descrizione non disponibile").slice(0, 900))}</p></section><section class="seo-section"><p class="seo-notice">Annuncio pubblicato da un utente adulto. Non inviare denaro, documenti, password o codici di accesso. Usa la segnalazione se il contenuto non ti sembra conforme.</p><div class="seo-chips"><a class="seo-chip" href="${cityRoute}/">Altri annunci a ${escapeHtml(ad.city)}</a><a class="seo-chip" href="${categoryRoute}/">Categoria ${escapeHtml(categoryName(ad.category))}</a><a class="seo-chip" href="/blog/incontri-sicuri-italia/">Guida alla sicurezza</a></div></section></main>`;
    writeRoute(
      route,
      renderShell(shell, {
        title: `${ad.title} — Incontri a ${ad.city}`,
        description,
        canonical,
        schema,
        body,
      }),
    );
    seoUrls.push({ loc: canonical, lastmod: ad.updated_at, type: "ad" });
  }

  const cityDefinitions = new Map(
    italianCities.map((city) => [slugify(city), city]),
  );
  for (const [citySlug, group] of byCity) {
    if (!cityDefinitions.has(citySlug))
      cityDefinitions.set(citySlug, group.name);
  }

  for (const [citySlug, city] of cityDefinitions) {
    const cityAds = byCity.get(citySlug)?.ads || [];
    const count = cityAds.length;
    const route = `/incontri/${citySlug}`;
    const canonical = `${SITE_URL}${route}/`;
    const title = `Incontri a ${city} — ${count ? `${count} annunci personali attivi` : "Annunci personali"}`;
    const description = count
      ? `Consulta ${count} annunci personali attivi pubblicati dagli utenti a ${city}, organizzati per categoria e data di aggiornamento.`
      : `La pagina degli annunci personali a ${city} sarà indicizzabile quando saranno presenti contenuti attivi.`;
    const categoryCounts = [...new Set(cityAds.map((ad) => ad.category))].map(
      (categoryId) => ({
        id: categoryId,
        count: cityAds.filter((ad) => ad.category === categoryId).length,
      }),
    );
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: title,
          description,
          url: canonical,
          isPartOf: {
            "@type": "WebSite",
            name: "Incontri di Bakeka",
            url: SITE_URL,
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: `${SITE_URL}/`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: `Incontri a ${city}`,
              item: canonical,
            },
          ],
        },
        ...(count
          ? [
              {
                "@type": "ItemList",
                numberOfItems: count,
                itemListElement: cityAds.slice(0, 30).map((ad, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  name: ad.title,
                  url: `${SITE_URL}${adRoute(ad)}/`,
                })),
              },
            ]
          : []),
      ],
    };
    const body = `<main class="seo-page"><nav class="seo-nav"><a href="/">Home</a><a href="/bacheca-incontri/">Come funziona</a><a href="/pubblica-annuncio/">Pubblica</a></nav><section class="seo-hero"><span class="seo-meta">Pagina locale aggiornata dagli annunci attivi</span><h1>Incontri a ${escapeHtml(city)}</h1><p>${escapeHtml(description)}</p></section>${count ? `<section class="seo-section"><h2>Annunci attivi a ${escapeHtml(city)}</h2>${renderAdList(cityAds)}</section><section class="seo-section"><h2>Categorie disponibili</h2><div class="seo-chips">${categoryCounts.map((item) => `<a class="seo-chip" href="/categoria/${item.id}/">${escapeHtml(categoryName(item.id))} · ${item.count}</a>`).join("")}</div></section>` : `<section class="seo-section"><p class="seo-notice">Nessun annuncio attivo al momento. Questa pagina è esclusa dalla sitemap e dai risultati di ricerca finché resta vuota.</p><a class="seo-chip" href="/pubblica-annuncio/">Pubblica il primo annuncio a ${escapeHtml(city)}</a></section>`}<section class="seo-section"><h2>Prima di contattare qualcuno</h2><p>Leggi con attenzione il profilo, proteggi i dati personali e non inviare anticipi o codici di accesso. Per il primo incontro scegli un luogo pubblico.</p><a class="seo-chip" href="/blog/incontri-sicuri-italia/">Guida alla sicurezza</a></section></main>`;
    writeRoute(
      route,
      renderShell(shell, {
        title,
        description,
        canonical,
        schema,
        body,
        robots: count
          ? "index,follow,max-image-preview:large"
          : "noindex,follow",
      }),
    );
    if (count)
      seoUrls.push({
        loc: canonical,
        lastmod: latestUpdate(cityAds),
        type: "city",
      });
  }

  for (const category of categories) {
    const categoryAds = byCategory.get(category.id) || [];
    const count = categoryAds.length;
    const route = `/categoria/${category.id}`;
    const canonical = `${SITE_URL}${route}/`;
    const title = `${category.name} — ${count ? `${count} annunci personali attivi` : "Annunci personali"}`;
    const description = count
      ? `${category.description} Consulta ${count} annunci attivi pubblicati dagli utenti.`
      : `${category.description} La pagina sarà indicizzabile quando saranno presenti annunci attivi.`;
    const cityCounts = [...new Set(categoryAds.map((ad) => ad.city))]
      .map((city) => ({
        city,
        count: categoryAds.filter((ad) => ad.city === city).length,
      }))
      .sort((a, b) => b.count - a.count);
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: title,
          description,
          url: canonical,
          isPartOf: {
            "@type": "WebSite",
            name: "Incontri di Bakeka",
            url: SITE_URL,
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: `${SITE_URL}/`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: category.name,
              item: canonical,
            },
          ],
        },
        ...(count
          ? [
              {
                "@type": "ItemList",
                numberOfItems: count,
                itemListElement: categoryAds.slice(0, 30).map((ad, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  name: ad.title,
                  url: `${SITE_URL}${adRoute(ad)}/`,
                })),
              },
            ]
          : []),
      ],
    };
    const body = `<main class="seo-page"><nav class="seo-nav"><a href="/">Home</a><a href="/bacheca-incontri/">Come funziona</a><a href="/pubblica-annuncio/">Pubblica</a></nav><section class="seo-hero"><span class="seo-meta">Categoria aggiornata dagli annunci attivi</span><h1>${escapeHtml(category.name)}</h1><p>${escapeHtml(description)}</p></section>${count ? `<section class="seo-section"><h2>Annunci attivi</h2>${renderAdList(categoryAds)}</section><section class="seo-section"><h2>Città presenti</h2><div class="seo-chips">${cityCounts.map((item) => `<a class="seo-chip" href="/incontri/${slugify(item.city)}/">${escapeHtml(item.city)} · ${item.count}</a>`).join("")}</div></section>` : `<section class="seo-section"><p class="seo-notice">Nessun annuncio attivo in questa categoria. La pagina è esclusa dalla sitemap e dai risultati di ricerca finché resta vuota.</p></section>`}<section class="seo-section"><h2>Contenuti pubblicati dagli utenti</h2><p>Leggi descrizione e recapiti con prudenza. Premium e Vetrina indicano visibilità temporanea e non sostituiscono i controlli prima di un contatto.</p><a class="seo-chip" href="/blog/riconoscere-annunci-sospetti/">Riconoscere un annuncio sospetto</a></section></main>`;
    writeRoute(
      route,
      renderShell(shell, {
        title,
        description,
        canonical,
        schema,
        body,
        robots: count
          ? "index,follow,max-image-preview:large"
          : "noindex,follow",
      }),
    );
    if (count)
      seoUrls.push({
        loc: canonical,
        lastmod: latestUpdate(categoryAds),
        type: "category",
      });
  }

  writeFileSync(
    resolve(OUT, "seo-urls.json"),
    JSON.stringify(seoUrls, null, 2),
    "utf8",
  );
  console.log(
    `SEO statico: ${ads.length} annunci, ${[...byCity.values()].filter((group) => group.ads.length).length} città attive, ${[...byCategory.values()].filter((group) => group.length).length} categorie attive`,
  );
}

main().catch((error) => {
  console.error(
    "SEO statico fallito:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
