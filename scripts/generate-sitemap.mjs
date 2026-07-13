import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SITE_URL = process.env.SITE_URL || "https://incontridibakeka.com";
const OUTPUT_DIR = resolve(__dirname, "..", "dist", "public");

async function main() {
  console.log("Generating sitemap...");

  const urls = [];

  // Homepage
  urls.push({ loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" });

  // Static pages
  urls.push({ loc: `${SITE_URL}/shop`, changefreq: "weekly", priority: "0.6" });

  // Blog articles - all from blog-data.ts (static HTML, return HTTP 200)
  const BLOG_SLUGS = [
    "incontri-sicuri-italia","profilo-perfetto-incontri","premium-vs-gratuito",
    "incontri-roma","escort-roma","trans-roma","uomo-cerca-uomo-roma",
    "incontri-milano","escort-milano","trans-milano","uomo-cerca-uomo-milano",
    "incontri-napoli","escort-napoli","trans-napoli","uomo-cerca-uomo-napoli",
    "incontri-torino","escort-torino","trans-torino","uomo-cerca-uomo-torino",
    "incontri-firenze","escort-firenze","trans-firenze","uomo-cerca-uomo-firenze",
    "incontri-bologna","escort-bologna","trans-bologna","uomo-cerca-uomo-bologna",
    "incontri-catania","escort-catania","trans-catania","uomo-cerca-uomo-catania",
    "incontri-palermo","escort-palermo","trans-palermo","uomo-cerca-uomo-palermo",
    "incontri-genova","escort-genova","trans-genova","uomo-cerca-uomo-genova",
    "incontri-bari","escort-bari","trans-bari","uomo-cerca-uomo-bari",
    "incontri-verona","escort-verona","trans-verona","uomo-cerca-uomo-verona",
    "incontri-venezia","escort-venezia","trans-venezia","uomo-cerca-uomo-venezia",
    "incontri-padova","escort-padova","trans-padova","uomo-cerca-uomo-padova",
    "incontri-trieste","escort-trieste","trans-trieste","uomo-cerca-uomo-trieste",
    "incontri-parma","escort-parma","trans-parma","uomo-cerca-uomo-parma",
    "incontri-perugia","escort-perugia","trans-perugia","uomo-cerca-uomo-perugia",
    "incontri-cagliari","escort-cagliari","trans-cagliari","uomo-cerca-uomo-cagliari",
    "incontri-lecce","escort-lecce","trans-lecce","uomo-cerca-uomo-lecce",
    "incontri-bergamo","escort-bergamo","trans-bergamo","uomo-cerca-uomo-bergamo",
    "incontri-brescia","escort-brescia","trans-brescia","uomo-cerca-uomo-brescia",
    "incontri-livorno","escort-livorno","trans-livorno","uomo-cerca-uomo-livorno",
    "incontri-ancona","escort-ancona","trans-ancona","uomo-cerca-uomo-ancona",
    "incontri-pescara","escort-pescara","trans-pescara","uomo-cerca-uomo-pescara",
    "incontri-salerno","escort-salerno","trans-salerno","uomo-cerca-uomo-salerno",
    "incontri-rimini","escort-rimini","trans-rimini","uomo-cerca-uomo-rimini",
    "incontri-sassari","escort-sassari","trans-sassari","uomo-cerca-uomo-sassari",
    "incontri-trento","escort-trento","trans-trento","uomo-cerca-uomo-trento",
  ];
  for (const slug of BLOG_SLUGS) {
    urls.push({ loc: `${SITE_URL}/blog/${slug}/`, changefreq: "weekly", priority: "0.8" });
  }
  // Blog listing page (single canonical URL with trailing slash)
  urls.push({ loc: `${SITE_URL}/blog/`, changefreq: "daily", priority: "0.7" });

  // Only include city/ad routes that were actually prerendered. This avoids
  // thin, empty city pages and guarantees every dynamic sitemap URL returns 200.
  const seoUrlsPath = resolve(OUTPUT_DIR, "seo-urls.json");
  if (existsSync(seoUrlsPath)) {
    const seoUrls = JSON.parse(readFileSync(seoUrlsPath, "utf8"));
    for (const entry of seoUrls) {
      urls.push({ loc: entry.loc, changefreq: "daily", priority: "0.8", lastmod: entry.lastmod });
    }
  }

  // Generate XML
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (u) =>
        `  <url>\n` +
        `    <loc>${u.loc}</loc>\n` +
        (u.lastmod ? `    <lastmod>${new Date(u.lastmod).toISOString().split("T")[0]}</lastmod>\n` : "") +
        `    <changefreq>${u.changefreq}</changefreq>\n` +
        `    <priority>${u.priority}</priority>\n` +
        `  </url>`
    ),
    "</urlset>",
  ].join("\n");

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  writeFileSync(resolve(OUTPUT_DIR, "sitemap.xml"), xml, "utf-8");
  console.log(`Sitemap written to ${resolve(OUTPUT_DIR, "sitemap.xml")} (${urls.length} URLs)`);
}

main().catch((err) => {
  console.error("Sitemap generation failed:", err);
  process.exit(1);
});
