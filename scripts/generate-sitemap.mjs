import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const SITE_URL = process.env.SITE_URL || "https://incontridibakeka.com";
const OUTPUT_DIR = resolve(__dirname, "..", "dist", "public");

const CATEGORIES = [
  { id: "donna-cerca-uomo", name: "Donna cerca uomo", priority: "0.9" },
  { id: "uomo-cerca-donna", name: "Uomo cerca donna", priority: "0.9" },
  { id: "donna-cerca-donna", name: "Donna cerca donna", priority: "0.8" },
  { id: "uomo-cerca-uomo", name: "Uomo cerca uomo", priority: "0.8" },
  { id: "trans", name: "Trans", priority: "0.8" },
  { id: "coppie", name: "Coppie", priority: "0.8" },
  { id: "massaggi", name: "Massaggi", priority: "0.7" },
  { id: "accompagnatrici", name: "Accompagnatrici", priority: "0.8" },
  { id: "evento-festa", name: "Eventi & Feste", priority: "0.7" },
  { id: "amicizia", name: "Amicizia", priority: "0.7" },
];

const CITIES = [
  "Roma", "Milano", "Napoli", "Torino", "Firenze", "Bologna", "Genova",
  "Palermo", "Bari", "Catania", "Venezia", "Verona", "Brescia", "Padova",
  "Prato", "Parma", "Taranto", "Modena", "Reggio Emilia", "Reggio Calabria",
  "Perugia", "Livorno", "Ravenna", "Cagliari", "Foggia", "Rimini", "Salerno",
  "Ferrara", "Sassari", "Latina", "Monza", "Siracusa",
  "Pescara", "Bergamo", "Forli", "Trento", "Vicenza", "Terni", "Bolzano",
  "Novara", "Piacenza", "Ancona", "Andria", "Arezzo", "Udine", "Cesena",
  "Lecce", "Pesaro", "Lucca", "Pisa", "Catanzaro", "Como",
  "Grosseto", "Siena", "Matera", "Pistoia", "Varese", "La Spezia",
  "Pordenone", "Lodi", "Cremona", "Lecco", "Frosinone",
  "Brindisi", "Massa", "Alessandria", "Asti", "LAquila",
  "Campobasso", "Potenza", "Cosenza", "Caserta",
  "Crotone", "Vibo Valentia", "Enna", "Nuoro", "Olbia", "Oristano",
  "Aosta", "Belluno", "Rovigo", "Treviso", "Gorizia",
  "Teramo", "Chieti", "Ascoli Piceno", "Macerata", "Fermo",
  "Viterbo", "Rieti", "Avellino", "Benevento",
];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function main() {
  console.log("Generating sitemap...");

  const urls = [];

  // Homepage
  urls.push({ loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" });

  // Static pages
  urls.push({ loc: `${SITE_URL}/shop`, changefreq: "weekly", priority: "0.6" });
  urls.push({ loc: `${SITE_URL}/my-ads`, changefreq: "weekly", priority: "0.5" });
  urls.push({ loc: `${SITE_URL}/blog`, changefreq: "daily", priority: "0.8" });

  // Blog articles
  const BLOG_SLUGS = [
    "incontri-roma", "incontri-milano", "incontri-napoli",
    "incontri-torino", "incontri-sicuri-italia",
    "profilo-perfetto-incontri", "premium-vs-gratuito",
  ];
  for (const slug of BLOG_SLUGS) {
    urls.push({ loc: `${SITE_URL}/blog/${slug}`, changefreq: "weekly", priority: "0.7" });
  }

  // City pages
  for (const city of CITIES) {
    const slug = slugify(city);
    urls.push({
      loc: `${SITE_URL}/incontri/${slug}`,
      changefreq: "daily",
      priority: "0.9",
    });
    // Also add category+city combinations for top categories
    for (const cat of CATEGORIES.slice(0, 5)) {
      urls.push({
        loc: `${SITE_URL}/incontri/${slug}?cat=${cat.id}`,
        changefreq: "daily",
        priority: "0.8",
      });
    }
  }

  // Category pages
  for (const cat of CATEGORIES) {
    urls.push({
      loc: `${SITE_URL}?cat=${cat.id}`,
      changefreq: "daily",
      priority: cat.priority,
    });
    // Also city+category
    const topCities = CITIES.slice(0, 10);
    for (const city of topCities) {
      urls.push({
        loc: `${SITE_URL}/incontri/${slugify(city)}?cat=${cat.id}`,
        changefreq: "daily",
        priority: "0.8",
      });
    }
  }

  // Try to fetch ads from Supabase for individual ad URLs
  if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.includes("supabase")) {
    try {
      console.log("Fetching ads from Supabase...");
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: ads, error } = await supabase
        .from("ads")
        .select("id, title, updated_at, is_active")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(5000);

      if (error) throw error;

      if (ads && ads.length > 0) {
        console.log(`Found ${ads.length} ads`);
        for (const ad of ads) {
          const slug = slugify(ad.title || "annuncio");
          urls.push({
            loc: `${SITE_URL}/ad/${slug}-${ad.id}`,
            changefreq: "weekly",
            priority: "0.7",
            lastmod: ad.updated_at,
          });
        }
      }
    } catch (err) {
      console.warn("Could not fetch ads from Supabase:", err.message);
      console.log("Generating sitemap without individual ad URLs");
    }
  } else {
    console.log("Supabase credentials not available, skipping ad URLs");
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
