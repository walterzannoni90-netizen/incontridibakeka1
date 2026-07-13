import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SITE_URL = "https://incontridibakeka.com";
const OUT = resolve("dist/public");
const INDEX = resolve(OUT, "index.html");
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

function readItalianCities() {
  const source = readFileSync(resolve("shared/data.ts"), "utf8");
  const block = source.match(/export const ITALIAN_CITIES = \[([\s\S]*?)\];/);
  if (!block) throw new Error("Elenco ITALIAN_CITIES non trovato");
  return [...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

const slugify = (value = "") => String(value).toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "")
  .replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function setTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html.replace("</head>", `${replacement}\n</head>`);
}

function renderShell(shell, { title, description, canonical, schema, body, robots = "index,follow,max-image-preview:large" }) {
  let html = shell;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setTag(html, /<meta name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
  html = setTag(html, /<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}" />`);
  html = setTag(html, /<meta name="robots"[^>]*>/i, `<meta name="robots" content="${robots}" />`);
  html = setTag(html, /<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = setTag(html, /<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = setTag(html, /<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}" />`);
  html = html.replace("</head>", `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>\n</head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return html;
}

function writeRoute(route, html) {
  const dir = resolve(OUT, route.replace(/^\//, ""));
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), html, "utf8");
}

async function main() {
  if (!existsSync(INDEX)) throw new Error("Build index.html non trovato");
  const shell = readFileSync(INDEX, "utf8");
  const italianCities = readItalianCities();
  const seoUrls = [];

  let ads = [];
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from("ads")
      .select("id,title,description,city,category,updated_at")
      .eq("is_active", true).order("updated_at", { ascending: false }).limit(5000);
    if (error) throw error;
    ads = data || [];
  } else {
    console.log("SEO statico: credenziali Supabase assenti, città generate in modalità noindex");
  }

  const byCity = new Map();
  for (const ad of ads) {
    const city = String(ad.city || "").trim();
    if (!city) continue;
    const citySlug = slugify(city);
    const cityGroup = byCity.get(citySlug) || { name: city, ads: [] };
    cityGroup.ads.push(ad);
    byCity.set(citySlug, cityGroup);

    const slug = `${slugify(ad.title || "annuncio")}-${ad.id}`;
    const route = `/ad/${slug}`;
    const canonical = `${SITE_URL}${route}/`;
    const description = `${ad.title}. Annuncio personale per adulti a ${city}. ${String(ad.description || "").slice(0, 125)}`.slice(0, 160);
    const schema = {
      "@context": "https://schema.org", "@type": "WebPage", name: ad.title,
      description, url: canonical, dateModified: ad.updated_at,
      isPartOf: { "@type": "WebSite", name: "Incontri di Bakeka", url: SITE_URL },
      breadcrumb: { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: `Incontri a ${city}`, item: `${SITE_URL}/incontri/${slugify(city)}/` },
        { "@type": "ListItem", position: 3, name: ad.title, item: canonical },
      ] },
    };
    const body = `<main style="max-width:760px;margin:40px auto;padding:20px;font-family:system-ui"><h1>${escapeHtml(ad.title)}</h1><p>Annuncio personale per adulti a <strong>${escapeHtml(city)}</strong>.</p><p>${escapeHtml(String(ad.description || "").slice(0, 500))}</p><p><a href="/incontri/${slugify(city)}">Vedi gli annunci a ${escapeHtml(city)}</a></p></main>`;
    writeRoute(route, renderShell(shell, { title: `${ad.title} — Incontri a ${city}`, description, canonical, schema, body }));
    seoUrls.push({ loc: canonical, lastmod: ad.updated_at });
  }

  for (const city of italianCities) {
    const citySlug = slugify(city);
    const cityAds = byCity.get(citySlug)?.ads || [];
    const count = cityAds.length;
    const route = `/incontri/${citySlug}`;
    const canonical = `${SITE_URL}${route}/`;
    const title = `Incontri a ${city} — Annunci personali per adulti`;
    const description = count > 0
      ? `Scopri ${count} annunci personali per adulti attivi a ${city}. Consulta i profili, usa i messaggi interni e segnala contenuti non conformi.`
      : `Consulta la sezione dedicata agli incontri a ${city}. I nuovi annunci personali per adulti saranno mostrati qui quando disponibili.`;
    const schemas = [{
      "@context": "https://schema.org", "@type": "CollectionPage", name: title,
      description, url: canonical, isPartOf: { "@type": "WebSite", name: "Incontri di Bakeka", url: SITE_URL },
    }, {
      "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: `Incontri a ${city}`, item: canonical },
      ],
    }];
    if (count > 0) {
      schemas.push({
        "@context": "https://schema.org", "@type": "ItemList", numberOfItems: count,
        itemListElement: cityAds.slice(0, 20).map((ad, index) => ({
          "@type": "ListItem", position: index + 1, name: ad.title,
          url: `${SITE_URL}/ad/${slugify(ad.title || "annuncio")}-${ad.id}/`,
        })),
      });
    }
    const availability = count > 0
      ? `<p><strong>${count} annunci attivi</strong>: scegli un profilo per leggere i dettagli e usa i messaggi della piattaforma.</p>`
      : `<p><strong>Nessun annuncio attivo al momento.</strong> La pagina rimane disponibile e si aggiornerà automaticamente alla prima pubblicazione.</p>`;
    const body = `<main style="max-width:760px;margin:40px auto;padding:20px;font-family:system-ui"><h1>Incontri a ${escapeHtml(city)}</h1><p>${escapeHtml(description)}</p>${availability}<h2>Annunci e contatti a ${escapeHtml(city)}</h2><p>Filtra gli annunci disponibili e consulta soltanto contenuti destinati a persone maggiorenni. Non condividere dati sensibili e utilizza gli strumenti di segnalazione in caso di contenuti non conformi.</p><p><a href="/">Esplora gli annunci</a> · <a href="/blog/incontri-sicuri-italia/">Guida agli incontri sicuri</a></p></main>`;
    writeRoute(route, renderShell(shell, {
      title, description, canonical, schema: schemas, body,
      robots: count > 0 ? "index,follow,max-image-preview:large" : "noindex,follow",
    }));
    if (count > 0) seoUrls.push({ loc: canonical, lastmod: cityAds[0]?.updated_at || new Date().toISOString() });
  }

  writeFileSync(resolve(OUT, "seo-urls.json"), JSON.stringify(seoUrls, null, 2));
  console.log(`SEO statico: ${italianCities.length} città (${byCity.size} attive) e ${ads.length} annunci`);
}

main().catch((error) => { console.error("SEO statico fallito:", error); process.exit(1); });
