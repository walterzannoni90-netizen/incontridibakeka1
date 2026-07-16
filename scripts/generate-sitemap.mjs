import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SITE_URL = (
  process.env.SITE_URL || "https://incontridibakeka.com"
).replace(/\/$/, "");
const OUTPUT_DIR = resolve("dist/public");

function readManifest(filename) {
  const manifestPath = resolve(OUTPUT_DIR, filename);
  if (!existsSync(manifestPath)) return [];
  const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(parsed))
    throw new Error(`${filename} deve contenere un array`);
  return parsed;
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeLastmod(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString().slice(0, 10);
}

function validateEntry(entry) {
  const url = new URL(entry.loc);
  if (url.origin !== SITE_URL)
    throw new Error(`URL esterno non consentito nella sitemap: ${entry.loc}`);
  if (url.search || url.hash)
    throw new Error(
      `Query e frammenti non sono consentiti nella sitemap: ${entry.loc}`,
    );
  if (url.pathname !== "/" && !url.pathname.endsWith("/")) {
    throw new Error(`Canonical senza slash finale: ${entry.loc}`);
  }
  return { loc: url.toString(), lastmod: normalizeLastmod(entry.lastmod) };
}

function main() {
  const entries = [
    { loc: `${SITE_URL}/` },
    { loc: `${SITE_URL}/bacheca-incontri/` },
    { loc: `${SITE_URL}/pubblica-annuncio/` },
    { loc: `${SITE_URL}/blog/` },
    ...readManifest("blog-urls.json"),
    ...readManifest("seo-urls.json"),
  ].map(validateEntry);

  const unique = new Map();
  for (const entry of entries) {
    const previous = unique.get(entry.loc);
    unique.set(entry.loc, {
      loc: entry.loc,
      lastmod: entry.lastmod || previous?.lastmod,
    });
  }

  const urls = [...unique.values()].sort((a, b) => a.loc.localeCompare(b.loc));
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((entry) =>
      [
        "  <url>",
        `    <loc>${xmlEscape(entry.loc)}</loc>`,
        ...(entry.lastmod ? [`    <lastmod>${entry.lastmod}</lastmod>`] : []),
        "  </url>",
      ].join("\n"),
    ),
    "</urlset>",
    "",
  ].join("\n");

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(resolve(OUTPUT_DIR, "sitemap.xml"), xml, "utf8");
  console.log(`Sitemap: ${urls.length} URL canonici e indicizzabili`);
}

try {
  main();
} catch (error) {
  console.error(
    "Generazione sitemap fallita:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
}
