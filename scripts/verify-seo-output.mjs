import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const SITE_URL = "https://incontridibakeka.com";
const OUTPUT_DIR = resolve("dist/public");

function fail(message) {
  throw new Error(message);
}

function htmlFileFor(url) {
  const pathname = new URL(url).pathname;
  return pathname === "/"
    ? resolve(OUTPUT_DIR, "index.html")
    : resolve(OUTPUT_DIR, pathname.replace(/^\//, ""), "index.html");
}

function extractAttribute(html, pattern, label, file) {
  const match = html.match(pattern);
  if (!match) fail(`${label} mancante in ${file}`);
  return match[1];
}

function main() {
  const sitemapPath = resolve(OUTPUT_DIR, "sitemap.xml");
  if (!existsSync(sitemapPath)) fail("sitemap.xml non generata");
  const sitemap = readFileSync(sitemapPath, "utf8");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );

  if (urls.length < 12) fail(`Sitemap troppo piccola: ${urls.length} URL`);
  if (new Set(urls).size !== urls.length)
    fail("La sitemap contiene URL duplicate");

  const forbidden = [
    "/admin",
    "/profile",
    "/my-ads",
    "/messages",
    "/shop",
    "?",
    "#",
  ];
  for (const url of urls) {
    if (!url.startsWith(`${SITE_URL}/`))
      fail(`Dominio inatteso nella sitemap: ${url}`);
    if (forbidden.some((part) => url.includes(part)))
      fail(`URL non indicizzabile nella sitemap: ${url}`);
    const pathname = new URL(url).pathname;
    if (pathname !== "/" && !pathname.endsWith("/"))
      fail(`Slash finale mancante: ${url}`);

    const file = htmlFileFor(url);
    if (!existsSync(file))
      fail(`La sitemap punta a una pagina non generata: ${url}`);
    const html = readFileSync(file, "utf8");
    const canonical = extractAttribute(
      html,
      /<link rel="canonical" href="([^"]+)"\s*\/?>(?:\s*)/i,
      "Canonical",
      file,
    );
    if (canonical !== url) fail(`Canonical errato per ${url}: ${canonical}`);
    const robots = extractAttribute(
      html,
      /<meta name="robots" content="([^"]+)"\s*\/?>(?:\s*)/i,
      "Meta robots",
      file,
    );
    if (/noindex/i.test(robots))
      fail(`Pagina noindex presente nella sitemap: ${url}`);
    if (!/<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/i.test(html)) {
      fail(`H1 mancante nella pagina indicizzabile: ${url}`);
    }
  }

  const robotsPath = resolve(OUTPUT_DIR, "robots.txt");
  if (!existsSync(robotsPath)) fail("robots.txt non pubblicato");
  const robots = readFileSync(robotsPath, "utf8");
  if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`))
    fail("robots.txt non indica la sitemap canonica");

  const emptyCity = resolve(OUTPUT_DIR, "incontri", "aosta", "index.html");
  if (existsSync(emptyCity)) {
    const html = readFileSync(emptyCity, "utf8");
    if (
      !/content="noindex,follow"/i.test(html) &&
      !urls.includes(`${SITE_URL}/incontri/aosta/`)
    ) {
      fail("Una città vuota fuori sitemap non è noindex");
    }
  }

  console.log(
    `Verifica SEO superata: ${urls.length} URL, canonical e file statici coerenti`,
  );
}

try {
  main();
} catch (error) {
  console.error(
    "Verifica SEO fallita:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
}
