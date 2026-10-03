const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const baseUrl = process.env.APP_URL || 'http://127.0.0.1:3000';
const outDir = path.resolve('output/playwright');
const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

fs.mkdirSync(outDir, { recursive: true });

async function screenshotPage(page, fileName) {
  await page.waitForTimeout(1800);
  await page.screenshot({
    path: path.join(outDir, fileName),
    fullPage: true,
    animations: 'disabled',
  });
}

async function openPublic(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await screenshotPage(page, 'trading-public-login.png');

  const loginButton = page.getByRole('button', { name: /^log in$/i }).first();
  await loginButton.click();
  await page.waitForTimeout(500);
  await screenshotPage(page, 'trading-login-panel.png');
  await context.close();
}

async function demoLogin(browser, email, expectedPath, fileName) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle', timeout: 60000 });

  await page.getByRole('button', { name: /^log in$/i }).first().click();
  await page.locator('input[autocomplete="username"]').fill(email);
  await page.locator('input[type="password"]').fill('demo');
  await page.locator('form').getByRole('button', { name: /log in/i }).click();

  try {
    await page.waitForURL((url) => url.pathname.startsWith(expectedPath), { timeout: 20000 });
  } catch {
    await page.goto(`${baseUrl}${expectedPath}`, { waitUntil: 'networkidle', timeout: 60000 });
  }

  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await screenshotPage(page, fileName);
  await context.close();
}

(async () => {
  const launchOptions = fs.existsSync(edgePath)
    ? { headless: true, executablePath: edgePath }
    : { headless: true, channel: 'chrome' };
  const browser = await chromium.launch(launchOptions);

  try {
    await openPublic(browser);
    await demoLogin(browser, 'client@bullenhaus.local', '/trade/dashboard', 'trading-client-dashboard.png');
    await demoLogin(browser, 'admin@bullenhaus.local', '/admin/dashboard', 'trading-admin-dashboard.png');
    await demoLogin(browser, 'agent@bullenhaus.local', '/crm/dashboard', 'crm-agent-dashboard.png');
  } finally {
    await browser.close();
  }
})();
