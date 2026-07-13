import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SITE_URL = "https://incontridibakeka.com";
const OUT = resolve("dist/public");
const INDEX = resolve(OUT, "index.html");
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

const slugify = (value = "") => String(value).toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "")
  .replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function setTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html.replace("</head>", `${replacement}\n</head>`);
}

function renderShell(shell, { title, description, canonical, schema, body }) {
  let html = shell;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setTag(html, /<meta name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
  html = setTag(html, /<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}" />`);
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
  const seoUrls = [];

  if (!supabaseUrl || !supabaseKey) {
    writeFileSync(resolve(OUT, "seo-urls.json"), "[]");
    console.log("SEO statico: credenziali Supabase assenti, nessuna pagina dinamica generata");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: ads, error } = await supabase.from("ads")
    .select("id,title,description,city,category,updated_at")
    .eq("is_active", true).order("updated_at", { ascending: false }).limit(5000);
  if (error) throw error;

  const byCity = new Map();
  for (const ad of ads || []) {
    const city = String(ad.city || "").trim();
    if (!city) continue;
    byCity.set(city, (byCity.get(city) || 0) + 1);

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

  for (const [city, count] of byCity) {
    const route = `/incontri/${slugify(city)}`;
    const canonical = `${SITE_URL}${route}/`;
    const title = `Incontri a ${city} — Annunci personali per adulti`;
    const description = `Scopri ${count} annunci personali per adulti attivi a ${city}. Consulta i profili, usa i messaggi interni e segnala contenuti non conformi.`;
    const schema = {
      "@context": "https://schema.org", "@type": "CollectionPage", name: title,
      description, url: canonical, isPartOf: { "@type": "WebSite", name: "Incontri di Bakeka", url: SITE_URL },
    };
    const body = `<main style="max-width:760px;margin:40px auto;padding:20px;font-family:system-ui"><h1>Incontri a ${escapeHtml(city)}</h1><p>${escapeHtml(description)}</p><p>Contenuti riservati ai maggiorenni. Usa sempre prudenza e gli strumenti di segnalazione.</p><p><a href="/">Esplora gli annunci</a> · <a href="/blog/incontri-sicuri-italia/">Guida agli incontri sicuri</a></p></main>`;
    writeRoute(route, renderShell(shell, { title, description, canonical, schema, body }));
    seoUrls.push({ loc: canonical, lastmod: new Date().toISOString() });
  }

  writeFileSync(resolve(OUT, "seo-urls.json"), JSON.stringify(seoUrls, null, 2));
  console.log(`SEO statico: ${byCity.size} città e ${(ads || []).length} annunci`);
}

main().catch((error) => { console.error("SEO statico fallito:", error); process.exit(1); });
