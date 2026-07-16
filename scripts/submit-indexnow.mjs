import { readFileSync, readdirSync } from "node:fs";
import { basename, resolve } from "node:path";

const SITE_URL = (
  process.env.SITE_URL || "https://incontridibakeka.com"
).replace(/\/$/, "");
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";

function findKeyFile() {
  const publicDirectory = resolve("client/public");
  const candidate = readdirSync(publicDirectory).find((filename) => {
    if (!/^[A-Za-z0-9-]{8,128}\.txt$/.test(filename)) return false;
    const expected = basename(filename, ".txt");
    const actual = readFileSync(
      resolve(publicDirectory, filename),
      "utf8",
    ).trim();
    return actual === expected;
  });
  if (!candidate) throw new Error("File di verifica IndexNow non trovato");
  return {
    key: basename(candidate, ".txt"),
    location: `${SITE_URL}/${candidate}`,
  };
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

async function main() {
  const sitemapResponse = await fetch(`${SITE_URL}/sitemap.xml`, {
    headers: { "User-Agent": "IncontriDiBakeka-IndexNow/1.0" },
  });
  if (!sitemapResponse.ok) {
    throw new Error(`Sitemap non disponibile: HTTP ${sitemapResponse.status}`);
  }

  const sitemap = await sitemapResponse.text();
  const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => decodeXml(match[1]))
    .filter((value) => {
      try {
        return new URL(value).origin === SITE_URL;
      } catch {
        return false;
      }
    })
    .slice(0, 10_000);
  if (!urlList.length) throw new Error("La sitemap non contiene URL valide");

  const verification = findKeyFile();
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key: verification.key,
      keyLocation: verification.location,
      urlList,
    }),
  });

  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow ha risposto HTTP ${response.status}`);
  }
  console.log(
    `IndexNow: ${urlList.length} URL inviate, HTTP ${response.status}`,
  );
}

main().catch((error) => {
  console.error(
    "Invio IndexNow fallito:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
