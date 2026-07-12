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
  <link rel="canonical" href="${BASE_URL}/blog/${article.slug}/">
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

console.log(`✅ Generati ${count} articoli blog statici + listing in client/public/blog/`);
