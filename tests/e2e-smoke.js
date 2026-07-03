const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');

const PORT = 3131;
const BASE = `http://127.0.0.1:${PORT}`;
const SUPABASE = 'https://rdqsmfgpbuswzilgbjyr.supabase.co';
const cities = ['Napoli', 'Roma', 'Milano', 'Torino', 'Firenze'];
const categories = ['donna-cerca-uomo', 'uomo-cerca-donna', 'uomo-cerca-uomo', 'donna-cerca-donna', 'coppie', 'trans', 'cerco-amici', 'anima-gemella'];
const ads = [];

function json(route, body, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockSupabase(page) {
  await page.route(`${SUPABASE}/**`, async route => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const auth = req.headers().authorization || '';
    const userNo = auth.match(/token-(\d+)/)?.[1] || '0';
    const userId = `user-${userNo}`;
    if (path.includes('/storage/v1/object/ad-photos/')) return json(route, { path: path.split('/ad-photos/')[1] });
    if (path.includes('/auth/v1/user')) return json(route, { id: userId, email: `${userId}@example.test` });
    if (path.includes('/rest/v1/cities')) return json(route, cities.map(name => ({ name, slug: name.toLowerCase(), region: '' })));
    if (path.includes('/rest/v1/categories')) return json(route, categories.map((slug, i) => ({ slug, name: slug.replace(/-/g, ' '), sort_order: i + 1 })));
    if (path.includes('/rest/v1/addons')) return json(route, [{ code: 'boost', name: 'Risalita', price_credits: 5, duration_days: 1, icon: 'fa-rocket', color: '#4f7cff', sort_order: 1 }]);
    if (path.includes('/rest/v1/profiles')) return json(route, [{ id: userId, name: `User ${userNo}`, email: `${userId}@example.test`, credits: 50, is_verified: true }]);
    if (path.includes('/rest/v1/credit_transactions') || path.includes('/rest/v1/saved_contacts') || path.includes('/rest/v1/support_messages')) return json(route, []);
    if (path.includes('/rest/v1/ads') && req.method() === 'POST') {
      const item = JSON.parse(req.postData() || '{}');
      item.id = `ad-${ads.length + 1}`;
      item.created_at = new Date().toISOString();
      ads.push(item);
      return json(route, [item], 201);
    }
    if (path.includes('/rest/v1/ads')) return json(route, ads);
    return json(route, []);
  });
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(BASE)).ok) return; } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('Server non avviato');
}

(async () => {
  const server = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  try {
    await waitForServer();
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await mockSupabase(page);
    for (let i = 1; i <= 50; i++) {
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#preloader.hidden', { timeout: 5000 });
      await page.evaluate(user => {
        localStorage.setItem('authToken', `token-${user}`);
        localStorage.setItem('currentUser', JSON.stringify({ id: `user-${user}`, name: `User ${user}`, email: `user${user}@example.test`, city: 'Roma', credits: 50 }));
      }, i);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#preloader.hidden', { timeout: 5000 });
      await page.locator('button[onclick="openPublish()"]').first().click();
      await page.fill('#adTitle', `Annuncio test ${i}`);
      await page.selectOption('#adCategory', categories[i % categories.length]);
      await page.fill('#adCity', cities[i % cities.length]);
      await page.fill('#adAge', String(18 + (i % 35)));
      await page.fill('#adDescription', `Descrizione annuncio generata dal test ${i}`);
      await page.setInputFiles('#fileInput', { name: `photo-${i}.jpg`, mimeType: 'image/jpeg', buffer: Buffer.from([255, 216, 255, 217]) });
      await page.waitForSelector('#photoPreview .thumb', { timeout: 5000 });
      await page.click('#publishBtn');
      await page.waitForFunction(() => !document.querySelector('#publishModal')?.classList.contains('active'), null, { timeout: 5000 });
    }
    if (ads.length !== 50) throw new Error(`Annunci creati: ${ads.length}, attesi: 50`);
    await browser.close();
    console.log('E2E OK: 50 utenti simulati hanno pubblicato 50 annunci');
  } finally {
    server.kill('SIGTERM');
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
